// Headless Screenshot Grabber using Puppeteer
// Captures responsive vertical layouts of target SaaS tools for Shorts ratio.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export async function captureScreenshots(url, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[Screenshot Grabber] Launching vertical mobile browser to capture URL: ${url}...`);

  // Launch browser with sandbox flags required for GitHub Actions runners
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set vertical viewport matching YouTube Shorts 9:16 aspect ratio
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    // Emulate mobile user agent to force responsive web layout
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Close cookie popups or banners if visible
    try {
      const selectors = ['button*="Accept"', 'button*="Consent"', '#cookie-accept', '.cookie-banner button'];
      for (const s of selectors) {
        if (await page.$(s)) {
          await page.click(s);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (e) {
      // Ignore if no banner
    }

    console.log('[Screenshot Grabber] Taking Slide 1: Hero landing page (mobile)...');
    const slide1Path = path.join(outputDir, '1.png');
    await page.screenshot({ path: slide1Path });

    console.log('[Screenshot Grabber] Scrolling to Features (mobile)...');
    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight * 0.95);
    });
    await new Promise(resolve => setTimeout(resolve, 800));
    const slide2Path = path.join(outputDir, '2.png');
    await page.screenshot({ path: slide2Path });

    console.log('[Screenshot Grabber] Scrolling to Pricing/Details (mobile)...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.7);
    });
    await new Promise(resolve => setTimeout(resolve, 800));
    const slide3Path = path.join(outputDir, '3.png');
    await page.screenshot({ path: slide3Path });

    console.log('[Screenshot Grabber] Completed successfully!');
    return [slide1Path, slide2Path, slide3Path];

  } catch (error) {
    console.error('[Screenshot Grabber Error] Screenshot failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}
