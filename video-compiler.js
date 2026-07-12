// Video Compiler using FFmpeg and FFprobe
// Stitches screenshots and narration audio into a dynamic video with Ken Burns panning & zoom animations.

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

  console.log(`[Video Compiler] Synthesizing animated vertical video with ${segments.length} segments...`);
  
  const tempVideoFiles = [];
  const listFilePath = path.join(tempDir, 'list.txt');

  try {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const duration = getAudioDuration(seg.audioPath);
      console.log(`[Video Compiler] Segment ${i + 1}/${segments.length}: Duration ${duration.toFixed(2)}s | Image: ${path.basename(seg.imagePath)}`);

      const tempLoop = path.join(tempDir, `loop_${i}.mp4`);
      const tempMerged = path.join(tempDir, `merged_${i}.mp4`);

      // Calculate total frames for zoom filter (duration * 25fps)
      const totalFrames = Math.ceil(duration * 25);

      // FFmpeg dynamic Ken Burns effect: Zoom in slowly from 1.0 to 1.15 and pan slightly
      // zoompan filter parameters:
      // - z: Zoom factor expression (increments dynamically per frame)
      // - d: Duration of the zoom effect in frames
      // - s: Output resolution (1080x1920)
      // - x & y: Panning coordinates centered
      const filterString = `zoompan=z='min(zoom+0.0006,1.15)':d=${totalFrames}:s=1080x1920:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;

      // Step A: Loop screenshot with dynamic zoom-pan filter
      console.log(`[Video Compiler] Rendering slide loop ${i} with zoom filter...`);
      execSync(
        `ffmpeg -y -loop 1 -i "${seg.imagePath}" -t ${duration} -vf "scale=1920:3413,crop=1920:3413,${filterString}" -r 25 -pix_fmt yuv420p "${tempLoop}"`,
        { stdio: 'inherit' }
      );

      // Step B: Bind the audio track to the video loop
      execSync(
        `ffmpeg -y -i "${tempLoop}" -i "${seg.audioPath}" -c:v libx264 -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${tempMerged}"`,
        { stdio: 'inherit' }
      );

      tempVideoFiles.push(tempMerged);
      
      // Clean up intermediate looped segment
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

    console.log(`[Video Compiler] Success! Saved animated video: ${outputPath}`);

  } catch (error) {
    console.error('[Video Compiler Error] Video compile failed:', error.message);
    throw error;
  } finally {
    // Cleanup temporary files
    tempVideoFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    if (fs.existsSync(listFilePath)) fs.unlinkSync(listFilePath);
    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  }
}
