import { config } from "dotenv";
config();
config({ path: ".env.local" });

import { ai } from "../src/ai/genkit";

async function main() {
  console.log("Testing Genkit generate with gemini-3.6-flash...");
  const res = await ai.generate({
    model: "googleai/gemini-3.6-flash",
    prompt: `Create a clean flat vector SVG logo for "Skyline Coffee" (A cozy modern specialty cafe).
Output ONLY the SVG wrapped in \`\`\`xml ... \`\`\`.`,
  });

  console.log("Text generated:", res.text.slice(0, 200));
}

main();
