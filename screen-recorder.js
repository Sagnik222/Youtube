// Screen Recorder Module
// Records a REAL browser session video using Puppeteer's CDP screencast API.
// Captures frames as the browser renders them during live interactions, then stitches into MP4 with FFmpeg.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

// Helper: smooth scroll animation
async function smoothScroll(page, distance, duration = 2000) {
  await page.evaluate(async (dist, dur) => {
    const start = window.scrollY;
    const startTime = Date.now();
    return new Promise(resolve => {
      function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / dur, 1);
        // Ease-in-out curve
        const ease = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
        window.scrollTo(0, start + dist * ease);
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      step();
    });
  }, distance, duration);
}

// Helper: type text with realistic human delays
async function humanType(page, selector, text, charDelay = 60) {
  await page.focus(selector);
  await new Promise(r => setTimeout(r, 300));
  for (const char of text) {
    await page.keyboard.type(char, { delay: charDelay + Math.random() * 40 });
  }
}

// Main recording function
export async function recordToolDemo(url, toolName, outputVideoPath, durationSeconds = 55) {
  const framesDir = './temp_screencast_frames';
  if (fs.existsSync(framesDir)) {
    fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
  } else {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  console.log(`[Screen Recorder] Recording live demo of ${toolName} at ${url}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();

    // Vertical mobile viewport for YouTube Shorts
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Start capturing frames via CDP screencast
    const cdp = await page.createCDPSession();
    let frameIndex = 0;

    cdp.on('Page.screencastFrame', async (params) => {
      const framePath = path.join(framesDir, `frame_${String(frameIndex).padStart(6, '0')}.jpg`);
      fs.writeFileSync(framePath, Buffer.from(params.data, 'base64'));
      frameIndex++;
      try {
        await cdp.send('Page.screencastFrameAck', { sessionId: params.sessionId });
      } catch (e) {
        // session may have ended
      }
    });

    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 85,
      maxWidth: 1080,
      maxHeight: 1920,
      everyNthFrame: 2 // capture every 2nd frame for smoother file sizes
    });

    // Navigate to the tool
    console.log(`[Screen Recorder] Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (e) {
      console.warn(`[Screen Recorder] Navigation partial: ${e.message}`);
    }

    // Let the page render
    await new Promise(r => setTimeout(r, 3000));

    // Close cookie banners
    try {
      for (const sel of ['button*="Accept"', 'button*="Consent"', '#cookie-accept']) {
        const btn = await page.$(sel);
        if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 500)); }
      }
    } catch (e) {}

    console.log(`[Screen Recorder] Performing live interactions for ${toolName}...`);

    // === TOOL-SPECIFIC LIVE INTERACTIONS ===
    const nameLower = toolName.toLowerCase();

    if (nameLower.includes('v0') || nameLower.includes('v0.dev')) {
      try {
        const ta = await page.$('textarea');
        if (ta) {
          await humanType(page, 'textarea', 'Build a sleek dark-mode dashboard with sidebar navigation and analytics charts', 50);
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e) {}
      await smoothScroll(page, 800, 3000);
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 600, 3000);
      await new Promise(r => setTimeout(r, 2000));

    } else if (nameLower.includes('julius')) {
      try {
        const ta = await page.$('textarea') || await page.$('input[type="text"]');
        if (ta) {
          const sel = (await page.$('textarea')) ? 'textarea' : 'input[type="text"]';
          await humanType(page, sel, 'Upload my sales data CSV and create a revenue trend chart with monthly breakdown', 45);
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e) {}
      await smoothScroll(page, 900, 3000);
      await new Promise(r => setTimeout(r, 2500));
      await smoothScroll(page, 700, 3000);
      await new Promise(r => setTimeout(r, 2000));

    } else if (nameLower.includes('elevenlabs')) {
      try {
        const boxes = await page.$$('textarea');
        if (boxes.length > 0) {
          await boxes[0].focus();
          await page.keyboard.down('Control');
          await page.keyboard.press('KeyA');
          await page.keyboard.up('Control');
          await page.keyboard.press('Backspace');
          await new Promise(r => setTimeout(r, 500));
          await humanType(page, 'textarea', 'The future of content creation is here. AI voices that sound indistinguishable from real humans.', 50);
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e) {}
      await smoothScroll(page, 800, 3000);
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 600, 2500);
      await new Promise(r => setTimeout(r, 2000));

    } else if (nameLower.includes('cursor')) {
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 700, 3000);
      await new Promise(r => setTimeout(r, 2500));
      await smoothScroll(page, 500, 2500);
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 400, 2000);
      await new Promise(r => setTimeout(r, 1500));

    } else if (nameLower.includes('notebook')) {
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 600, 3000);
      await new Promise(r => setTimeout(r, 2500));
      await smoothScroll(page, 500, 2500);
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 400, 2000);
      await new Promise(r => setTimeout(r, 1500));

    } else {
      // Generic: scroll through the page smoothly
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 600, 3000);
      await new Promise(r => setTimeout(r, 2500));
      await smoothScroll(page, 800, 3000);
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 500, 2500);
      await new Promise(r => setTimeout(r, 1500));
    }

    // Scroll back to top for a final hero shot
    await smoothScroll(page, -99999, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Stop screencast
    await cdp.send('Page.stopScreencast');
    await cdp.detach();

    console.log(`[Screen Recorder] Captured ${frameIndex} frames. Compiling to MP4 with FFmpeg...`);

    if (frameIndex < 10) {
      throw new Error(`Only captured ${frameIndex} frames — too few for a video.`);
    }

    // Compile frames into an MP4 video using FFmpeg
    const fps = Math.max(8, Math.min(15, Math.round(frameIndex / durationSeconds)));
    console.log(`[Screen Recorder] Using ${fps} FPS for ${frameIndex} frames...`);

    execSync(
      `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame_%06d.jpg" -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -crf 20 -preset fast -pix_fmt yuv420p -r 25 "${outputVideoPath}"`,
      { stdio: 'inherit' }
    );

    console.log(`[Screen Recorder] Success! Saved screen recording: ${outputVideoPath}`);

  } catch (error) {
    console.error('[Screen Recorder Error]:', error.message);
    throw error;
  } finally {
    await browser.close();
    // Cleanup frames
    if (fs.existsSync(framesDir)) {
      fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
      fs.rmdirSync(framesDir);
    }
  }
}
