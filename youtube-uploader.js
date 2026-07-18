// YouTube Uploader module
// Handles Google OAuth2 authentication and video metadata upload using YouTube Data API.

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const CREDENTIALS_DIR = './.credentials';
const CLIENT_SECRET_PATH = path.join(CREDENTIALS_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(CREDENTIALS_DIR, 'youtube-token.json');

// Get authenticated OAuth2 Client, checking environment first, then local files
export function getOAuth2Client() {
  // Check environment variables first (GitHub Actions secrets)
  const envClientId = process.env.YOUTUBE_CLIENT_ID;
  const envClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const envRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (envClientId && envClientSecret && envRefreshToken) {
    console.log('[YouTube Auth] Authenticating via environment secrets.');
    const oauth2Client = new google.auth.OAuth2(
      envClientId,
      envClientSecret,
      'http://localhost:3000'
    );
    oauth2Client.setCredentials({
      refresh_token: envRefreshToken
    });
    return oauth2Client;
  }

  // Fallback: local files authentication (local tests)
  if (fs.existsSync(CLIENT_SECRET_PATH) && fs.existsSync(TOKEN_PATH)) {
    console.log('[YouTube Auth] Authenticating via local .credentials files.');
    try {
      const secrets = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, 'utf8'));
      const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      
      const clientSecretObj = secrets.web || secrets.installed;
      const { client_id, client_secret, redirect_uris } = clientSecretObj;
      const redirectUrl = redirect_uris ? redirect_uris[0] : 'http://localhost:3000';

      const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirectUrl
      );
      oauth2Client.setCredentials(tokens);
      return oauth2Client;
    } catch (err) {
      console.error('[YouTube Auth Error] Failed to read credentials files:', err.message);
    }
  }

  return null;
}

// Check configuration status
export function checkCredentials() {
  const envReady = !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET && process.env.YOUTUBE_REFRESH_TOKEN);
  const localSecretExists = fs.existsSync(CLIENT_SECRET_PATH);
  const localTokenExists = fs.existsSync(TOKEN_PATH);
  
  return {
    ready: envReady || (localSecretExists && localTokenExists),
    envReady,
    localSecretExists,
    localTokenExists
  };
}

// Simulated uploader fallback
export async function uploadVideoMock(videoMetadata) {
  console.log(`\n[YouTube API Mock] Uploading video to channel...`);
  console.log(` > Title: "${videoMetadata.title}"`);
  console.log(` > Tags: ${videoMetadata.tags.slice(0, 3).join(', ')}...`);

  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockVideoId = 'mock_yt_' + Math.random().toString(36).substr(2, 9);
  console.log(`[YouTube API Mock] Upload complete! Video ID: ${mockVideoId}`);
  
  return {
    success: true,
    videoId: mockVideoId,
    url: `https://youtube.com/shorts/${mockVideoId}`
  };
}

// Real YouTube Video Uploader
export async function uploadVideoProduction(videoMetadata, videoFilePath) {
  const auth = getOAuth2Client();
  
  if (!auth) {
    console.warn('[YouTube API] Credentials not configured. Defaulting to Mock mode.');
    return uploadVideoMock(videoMetadata);
  }

  console.log(`\n[YouTube API Production] Uploading file "${videoFilePath}"...`);
  
  try {
    const youtube = google.youtube({ version: 'v3', auth });

    // Verify video file exists
    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`Video file not found at path: ${videoFilePath}`);
    }

    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: videoMetadata.title.substring(0, 100),
          description: videoMetadata.description,
          tags: videoMetadata.tags,
          categoryId: '28' // Science & Technology
        },
        status: {
          privacyStatus: 'public', // Upload as public for maximum algorithm reach
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(videoFilePath)
      }
    });

    const videoId = response.data.id;
    console.log(`[YouTube API Production] Upload successful! Video ID: ${videoId}`);
    
    return {
      success: true,
      videoId,
      url: `https://youtube.com/shorts/${videoId}`
    };
  } catch (error) {
    console.error('[YouTube API Production Error] Upload failed:', error.message);
    throw error;
  }
}
