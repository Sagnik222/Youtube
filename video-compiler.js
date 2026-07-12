// Video Compiler using FFmpeg and FFprobe
// Compiles crisp high-density vertical videos, applies Ken Burns zoompan filters, and burns dynamic wrapped subtitle captions.

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

// Split long text into multiple lines for portrait drawtext filter bounding box
function wrapText(text, maxChars = 22) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

// Escape special characters for FFmpeg drawtext parameters
function escapeFFmpegText(text) {
  return text
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"');
}

export async function compileVideo(segments, outputPath) {
  const tempDir = './temp_video_rendering';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  console.log(`[Video Compiler] Synthesizing vertical video with ${segments.length} segments and captions...`);
  
  const tempVideoFiles = [];
  const listFilePath = path.join(tempDir, 'list.txt');

  // Determine system font path for subtitle drawing
  let fontOption = '';
  let fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  if (process.platform === 'darwin') {
    fontPath = '/System/Library/Fonts/Supplemental/Arial.ttf';
    if (!fs.existsSync(fontPath)) fontPath = '/Library/Fonts/Arial.ttf';
  } else {
    if (!fs.existsSync(fontPath)) {
      fontPath = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
    }
  }

  if (fs.existsSync(fontPath)) {
    fontOption = `:fontfile='${fontPath}'`;
    console.log(`[Video Compiler] Using subtitle font: ${fontPath}`);
  } else {
    console.log(`[Video Compiler] Subtitle font not found. Letting FFmpeg select default...`);
  }

  try {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const duration = getAudioDuration(seg.audioPath);
      console.log(`[Video Compiler] Segment ${i + 1}/${segments.length}: Duration ${duration.toFixed(2)}s`);

      const tempLoop = path.join(tempDir, `loop_${i}.mp4`);
      const tempMerged = path.join(tempDir, `merged_${i}.mp4`);
      const totalFrames = Math.ceil(duration * 25);

      // Build zoompan filter
      const zoompanFilter = `zoompan=z='min(zoom+0.0006,1.15)':d=${totalFrames}:s=1080x1920:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;

      // Build drawtext subtitles filter
      const wrappedText = wrapText(seg.text || '');
      const escapedText = escapeFFmpegText(wrappedText);
      const drawtextFilter = `,drawtext=text='${escapedText}'${fontOption}:fontsize=44:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=18:x=(w-text_w)/2:y=h-480:line_spacing=12`;

      // Step A: Loop screenshot with Lanczos scaling, zoompan, and captions
      console.log(`[Video Compiler] Compiling Slide ${i + 1} video stream...`);
      const vfChain = `scale=1080:1920:flags=lanczos,${zoompanFilter}${drawtextFilter}`;
      
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

    console.log(`[Video Compiler] Success! Saved final annotated video to: ${outputPath}`);

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
