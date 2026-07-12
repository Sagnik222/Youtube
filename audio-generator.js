// Audio Narration Generator using Microsoft Edge Neural TTS (Free, realistic) and OpenAI TTS (Premium)
// Zero API keys required for realistic human voices out of the box!

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';
import { EdgeTTS } from 'edge-tts-universal';

// Split script text into chunks under 180 characters (used ONLY for Google Translate fallback)
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
  const openAiApiKey = process.env.OPENAI_API_KEY;

  // Option 1: Use premium OpenAI Neural TTS if configured (ultra-realistic)
  if (openAiApiKey) {
    console.log('[Audio Generator] Generating premium human voice using OpenAI TTS (onyx)...');
    try {
      const response = await axios({
        method: 'post',
        url: 'https://api.openai.com/v1/audio/speech',
        headers: {
          'Authorization': `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'tts-1',
          input: scriptText,
          voice: 'onyx'
        },
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`[Audio Generator] Success! Saved premium OpenAI voiceover: ${outputPath}`);
      return;
    } catch (err) {
      console.warn(`[Audio Generator Warning] OpenAI TTS failed: ${err.message}. Trying Edge TTS...`);
    }
  }

  // Option 2: Use Microsoft Edge Neural TTS (100% Free, extremely realistic, no keys or billing required!)
  console.log('[Audio Generator] Generating realistic human voice using Microsoft Edge Neural TTS (en-US-ChristopherNeural)...');
  try {
    const tts = new EdgeTTS(String(scriptText), 'en-US-ChristopherNeural');
    const result = await tts.synthesize();
    
    // result may be an ArrayBuffer, Uint8Array, or Buffer depending on environment
    const buffer = Buffer.isBuffer(result) ? result : Buffer.from(result);
    fs.writeFileSync(outputPath, buffer);
    console.log(`[Audio Generator] Success! Saved free Edge Neural voiceover: ${outputPath}`);
    return;
  } catch (edgeError) {
    console.warn(`[Audio Generator Warning] Edge TTS failed: ${edgeError.message}. Falling back to Google Translate TTS...`);
  }

  // Option 3: Fallback to old Google Translate TTS chunking (Mechanical robotic voice)
  const tempDir = './temp_audio';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const chunks = splitTextIntoChunks(scriptText);
  console.log(`[Audio Generator Fallback] Splitting script into ${chunks.length} segments for basic TTS...`);

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

    console.log(`[Audio Generator Fallback] Concatenating fallback chunks using FFmpeg...`);
    
    const listFilePath = path.join(tempDir, 'list.txt');
    const listContent = tempFiles.map(file => `file '${path.resolve(file)}'`).join('\n') + '\n';
    fs.writeFileSync(listFilePath, listContent);

    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[Audio Generator Fallback] Saved fallback voiceover file: ${outputPath}`);

  } catch (error) {
    console.error('[Audio Generator Error] Critical fallback synthesis failed:', error.message);
    throw error;
  } finally {
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    const listFilePath = path.join(tempDir, 'list.txt');
    if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  }
}
