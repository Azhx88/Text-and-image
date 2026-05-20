/**
 * /api/upload-to-drive/route.ts
 * ─────────────────────────────────────────────────────────────
 * Uploads files to the owner's personal Google Drive using a
 * pre-authorized OAuth2 refresh token — completely silent,
 * no popup, no sign-in needed at runtime.
 *
 * Files are uploaded AS the real Google user (not a service account),
 * so they consume the user's own Drive quota and appear in their Drive.
 * ─────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

const CLIENT_ID     = process.env.GOOGLE_OAUTH_CLIENT_ID     ?? '';
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? '';
const FOLDER_ID     = process.env.GOOGLE_DRIVE_FOLDER_ID     ?? '';

export async function POST(req: NextRequest) {
  // ── Config check ─────────────────────────────────────────
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return NextResponse.json(
      { error: 'Google Drive not configured. Run: node scripts/get-drive-refresh-token.mjs' },
      { status: 500 }
    );
  }

  try {
    // ── Parse multipart form ─────────────────────────────────
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    const fileName = (formData.get('fileName') as string) || file?.name || 'upload.png';
    const mimeType = (formData.get('mimeType') as string) || file?.type || 'image/png';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── Auth — OAuth2 with refresh token (silent, no popup) ──
    // Files are owned by the real Google user, so they use
    // the user's Drive quota — works on any personal account.
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // ── Convert File → Node.js Readable stream ───────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const stream      = Readable.from(buffer);

    // ── Build the file metadata ───────────────────────────────
    // If FOLDER_ID is set, upload into that folder; otherwise go to Drive root
    const requestBody: Record<string, any> = { name: fileName };
    if (FOLDER_ID) requestBody.parents = [FOLDER_ID];

    // ── Upload ────────────────────────────────────────────────
    const response = await drive.files.create({
      requestBody,
      media: { mimeType, body: stream },
      fields: 'id,name,webViewLink',
    });

    const data = response.data;

    return NextResponse.json({
      fileId:      data.id,
      fileName:    data.name,
      webViewLink: data.webViewLink,
    });

  } catch (err: any) {
    console.error('[Drive API] Upload error:', err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
