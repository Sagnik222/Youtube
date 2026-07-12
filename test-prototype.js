import fs from 'fs';
import path from 'path';
import { getCuratedProducts } from './scraper.js';
import { generateShortsScript, formatScriptToMarkdown } from './scriptwriter.js';

// The artifact folder path supplied to our environment
const ARTIFACT_DIR = '/Users/sagnikchakraborty/.gemini/antigravity/brain/28bb1dd6-c2c5-4a8b-a356-f5428a8d5103';

async function runPrototype() {
  console.log('🤖 Starting YouTube SaaS Reviewer Scripting Engine Prototype...');

  try {
    const products = await getCuratedProducts();
    console.log(`📦 Curated database loaded. Found ${products.length} products to compile.`);

    for (const p of products) {
      console.log(`✍️ Drafting script for: ${p.name}...`);
      const scriptData = generateShortsScript(p);
      const markdown = formatScriptToMarkdown(scriptData);

      // Save in workspace scratch directory
      const filename = `sample_${p.name.toLowerCase().replace(/\s+/g, '_')}_script.md`;
      const localPath = path.join('./', filename);
      fs.writeFileSync(localPath, markdown);
      console.log(`💾 Saved local script copy: ${localPath}`);

      // Save as user-facing artifact in brain folder
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(artifactPath, markdown);
      console.log(`⭐ Saved user-facing artifact: ${artifactPath}`);
    }

    console.log('\n🎉 Scripting engine generated all sample contents successfully!');
  } catch (error) {
    console.error('❌ Prototype failed:', error);
  }
}

runPrototype();
