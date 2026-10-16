import templateImgUrl from "@/assets/drop-build-template.png";

/**
 * Spark Club - Drop Your Build
 * Official Poster Generator
 *
 * Composites user website submissions directly onto the official Spark Club designer template:
 * - High-resolution 2x retina canvas (1850 × 2048 px based on 925 × 1024 master template)
 * - Tilted Polaroid frame with accurate angle (-3.814°) and pixel-perfect photo cutout
 * - Website screenshot preview (or neon branded developer terminal if skipped)
 * - Dashed stitch line & neon lime masking tape sticker
 * - "I’m [Student Name] AND MADE MY FIRST WEBSITE."
 * - "🔥 DROP YOUR BUILD" and live site domain in the footer badges
 */

export interface PosterOptions {
  studentName: string;
  websiteUrl: string;
  screenshotDataUrl?: string | null;
  /**
   * "poster": The exact master template aspect ratio (1850 × 2048, ~9:10)
   * "story": Padded 1080 × 1920 (9:16) for full-screen Instagram Stories
   */
  mode?: "poster" | "story";
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
 * Renders the official Spark Club poster onto an offscreen canvas
 * and returns the high-resolution PNG data URL.
 */
export async function renderInstagramStoryPoster(options: PosterOptions): Promise<string> {
  // Wait for Google Fonts to be ready so Anton, Bebas Neue, Barlow, and Manrope render accurately
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font loading times out
    }
  }

  // 1. Load the official master template graphic
  const templateImg = await loadImage(templateImgUrl);
  const baseW = templateImg.width || 925;
  const baseH = templateImg.height || 1024;

  const isStory = options.mode === "story";

  // Master canvas setup
  // For standard "poster" mode: 2x retina (1850 × 2048)
  // For "story" mode: 1080 × 1920 portrait
  const canvas = document.createElement("canvas");
  const scale = 2; // Retina sharpness

  if (isStory) {
    canvas.width = 1080;
    canvas.height = 1920;
  } else {
    canvas.width = baseW * scale;
    canvas.height = baseH * scale;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to initialize canvas 2D rendering context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // If Story mode (9:16), fill background with matching deep space navy and center the template
  if (isStory) {
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGradient.addColorStop(0, "#080618");
    bgGradient.addColorStop(0.5, "#0D0A24");
    bgGradient.addColorStop(1, "#070516");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Compute scale and position to fit template neatly inside 1080x1920 with safe margins
    const targetW = 1020;
    const targetH = (baseH / baseW) * targetW;
    const offsetX = (1080 - targetW) / 2;
    const offsetY = (1920 - targetH) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(targetW / baseW, targetH / baseH);
    await drawPosterLayers(ctx, templateImg, options, baseW, baseH);
    ctx.restore();

    // Top Story Pill
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    roundRect(ctx, 540 - 180, 60, 360, 48, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 16px 'Manrope', system-ui, sans-serif";
    ctx.fillText("⚡ SPARK CLUB · IIIT BHOPAL ⚡", 540, 84);

    // Bottom Story Tag
    ctx.fillStyle = "#E0E7FF";
    ctx.font = "800 18px 'Manrope', system-ui, sans-serif";
    ctx.fillText("TAG @SPARK_IIITB ON INSTAGRAM STORIES", 540, 1850);
    ctx.restore();
  } else {
    // Exact official poster mode (matches Image 2 directly at 2x retina)
    ctx.save();
    ctx.scale(scale, scale);
    await drawPosterLayers(ctx, templateImg, options, baseW, baseH);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

/**
 * Draws the composite layers onto the canvas at base template coordinates (925 × 1024)
 */
async function drawPosterLayers(
  ctx: CanvasRenderingContext2D,
  templateImg: HTMLImageElement,
  options: PosterOptions,
  baseW: number,
  baseH: number
) {
  // 1. Draw base designer template (background graphics, "SEARCH FOR SPARK", corner polaroids, white frame)
  ctx.drawImage(templateImg, 0, 0, baseW, baseH);

  // 2. White Polaroid Frame Transformation
  // Measured center: (483.75, 442.75), tilt angle: -3.814° (-0.066568 rad)
  const cx = 483.75;
  const cy = 442.75;
  const angle = -0.066568;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 3. Photo container coordinates (relative to tilted frame center)
  // Perfectly overlays the purple cutout in the master template
  const photoX = -282;
  const photoY = -352;
  const photoW = 575;
  const photoH = 510;

  // Clip to inner photo area with slight corner radius
  ctx.save();
  roundRect(ctx, photoX, photoY, photoW, photoH, 4);
  ctx.clip();

  // 4. Draw Website Screenshot OR Branded Terminal Fallback
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
        // Taller than frame: fit width, align to top to showcase website navbar & hero!
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
    // Deep violet terminal canvas
    const termGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
    termGrad.addColorStop(0, "#150D32");
    termGrad.addColorStop(1, "#231454");
    ctx.fillStyle = termGrad;
    ctx.fillRect(photoX, photoY, photoW, photoH);

    // Browser header bar
    ctx.fillStyle = "#1E1442";
    ctx.fillRect(photoX, photoY, photoW, 36);

    // Traffic light dots
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(photoX + 18, photoY + 18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(photoX + 34, photoY + 18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(photoX + 50, photoY + 18, 5, 0, Math.PI * 2);
    ctx.fill();

    // Address pill
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    roundRect(ctx, photoX + 70, photoY + 8, photoW - 90, 20, 6);
    ctx.fill();

    let displayDomain = options.websiteUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    if (displayDomain.length > 34) displayDomain = displayDomain.slice(0, 32) + "…";

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "600 10px 'Manrope', monospace, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(displayDomain || "my-first-site.vercel.app", photoX + 80, photoY + 18);

    // Center Graphic
    ctx.textAlign = "center";
    ctx.fillStyle = "#CCFF00"; // Neon Lime
    ctx.font = "900 68px 'Anton', 'Bebas Neue', monospace";
    ctx.fillText("⚡ </> ⚡", photoX + photoW / 2, photoY + 180);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 38px 'Anton', 'Bebas Neue', sans-serif";
    ctx.fillText("MY FIRST WEBSITE", photoX + photoW / 2, photoY + 245);

    ctx.fillStyle = "#C4B5FD";
    ctx.font = "800 18px 'Barlow Condensed', 'Manrope', sans-serif";
    ctx.fillText("BUILT & DEPLOYED LIVE", photoX + photoW / 2, photoY + 285);

    // Spark Club Builder Badge
    ctx.fillStyle = "rgba(204, 255, 0, 0.15)";
    roundRect(ctx, photoX + photoW / 2 - 110, photoY + 320, 220, 36, 18);
    ctx.fill();
    ctx.strokeStyle = "#CCFF00";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#CCFF00";
    ctx.font = "800 13px 'Manrope', sans-serif";
    ctx.fillText("SPARK CLUB BUILDER", photoX + photoW / 2, photoY + 338);
  }

  // 5. Authentic Dashed Stitch Border (from the reference template)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(photoX + 14, photoY + 14, photoW - 28, photoH - 28);
  ctx.setLineDash([]);

  ctx.restore(); // Restore photo clip

  // 6. Neon Lime Masking Tape Sticker
  // Pinned at center u = -22, v = 156 with realistic drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#C5E800"; // Exact neon lime
  const tapeW = 276;
  const tapeH = 62;
  const tapeX = -22 - tapeW / 2;
  const tapeY = 156 - tapeH / 2;
  ctx.fillRect(tapeX, tapeY, tapeW, tapeH);
  ctx.restore();

  // 7. Remove the bottom option boxes cleanly with Polaroid white
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(-276, 190, 515, 140);

  // 8. Write requested text: "hey i am xyz(name of the student) and excited to share my first website"
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const studentDisplayName = options.studentName.trim() || "A Student";
  let nameUpper = studentDisplayName.toUpperCase();
  if (nameUpper.length > 24) nameUpper = nameUpper.slice(0, 22) + "…";

  // Line 1: "Hey, I am"
  ctx.font = "800 18px 'Manrope', system-ui, sans-serif";
  ctx.fillStyle = "#64748B"; // Elegant slate
  ctx.fillText("Hey, I am", -250, 218);

  // Line 2: Student Name in bold display font
  ctx.font = "900 38px 'Anton', 'Bebas Neue', 'Barlow Condensed', sans-serif";
  ctx.fillStyle = "#0F172A";
  ctx.fillText(nameUpper, -250, 252);

  // Line 3: "and excited to share my first website!"
  ctx.font = "800 21px 'Barlow Condensed', 'Manrope', sans-serif";
  ctx.fillStyle = "#4321A9"; // Royal purple
  ctx.fillText("and excited to share my first website! 🚀", -250, 292);

  ctx.restore(); // Restore Polaroid transform
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
