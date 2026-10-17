import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const HTML_CONTENT = (name = "DFB", screenshotUrl = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background-color: #140A3A;
      font-family: 'Anton', Impact, sans-serif;
      user-select: none;
      -webkit-font-smoothing: antialiased;
    }

    #stage {
      position: absolute;
      width: 1080px;
      height: 1920px;
      left: 0;
      top: 0;
      overflow: hidden;
      background-color: #140A3A;
    }

    /* Background letters: Anton uppercase ~395px, letter-spacing -10px, line-height 1 */
    .bg-row {
      position: absolute;
      white-space: nowrap;
      font-size: 395px;
      line-height: 0.82; /* Align cap top */
      letter-spacing: -10px;
      font-family: 'Anton', Impact, sans-serif;
      text-transform: uppercase;
      pointer-events: none;
    }

    /* Vignette overlay */
    .vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, rgba(20, 10, 58, 0) 45%, rgba(8, 3, 28, 0.45) 100%);
      pointer-events: none;
      z-index: 2;
    }

    /* Peeking Cards: drawn after background letters and before main card */
    .peeking-card {
      position: absolute;
      width: 280px;
      height: 390px;
      background: #FFFFFF;
      box-shadow: 14px 22px 50px rgba(0, 0, 0, 0.55);
      border-radius: 2px;
      overflow: hidden;
      z-index: 3;
    }

    .pink-rect {
      position: absolute;
      left: 14%;
      top: 14%;
      right: 8%;
      bottom: 20%;
      background: #E8307A;
      overflow: hidden;
    }

    /* Top-right card: center at (1050, 330), rotated -4deg */
    #card-top-right {
      left: calc(1050px - 140px);
      top: calc(330px - 195px);
      transform: rotate(-4deg);
    }

    /* Bottom-left card: center at (10, 1500), rotated -5deg */
    #card-bottom-left {
      left: calc(10px - 140px);
      top: calc(1500px - 195px);
      transform: rotate(-5deg);
    }

    /* Main white card: 780x1260, centered at (540, 960), rotated -3.5deg */
    #main-card {
      position: absolute;
      width: 780px;
      height: 1260px;
      left: calc(540px - 390px);
      top: calc(960px - 630px);
      transform: rotate(-3.5deg);
      background: #FFFFFF;
      box-shadow: 16px 26px 60px rgba(0, 0, 0, 0.55);
      border-radius: 2px;
      z-index: 5;
    }

    /* 3a. Photo frame: left 30, top 30, width 720, height 870 */
    #photo-frame {
      position: absolute;
      left: 30px;
      top: 30px;
      width: 720px;
      height: 870px;
      overflow: hidden;
      background: linear-gradient(180deg, #6238F5 0%, #9E2EB9 100%);
    }

    #photo-frame img.screenshot {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      display: block;
    }

    /* Dashed stitch guide inside placeholder: 14px dash, 10px gap */
    .dashed-guide-svg {
      position: absolute;
      left: 16px;
      top: 16px;
      width: calc(100% - 32px);
      height: calc(100% - 32px);
      pointer-events: none;
    }

    /* 3b. Lime name tag: x=200 to 580 (width 380), y=870 to 936 (height 66), background #C5E800 */
    #lime-tag {
      position: absolute;
      left: 200px;
      top: 870px;
      width: 380px;
      height: 66px;
      background: #C5E800;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    #lime-tag-text {
      font-family: 'Anton', Impact, sans-serif;
      font-size: 44px;
      line-height: 1;
      color: #0E0A18;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      text-align: center;
      margin-top: 2px;
    }

    /* 3c. Title */
    #title-line1 {
      position: absolute;
      left: 38px;
      top: 960px; /* Baseline ~1028 */
      font-family: 'Anton', Impact, sans-serif;
      font-size: 70px;
      line-height: 1;
      color: #0E0A18;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    #title-line2 {
      position: absolute;
      left: 38px;
      top: 1037px; /* Baseline ~1105 */
      font-family: 'Anton', Impact, sans-serif;
      font-size: 70px;
      line-height: 1;
      color: #0E0A18;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    #title-line2 .purple-word {
      color: #6238F5;
    }

    /* 3d. Bottom bars */
    #bar-left {
      position: absolute;
      left: 30px;
      top: 1160px;
      width: 420px;
      height: 56px;
      background: #0E0A18;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #bar-left span {
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 800;
      font-size: 24px;
      color: #FFFFFF;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    #bar-right {
      position: absolute;
      left: 480px;
      top: 1160px;
      width: 270px;
      height: 56px;
      border: 4px solid #0E0A18;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #bar-right span {
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 800;
      font-size: 24px;
      color: #0E0A18;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div id="stage">
    <!-- 2. Background letters -->
    <!-- Row 1: SEARCH y=10, x=-20 -->
    <div class="bg-row" style="top: 10px; left: -20px;">
      <span style="color: #6238F5;">S</span><span style="color: #2C1478;">E</span><span style="color: #6238F5;">A</span><span style="color: #E8307A;">R</span><span style="color: #2C1478;">C</span><span style="color: #6238F5;">H</span>
    </div>

    <!-- Row 2: FORSPARK y=395, x=-140 -->
    <div class="bg-row" style="top: 395px; left: -140px;">
      <span style="color: #2C1478;">F</span><span style="color: #6238F5;">O</span><span style="color: #2C1478;">R</span><span style="color: #E8307A;">S</span><span style="color: #6238F5;">P</span><span style="color: #2C1478;">A</span><span style="color: #6238F5;">R</span><span style="color: #2C1478;">K</span>
    </div>

    <!-- Row 3: SEARCH y=780, x=-60 -->
    <div class="bg-row" style="top: 780px; left: -60px;">
      <span style="color: #6238F5;">S</span><span style="color: #2C1478;">E</span><span style="color: #E8307A;">A</span><span style="color: #6238F5;">R</span><span style="color: #2C1478;">C</span><span style="color: #6238F5;">H</span>
    </div>

    <!-- Row 4: FORSPARK y=1165, x=-190 -->
    <div class="bg-row" style="top: 1165px; left: -190px;">
      <span style="color: #6238F5;">F</span><span style="color: #2C1478;">O</span><span style="color: #6238F5;">R</span><span style="color: #2C1478;">S</span><span style="color: #6238F5;">P</span><span style="color: #E8307A;">A</span><span style="color: #2C1478;">R</span><span style="color: #6238F5;">K</span>
    </div>

    <!-- Row 5: SPARKFOR y=1550, x=-40 -->
    <div class="bg-row" style="top: 1550px; left: -40px;">
      <span style="color: #6238F5;">S</span><span style="color: #2C1478;">P</span><span style="color: #E8307A;">A</span><span style="color: #6238F5;">R</span><span style="color: #C5E800;">K</span><span style="color: #2C1478;">F</span><span style="color: #6238F5;">O</span><span style="color: #2C1478;">R</span>
    </div>

    <!-- Vignette overlay -->
    <div class="vignette"></div>

    <!-- 4. Peeking pink cards -->
    <!-- Top-right card: center (1050, 330), rotate -4deg -->
    <div id="card-top-right" class="peeking-card">
      <div class="pink-rect">
        <img
          src="spark_logo_transparent.png"
          alt="Spark Logo"
          style="position: absolute; left: 14%; top: 30%; width: 250px; height: auto; max-width: none;"
        />
      </div>
    </div>

    <!-- Bottom-left card: center (10, 1500), rotate -5deg -->
    <div id="card-bottom-left" class="peeking-card">
      <div class="pink-rect">
        <img
          src="spark_logo_transparent.png"
          alt="Spark Logo"
          style="position: absolute; left: 22%; top: 27%; width: 175px; height: auto; max-width: none;"
        />
      </div>
    </div>

    <!-- 3. Main white card -->
    <div id="main-card">
      <!-- 3a. Photo frame -->
      <div id="photo-frame">
        ${
          screenshotUrl
            ? `<img src="${screenshotUrl}" class="screenshot" alt="Website Screenshot" />`
            : `
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none;">
              <img src="spark_logo_transparent.png" alt="Spark Logo In Frame" style="width: 320px; height: auto; object-fit: contain; filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.45));" />
            </div>
            <svg class="dashed-guide-svg">
              <rect
                x="1.5"
                y="1.5"
                width="685"
                height="835"
                fill="none"
                stroke="rgba(255, 255, 255, 0.85)"
                stroke-width="2.5"
                stroke-dasharray="14, 10"
              />
            </svg>
            `
        }
      </div>

      <!-- 3b. Lime name tag -->
      <div id="lime-tag">
        <div id="lime-tag-text">HEY, I AM ${name}</div>
      </div>

      <!-- 3c. Title -->
      <div id="title-line1">EXCITED TO SHARE</div>
      <div id="title-line2">MY FIRST <span class="purple-word">WEBSITE!</span></div>

      <!-- 3d. Bottom bars -->
      <div id="bar-left">
        <span>SPARK CLUB</span>
      </div>
      <div id="bar-right">
        <span>26-27 TEAM</span>
      </div>
    </div>
  </div>

  <script>
    // Fit name text size if longer than 340px
    const tagText = document.getElementById('lime-tag-text');
    if (tagText) {
      let fontSize = 44;
      while (tagText.scrollWidth > 340 && fontSize > 28) {
        fontSize -= 1;
        tagText.style.fontSize = fontSize + 'px';
      }
    }
  </script>
</body>
</html>
`;

async function main() {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
  });

  await page.setContent(HTML_CONTENT("DFB", ""), {
    waitUntil: "networkidle",
  });

  // Inject logo as base64
  const logoPath = path.resolve("public/spark_logo_transparent.png");
  if (fs.existsSync(logoPath)) {
    const logoBase64 = fs.readFileSync(logoPath).toString("base64");
    await page.evaluate((dataUri) => {
      document.querySelectorAll("img[alt*='Spark Logo']").forEach((img) => {
        img.src = dataUri;
      });
    }, `data:image/png;base64,${logoBase64}`);
  }

  // Ensure fonts ready
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  await page.waitForTimeout(300);

  const outputPath = "src/assets/test-html-render.png";
  await page.screenshot({ path: outputPath, type: "png" });
  await browser.close();
  console.log(`Rendered HTML/CSS stage successfully to: ${outputPath}`);
}

main().catch(console.error);
