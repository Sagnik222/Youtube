// Audio Narration Generator using Google Translate TTS API
// Handles splitting script text into chunks under 200 chars and downloading narration MP3.

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';

// Split script text into chunks under 180 characters for Google Translate TTS API compatibility
function splitTextIntoChunks(text, maxLength = 180) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length < maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  const finalizedChunks = [];
  chunks.forEach(c => {
    if (c.length > maxLength) {
      const words = c.split(' ');
      let subChunk = '';
      words.forEach(w => {
        if ((subChunk + ' ' + w).length < maxLength) {
          subChunk += (subChunk ? ' ' : '') + w;
        } else {
          finalizedChunks.push(subChunk);
          subChunk = w;
        }
      });
      if (subChunk) finalizedChunks.push(subChunk);
    } else {
      finalizedChunks.push(c);
    }
  });

  return finalizedChunks;
}

export async function generateSpeech(scriptText, outputPath) {
  const tempDir = './temp_audio';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const chunks = splitTextIntoChunks(scriptText);
  console.log(`[Audio Generator] Splitting script into ${chunks.length} segments for TTS...`);

  const tempFiles = [];

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const encodedText = encodeURIComponent(chunk);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;
      
      const tempPath = path.join(tempDir, `chunk_${i}.mp3`);
      
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      tempFiles.push(tempPath);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`[Audio Generator] All chunks downloaded. Concatenating using FFmpeg concat demuxer...`);
    
    // Write concat list file
    const listFilePath = path.join(tempDir, 'list.txt');
    // FFmpeg concat demuxer requires paths to be escaped or relative to the list file,
    // or set -safe 0 and use absolute/relative paths
    const listContent = tempFiles.map(file => `file '${path.resolve(file)}'`).join('\n') + '\n';
    fs.writeFileSync(listFilePath, listContent);

    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`;
    
    execSync(cmd, { stdio: 'ignore' });
    console.log(`[Audio Generator] Success! Saved complete voiceover file: ${outputPath}`);

  } catch (error) {
    console.error('[Audio Generator Error] Failed to compile voiceover:', error.message);
    throw error;
  } finally {
    // Cleanup temporary chunk files
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    const listFilePath = path.join(tempDir, 'list.txt');
    if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  }
}
