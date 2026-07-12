// One-Time Authentication Helper
// Run this script locally to authorize your YouTube account and generate your Refresh Token.

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';

const CREDENTIALS_DIR = './.credentials';
const CLIENT_SECRET_PATH = path.join(CREDENTIALS_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(CREDENTIALS_DIR, 'youtube-token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];

// Ensure credentials directory exists
if (!fs.existsSync(CREDENTIALS_DIR)) {
  fs.mkdirSync(CREDENTIALS_DIR);
}

async function startAuth() {
  if (!fs.existsSync(CLIENT_SECRET_PATH)) {
    console.error(`❌ Error: 'client_secret.json' not found in ${CREDENTIALS_DIR}`);
    console.log('\n--- SETUP INSTRUCTIONS ---');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
    console.log('2. Create a project and search/enable: "YouTube Data API v3"');
    console.log('3. Go to "OAuth consent screen", set User Type to External, and add your email as a test user.');
    console.log('4. Go to "Credentials" ➔ "Create Credentials" ➔ "OAuth client ID".');
    console.log('5. Select Application Type: "Web application" or "Desktop app".');
    console.log('6. Set Authorized redirect URI to: http://localhost:3000 (if web app) or leave blank if Desktop.');
    console.log('7. Download the credentials JSON, rename it to "client_secret.json", and save it to:');
    console.log(`   ${path.resolve(CLIENT_SECRET_PATH)}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(CLIENT_SECRET_PATH, 'utf8');
    const credentials = JSON.parse(content);
    
    // Parse key structure depending on Desktop vs Web Client
    const clientSecretObj = credentials.web || credentials.installed;
    if (!clientSecretObj) {
      throw new Error("Invalid client_secret.json format. Must contain 'web' or 'installed' parameters.");
    }

    const { client_secret, client_id, redirect_uris } = clientSecretObj;
    const redirectUrl = redirect_uris ? redirect_uris[0] : 'http://localhost:3000';
    
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirectUrl
    );

    // Generate Auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force offline access refresh token
    });

    console.log('\n🔑 Authorize this app by visiting this URL in your web browser:');
    console.log(`\x1b[36m${authUrl}\x1b[0m\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('➔ Enter the authorization code from the page redirect: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Save token to file
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log(`\n✅ Access & Refresh Tokens successfully retrieved and saved!`);
        console.log(`💾 Saved to: ${path.resolve(TOKEN_PATH)}`);
        
        if (tokens.refresh_token) {
          console.log('\n--- GITHUB ACTIONS CONFIGURATION SECRETS ---');
          console.log('Add the following variables to your GitHub Repository Secrets:\n');
          console.log(`1. Name: YOUTUBE_CLIENT_ID`);
          console.log(`   Value: ${client_id}\n`);
          console.log(`2. Name: YOUTUBE_CLIENT_SECRET`);
          console.log(`   Value: ${client_secret}\n`);
          console.log(`3. Name: YOUTUBE_REFRESH_TOKEN`);
          console.log(`   Value: ${tokens.refresh_token}\n`);
          console.log('---------------------------------------------');
        } else {
          console.warn('\n⚠️ Warning: No refresh token returned. If you are re-authorizing, you must revoke access in your Google Account security panel first or clear app access.');
        }

      } catch (err) {
        console.error('Error retrieving access token:', err.message);
      }
    });

  } catch (error) {
    console.error('Initialization error:', error.message);
  }
}

startAuth();
