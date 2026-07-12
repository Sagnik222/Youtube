// Video Compiler using FFmpeg commands
// Stitches screenshots and narration audio into a vertical YouTube Shorts MP4 video.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function compileVideo(imagePaths, audioPath, outputPath) {
  const tempDir = './temp_video';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  console.log(`[Video Compiler] Starting video synthesis for output: ${outputPath}`);

  const v1 = path.join(tempDir, 'v1.mp4');
  const v2 = path.join(tempDir, 'v2.mp4');
  const v3 = path.join(tempDir, 'v3.mp4');
  const slideshow = path.join(tempDir, 'slideshow.mp4');

  try {
    // 1. Compile Slide 1 loop (0-18s = 18 seconds)
    console.log('[Video Compiler] Rendering Slide 1 (18 seconds)...');
    execSync(
      `ffmpeg -y -loop 1 -i "${imagePaths[0]}" -t 18 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -r 25 -pix_fmt yuv420p "${v1}"`,
      { stdio: 'inherit' }
    );

    // 2. Compile Slide 2 loop (18-45s = 27 seconds)
    console.log('[Video Compiler] Rendering Slide 2 (27 seconds)...');
    execSync(
      `ffmpeg -y -loop 1 -i "${imagePaths[1]}" -t 27 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -r 25 -pix_fmt yuv420p "${v2}"`,
      { stdio: 'inherit' }
    );

    // 3. Compile Slide 3 loop (45-60s = 15 seconds)
    console.log('[Video Compiler] Rendering Slide 3 (15 seconds)...');
    execSync(
      `ffmpeg -y -loop 1 -i "${imagePaths[2]}" -t 15 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -r 25 -pix_fmt yuv420p "${v3}"`,
      { stdio: 'inherit' }
    );

    // 4. Concatenate slideshow segments
    console.log('[Video Compiler] Concatenating slides...');
    const listFilePath = path.join(tempDir, 'list.txt');
    const fileContent = `file 'v1.mp4'\nfile 'v2.mp4'\nfile 'v3.mp4'\n`;
    fs.writeFileSync(listFilePath, fileContent);

    // Use FFmpeg concat demuxer (safest approach for different segments)
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${slideshow}"`,
      { stdio: 'inherit' }
    );

    // 5. Merge audio and video, cut at shortest stream duration
    console.log('[Video Compiler] Merging narration audio stream...');
    execSync(
      `ffmpeg -y -i "${slideshow}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`,
      { stdio: 'inherit' }
    );

    console.log(`[Video Compiler] Success! Saved final compiled video: ${outputPath}`);

  } catch (error) {
    console.error('[Video Compiler Error] FFmpeg rendering failed:', error.message);
    throw error;
  } finally {
    // Cleanup temporary video segments
    const filesToClean = [v1, v2, v3, slideshow, path.join(tempDir, 'list.txt')];
    filesToClean.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  }
}
