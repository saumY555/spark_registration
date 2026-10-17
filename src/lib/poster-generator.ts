/**
 * Spark Club - Drop Your Build
 * Official Instagram Story Poster Generator (1080 × 1920 px, 9:16 portrait)
 *
 * Exact 1:1 recreation of the official Spark Club reference image:
 * - 1080 × 1920 fixed canvas, background #140A3A
 * - 5 rows of giant Anton background letters ("SEARCH", "FORSPARK", "SEARCH", "FORSPARK", "SPARKFOR")
 * - Vignette overlay
 * - Peeking pink cards with Spark brand lockup at (-4deg and -5deg)
 * - Main white card 780 × 1260 rotated -3.5deg
 * - 720 × 870 photo frame: screenshot object-fit cover (or gradient + dashed stitch guide fallback)
 * - Lime tag (#C5E800): "HEY, I AM " + NAME (default "DFB")
 * - Title: "EXCITED TO SHARE" + "MY FIRST WEBSITE!" (#6238F5)
 * - Bottom bars: "SPARK CLUB" (black) and "26-27 TEAM" (white with 4px border)
 * - Zero extra labels, pills, or footers
 */

import { toPng } from "html-to-image";
import sparkLogoUrl from "@/assets/spark_logo_transparent.png";

export interface PosterOptions {
  studentName?: string;
  websiteUrl?: string;
  screenshotDataUrl?: string | null;
  stageElement?: HTMLElement | null;
}

/**
 * Loads an image from a URL or data URI asynchronously
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image asset: ${e}`));
    img.src = src;
  });
}

/**
 * Waits for fonts to be loaded before rendering
 */
export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font wait times out
    }
  }
}

/**
 * Renders the official 1080×1920 Instagram Story Poster.
 * First tries high-fidelity DOM rasterization via html-to-image from the live SparkStoryStage;
 * if unavailable, falls back to direct Canvas 2D pixel-exact rendering.
 */
export async function renderInstagramStoryPoster(options: PosterOptions): Promise<string> {
  await ensureFontsLoaded();

  // 1. Attempt client-side html-to-image from the active DOM stage if available
  const targetElement =
    options.stageElement ||
    (typeof document !== "undefined" ? (document.getElementById("spark-story-canvas") as HTMLElement) : null);

  if (targetElement) {
    try {
      const dataUrl = await toPng(targetElement, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: false,
      });
      if (dataUrl && dataUrl.startsWith("data:image/png")) {
        return dataUrl;
      }
    } catch (domErr) {
      console.warn("[html-to-image fallback to Canvas 2D]", domErr);
    }
  }

  // 2. Direct Canvas 2D rendering matching the exact specification
  return renderCanvas2D(options);
}

/**
 * Direct Canvas 2D implementation matching the exact mathematical coordinates
 */
async function renderCanvas2D(options: PosterOptions): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to initialize canvas 2D rendering context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Canvas Background: #140A3A
  ctx.fillStyle = "#140A3A";
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Background letters: Anton uppercase ~395px, line-height 1, letter-spacing: -10px
  const bgRows = [
    {
      text: "SEARCH",
      y: 10,
      x: -20,
      colors: ["#6238F5", "#2C1478", "#6238F5", "#E8307A", "#2C1478", "#6238F5"],
    },
    {
      text: "FORSPARK",
      y: 395,
      x: -140,
      colors: ["#2C1478", "#6238F5", "#2C1478", "#E8307A", "#6238F5", "#2C1478", "#6238F5", "#2C1478"],
    },
    {
      text: "SEARCH",
      y: 780,
      x: -60,
      colors: ["#6238F5", "#2C1478", "#E8307A", "#6238F5", "#2C1478", "#6238F5"],
    },
    {
      text: "FORSPARK",
      y: 1165,
      x: -190,
      colors: ["#6238F5", "#2C1478", "#6238F5", "#2C1478", "#6238F5", "#E8307A", "#2C1478", "#6238F5"],
    },
    {
      text: "SPARKFOR",
      y: 1550,
      x: -40,
      colors: ["#6238F5", "#2C1478", "#E8307A", "#6238F5", "#C5E800", "#2C1478", "#6238F5", "#2C1478"],
    },
  ];

  ctx.font = "395px 'Anton', Impact, sans-serif";
  ctx.textBaseline = "top";

  for (const row of bgRows) {
    let curX = row.x;
    for (let i = 0; i < row.text.length; i++) {
      const char = row.text[i];
      ctx.fillStyle = row.colors[i];
      ctx.fillText(char, curX, row.y);
      const metrics = ctx.measureText(char);
      curX += metrics.width - 10; // Tight letter-spacing
    }
  }

  // Soft vignette overlay: edges darkened toward #08031C (35% strength)
  const vigGrad = ctx.createRadialGradient(540, 960, 400, 540, 960, 960);
  vigGrad.addColorStop(0, "rgba(20, 10, 58, 0)");
  vigGrad.addColorStop(0.5, "rgba(20, 10, 58, 0)");
  vigGrad.addColorStop(1, "rgba(8, 3, 28, 0.45)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Load Spark Logo for peeking cards
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImage(sparkLogoUrl);
  } catch (err) {
    console.warn("Could not load logo for peeking cards", err);
  }

  // 4. Peeking Pink Cards (drawn after letters, before main card)
  // Top-right card: center at (1050, 330), rotated -4deg
  ctx.save();
  ctx.translate(1050, 330);
  ctx.rotate((-4 * Math.PI) / 180);
  drawPeekingCard(ctx, logoImg, 250, 0.14, 0.30);
  ctx.restore();

  // Bottom-left card: center at (10, 1500), rotated -5deg
  ctx.save();
  ctx.translate(10, 1500);
  ctx.rotate((-5 * Math.PI) / 180);
  drawPeekingCard(ctx, logoImg, 175, 0.22, 0.27);
  ctx.restore();

  // 3. Main White Card: 780x1260, centered at (540, 960), rotated -3.5deg
  ctx.save();
  ctx.translate(540, 960);
  ctx.rotate((-3.5 * Math.PI) / 180);

  // Shadow: box-shadow 16px 26px 60px rgba(0,0,0,0.55)
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetX = 16;
  ctx.shadowOffsetY = 26;

  // White Card body: centered at (0, 0), so left is -390, top is -630
  const cardLeft = -390;
  const cardTop = -630;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(cardLeft, cardTop, 780, 1260);

  // Clear shadow for internal elements
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 3a. Photo frame: left 30, top 30, width 720, height 870
  const frameX = cardLeft + 30;
  const frameY = cardTop + 30;
  const frameW = 720;
  const frameH = 870;

  let screenshotDrawn = false;
  if (options.screenshotDataUrl) {
    try {
      const siteImg = await loadImage(options.screenshotDataUrl);
      ctx.save();
      ctx.beginPath();
      ctx.rect(frameX, frameY, frameW, frameH);
      ctx.clip();

      const imgAspect = siteImg.width / siteImg.height;
      const targetAspect = frameW / frameH;
      let drawW = frameW;
      let drawH = frameH;
      let drawX = frameX;
      let drawY = frameY;

      if (imgAspect > targetAspect) {
        drawW = frameH * imgAspect;
        drawX = frameX - (drawW - frameW) / 2;
      } else {
        drawH = frameW / imgAspect;
        drawY = frameY; // Align to top
      }

      ctx.drawImage(siteImg, drawX, drawY, drawW, drawH);
      ctx.restore();
      screenshotDrawn = true;
    } catch {
      screenshotDrawn = false;
    }
  }

  // Placeholder gradient + dashed stitch guide if no screenshot
  if (!screenshotDrawn) {
    const frameGrad = ctx.createLinearGradient(frameX, frameY, frameX, frameY + frameH);
    frameGrad.addColorStop(0, "#6238F5");
    frameGrad.addColorStop(1, "#9E2EB9");
    ctx.fillStyle = frameGrad;
    ctx.fillRect(frameX, frameY, frameW, frameH);

    // Dashed stitch line guide: inset 16px, 14px dash, 10px gap
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(frameX + 16, frameY + 16, frameW - 32, frameH - 32);
    ctx.restore();
  }

  // 3b. Lime name tag: x=200 to 580 (width 380), y=870 to 936 (height 66), background #C5E800
  const tagX = cardLeft + 200;
  const tagY = cardTop + 870;
  const tagW = 380;
  const tagH = 66;

  ctx.fillStyle = "#C5E800";
  ctx.fillRect(tagX, tagY, tagW, tagH);

  const cleanName = (options.studentName || "").trim().toUpperCase() || "DFB";
  const nameToUse = cleanName.length > 24 ? cleanName.slice(0, 24) : cleanName;
  const fullTagText = `HEY, I AM ${nameToUse}`;

  // Dynamically shrink font size if text exceeds 340px
  let tagFontSize = 44;
  ctx.font = `${tagFontSize}px 'Anton', Impact, sans-serif`;
  while (ctx.measureText(fullTagText).width > 340 && tagFontSize > 28) {
    tagFontSize -= 1;
    ctx.font = `${tagFontSize}px 'Anton', Impact, sans-serif`;
  }

  ctx.fillStyle = "#0E0A18";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fullTagText, tagX + tagW / 2, tagY + tagH / 2 + 2);

  // 3c. Title
  ctx.textAlign = "left";
  ctx.font = "70px 'Anton', Impact, sans-serif";

  // Line 1: "EXCITED TO SHARE" (Anton 70px, color #0E0A18, left x=38, baseline y=1028)
  ctx.fillStyle = "#0E0A18";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("EXCITED TO SHARE", cardLeft + 38, cardTop + 1028);

  // Line 2: "MY FIRST " in #0E0A18 followed by "WEBSITE!" in #6238F5, baseline y=1105
  ctx.fillStyle = "#0E0A18";
  ctx.fillText("MY FIRST ", cardLeft + 38, cardTop + 1105);
  const myFirstWidth = ctx.measureText("MY FIRST ").width;
  ctx.fillStyle = "#6238F5";
  ctx.fillText("WEBSITE!", cardLeft + 38 + myFirstWidth, cardTop + 1105);

  // 3d. Bottom bars
  // Left bar: x=30 to 450, y=1160 to 1216, background #0E0A18. Text "SPARK CLUB", white, bold sans 24px, centered
  const barY = cardTop + 1160;
  const barH = 56;
  ctx.fillStyle = "#0E0A18";
  ctx.fillRect(cardLeft + 30, barY, 420, barH);

  ctx.font = "800 24px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPARK CLUB", cardLeft + 30 + 210, barY + barH / 2);

  // Right box: x=480 to 750, same y range, 4px solid #0E0A18 border, white fill. Text "26-27 TEAM"
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(cardLeft + 480, barY, 270, barH);
  ctx.strokeStyle = "#0E0A18";
  ctx.lineWidth = 4;
  ctx.strokeRect(cardLeft + 480, barY, 270, barH);

  ctx.fillStyle = "#0E0A18";
  ctx.fillText("26-27 TEAM", cardLeft + 480 + 135, barY + barH / 2);

  ctx.restore();

  return canvas.toDataURL("image/png");
}

/**
 * Draws one peeking card with pink rectangle and clipped logo
 */
function drawPeekingCard(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement | null,
  logoWidth: number,
  logoLeftFraction: number,
  logoTopFraction: number
) {
  const cardW = 280;
  const cardH = 390;
  const halfW = cardW / 2;
  const halfH = cardH / 2;

  // Drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetX = 14;
  ctx.shadowOffsetY = 22;

  // White Card
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(-halfW, -halfH, cardW, cardH);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Pink rectangle: inset at left 14%, top 14%, right 8%, bottom 20%
  const pinkX = -halfW + cardW * 0.14;
  const pinkY = -halfH + cardH * 0.14;
  const pinkW = cardW * (1.0 - 0.14 - 0.08);
  const pinkH = cardH * (1.0 - 0.14 - 0.2);

  ctx.fillStyle = "#E8307A";
  ctx.fillRect(pinkX, pinkY, pinkW, pinkH);

  // Clip to pink rectangle for the logo
  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(pinkX, pinkY, pinkW, pinkH);
    ctx.clip();

    const logoX = -halfW + cardW * logoLeftFraction;
    const logoY = -halfH + cardH * logoTopFraction;
    const logoHeight = logoWidth * (logoImg.height / logoImg.width);
    ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
    ctx.restore();
  }
}

/**
 * Converts a data URL to a File object for the Web Share API
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0]?.match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1] || "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
