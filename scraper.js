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
  }
];

export async function getCuratedProducts() {
  return CURATED_PRODUCTS;
}

export async function getProductByName(name) {
  return CURATED_PRODUCTS.find(p => p.name.toLowerCase() === name.toLowerCase()) || CURATED_PRODUCTS[0];
}
