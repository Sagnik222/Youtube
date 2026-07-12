// Scriptwriter module
// Compiles product data into highly structured YouTube Shorts scripts and visual storyboards.

export function generateShortsScript(product) {
  const name = product.name;
  const tagline = product.tagline;
  const category = product.category;
  const features = product.features;
  const pricing = product.pricing;
  const audience = product.targetAudience;
  const affiliate = product.affiliateLink;

  // Compile visual segments and script lines
  const sections = [
    {
      timeRange: "00:00 - 00:06",
      visual: `Fast 3D zoom onto the ${name} landing page. Bold red text on screen: "STOP building websites manually!"`,
      audio: `Stop building websites the old way. This new AI tool is officially making web developers obsolete.`
    },
    {
      timeRange: "00:06 - 00:18",
      visual: `Screen recording showing cursor entering a simple prompt: "A sleek dark-mode portfolio for a photographer." Show ${name} writing code in real time.`,
      audio: `It's called ${name}, the ${tagline}. All you do is tell the AI what you want to build in plain English, and it literally generates the design and code in under ten seconds.`
    },
    {
      timeRange: "00:18 - 00:32",
      visual: `Show a side-by-side view. Left: The generated interactive UI. Right: The clean copy-pasteable React and Tailwind code. Highlight the button to copy.`,
      audio: `Look at this. You get fully responsive React components styled with Tailwind CSS. You can iterate on the designs instantly by just chatting with the AI. No more starting from scratch.`
    },
    {
      timeRange: "00:32 - 00:45",
      visual: `Close-up shot of the UI features: ${features[0]} and ${features[2]}. Quick cut to a developer smiling or shaking their head in disbelief.`,
      audio: `It handles complex layouts, state management, and even custom UI elements. Whether you're a freelancer, founder, or student, it saves you hours of coding.`
    },
    {
      timeRange: "00:45 - 00:60",
      visual: `Show pricing dashboard (${pricing}). End with a bright neon green arrow pointing downwards to the description. Text on screen: "Link in Description!"`,
      audio: `The best part? It has a massive free tier to test out. I've left the official link in the description. Try it out and let me know in the comments: is AI taking over web design?`
    }
  ];

  // Tailor script if the product is ElevenLabs or Cursor
  if (name.toLowerCase().includes("elevenlabs")) {
    sections[0].audio = `Stop using robotic voices for your videos. This AI tool is officially indistinguishable from a real human voice.`;
    sections[0].visual = `Fast cut showing a waveform moving. Text on screen: "Real Human or AI?"`;
    sections[1].audio = `It's called ${name}, the ${tagline}. All you do is paste your article or script, and it narrates it with natural local accents, emotional context, and perfect breathing.`;
    sections[1].visual = `Show a PDF being uploaded into the dashboard. Highlight a voice list (e.g., "Antoni", "Rachel") being selected.`;
    sections[2].audio = `It supports twenty-nine languages. You can even clone your own voice or design a completely unique voice from scratch. This is a game-changer for content creators.`;
    sections[2].visual = `Show the voice cloning dashboard with a recording meter pulsing. Text on screen: "Voice Cloner Active".`;
    sections[3].audio = `It reads PDFs, books, and web articles seamlessly. If you struggle with editing or voiceover narration, this is the ultimate workflow hack.`;
    sections[3].visual = `Show the reader mobile application interface playing an audiobook. Text on screen: "Listen anywhere".`;
    sections[4].audio = `You can start using it for free today. I've pinned the link in the description. Subscribe for more daily AI tool guides!`;
  } else if (name.toLowerCase().includes("cursor")) {
    sections[0].audio = `Developers, stop editing files one by one. This new coding assistant edits your entire codebase at once.`;
    sections[0].visual = `Show VS Code editor pane. Bold red text on screen: "Write code 10x FASTER!"`;
    sections[1].audio = `It's called ${name}, the ${tagline}. You simply press a shortcut, tell the AI what feature to build, and it edits multiple files in your directory simultaneously.`;
    sections[1].visual = `Close up of cursor typing: "Implement dark mode across all pages". File sidebar highlights changing files.`;
    sections[2].audio = `It reads your local codebase semantics, executes commands in your terminal, and lets you review the full Git diff before applying. It's like pairing with a senior engineer.`;
    sections[2].visual = `Show terminal command running automatically. Cut to Git Diff panel showing green additions and red deletions.`;
    sections[3].audio = `If you want to build MVPs or launch side projects in hours instead of weeks, you need to add this to your editor today.`;
    sections[3].visual = `Fast scrolling through a folder of generated files. Text on screen: "MVP built in 2 hours!"`;
    sections[4].audio = `It has a free trial, and you can download it via the link in the description. Hit subscribe to stay ahead of the software engineering curve!`;
  }

  // Compile titles
  const titles = [
    `🚨 Stop Building Websites Manually! (Use ${name})`,
    `This AI Tool is Replacing Web Developers... 🤯`,
    `How to Build a Website in 10 Seconds (Free AI)`,
    `The AI Web Design Hack Nobody is Telling You 🤫`
  ];
  
  if (name.toLowerCase().includes("elevenlabs")) {
    titles[0] = `🔊 Is this AI Voice Real or Fake? (${name})`;
    titles[1] = `This AI Voice Tool is getting TOO realistic... 🤯`;
    titles[2] = `How to Get Professional Voiceovers for FREE (AI)`;
    titles[3] = `The Ultimate Voice Cloning Hack for Creators 🤫`;
  } else if (name.toLowerCase().includes("cursor")) {
    titles[0] = `💻 Stop Coding Files One-by-One! (${name})`;
    titles[1] = `This AI Code Editor is replacing VS Code... 🤯`;
    titles[2] = `How to Build an App in 1 Hour (Cursor AI)`;
    titles[3] = `The Multi-File AI Coding Hack you Need 🤫`;
  }

  // Compile tags
  const tags = ["AITools", "TechReviews", "ProductivityHacks", name.replace(/\s+/g, ""), category.replace(/\s+/g, ""), "SaaSReview", "YouTubeAutomation", "Shorts"];

  // Format Description
  const description = `This is why you need to stop coding manually in 2026. We review ${name} - the ${tagline}. 

🔗 Try ${name} here: ${affiliate}
(Note: This is an affiliate link, which supports the channel at no extra cost to you!)

👉 Subscribe for daily software hacks, AI tutorials, and SaaS breakdowns!

#shorts #${tags[0]} #${tags[1]} #${tags[3]}`;

  return {
    productName: name,
    category,
    titles,
    description,
    tags,
    storyboard: sections
  };
}

export function formatScriptToMarkdown(scriptData) {
  let md = `# YouTube Shorts Script & Storyboard: ${scriptData.productName}\n\n`;
  
  md += `## 💡 Proposed Metadata\n`;
  md += `### Suggested Titles (Hook-Optimized):\n`;
  scriptData.titles.forEach((t, i) => {
    md += `${i + 1}. **${t}**\n`;
  });
  md += `\n`;
  md += `### Tags:\n\`${scriptData.tags.join(', ')}\`\n\n`;
  
  md += `### Video Description:\n`;
  md += `\`\`\`text\n${scriptData.description}\n\`\`\`\n\n`;
  
  md += `## 🎬 Visual Storyboard & Audio Script (60s Limit)\n`;
  md += `| Time | 🎥 Visual Cues (What is on screen) | 🎙️ Narration (Voiceover script) |\n`;
  md += `| :--- | :--- | :--- |\n`;
  
  scriptData.storyboard.forEach(s => {
    md += `| **${s.timeRange}** | ${s.visual} | *"${s.audio}"* |\n`;
  });
  
  md += `\n---\n*Generated automatically by YouTube SaaS Reviewer Daemon.*`;
  
  return md;
}
