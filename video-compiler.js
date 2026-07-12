// Video Compiler using FFmpeg and FFprobe
// Dynamically stitches segment audio and corresponding screenshots based on actual audio duration.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get exact duration of an audio file using FFprobe
function getAudioDuration(audioPath) {
  try {
    const cmd = `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`;
    const output = execSync(cmd).toString().trim();
    const duration = parseFloat(output);
    if (isNaN(duration)) throw new Error("Parsed duration is NaN");
    return duration;
  } catch (err) {
    console.error(`[Video Compiler] Failed to read audio duration for ${audioPath}:`, err.message);
    return 10.0; // fallback to 10 seconds if ffprobe fails
  }
}

export async function compileVideo(segments, outputPath) {
  const tempDir = './temp_video_rendering';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  console.log(`[Video Compiler] Synthesizing vertical video with ${segments.length} segments...`);
  
  const tempVideoFiles = [];
  const listFilePath = path.join(tempDir, 'list.txt');

  try {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const duration = getAudioDuration(seg.audioPath);
      console.log(`[Video Compiler] Segment ${i + 1}/${segments.length}: Duration ${duration.toFixed(2)}s | Image: ${path.basename(seg.imagePath)}`);

      const tempLoop = path.join(tempDir, `loop_${i}.mp4`);
      const tempMerged = path.join(tempDir, `merged_${i}.mp4`);

      // Step A: Loop screenshot for the exact duration of the audio
      execSync(
        `ffmpeg -y -loop 1 -i "${seg.imagePath}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -r 25 -pix_fmt yuv420p "${tempLoop}"`,
        { stdio: 'inherit' }
      );

      // Step B: Bind the audio track to the video loop
      execSync(
        `ffmpeg -y -i "${tempLoop}" -i "${seg.audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${tempMerged}"`,
        { stdio: 'inherit' }
      );

      tempVideoFiles.push(tempMerged);
      
      // Clean up the intermediate looped segment
      if (fs.existsSync(tempLoop)) fs.unlinkSync(tempLoop);
    }

    // Step C: Concatenate all segments
    console.log('[Video Compiler] Concatenating segment videos...');
    const listContent = tempVideoFiles.map(file => `file '${path.resolve(file)}'`).join('\n') + '\n';
    fs.writeFileSync(listFilePath, listContent);

    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`,
      { stdio: 'inherit' }
    );

    console.log(`[Video Compiler] Success! Saved compiled video to: ${outputPath}`);

  } catch (error) {
    console.error('[Video Compiler Error] Video compile failed:', error.message);
    throw error;
  } finally {
    // Cleanup temporary merged segments
    tempVideoFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  }
}
