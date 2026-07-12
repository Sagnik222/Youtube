// Headless Screenshot Grabber using Puppeteer
// Captures responsive vertical layouts of target SaaS tools, with robust fallback slide generation for Cloudflare bypasses.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export async function captureScreenshots(url, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Parse product name from URL for branding fallbacks
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '');
  const brandName = hostname.split('.')[0].toUpperCase();

  console.log(`[Screenshot Grabber] Launching vertical mobile browser to capture URL: ${url}...`);

  // Launch browser with stealth settings
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled' // Hides navigator.webdriver
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set vertical viewport matching YouTube Shorts 9:16 aspect ratio
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

    // Hides automation indicator
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    try {
      // Use 'domcontentloaded' wait condition to bypass slow analytics and tracking pixel timeouts
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log('[Screenshot Grabber] Page loaded successfully.');

      // Wait 1 second for any dynamic layout rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Close cookie popups or banners if visible
      try {
        const selectors = ['button*="Accept"', 'button*="Consent"', '#cookie-accept', '.cookie-banner button'];
        for (const s of selectors) {
          if (await page.$(s)) {
            await page.click(s);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (e) {}

      console.log('[Screenshot Grabber] Taking Slide 1: Hero page...');
      const slide1Path = path.join(outputDir, '1.png');
      await page.screenshot({ path: slide1Path });

      console.log('[Screenshot Grabber] Scrolling to Features...');
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.95));
      await new Promise(resolve => setTimeout(resolve, 800));
      const slide2Path = path.join(outputDir, '2.png');
      await page.screenshot({ path: slide2Path });

      console.log('[Screenshot Grabber] Scrolling to Details...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
      await new Promise(resolve => setTimeout(resolve, 800));
      const slide3Path = path.join(outputDir, '3.png');
      await page.screenshot({ path: slide3Path });

      console.log('[Screenshot Grabber] Completed web screenshots successfully.');
      return [slide1Path, slide2Path, slide3Path];

    } catch (navError) {
      console.warn(`[Screenshot Grabber Warning] Web page capture failed or timed out: ${navError.message}`);
      console.log('[Screenshot Grabber] Falling back to high-end graphic slide generator...');

      // Generate 3 branded graphics slides locally using HTML content rendering
      const slideThemes = [
        { title: brandName, subtitle: "The Ultimate AI Workflow Hack", bg: "linear-gradient(135deg, #1e3a8a, #0d9488)" },
        { title: "Key Features", subtitle: "Automated, Expressive, and Smart", bg: "linear-gradient(135deg, #0d9488, #111827)" },
        { title: "Start Free Today", subtitle: "Link and Promo Code in Description", bg: "linear-gradient(135deg, #1e3a8a, #111827)" }
      ];

      const paths = [];

      for (let i = 0; i < slideThemes.length; i++) {
        const theme = slideThemes[i];
        const html = `
          <html>
            <body style="background: ${theme.bg}; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 0 40px;">
              <div style="background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 48px 32px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 80%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 56px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 24px; background: linear-gradient(to right, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                  ${theme.title}
                </div>
                <div style="font-size: 28px; line-height: 1.4; color: #d1d5db; font-weight: 500; max-width: 600px;">
                  ${theme.subtitle}
                </div>
              </div>
              <div style="position: absolute; bottom: 40px; font-size: 16px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">
                Tool of the Day Review
              </div>
            </body>
          </html>
        `;

        await page.setContent(html);
        const slidePath = path.join(outputDir, `${i + 1}.png`);
        await page.screenshot({ path: slidePath });
        paths.push(slidePath);
      }

      console.log('[Screenshot Grabber] Branded graphic slides compiled successfully.');
      return paths;
    }

  } catch (error) {
    console.error('[Screenshot Grabber Error] Critical browser error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}
