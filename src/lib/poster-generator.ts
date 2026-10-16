/**
 * Spark Club - Drop Your Build
 * Instagram Story Poster Generator (1080 × 1920 px, 9:16 portrait)
 *
 * Implements the official Spark Club visual language inspired by the reference design:
 * - Midnight deep violet/navy background with huge background typography ("SEARCH FOR SPARK")
 * - Tilted white Polaroid frame with dashed stitch inner border
 * - Neon lime accent tape sticker
 * - Website screenshot preview (or branded terminal fallback if skipped)
 * - "I'm [Student Name] and made my first website."
 * - Spark Club branding & Instagram handle (@spark_iiitb)
 */

export interface PosterOptions {
  studentName: string;
  websiteUrl: string;
  screenshotDataUrl?: string | null;
}

/**
 * Loads an image from a data URL or path asynchronously
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}

/**
 * Helper to draw rounded rectangle
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
 * Generates the 1080x1920 Instagram Story Poster on an offscreen HTML5 canvas
 * and returns the resulting high-res PNG data URL.
 */
export async function renderInstagramStoryPoster(options: PosterOptions): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create 2D canvas context.");
  }

  // Ensure high quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Background: Deep Space Violet/Navy Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  bgGradient.addColorStop(0, "#090818");
  bgGradient.addColorStop(0.4, "#120D30");
  bgGradient.addColorStop(0.8, "#1A1042");
  bgGradient.addColorStop(1, "#0B071F");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Background Typographic Texture ("SEARCH FOR SPARK")
  // Replicating the massive graphic typography from the reference template
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Line 1: "SEARCH" (Vibrant violet/blue)
  ctx.font = "900 240px 'Anton', 'Bebas Neue', Impact, sans-serif";
  ctx.fillStyle = "rgba(79, 70, 229, 0.45)";
  ctx.fillText("SEARCH", 540, 260);

  // Line 2: "FOR" (Electric blue)
  ctx.font = "900 260px 'Anton', 'Bebas Neue', Impact, sans-serif";
  ctx.fillStyle = "rgba(67, 56, 202, 0.55)";
  ctx.fillText("FOR", 540, 680);

  // Line 3: "SPARK" with colorful letters
  ctx.font = "900 260px 'Anton', 'Bebas Neue', Impact, sans-serif";
  // Shadow letters
  ctx.fillStyle = "rgba(124, 58, 237, 0.35)";
  ctx.fillText("SPARK", 540, 1340);

  // Bottom accents: Pink 'A', Neon Lime 'K'
  ctx.font = "900 220px 'Anton', 'Bebas Neue', Impact, sans-serif";
  ctx.fillStyle = "rgba(236, 72, 153, 0.85)"; // Hot Pink
  ctx.fillText("S", 220, 1680);
  ctx.fillStyle = "rgba(168, 85, 247, 0.85)"; // Purple
  ctx.fillText("P", 380, 1680);
  ctx.fillStyle = "rgba(244, 63, 94, 0.85)"; // Coral
  ctx.fillText("A", 540, 1680);
  ctx.fillStyle = "rgba(139, 92, 246, 0.85)"; // Violet
  ctx.fillText("R", 700, 1680);
  ctx.fillStyle = "rgba(204, 255, 0, 0.95)"; // Neon Lime
  ctx.fillText("K", 860, 1680);

  ctx.restore();

  // 3. Tilted Decorative Corner Polaroids (Top-Right & Bottom-Left)
  // Top-Right decorative card
  ctx.save();
  ctx.translate(980, 120);
  ctx.rotate((14 * Math.PI) / 180);
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 25;
  ctx.fillRect(-100, -120, 200, 240);
  ctx.fillStyle = "#EC4899"; // Hot pink fill
  ctx.fillRect(-85, -105, 170, 170);
  ctx.restore();

  // Bottom-Left decorative card
  ctx.save();
  ctx.translate(60, 1820);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 25;
  ctx.fillRect(-110, -130, 220, 260);
  ctx.fillStyle = "#F43F5E"; // Pink/coral fill
  ctx.fillRect(-95, -115, 190, 180);
  ctx.restore();

  // 4. Central Polaroid Card (Main Focus)
  // Dimensions and tilt matching the reference template
  const cardWidth = 750;
  const cardHeight = 980;
  const cardCenterX = 540;
  const cardCenterY = 960;
  const tiltAngle = (-3.5 * Math.PI) / 180; // -3.5 deg tilt

  ctx.save();
  ctx.translate(cardCenterX, cardCenterY);
  ctx.rotate(tiltAngle);

  // Soft natural card drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 24;
  ctx.shadowOffsetX = 8;

  // White Polaroid frame
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
  ctx.fill();

  // Reset shadow for inner elements
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowOffsetX = 0;

  // Inner Photo Cutout Container
  const photoMargin = 45;
  const photoX = -cardWidth / 2 + photoMargin;
  const photoY = -cardHeight / 2 + photoMargin;
  const photoWidth = cardWidth - photoMargin * 2; // 660px
  const photoHeight = 630; // 630px

  // Clip to inner photo area with rounded corners
  ctx.save();
  roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 8);
  ctx.clip();

  // Deep purple photo background
  ctx.fillStyle = "#4321A9";
  ctx.fillRect(photoX, photoY, photoWidth, photoHeight);

  // Draw Website Screenshot OR Branded Terminal Fallback
  let imageDrawn = false;
  if (options.screenshotDataUrl) {
    try {
      const siteImg = await loadImage(options.screenshotDataUrl);
      // Draw screenshot with "cover" or high-quality scaling
      const imgAspect = siteImg.width / siteImg.height;
      const targetAspect = photoWidth / photoHeight;
      let drawW = photoWidth;
      let drawH = photoHeight;
      let drawX = photoX;
      let drawY = photoY;

      if (imgAspect > targetAspect) {
        // Image is wider than container
        drawW = photoHeight * imgAspect;
        drawX = photoX - (drawW - photoWidth) / 2;
      } else {
        // Image is taller or equal
        drawH = photoWidth / imgAspect;
        drawY = photoY;
      }

      ctx.drawImage(siteImg, drawX, drawY, drawW, drawH);
      imageDrawn = true;
    } catch (e) {
      console.warn("Screenshot render failed, using placeholder", e);
      imageDrawn = false;
    }
  }

  // Branded placeholder if no screenshot or failed
  if (!imageDrawn) {
    // Cyber tech grid / terminal pattern
    ctx.fillStyle = "#2D1B69";
    ctx.fillRect(photoX, photoY, photoWidth, photoHeight);

    // Browser window header bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(photoX, photoY, photoWidth, 42);

    // Window dots
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(photoX + 24, photoY + 21, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(photoX + 44, photoY + 21, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(photoX + 64, photoY + 21, 6, 0, Math.PI * 2);
    ctx.fill();

    // Browser address bar pill
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    roundRect(ctx, photoX + 85, photoY + 10, photoWidth - 110, 22, 6);
    ctx.fill();

    // Clean site URL text in address bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "600 12px 'Manrope', monospace, sans-serif";
    ctx.textAlign = "left";
    let displayDomain = options.websiteUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    if (displayDomain.length > 40) displayDomain = displayDomain.slice(0, 37) + "…";
    ctx.fillText(displayDomain || "localhost:3000", photoX + 98, photoY + 25);

    // Center Graphic in Placeholder
    ctx.textAlign = "center";

    // Big Code Brackets & Spark Icon
    ctx.font = "900 84px 'Anton', 'Bebas Neue', monospace";
    ctx.fillStyle = "#CCFF00"; // Neon Lime
    ctx.fillText("⚡ </> ⚡", photoX + photoWidth / 2, photoY + 250);

    ctx.font = "900 48px 'Anton', 'Bebas Neue', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("MY FIRST WEBSITE", photoX + photoWidth / 2, photoY + 340);

    ctx.font = "800 22px 'Manrope', sans-serif";
    ctx.fillStyle = "#A78BFA";
    ctx.fillText("BUILT & DEPLOYED LIVE", photoX + photoWidth / 2, photoY + 390);

    // Decorative chip
    ctx.fillStyle = "rgba(204, 255, 0, 0.18)";
    roundRect(ctx, photoX + photoWidth / 2 - 130, photoY + 440, 260, 44, 22);
    ctx.fill();
    ctx.strokeStyle = "#CCFF00";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#CCFF00";
    ctx.font = "700 16px 'Manrope', sans-serif";
    ctx.fillText("SPARK CLUB BUILDER", photoX + photoWidth / 2, photoY + 467);
  }

  // Dashed line stitch border (Authentic detail from the reference template)
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  roundRect(ctx, photoX + 16, photoY + 16, photoWidth - 32, photoHeight - 32, 6);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  ctx.restore(); // Restore clip

  // 5. Neon Lime Accent Tape Sticker
  // Pinned across the bottom border of the photo frame (as seen in the template)
  const tapeWidth = 260;
  const tapeHeight = 44;
  const tapeX = -tapeWidth / 2;
  const tapeY = photoY + photoHeight - tapeHeight / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#CCFF00"; // Neon Lime
  ctx.fillRect(tapeX, tapeY, tapeWidth, tapeHeight);
  ctx.restore();

  // 6. Bottom Information Section of the White Polaroid
  // Bottom black bar + white outlined badge block (inspired by reference template)
  const bottomBarY = photoY + photoHeight + 36;

  // Left solid black pill / badge
  ctx.fillStyle = "#0A0A0A";
  roundRect(ctx, photoX, bottomBarY + 120, 360, 48, 6);
  ctx.fill();

  ctx.fillStyle = "#CCFF00";
  ctx.font = "900 18px 'Manrope', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🔥 DROP YOUR BUILD", photoX + 180, bottomBarY + 151);

  // Right outlined badge
  ctx.strokeStyle = "#0A0A0A";
  ctx.lineWidth = 3;
  roundRect(ctx, photoX + 380, bottomBarY + 120, photoWidth - 380, 48, 6);
  ctx.stroke();

  ctx.fillStyle = "#0A0A0A";
  ctx.font = "800 16px 'Manrope', sans-serif";
  ctx.fillText("SPARK CLUB 2026", photoX + 380 + (photoWidth - 380) / 2, bottomBarY + 151);

  // Student Name & Announcement (Main statement on the Polaroid)
  ctx.textAlign = "left";

  // "I’m [Student Name]"
  const studentDisplayName = options.studentName.trim() || "A First-Year";

  ctx.font = "700 24px 'Manrope', sans-serif";
  ctx.fillStyle = "#52525B";
  ctx.fillText("I’m", photoX, bottomBarY + 36);

  // Name in bold display font
  ctx.font = "900 52px 'Anton', 'Bebas Neue', 'Barlow Condensed', sans-serif";
  ctx.fillStyle = "#0F172A";
  let nameText = studentDisplayName.toUpperCase();
  if (nameText.length > 22) nameText = nameText.slice(0, 20) + "…";
  ctx.fillText(nameText, photoX + 54, bottomBarY + 38);

  // "and made my first website."
  ctx.font = "800 32px 'Barlow Condensed', 'Manrope', sans-serif";
  ctx.fillStyle = "#4321A9"; // Royal purple
  ctx.fillText("AND MADE MY FIRST WEBSITE.", photoX, bottomBarY + 84);

  ctx.restore(); // End tilted Polaroid transformation

  // 7. Top Poster Branding & Header
  ctx.save();
  ctx.textAlign = "center";

  // Spark Logo / Club Pill
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundRect(ctx, 540 - 200, 110, 400, 56, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 20px 'Manrope', sans-serif";
  ctx.fillText("⚡ SPARK CLUB · IIIT BHOPAL ⚡", 540, 145);

  ctx.restore();

  // 8. Bottom Footer Branding
  ctx.save();
  ctx.textAlign = "center";

  // Official Instagram Callout
  ctx.font = "800 22px 'Manrope', sans-serif";
  ctx.fillStyle = "#E0E7FF";
  ctx.fillText("TAG @SPARK_IIITB ON INSTAGRAM STORIES", 540, 1800);

  ctx.font = "600 16px 'Manrope', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  let cleanUrl = options.websiteUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (cleanUrl.length > 40) cleanUrl = cleanUrl.slice(0, 38) + "…";
  ctx.fillText(cleanUrl, 540, 1835);

  ctx.restore();

  return canvas.toDataURL("image/png");
}

/**
 * Converts a data URL to a File object for the Web Share API
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
