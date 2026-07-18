// Scraper / Product finder module
// Handles fetching curated or trending products to review.

const CURATED_PRODUCTS = [
  {
    name: "v0.dev",
    tagline: "Generative UI by Vercel",
    category: "AI Coding / Web Design",
    description: "An AI-powered interface builder that generates copy-pasteable React, Tailwind CSS, and HTML code based on simple text prompts.",
    features: [
      "Generates modern Tailwind CSS designs in seconds",
      "Outputs production-ready React components",
      "Supports interactive text-based design iterations",
      "Direct integration with shadcn/ui library"
    ],
    pricing: "Free tier available; Premium plan is $20/month.",
    targetAudience: "Web Developers, Designers, Freelancers, Solopreneurs",
    affiliateLink: "https://v0.dev?ref=ytsaas"
  },
  {
    name: "ElevenLabs Reader",
    tagline: "Ultra-realistic AI voice narrator",
    category: "AI Audio / Content Creation",
    description: "An application that reads articles, books, and documents out loud using hyper-realistic, emotionally expressive AI voices.",
    features: [
      "Supports 29+ languages with natural local accents",
      "Emotional context parsing for expressive narration",
      "Custom voice cloning features",
      "Reads PDFs, EPUBs, and text documents"
    ],
    pricing: "Free starting tier; Paid plans from $5/month.",
    targetAudience: "Creators, Audio Book Lovers, Students, Commuters",
    affiliateLink: "https://elevenlabs.io?ref=ytsaas"
  },
  {
    name: "Cursor Composer",
    tagline: "Multi-file AI editor built for speed",
    category: "AI Developer Tools",
    description: "An advanced feature inside the Cursor editor that allows developers to write, edit, and refactor code across multiple files simultaneously using chat instructions.",
    features: [
      "Edits multiple code files in one command",
      "Direct terminal execution assistance",
      "Local codebase semantic search integration",
      "Full Git diff preview before applying changes"
    ],
    pricing: "Free trial; Pro plan is $20/month.",
    targetAudience: "Software Engineers, App Developers, Tech Founders",
    affiliateLink: "https://cursor.com?ref=ytsaas"
  },
  {
    name: "Julius AI",
    tagline: "AI Data Analyst for spreadsheets and coding",
    category: "AI Data Science",
    description: "An AI-powered data analysis tool that lets you upload spreadsheets and get instant charts, regressions, and predictions.",
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
    description: "Google's AI notebook that turns uploaded documents into interactive knowledge bases with podcast-style audio summaries.",
    features: [
      "Upload source documents (PDF, slides, docs) directly",
      "Generates deep audio summaries / podcast dialogues",
      "Answers queries based strictly on uploaded sources",
      "Cites document page numbers in references"
    ],
    pricing: "Completely free (Beta stage).",
    targetAudience: "Researchers, writers, students, knowledge workers",
    affiliateLink: "https://notebooklm.google?ref=ytsaas"
  },
  {
    name: "Bolt.new",
    tagline: "AI full-stack app builder in the browser",
    category: "AI Coding / No-Code",
    description: "Build and deploy full-stack web applications directly in the browser using AI prompts. No local setup required.",
    features: [
      "Generates full-stack apps from text prompts",
      "Runs entirely in the browser — no local setup",
      "Supports React, Next.js, and Node.js backends",
      "One-click deployment to production"
    ],
    pricing: "Free tier with limits; Pro plan from $20/month.",
    targetAudience: "Founders, indie hackers, developers, students",
    affiliateLink: "https://bolt.new?ref=ytsaas"
  },
  {
    name: "Gamma AI",
    tagline: "AI-powered presentations in seconds",
    category: "AI Productivity / Design",
    description: "Create beautiful presentations, documents, and websites using AI. Just describe what you want and Gamma builds it.",
    features: [
      "Generates polished slide decks from text prompts",
      "Beautiful templates and design system built-in",
      "Supports embedded media, charts, and interactivity",
      "Export to PDF or present directly from browser"
    ],
    pricing: "Free tier available; Plus plan from $8/month.",
    targetAudience: "Marketers, students, consultants, founders",
    affiliateLink: "https://gamma.app?ref=ytsaas"
  }
];

export async function getCuratedProducts() {
  return CURATED_PRODUCTS;
}

export async function getProductByName(name) {
  return CURATED_PRODUCTS.find(p => p.name.toLowerCase() === name.toLowerCase()) || CURATED_PRODUCTS[0];
}
