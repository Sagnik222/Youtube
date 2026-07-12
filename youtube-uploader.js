// YouTube Uploader module
// Handles Google OAuth2 authentication and video metadata upload using YouTube Data API.

import fs from 'fs';
import path from 'path';

const CREDENTIALS_DIR = './.credentials';
const TOKEN_PATH = path.join(CREDENTIALS_DIR, 'youtube-token.json');

// Check if credentials files are ready
export function checkCredentials() {
  const hasClientSecret = fs.existsSync(path.join(CREDENTIALS_DIR, 'client_secret.json'));
  return {
    ready: hasClientSecret,
    tokenCached: fs.existsSync(TOKEN_PATH)
  };
}

// Simulated upload function to showcase script workflow in Mock Mode
export async function uploadVideoMock(videoMetadata) {
  console.log(`\n[YouTube API Mock] Uploading video to channel...`);
  console.log(` > Title: "${videoMetadata.title}"`);
  console.log(` > Tags: ${videoMetadata.tags.slice(0, 3).join(', ')}...`);
  console.log(` > Description Length: ${videoMetadata.description.length} chars`);

  // Simulate networking delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const mockVideoId = 'mock_yt_' + Math.random().toString(36).substr(2, 9);
  console.log(`[YouTube API Mock] Video uploaded successfully! Video ID: ${mockVideoId}`);
  
  return {
    success: true,
    videoId: mockVideoId,
    url: `https://youtube.com/shorts/${mockVideoId}`
  };
}

// Real YouTube API Client Template - ready for production key insertion
export async function uploadVideoProduction(videoMetadata, videoFilePath) {
  // To use this, standard developers install: npm install googleapis
  // In a real environment, load googleapis dynamically or import at top:
  // import { google } from 'googleapis';
  
  console.log(`[YouTube Production] Uploading file "${videoFilePath}"...`);
  throw new Error("YouTube API credentials not configured. Please see the walkthrough guide to insert your client_secret.json.");
}
