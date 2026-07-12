// Headless Screenshot Grabber using Puppeteer
// Captures landing pages, features, and pricing sections of the target SaaS tool.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export async function captureScreenshots(url, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[Screenshot Grabber] Launching headless browser to capture URL: ${url}...`);

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
    
    // Set standard viewport
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Close cookie popups or banners if visible (to keep screenshots clean)
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

    console.log('[Screenshot Grabber] Taking Slide 1: Hero landing page...');
    const slide1Path = path.join(outputDir, '1.png');
    await page.screenshot({ path: slide1Path });

    console.log('[Screenshot Grabber] Scrolling to Features...');
    await page.evaluate(() => {
      window.scrollTo(0, window.innerHeight * 0.7);
    });
    await new Promise(resolve => setTimeout(resolve, 800)); // wait for scroll animation
    const slide2Path = path.join(outputDir, '2.png');
    await page.screenshot({ path: slide2Path });

    console.log('[Screenshot Grabber] Scrolling to Pricing/Product...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.6);
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
