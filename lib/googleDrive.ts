/**
 * googleDrive.ts  (client-side helper)
 * ─────────────────────────────────────────────────────────────
 * Sends a file to our own Next.js API route (/api/upload-to-drive),
 * which handles the actual Drive upload server-side using a
 * Service Account — no OAuth popup, no user sign-in required.
 * ─────────────────────────────────────────────────────────────
 */

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
}

/**
 * Upload a Blob silently to Google Drive via the server API route.
 * @param blob     - The file data
 * @param fileName - Desired filename in Drive
 * @param mimeType - MIME type (e.g. 'image/png', 'image/jpeg')
 */
export async function uploadToDrive(
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<DriveUploadResult> {
  const formData = new FormData();
  formData.append('file', new File([blob], fileName, { type: mimeType }));
  formData.append('fileName', fileName);
  formData.append('mimeType', mimeType);

  const res = await fetch('/api/upload-to-drive', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? 'Drive upload failed');
  }

  return res.json();
}

/** Generate a timestamped filename  e.g. "textfx_export_20260520_145512.png" */
export function timestampedName(prefix: string, ext: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}_${date}_${time}.${ext}`;
}
