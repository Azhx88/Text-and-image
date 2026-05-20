/**
 * scripts/get-drive-refresh-token.mjs
 * ─────────────────────────────────────────────────────────────
 * ONE-TIME SETUP SCRIPT — run this once to get your refresh token.
 *
 * Usage:
 *   node scripts/get-drive-refresh-token.mjs
 *
 * It will print a URL → open it → sign in with YOUR Google account
 * → paste the code back → you get a refresh token to put in .env.local
 * ─────────────────────────────────────────────────────────────
 */

import { createServer } from 'http';
import { google } from 'googleapis';
import { readFileSync } from 'fs';

// ── Read Client ID + Secret from .env.local ──────────────────
const envRaw = readFileSync('.env.local', 'utf-8');
const get = (key) => {
  const match = envRaw.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim().replace(/^"|"$/g, '') : '';
};

const CLIENT_ID     = get('GOOGLE_OAUTH_CLIENT_ID');
const CLIENT_SECRET = get('GOOGLE_OAUTH_CLIENT_SECRET');
const REDIRECT_URI  = 'http://localhost:9876/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌  Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in .env.local\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',           // forces refresh_token to be returned
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

console.log('\n──────────────────────────────────────────────────────────');
console.log('  TextFX — Google Drive One-Time Authorization');
console.log('──────────────────────────────────────────────────────────');
console.log('\n1. Open this URL in your browser:\n');
console.log('  ', authUrl);
console.log('\n2. Sign in with the Google account whose Drive you want to use.');
console.log('\n   Waiting for Google to redirect back...\n');

// Start a tiny local server to catch the redirect
const server = createServer(async (req, res) => {
  const url  = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');

  if (!code) {
    res.end('No code found.');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.end('<h2>✅ Success! You can close this tab and return to the terminal.</h2>');
    server.close();

    console.log('\n──────────────────────────────────────────────────────────');
    console.log('✅  Authorized! Add these to your .env.local:\n');
    console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('──────────────────────────────────────────────────────────\n');
  } catch (err) {
    res.end('Error: ' + err.message);
    console.error('\n❌  Error exchanging code:', err.message);
  }
});

server.listen(9876, () => {
  // server ready, URL already printed above
});
