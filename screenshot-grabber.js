// Headless Screenshot Grabber using Puppeteer
// Captures responsive vertical layouts of target SaaS tools, overlaying high-fidelity HTML/CSS subtitles dynamically before saving.

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export async function captureStoryboards(url, storyboard, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '');
  const brandName = hostname.split('.')[0].toUpperCase();

  console.log(`[Screenshot Grabber] Launching mobile browser (DPI: 2) for dynamic subtitle baking: ${url}...`);

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

  const paths = [];

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
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Close cookie popups
      try {
        const selectors = ['button*="Accept"', 'button*="Consent"', '#cookie-accept', '.cookie-banner button'];
        for (const s of selectors) {
          if (await page.$(s)) {
            await page.click(s);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (e) {}

      // Perform interactions for the first slides
      if (hostname.includes('v0.dev')) {
        try {
          const textarea = await page.$('textarea');
          if (textarea) {
            await textarea.focus();
            await page.type('textarea', 'Create a premium vertical dashboard for an AI SaaS app', { delay: 30 });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (e) {}
      } else if (hostname.includes('julius.ai')) {
        try {
          const input = await page.$('textarea') || await page.$('input[type="text"]');
          if (input) {
            await input.focus();
            await page.type('textarea', 'Analyze this CSV dataset and plot a correlation heat map', { delay: 30 });
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (e) {}
      } else if (hostname.includes('elevenlabs.io')) {
        try {
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
        } catch (e) {}
      }

      // Map 5 storyboard segments to viewport scrolls
      // Segment 0, 1 -> Hero Scroll (Top)
      // Segment 2, 3 -> Features Scroll (Middle)
      // Segment 4 -> Pricing Scroll (Bottom)
      const scrollMapping = [0, 0, 1, 1, 2];

      for (let i = 0; i < storyboard.length; i++) {
        const segment = storyboard[i];
        const scrollIndex = scrollMapping[i];
        const slidePath = path.join(outputDir, `slide_${i}.png`);

        console.log(`[Screenshot Grabber] Compiling Slide ${i + 1}/${storyboard.length} (Scroll: ${scrollIndex})...`);

        // Perform scroll matching slide segment
        await page.evaluate((idx) => {
          if (idx === 0) {
            window.scrollTo(0, 0);
          } else if (idx === 1) {
            window.scrollTo(0, window.innerHeight * 0.9);
          } else if (idx === 2) {
            window.scrollTo(0, document.body.scrollHeight * 0.65);
          }
        }, scrollIndex);

        await new Promise(resolve => setTimeout(resolve, 800));

        // Inject subtitles overlay box directly into the page
        await page.evaluate((captionText) => {
          const existing = document.getElementById('youtube-autopilot-caption');
          if (existing) existing.remove();
          
          if (!captionText) return;

          const captionDiv = document.createElement('div');
          captionDiv.id = 'youtube-autopilot-caption';
          captionDiv.style.position = 'fixed';
          captionDiv.style.bottom = '280px';
          captionDiv.style.left = '50%';
          captionDiv.style.transform = 'translateX(-50%)';
          captionDiv.style.width = '82%';
          captionDiv.style.backgroundColor = 'rgba(10, 15, 30, 0.88)';
          captionDiv.style.backdropFilter = 'blur(16px)';
          captionDiv.style.webkitBackdropFilter = 'blur(16px)';
          captionDiv.style.border = '2px solid rgba(255, 255, 255, 0.12)';
          captionDiv.style.color = '#ffffff';
          captionDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';
          captionDiv.style.fontSize = '38px';
          captionDiv.style.fontWeight = 'bold';
          captionDiv.style.textAlign = 'center';
          captionDiv.style.padding = '28px 36px';
          captionDiv.style.borderRadius = '28px';
          captionDiv.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
          captionDiv.style.zIndex = '9999999';
          captionDiv.style.lineHeight = '1.4';
          captionDiv.innerText = captionText;

          document.body.appendChild(captionDiv);
        }, segment.audio);

        // Take screen capture
        await page.screenshot({ path: slidePath });
        paths.push(slidePath);
      }

      console.log('[Screenshot Grabber] Dynamic slide baking complete!');
      return paths;

    } catch (navError) {
      console.warn(`[Screenshot Grabber Warning] Web page capture failed: ${navError.message}`);
      console.log('[Screenshot Grabber] Falling back to high-end local slide generator...');

      const slideThemes = [
        { title: brandName, subtitle: "The Ultimate AI Workflow Hack", bg: "linear-gradient(135deg, #1e3a8a, #0d9488)" },
        { title: "Key Features", subtitle: "Automated, Expressive, and Smart", bg: "linear-gradient(135deg, #0d9488, #111827)" },
        { title: "Start Free Today", subtitle: "Link and Promo Code in Description", bg: "linear-gradient(135deg, #1e3a8a, #111827)" }
      ];

      const pathsFallback = [];
      // If web scraper fails, generate 5 graphic slides with baked narration overlays
      for (let i = 0; i < storyboard.length; i++) {
        const segment = storyboard[i];
        const theme = slideThemes[scrollMapping[i]];
        const slidePath = path.join(outputDir, `slide_${i}.png`);

        const html = `
          <html>
            <body style="background: ${theme.bg}; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 0 40px;">
              <div style="background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 56px 40px; border-radius: 32px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); max-width: 80%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 200px;">
                <div style="font-size: 64px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 28px; background: linear-gradient(to right, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                  ${theme.title}
                </div>
                <div style="font-size: 32px; line-height: 1.4; color: #d1d5db; font-weight: 500;">
                  ${theme.subtitle}
                </div>
              </div>
              
              <div style="position: fixed; bottom: 280px; width: 82%; background: rgba(10, 15, 30, 0.88); border: 2px solid rgba(255, 255, 255, 0.12); color: #ffffff; padding: 28px 36px; border-radius: 28px; font-size: 38px; font-weight: bold; line-height: 1.4; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                ${segment.audio}
              </div>
            </body>
          </html>
        `;

        await page.setContent(html);
        await page.screenshot({ path: slidePath });
        pathsFallback.push(slidePath);
      }

      console.log('[Screenshot Grabber] Fallback slide compilation complete.');
      return pathsFallback;
    }

  } catch (error) {
    console.error('[Screenshot Grabber Error] Critical browser error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}
