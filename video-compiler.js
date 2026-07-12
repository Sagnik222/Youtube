// Video Compiler using FFmpeg and FFprobe
// Dynamically compiles vertical videos with smooth Ken Burns zoompan animations.
// Subtitles are pre-baked into visual frames, avoiding native drawtext filter requirements.

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
    return 10.0;
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
      console.log(`[Video Compiler] Segment ${i + 1}/${segments.length}: Duration ${duration.toFixed(2)}s`);

      const tempLoop = path.join(tempDir, `loop_${i}.mp4`);
      const tempMerged = path.join(tempDir, `merged_${i}.mp4`);
      const totalFrames = Math.ceil(duration * 25);

      // Build zoompan filter (No drawtext filter needed!)
      const zoompanFilter = `zoompan=z='min(zoom+0.0006,1.15)':d=${totalFrames}:s=1080x1920:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
      const vfChain = `scale=1080:1920:flags=lanczos,${zoompanFilter}`;

      // Step A: Loop screenshot with Lanczos scaling and zoompan
      console.log(`[Video Compiler] Compiling Slide ${i + 1} video stream...`);
      execSync(
        `ffmpeg -y -loop 1 -i "${seg.imagePath}" -t ${duration} -vf "${vfChain}" -c:v libx264 -crf 18 -preset fast -r 25 -pix_fmt yuv420p "${tempLoop}"`,
        { stdio: 'inherit' }
      );

      // Step B: Bind the audio track to the video loop
      console.log(`[Video Compiler] Merging Audio segment ${i + 1}...`);
      execSync(
        `ffmpeg -y -i "${tempLoop}" -i "${seg.audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${tempMerged}"`,
        { stdio: 'inherit' }
      );

      tempVideoFiles.push(tempMerged);
      if (fs.existsSync(tempLoop)) fs.unlinkSync(tempLoop);
    }

    // Step C: Concatenate all segments
    console.log('[Video Compiler] Stitching compiled segments together...');
    const listContent = tempVideoFiles.map(file => `file '${path.resolve(file)}'`).join('\n') + '\n';
    fs.writeFileSync(listFilePath, listContent);

    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`,
      { stdio: 'inherit' }
    );

    console.log(`[Video Compiler] Success! Saved final animated video to: ${outputPath}`);

  } catch (error) {
    console.error('[Video Compiler Error] Video compile failed:', error.message);
    throw error;
  } finally {
    tempVideoFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  }
}
