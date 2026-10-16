/**
 * Spark Club - Drop Your Build
 * Instagram Story Poster Generator (1080 × 1920 px, 9:16 portrait)
 *
 * Implements the official Spark Club visual language:
 * - Full-height 1080 × 1920 canvas filling all story space
 * - Deep space violet/navy gradient background with custom background typography ("SEARCH FOR SPARK")
 * - Top-right & bottom-left pink Polaroid photo elements with drop shadows
 * - Enlarged central white Polaroid frame with ample margin so screenshots never surpass the frame
 * - Website screenshot preview (or neon branded developer terminal fallback if skipped)
 * - Dashed stitch line & neon lime masking tape sticker
 * - "Hey, I am [Student Name]" + "and excited to share my first website! 🚀"
 * - Live site link pill
 * - Club pill header & @spark_iiitb Instagram tag footer
 */

export interface PosterOptions {
  studentName: string;
  websiteUrl: string;
  screenshotDataUrl?: string | null;
  mode?: "story" | "poster";
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
 * Helper to draw a rounded rectangle path
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Renders the official 1080×1920 Instagram Story Poster on an offscreen HTML5 canvas
 * and returns the high-resolution PNG data URL.
 */
export async function renderInstagramStoryPoster(options: PosterOptions): Promise<string> {
  // Wait for Google Fonts to be ready
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font loading times out
    }
  }

  const canvas = document.createElement("canvas");
  const isPosterMaster = options.mode === "poster";

  if (isPosterMaster) {
    // 925 × 1024 master aspect (scaled 2x retina)
    canvas.width = 1850;
    canvas.height = 2048;
  } else {
    // Default: 1080 × 1920 Instagram Story (uses all vertical spaces)
    canvas.width = 1080;
    canvas.height = 1920;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to initialize canvas 2D rendering context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (isPosterMaster) {
    ctx.save();
    ctx.scale(2, 2);
    await drawStoryCanvas(ctx, options, 925, 1024, true);
    ctx.restore();
  } else {
    await drawStoryCanvas(ctx, options, 1080, 1920, false);
  }

  return canvas.toDataURL("image/png");
}

/**
 * Draws the complete Instagram Story layout
 */
async function drawStoryCanvas(
  ctx: CanvasRenderingContext2D,
  options: PosterOptions,
  w: number,
  h: number,
  compactMode: boolean
) {
  // 1. Deep Space Violet/Navy Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#09071c");
  bgGrad.addColorStop(0.3, "#110b30");
  bgGrad.addColorStop(0.7, "#160e3d");
  bgGrad.addColorStop(1, "#070517");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Center alignment helper
  const sfCenter = (text: string, x: number, y: number) => {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  };

  // 2. Background Typographic Graphics: "SEARCH FOR SPARK"
  if (!compactMode) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Top: "SEARCH" (Electric Violet/Blue)
    ctx.font = "900 145px 'Anton', 'Bebas Neue', Impact, sans-serif";
    ctx.fillStyle = "rgba(80, 50, 235, 0.72)";
    ctx.fillText("SEARCH", 540, 245);

    // Middle: "FOR" (subtle electric indigo behind the Polaroid)
    ctx.font = "900 130px 'Anton', 'Bebas Neue', Impact, sans-serif";
    ctx.fillStyle = "rgba(65, 40, 200, 0.45)";
    ctx.fillText("FOR", 540, 670);

    // Bottom: "S P A R K" with signature club colors
    ctx.font = "900 150px 'Anton', 'Bebas Neue', Impact, sans-serif";

    // S (Electric Violet)
    ctx.fillStyle = "rgba(124, 58, 237, 0.85)";
    ctx.fillText("S", 190, 1680);

    // P (Hot Pink)
    ctx.fillStyle = "rgba(236, 72, 153, 0.9)";
    ctx.fillText("P", 365, 1680);

    // A (Coral/Red)
    ctx.fillStyle = "rgba(244, 63, 94, 0.9)";
    ctx.fillText("A", 540, 1680);

    // R (Purple)
    ctx.fillStyle = "rgba(139, 92, 246, 0.85)";
    ctx.fillText("R", 715, 1680);

    // K (Neon Lime)
    ctx.fillStyle = "rgba(204, 255, 0, 0.95)";
    ctx.fillText("K", 890, 1680);

    ctx.restore();

    // Top-Right Tilted Pink Polaroid Card
    ctx.save();
    ctx.translate(960, 140);
    ctx.rotate((14 * Math.PI) / 180);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(-80, -100, 180, 220);
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, -90, -110, 180, 220, 4);
    ctx.fill();
    ctx.fillStyle = "#EC4899"; // Hot pink
    ctx.fillRect(-78, -98, 156, 156);
    ctx.restore();

    // Bottom-Left Tilted Coral Polaroid Card
    ctx.save();
    ctx.translate(80, 1800);
    ctx.rotate((-12 * Math.PI) / 180);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(-90, -110, 200, 240);
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, -100, -120, 200, 240, 4);
    ctx.fill();
    ctx.fillStyle = "#F43F5E"; // Coral
    ctx.fillRect(-88, -108, 176, 170);
    ctx.restore();
  }

  // 3. ENLARGED WHITE POLAROID FRAME (The Hero Element)
  // Generous proportions, centered with a slight tilt
  const cardW = compactMode ? 660 : 840;
  const cardH = compactMode ? 860 : 1120;
  const cardCenterX = compactMode ? w / 2 : 540;
  const cardCenterY = compactMode ? h / 2 : 960;
  const cardAngle = (-3.5 * Math.PI) / 180;

  ctx.save();
  ctx.translate(cardCenterX, cardCenterY);
  ctx.rotate(cardAngle);

  // Physical paper drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 20;

  // White Polaroid Paper Frame
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 8);
  ctx.fill();

  // Reset shadow for inner elements
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Inner Photo Cutout Container
  // 45px white margins on left/right/top -> SCREENSHOT NEVER OVERFLOWS!
  const margin = compactMode ? 36 : 45;
  const photoX = -cardW / 2 + margin;
  const photoY = -cardH / 2 + margin;
  const photoW = cardW - margin * 2; // 750px (in story mode)
  const photoH = compactMode ? 490 : 640; // 640px (in story mode)

  // Clip to photo cutout with rounded corners
  ctx.save();
  roundRect(ctx, photoX, photoY, photoW, photoH, 4);
  ctx.clip();

  // Draw Screenshot OR Branded Developer Terminal Fallback
  let imageDrawn = false;
  if (options.screenshotDataUrl) {
    try {
      const siteImg = await loadImage(options.screenshotDataUrl);
      const imgAspect = siteImg.width / siteImg.height;
      const targetAspect = photoW / photoH;

      let drawW = photoW;
      let drawH = photoH;
      let drawX = photoX;
      let drawY = photoY;

      if (imgAspect > targetAspect) {
        // Wider than frame: fit height, center horizontally
        drawW = photoH * imgAspect;
        drawX = photoX - (drawW - photoW) / 2;
      } else {
        // Taller than frame: fit width, align to top to showcase website hero/header
        drawH = photoW / imgAspect;
        drawY = photoY;
      }

      ctx.drawImage(siteImg, drawX, drawY, drawW, drawH);
      imageDrawn = true;
    } catch (e) {
      console.warn("Screenshot rendering failed, using branded terminal", e);
      imageDrawn = false;
    }
  }

  // Branded Terminal Graphic if screenshot is skipped or failed
  if (!imageDrawn) {
    const termGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
    termGrad.addColorStop(0, "#150D32");
    termGrad.addColorStop(1, "#231454");
    ctx.fillStyle = termGrad;
    ctx.fillRect(photoX, photoY, photoW, photoH);

    // Browser header bar
    ctx.fillStyle = "#1E1442";
    ctx.fillRect(photoX, photoY, photoW, 42);

    // Control dots
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(photoX + 20, photoY + 21, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(photoX + 40, photoY + 21, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(photoX + 60, photoY + 21, 6, 0, Math.PI * 2);
    ctx.fill();

    // Address bar pill
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    roundRect(ctx, photoX + 85, photoY + 10, photoW - 110, 22, 6);
    ctx.fill();

    let displayDomain = options.websiteUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    if (displayDomain.length > 36) displayDomain = displayDomain.slice(0, 34) + "…";

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "600 11px 'Manrope', monospace, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(displayDomain || "my-first-site.vercel.app", photoX + 98, photoY + 21);

    // Center Graphic
    ctx.textAlign = "center";
    ctx.fillStyle = "#CCFF00"; // Neon Lime
    ctx.font = "900 76px 'Anton', 'Bebas Neue', monospace";
    ctx.fillText("⚡ </> ⚡", photoX + photoW / 2, photoY + 210);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 44px 'Anton', 'Bebas Neue', sans-serif";
    ctx.fillText("MY FIRST WEBSITE", photoX + photoW / 2, photoY + 290);

    ctx.fillStyle = "#C4B5FD";
    ctx.font = "800 20px 'Barlow Condensed', 'Manrope', sans-serif";
    ctx.fillText("BUILT & DEPLOYED LIVE", photoX + photoW / 2, photoY + 340);

    // Spark Club Builder Badge
    ctx.fillStyle = "rgba(204, 255, 0, 0.15)";
    roundRect(ctx, photoX + photoW / 2 - 120, photoY + 380, 240, 40, 20);
    ctx.fill();
    ctx.strokeStyle = "#CCFF00";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#CCFF00";
    ctx.font = "800 14px 'Manrope', sans-serif";
    ctx.fillText("SPARK CLUB BUILDER", photoX + photoW / 2, photoY + 400);
  }

  // Dashed Stitch Border (inside the photo cutout)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  roundRect(ctx, photoX + 16, photoY + 16, photoW - 32, photoH - 32, 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore(); // Restore photo clip

  // Neon Lime Masking Tape Sticker (pinned over bottom edge of photo)
  const tapeW = compactMode ? 280 : 350;
  const tapeH = compactMode ? 56 : 70;
  const tapeX = -tapeW / 2;
  const tapeY = photoY + photoH - tapeH / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#C5E800"; // Exact neon lime
  ctx.fillRect(tapeX, tapeY, tapeW, tapeH);
  ctx.restore();

  // 4. White Polaroid Section: "Hey, I am [Student Name]" + "and excited to share my first website!"
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const studentDisplayName = options.studentName.trim() || "A Student";
  let nameUpper = studentDisplayName.toUpperCase();
  if (nameUpper.length > 22) nameUpper = nameUpper.slice(0, 20) + "…";

  const textBaseY = photoY + photoH + (compactMode ? 44 : 56);

  // Line 1: "Hey, I am"
  ctx.font = `800 ${compactMode ? 18 : 24}px 'Manrope', system-ui, sans-serif`;
  ctx.fillStyle = "#64748B"; // Slate gray
  ctx.fillText("Hey, I am", photoX + 10, textBaseY);

  // Line 2: Student Name in bold display font
  ctx.font = `900 ${compactMode ? 42 : 54}px 'Anton', 'Bebas Neue', 'Barlow Condensed', sans-serif`;
  ctx.fillStyle = "#0F172A"; // Dark slate
  ctx.fillText(nameUpper, photoX + 10, textBaseY + (compactMode ? 32 : 40));

  // Line 3: "and excited to share my first website! 🚀"
  ctx.font = `800 ${compactMode ? 22 : 28}px 'Barlow Condensed', 'Manrope', sans-serif`;
  ctx.fillStyle = "#4321A9"; // Royal purple
  ctx.fillText("and excited to share my first website! 🚀", photoX + 10, textBaseY + (compactMode ? 86 : 118));

  // Line 4: Clean website domain pill
  const pillY = textBaseY + (compactMode ? 132 : 185);
  const pillH = compactMode ? 40 : 50;

  ctx.fillStyle = "#F1F5F9";
  roundRect(ctx, photoX + 10, pillY, photoW - 20, pillH, 8);
  ctx.fill();
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#1E293B";
  ctx.font = `700 ${compactMode ? 13 : 16}px 'Manrope', monospace, sans-serif`;
  let cleanDomain = options.websiteUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (cleanDomain.length > 34) cleanDomain = cleanDomain.slice(0, 32) + "…";
  ctx.fillText(`🔗  ${cleanDomain || "spark-registration-station.vercel.app"}`, 0, pillY + pillH / 2);

  ctx.restore(); // Restore Polaroid transform

  // 5. Top Story Header: Frosted Club Pill
  if (!compactMode) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    roundRect(ctx, 540 - 220, 60, 440, 56, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 17px 'Manrope', system-ui, sans-serif";
    ctx.fillText("⚡ SPARK CLUB · IIIT BHOPAL ⚡", 540, 88);

    // 6. Bottom Story Footer
    ctx.fillStyle = "#E0E7FF";
    ctx.font = "800 17px 'Manrope', system-ui, sans-serif";
    ctx.fillText("TAG @SPARK_IIITB ON INSTAGRAM STORIES", 540, 1855);

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
