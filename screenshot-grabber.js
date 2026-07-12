// Headless Screenshot Grabber using Puppeteer
// Captures high-res Retina (deviceScaleFactor: 2) mobile layouts with dynamic DOM interactions to show tools in action.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export async function captureScreenshots(url, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '');
  const brandName = hostname.split('.')[0].toUpperCase();

  console.log(`[Screenshot Grabber] Launching vertical mobile browser (DPI: 2) to capture URL: ${url}...`);

  // Launch browser with stealth settings
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
    
    // Set vertical viewport matching YouTube Shorts 9:16 aspect ratio at double density (Retina)
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log('[Screenshot Grabber] Page loaded successfully.');

      // Wait 1.5 seconds for scripts to settle
      await new Promise(resolve => setTimeout(resolve, 1500));

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

      // Tool-specific custom interactions to show them "in action"
      console.log(`[Screenshot Grabber] Performing automated interactions for ${hostname}...`);
      
      if (hostname.includes('v0.dev')) {
        try {
          const textarea = await page.$('textarea');
          if (textarea) {
            await textarea.focus();
            await page.type('textarea', 'Create a premium vertical dashboard for an AI SaaS app', { delay: 30 });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (e) {
          console.warn('[Screenshot Grabber] v0.dev interaction skipped:', e.message);
        }
      } else if (hostname.includes('julius.ai')) {
        try {
          const input = await page.$('textarea') || await page.$('input[type="text"]');
          if (input) {
            await input.focus();
            await page.type('textarea', 'Analyze this CSV dataset and plot a correlation heat map', { delay: 30 });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (e) {
          console.warn('[Screenshot Grabber] Julius AI interaction skipped:', e.message);
        }
      } else if (hostname.includes('elevenlabs.io')) {
        try {
          // Type into the TTS demo text area
          const textboxes = await page.$$('textarea');
          for (const box of textboxes) {
            await box.focus();
            await page.keyboard.down('Control');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.type('textarea', 'Experience the most realistic AI voices ever generated.', { delay: 30 });
            break;
          }
        } catch (e) {
          console.warn('[Screenshot Grabber] ElevenLabs interaction skipped:', e.message);
        }
      } else if (hostname.includes('cursor.com')) {
        try {
          // Scroll and click on features to trigger styling highlights
          await page.evaluate(() => {
            const el = document.querySelector('h2') || document.querySelector('h1');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          });
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (e) {}
      }

      console.log('[Screenshot Grabber] Taking Slide 1: Hero Page/Action State...');
      const slide1Path = path.join(outputDir, '1.png');
      await page.screenshot({ path: slide1Path });

      console.log('[Screenshot Grabber] Scrolling to Features...');
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.9));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const slide2Path = path.join(outputDir, '2.png');
      await page.screenshot({ path: slide2Path });

      console.log('[Screenshot Grabber] Scrolling to Details/Pricing...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.65));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const slide3Path = path.join(outputDir, '3.png');
      await page.screenshot({ path: slide3Path });

      console.log('[Screenshot Grabber] Completed web screenshots successfully.');
      return [slide1Path, slide2Path, slide3Path];

    } catch (navError) {
      console.warn(`[Screenshot Grabber Warning] Web page capture failed: ${navError.message}`);
      console.log('[Screenshot Grabber] Falling back to high-end graphic slide generator...');

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
              <div style="background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 56px 40px; border-radius: 32px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); max-width: 80%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 64px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 28px; background: linear-gradient(to right, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                  ${theme.title}
                </div>
                <div style="font-size: 32px; line-height: 1.4; color: #d1d5db; font-weight: 500; max-width: 600px;">
                  ${theme.subtitle}
                </div>
              </div>
              <div style="position: absolute; bottom: 60px; font-size: 20px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.15em;">
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
