import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({
    viewport: { width: 1080 * 2, height: 1920, deviceScaleFactor: 1 },
  });

  const refPath = path.resolve("src/assets/spark_story_reference.png");
  const renderPath = path.resolve("src/assets/test-html-render.png");

  const refBase64 = fs.readFileSync(refPath).toString("base64");
  const renderBase64 = fs.readFileSync(renderPath).toString("base64");

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex;
            background: #000;
            width: ${1080 * 2}px;
            height: 1920px;
          }
          .pane {
            width: 1080px;
            height: 1920px;
            position: relative;
            overflow: hidden;
          }
          .pane img {
            width: 100%;
            height: 100%;
            object-fit: fill;
            display: block;
          }
          .label {
            position: absolute;
            top: 24px;
            left: 24px;
            background: rgba(14, 10, 24, 0.92);
            color: #C5E800;
            padding: 10px 20px;
            font-family: sans-serif;
            font-weight: 800;
            font-size: 26px;
            border-radius: 8px;
            z-index: 100;
            border: 2px solid #C5E800;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="pane">
          <div class="label">GROUND TRUTH REFERENCE</div>
          <img src="data:image/png;base64,${refBase64}" alt="Reference" />
        </div>
        <div class="pane">
          <div class="label">OUR EXACT IMPLEMENTATION</div>
          <img src="data:image/png;base64,${renderBase64}" alt="Our Implementation" />
        </div>
      </body>
    </html>
  `);

  await page.waitForTimeout(300);

  const outputPath = "src/assets/story-side-by-side.png";
  await page.screenshot({ path: outputPath, type: "png" });
  await browser.close();
  console.log(`Side-by-side comparison saved to: ${outputPath}`);
}

main().catch(console.error);
