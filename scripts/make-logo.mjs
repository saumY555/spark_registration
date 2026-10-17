import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function makeTransparentLogo() {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 400, height: 600 } });

  // Read the robot arm icon
  const iconBase64 = fs.readFileSync(path.resolve("public/spark-logo-clean.png")).toString("base64");

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: transparent;
            width: 320px;
            height: 480px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
          }
          #logo-container {
            width: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          #icon {
            width: 170px;
            height: 170px;
            filter: brightness(0) invert(1);
            object-fit: contain;
          }
          #spark-word {
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Anton', Impact, sans-serif;
            font-size: 72px;
            line-height: 1;
            color: #FFFFFF;
            letter-spacing: 2px;
          }
          #spark-word .cyan-accent {
            color: #00E5FF;
          }
          #team-row {
            margin-top: 6px;
            font-family: 'Inter', system-ui, sans-serif;
            font-weight: 800;
            font-size: 19px;
            line-height: 1;
            color: #FFFFFF;
            letter-spacing: 3px;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div id="logo-container">
          <img id="icon" src="data:image/png;base64,${iconBase64}" alt="Icon" />
          <div id="spark-word">SP<span class="cyan-accent">A</span>RK</div>
          <div id="team-row">26-27 TEAM</div>
        </div>
      </body>
    </html>
  `);

  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  const logoElem = await page.$("#logo-container");
  const logoBuffer = await logoElem.screenshot({ omitBackground: true });

  fs.writeFileSync(path.resolve("public/spark_logo_transparent.png"), logoBuffer);
  fs.writeFileSync(path.resolve("src/assets/spark_logo_transparent.png"), logoBuffer);
  console.log("spark_logo_transparent.png updated with full brand lockup!");

  await browser.close();
}

makeTransparentLogo().catch(console.error);
