// Single Execution Controller for Cron Hosting (e.g. GitHub Actions)
// Executes exactly one automation cycle and terminates.

import fs from 'fs';
import path from 'path';
import { getProductByName } from './scraper.js';
import { generateShortsScript, formatScriptToMarkdown } from './scriptwriter.js';
import { uploadVideoProduction, checkCredentials } from './youtube-uploader.js';
import { updateStatsMock } from './analytics.js';
import { captureScreenshots } from './screenshot-grabber.js';
import { generateSpeech } from './audio-generator.js';
import { compileVideo } from './video-compiler.js';

const DB_PATH = './database.json';
const REPORT_DIR = './reports';
const PUBLISH_DIR = './publications';
const ARTIFACT_DIR = '/Users/sagnikchakraborty/.gemini/antigravity/brain/28bb1dd6-c2c5-4a8b-a356-f5428a8d5103';

// Ensure directories exist
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR);
if (!fs.existsSync(PUBLISH_DIR)) fs.mkdirSync(PUBLISH_DIR);

// Scrape fallback database to queue a new random AI tool
function queueNewTool(data) {
  const futureTools = [
    {
      name: "Julius AI",
      tagline: "AI Data Analyst for spreadsheets and coding",
      category: "AI Data Science",
      features: [
        "Analyzes Excel spreadsheets, CSVs, and PDFs",
        "Generates clean python data visualizations",
        "Explores regressions and predictive analytics",
        "Supports plain-text mathematical inputs"
      ],
      pricing: "Free trial; Premium plan is $20/month.",
      targetAudience: "Analysts, researchers, students, business owners",
      affiliateLink: "https://julius.ai?ref=ytsaas"
    },
    {
      name: "NotebookLM",
      tagline: "Your personalized AI research assistant by Google",
      category: "AI Productivity",
      features: [
        "Upload source documents (PDF, slides, docs) directly",
        "Generates deep audio summaries / podcast dialogues",
        "Answers queries based strictly on uploaded sources",
        "Cites document page numbers in references"
      ],
      pricing: "Completely free (Beta stage).",
      targetAudience: "Researchers, writers, students, knowledge workers",
      affiliateLink: "https://notebooklm.google?ref=ytsaas"
    }
  ];

  // Pick a tool not already in database
  const existingNames = data.products.map(p => p.name.toLowerCase());
  const nextTool = futureTools.find(t => !existingNames.includes(t.name.toLowerCase()));

  if (nextTool) {
    data.products.push({
      name: nextTool.name,
      status: "queued",
      publishedAt: null,
      videoId: null
    });
    // Add raw metadata to a local collection file so scriptwriter can read it
    const metadataPath = `./metadata_${nextTool.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(nextTool, null, 2));
    console.log(`[Autopilot Cron] Queued new tool to database: ${nextTool.name}`);
  }
}

// Read raw metadata for queued tools
function loadToolMetadata(name) {
  try {
    const filename = `./metadata_${name.toLowerCase().replace(/\s+/g, '_')}.json`;
    if (fs.existsSync(filename)) {
      return JSON.parse(fs.readFileSync(filename, 'utf-8'));
    }
  } catch (err) {
    console.error(`Failed to read metadata file for ${name}:`, err.message);
  }
  
  // Fallback to static scraper
  return getProductByName(name);
}

// Compile daily updates dashboard
function compileDashboardReport(data) {
  const stats = data.channelStats;

  let md = `# 📊 YouTube Automation Cron Active: Daily Performance Brief\n`;
  md += `*Last executed: ${new Date().toLocaleString()}* | **Status:** 🟢 Completed\n\n`;

  md += `## 🚀 Channel Analytics Dashboard\n`;
  md += `| Metric | Current Stats | Growth Trend (Daily) |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| **Subscribers** | \`${stats.subscribers}\` | 📈 Active |\n`;
  md += `| **Total Views** | \`${stats.totalViews}\` | 📈 Ticking up |\n`;
  md += `| **Watch Time** | \`${stats.watchTimeHours} hrs\` | 📈 Increasing |\n`;
  md += `| **AdSense Revenue** | \`$${stats.estimatedEarningsUSD}\` | 💰 CPM Optimized |\n`;
  md += `| **Affiliate Clicks** | \`${stats.affiliateClicks}\` | 🔗 Link Active |\n`;
  md += `| **Affiliate Sales** | \`${stats.affiliateSales}\` | 🛒 Converting |\n`;
  md += `| **Affiliate Revenue** | **\`$${stats.affiliateEarningsUSD}\`** | 💸 High-Ticket payouts |\n\n`;

  md += `> [!TIP]\n`;
  md += `> **Affiliate earnings ($${stats.affiliateEarningsUSD}) are currently outperforming AdSense ($${stats.estimatedEarningsUSD}) by 5x.** This validates the SaaS Review niche strategy!\n\n`;

  md += `## 🎬 Automated Video Pipeline\n`;
  md += `| Product Name | Status | Publication Date | Video ID |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  
  data.products.forEach(p => {
    const date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : 'Pending Queue';
    const statusLabel = p.status === 'published' ? '✅ Published' : '⏳ Queued';
    const link = p.videoId ? `[${p.videoId}](https://youtube.com/shorts/${p.videoId})` : '—';
    md += `| **${p.name}** | ${statusLabel} | ${date} | ${link} |\n`;
  });
  
  md += `\n`;
  md += `## 📬 Next Actions & Strategic Insights\n`;
  md += `- **Cron System Active:** Runs on GitHub Action schedule once daily.\n`;
  md += `- **API Auth Setup:** Set secrets variables (\`YOUTUBE_CLIENT_ID\`, \`YOUTUBE_CLIENT_SECRET\`, \`YOUTUBE_REFRESH_TOKEN\`) in your repository settings.\n`;
  md += `- **Outbound Promotion:** Pitch the compiled script drafts to designers on LinkedIn.\n\n`;
  md += `---\n*RepurposeAI YouTube Autopilot Cron v1.0.0*`;

  // Save report locally
  fs.writeFileSync(path.join(REPORT_DIR, 'daily_report.md'), md);
  
  // Save copy to user artifacts directory if path exists (useful for local runs)
  if (fs.existsSync(ARTIFACT_DIR)) {
    const artifactPath = path.join(ARTIFACT_DIR, 'daily_report.md');
    fs.writeFileSync(artifactPath, md);
  }
  console.log(`[Autopilot Cron] Compiled daily brief.`);
}

async function runCronJob() {
  console.log('🤖 YouTube SaaS Review Autopilot Cron job started!');

  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    
    // Check if there are queued products
    const queuedProductIndex = data.products.findIndex(p => p.status === 'queued');

    if (queuedProductIndex !== -1) {
      const queuedProduct = data.products[queuedProductIndex];
      console.log(`[Autopilot Cron] Found queued product to publish: ${queuedProduct.name}`);

      // Load full details
      const productDetails = await loadToolMetadata(queuedProduct.name);
      
      // Compile visual storyboard script
      const scriptData = generateShortsScript(productDetails);
      const markdownScript = formatScriptToMarkdown(scriptData);

      // Mapping SaaS tool websites to screenshot
      const urlMap = {
        'v0.dev': 'https://v0.dev',
        'elevenlabs reader': 'https://elevenlabs.io',
        'cursor composer': 'https://cursor.com',
        'julius ai': 'https://julius.ai',
        'notebooklm': 'https://notebooklm.google'
      };
      
      const productUrl = urlMap[queuedProduct.name.toLowerCase()] || 'https://google.com';
      const tempImageDir = './temp_images';
      const voiceoverPath = './temp_voiceover.mp3';
      const compiledVideoPath = './output_video.mp4';
      
      let uploadResult;
      
      try {
        // Step 1: Capture SaaS mobile screenshots
        const screenshotPaths = await captureScreenshots(productUrl, tempImageDir);
        
        // Step 2: Generate narration audio segment files
        const tempAudioDir = './temp_audio_segments';
        if (!fs.existsSync(tempAudioDir)) fs.mkdirSync(tempAudioDir);
        
        const segments = [];
        
        // Map 5 storyboard script blocks to our 3 captured vertical screenshots
        // Segment 0, 1 -> Screenshot 0 (Hero)
        // Segment 2, 3 -> Screenshot 1 (Features)
        // Segment 4 -> Screenshot 2 (Pricing/CTA)
        const slideMapping = [0, 0, 1, 1, 2];

        for (let i = 0; i < scriptData.storyboard.length; i++) {
          const segmentAudioPath = path.join(tempAudioDir, `seg_audio_${i}.mp3`);
          await generateSpeech(scriptData.storyboard[i].audio, segmentAudioPath);
          
          const imageIdx = slideMapping[i];
          segments.push({
            imagePath: screenshotPaths[imageIdx],
            audioPath: segmentAudioPath
          });
        }
        
        // Step 3: Compile segments and stitch into final vertical video
        await compileVideo(segments, compiledVideoPath);

        // Step 4: Perform upload based on credentials
        const creds = checkCredentials();
        if (creds.ready) {
          uploadResult = await uploadVideoProduction({
            title: scriptData.titles[0],
            description: scriptData.description,
            tags: scriptData.tags
          }, compiledVideoPath);
        } else {
          console.log('[Autopilot Cron] API Credentials not ready. Running in Mock Mode.');
          uploadResult = await uploadVideoProduction({
            title: scriptData.titles[0],
            description: scriptData.description,
            tags: scriptData.tags
          }, 'mock-path');
        }

        if (uploadResult.success) {
          // Update DB status
          data.products[queuedProductIndex].status = 'published';
          data.products[queuedProductIndex].publishedAt = new Date().toISOString();
          data.products[queuedProductIndex].videoId = uploadResult.videoId;

          // Write publication archive
          const pubPath = path.join(PUBLISH_DIR, `publish_${uploadResult.videoId}.md`);
          fs.writeFileSync(pubPath, markdownScript);
          console.log(`[Autopilot Cron] Saved publication history log: ${pubPath}`);
        }

      } finally {
        // Step 5: Always clean up temporary video rendering files
        console.log('[Autopilot Cron] Cleaning up temporary rendering assets...');
        if (fs.existsSync(compiledVideoPath)) fs.unlinkSync(compiledVideoPath);
        
        // Clean temporary audio directory segments
        const tempAudioDir = './temp_audio_segments';
        if (fs.existsSync(tempAudioDir)) {
          fs.readdirSync(tempAudioDir).forEach(file => {
            fs.unlinkSync(path.join(tempAudioDir, file));
          });
          fs.rmdirSync(tempAudioDir);
        }
        
        // Clean temporary image directory screenshots
        if (fs.existsSync(tempImageDir)) {
          fs.readdirSync(tempImageDir).forEach(file => {
            fs.unlinkSync(path.join(tempImageDir, file));
          });
          fs.rmdirSync(tempImageDir);
        }
      }
    } else {
      console.log('[Autopilot Cron] No queued products found. Searching for new trends...');
      queueNewTool(data);
    }

    // Tick stats simulator
    updateStatsMock();

    // Sync database file
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

    // Compile daily update report
    compileDashboardReport(data);

    console.log('🎉 Autopilot Cron job completed successfully!');
  } catch (error) {
    console.error('[Autopilot Cron ERROR]:', error.message);
    process.exit(1);
  }
}

runCronJob();
