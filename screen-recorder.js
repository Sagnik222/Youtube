// Screen Recorder Module
// Records REAL browser sessions using Chrome DevTools Protocol screencast.
// Navigates to actual demo/playground pages and performs meaningful tool interactions.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

// Helper: smooth scroll animation with ease-in-out
async function smoothScroll(page, distance, duration = 2000) {
  await page.evaluate(async (dist, dur) => {
    const start = window.scrollY;
    const startTime = Date.now();
    return new Promise(resolve => {
      function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / dur, 1);
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
async function humanType(page, selector, text, charDelay = 55) {
  try {
    await page.focus(selector);
    await new Promise(r => setTimeout(r, 300));
    for (const char of text) {
      await page.keyboard.type(char, { delay: charDelay + Math.random() * 30 });
    }
  } catch (e) {
    console.warn(`[Screen Recorder] Could not type into ${selector}: ${e.message}`);
  }
}

// Helper: click element safely
async function safeClick(page, selector, waitAfter = 1500) {
  try {
    const el = await page.$(selector);
    if (el) {
      await el.click();
      await new Promise(r => setTimeout(r, waitAfter));
      return true;
    }
  } catch (e) {}
  return false;
}

// Helper: navigate to a URL safely within the same page session
async function safeNavigate(page, url, waitMs = 3000) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, waitMs));
  } catch (e) {
    console.warn(`[Screen Recorder] Navigation to ${url} partial: ${e.message}`);
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Tool-specific demo interaction sequences
const toolDemos = {
  'v0.dev': async (page) => {
    console.log('[Screen Recorder] v0.dev: Typing prompt and browsing templates...');
    await new Promise(r => setTimeout(r, 2500));

    // v0.dev uses a custom input — try multiple selectors
    const inputSelectors = ['textarea', 'input[placeholder*="build"]', 'input[placeholder*="Ask"]', '[contenteditable="true"]', 'input[type="text"]'];
    let typed = false;
    for (const sel of inputSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await new Promise(r => setTimeout(r, 500));
          await page.keyboard.type('Build a dark-mode SaaS dashboard with sidebar navigation and analytics charts', { delay: 45 });
          typed = true;
          await new Promise(r => setTimeout(r, 2000));
          break;
        }
      } catch (e) {}
    }

    if (typed) {
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 4000));
    }

    // Scroll down to the template gallery
    await smoothScroll(page, 500, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Click on template cards to show generated projects
    const cardSelectors = ['a[href*="/t/"]', '[class*="template"] a', '[class*="card"] a', 'a[href*="chat"]'];
    for (const sel of cardSelectors) {
      try {
        const cards = await page.$$(sel);
        if (cards.length > 0) {
          console.log(`[Screen Recorder] Clicking template card...`);
          await cards[0].click();
          await new Promise(r => setTimeout(r, 4000));
          
          // Scroll through the generated project
          await smoothScroll(page, 600, 2500);
          await new Promise(r => setTimeout(r, 2500));
          await smoothScroll(page, 400, 2000);
          await new Promise(r => setTimeout(r, 2000));

          // Go back to main page
          await page.goBack();
          await new Promise(r => setTimeout(r, 3000));

          // Click a second template
          if (cards.length > 1) {
            await cards[1].click();
            await new Promise(r => setTimeout(r, 4000));
            await smoothScroll(page, 500, 2000);
            await new Promise(r => setTimeout(r, 2000));
            await page.goBack();
            await new Promise(r => setTimeout(r, 2000));
          }
          break;
        }
      } catch (e) {}
    }

    // Browse Templates page
    await safeNavigate(page, 'https://v0.dev/templates', 3000);
    await smoothScroll(page, 600, 2500);
    await new Promise(r => setTimeout(r, 2000));

    // Visit Pricing
    await safeNavigate(page, 'https://v0.dev/pricing', 3000);
    await smoothScroll(page, 400, 2000);
    await new Promise(r => setTimeout(r, 2000));
  },

  'elevenlabs': async (page) => {
    console.log('[Screen Recorder] ElevenLabs: Interacting with voice demo...');
    await new Promise(r => setTimeout(r, 2500));

    // Find and interact with the text demo area using flexible selectors
    const inputSelectors = ['textarea', '[contenteditable="true"]', 'input[type="text"]'];
    for (const sel of inputSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await new Promise(r => setTimeout(r, 500));
          await page.keyboard.down('Control');
          await page.keyboard.press('KeyA');
          await page.keyboard.up('Control');
          await page.keyboard.press('Backspace');
          await new Promise(r => setTimeout(r, 300));
          await page.keyboard.type('Welcome to the future of AI voice generation. This tool creates voices that sound completely human.', { delay: 40 });
          await new Promise(r => setTimeout(r, 2000));
          
          // Try clicking any Generate/Play button
          await safeClick(page, 'button[aria-label*="Generate"]', 3000);
          await safeClick(page, 'button[aria-label*="Play"]', 3000);
          break;
        }
      } catch (e) {}
    }

    // Scroll to show more features
    await smoothScroll(page, 800, 3000);
    await new Promise(r => setTimeout(r, 2500));

    // Navigate to Voice Library
    await safeNavigate(page, 'https://elevenlabs.io/voice-library', 3000);
    await smoothScroll(page, 500, 2000);
    await new Promise(r => setTimeout(r, 2500));
    await smoothScroll(page, 400, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Navigate to Pricing
    await safeNavigate(page, 'https://elevenlabs.io/pricing', 3000);
    await smoothScroll(page, 500, 2000);
    await new Promise(r => setTimeout(r, 2000));
  },

  'julius': async (page) => {
    console.log('[Screen Recorder] Julius AI: Showing data analysis capabilities...');
    await new Promise(r => setTimeout(r, 2500));

    // Try to interact with any prompt input
    const inputSelectors = ['textarea', 'input[type="text"]', '[contenteditable="true"]'];
    for (const sel of inputSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await new Promise(r => setTimeout(r, 500));
          await page.keyboard.type('Analyze my sales data and create a monthly revenue chart with growth predictions', { delay: 45 });
          await new Promise(r => setTimeout(r, 2000));
          await page.keyboard.press('Enter');
          await new Promise(r => setTimeout(r, 4000));
          break;
        }
      } catch (e) {}
    }

    // Browse through homepage features
    await smoothScroll(page, 700, 2500);
    await new Promise(r => setTimeout(r, 2500));
    await smoothScroll(page, 500, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Click on any visible feature cards/buttons
    await safeClick(page, 'a[href*="example"]', 2000);
    await safeClick(page, 'a[href*="use-case"]', 2000);
    
    await smoothScroll(page, 400, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Navigate to pricing
    await safeNavigate(page, 'https://julius.ai/pricing', 3000);
    await smoothScroll(page, 400, 2000);
    await new Promise(r => setTimeout(r, 2500));
  },

  'cursor': async (page) => {
    console.log('[Screen Recorder] Cursor: Showcasing AI coding features...');
    await new Promise(r => setTimeout(r, 2500));

    // Browse the landing page features slowly
    await smoothScroll(page, 500, 2500);
    await new Promise(r => setTimeout(r, 2500));
    await smoothScroll(page, 500, 2500);
    await new Promise(r => setTimeout(r, 2500));
    await smoothScroll(page, 400, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Navigate to features page
    await safeNavigate(page, 'https://cursor.com/features', 3000);
    await smoothScroll(page, 600, 2500);
    await new Promise(r => setTimeout(r, 2500));
    await smoothScroll(page, 500, 2500);
    await new Promise(r => setTimeout(r, 2000));

    // Navigate to pricing
    await safeNavigate(page, 'https://cursor.com/pricing', 3000);
    await smoothScroll(page, 500, 2000);
    await new Promise(r => setTimeout(r, 2500));
  },

  'notebooklm': async (page) => {
    console.log('[Screen Recorder] NotebookLM: Exploring AI notebook features...');
    await new Promise(r => setTimeout(r, 2500));

    // Browse landing page
    await smoothScroll(page, 500, 2500);
    await new Promise(r => setTimeout(r, 2500));

    // Click on any interactive elements or cards
    await safeClick(page, 'a[href*="about"]', 2000);
    await safeClick(page, '[class*="card"]', 2000);

    await smoothScroll(page, 600, 2500);
    await new Promise(r => setTimeout(r, 2500));
    await smoothScroll(page, 400, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Navigate to about/FAQ
    await safeNavigate(page, 'https://notebooklm.google/about', 3000);
    await smoothScroll(page, 500, 2500);
    await new Promise(r => setTimeout(r, 2500));
    await smoothScroll(page, 400, 2000);
    await new Promise(r => setTimeout(r, 2000));
  }
};

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
      } catch (e) {}
    });

    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 85,
      maxWidth: 1080,
      maxHeight: 1920,
      everyNthFrame: 2
    });

    // Navigate to the tool
    console.log(`[Screen Recorder] Navigating to ${url}...`);
    await safeNavigate(page, url, 3000);

    // Close cookie banners
    await safeClick(page, 'button*="Accept"', 500);
    await safeClick(page, 'button*="Consent"', 500);
    await safeClick(page, '#cookie-accept', 500);

    // Run tool-specific demo interaction sequence
    const nameLower = toolName.toLowerCase();
    let demoRan = false;

    for (const [key, demoFn] of Object.entries(toolDemos)) {
      if (nameLower.includes(key)) {
        console.log(`[Screen Recorder] Running custom demo sequence for: ${key}`);
        await demoFn(page);
        demoRan = true;
        break;
      }
    }

    // Generic fallback: browse multiple pages
    if (!demoRan) {
      console.log('[Screen Recorder] Running generic multi-page browse demo...');
      await new Promise(r => setTimeout(r, 2000));
      await smoothScroll(page, 700, 3000);
      await new Promise(r => setTimeout(r, 2000));
      
      // Try clicking navigation links to show different pages
      const navLinks = await page.$$('nav a, header a');
      for (let i = 0; i < Math.min(navLinks.length, 2); i++) {
        try {
          const href = await navLinks[i].evaluate(el => el.href);
          if (href && !href.includes('login') && !href.includes('signup')) {
            await safeNavigate(page, href, 3000);
            await smoothScroll(page, 500, 2000);
            await new Promise(r => setTimeout(r, 2000));
          }
        } catch (e) {}
      }
      
      await smoothScroll(page, 400, 2000);
      await new Promise(r => setTimeout(r, 2000));
    }

    // Final: scroll back to hero for closing shot
    await smoothScroll(page, -99999, 2000);
    await new Promise(r => setTimeout(r, 2000));

    // Stop screencast
    await cdp.send('Page.stopScreencast');
    await cdp.detach();

    console.log(`[Screen Recorder] Captured ${frameIndex} frames. Compiling to MP4...`);

    if (frameIndex < 10) {
      throw new Error(`Only captured ${frameIndex} frames — too few for a video.`);
    }

    // Compile frames into MP4
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
    if (fs.existsSync(framesDir)) {
      fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
      fs.rmdirSync(framesDir);
    }
  }
}
