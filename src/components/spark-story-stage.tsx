import { useMemo, forwardRef, type HTMLAttributes } from "react";
import sparkLogo from "@/assets/spark_logo_transparent.png";

export interface SparkStoryStageProps extends HTMLAttributes<HTMLDivElement> {
  studentName?: string;
  screenshotUrl?: string | null;
  scale?: number;
  titleLine1?: string;
  titleLine2?: string;
  fitMode?: "cover" | "contain";
}

export { SparkWideStage, type SparkWideStageProps } from "./spark-wide-stage";

/**
 * Exact 1080 × 1920 Instagram Story Poster Stage
 * Ground truth layout matching official Spark Club reference
 */
export const SparkStoryStage = forwardRef<HTMLDivElement, SparkStoryStageProps>(
  function SparkStoryStage(
    { studentName, screenshotUrl, scale = 1, titleLine1, titleLine2, fitMode = "cover", className, style, ...props },
    ref
  ) {
    // Sanitize and format name: default "DFB", max 24 chars
    const displayName = useMemo(() => {
      const clean = (typeof studentName === "string" ? studentName : "").trim().toUpperCase();
      if (!clean) return "DFB";
      return clean.length > 24 ? clean.slice(0, 24) : clean;
    }, [studentName]);

    // Sanitize and format custom title lines (with ground-truth defaults)
    const cleanLine1 = useMemo(() => {
      const raw = typeof titleLine1 === "string" && titleLine1.trim() ? titleLine1 : "EXCITED TO SHARE";
      return raw.trim().toUpperCase().slice(0, 36);
    }, [titleLine1]);

    const cleanLine2 = useMemo(() => {
      const raw = typeof titleLine2 === "string" && titleLine2.trim() ? titleLine2 : "MY FIRST WEBSITE!";
      return raw.trim().toUpperCase().slice(0, 36);
    }, [titleLine2]);

    // Split Line 2 so the final word is highlighted in #6238F5
    const { firstPart, lastWord } = useMemo(() => {
      const words = cleanLine2.split(/\s+/).filter(Boolean);
      if (words.length <= 1) {
        return { firstPart: "", lastWord: words[0] || "WEBSITE!" };
      }
      const last = words.pop()!;
      return { firstPart: words.join(" ") + " ", lastWord: last };
    }, [cleanLine2]);

    // Dynamic font sizing for long custom titles
    const line1FontSize = useMemo(() => {
      if (cleanLine1.length > 24) return 50;
      if (cleanLine1.length > 18) return 60;
      return 70;
    }, [cleanLine1]);

    const line2FontSize = useMemo(() => {
      if (cleanLine2.length > 24) return 50;
      if (cleanLine2.length > 18) return 60;
      return 70;
    }, [cleanLine2]);

    // Calculate dynamic font size for name tag:
    // Text: "HEY, I AM " + NAME. Baseline font is 44px.
    // If length > 12 characters, shrink down to minimum 28px so it never overflows 340px.
    const tagFontSize = useMemo(() => {
      const fullText = `HEY, I AM ${displayName}`;
      if (fullText.length <= 13) return 44;
      if (fullText.length <= 16) return 38;
      if (fullText.length <= 20) return 32;
      return 28;
    }, [displayName]);

    return (
      <div
        className={className}
        style={{
          width: `${1080 * scale}px`,
          height: `${1920 * scale}px`,
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
        {...props}
      >
        <div
          ref={ref}
          id="spark-story-canvas"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "1080px",
            height: "1920px",
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            backgroundColor: "#140A3A",
            overflow: "hidden",
            userSelect: "none",
            WebkitUserSelect: "none",
            fontFamily: "'Anton', Impact, sans-serif",
          }}
        >
          {/* 1. Background Anton Letters (Behind everything) */}
          {/* Row 1: SEARCH y=10, x=-20 */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "-20px",
              fontSize: "395px",
              lineHeight: 0.82,
              letterSpacing: "-10px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#6238F5" }}>S</span>
            <span style={{ color: "#2C1478" }}>E</span>
            <span style={{ color: "#6238F5" }}>A</span>
            <span style={{ color: "#E8307A" }}>R</span>
            <span style={{ color: "#2C1478" }}>C</span>
            <span style={{ color: "#6238F5" }}>H</span>
          </div>

          {/* Row 2: FORSPARK y=395, x=-140 */}
          <div
            style={{
              position: "absolute",
              top: "395px",
              left: "-140px",
              fontSize: "395px",
              lineHeight: 0.82,
              letterSpacing: "-10px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#2C1478" }}>F</span>
            <span style={{ color: "#6238F5" }}>O</span>
            <span style={{ color: "#2C1478" }}>R</span>
            <span style={{ color: "#E8307A" }}>S</span>
            <span style={{ color: "#6238F5" }}>P</span>
            <span style={{ color: "#2C1478" }}>A</span>
            <span style={{ color: "#6238F5" }}>R</span>
            <span style={{ color: "#2C1478" }}>K</span>
          </div>

          {/* Row 3: SEARCH y=780, x=-60 */}
          <div
            style={{
              position: "absolute",
              top: "780px",
              left: "-60px",
              fontSize: "395px",
              lineHeight: 0.82,
              letterSpacing: "-10px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#6238F5" }}>S</span>
            <span style={{ color: "#2C1478" }}>E</span>
            <span style={{ color: "#E8307A" }}>A</span>
            <span style={{ color: "#6238F5" }}>R</span>
            <span style={{ color: "#2C1478" }}>C</span>
            <span style={{ color: "#6238F5" }}>H</span>
          </div>

          {/* Row 4: FORSPARK y=1165, x=-190 */}
          <div
            style={{
              position: "absolute",
              top: "1165px",
              left: "-190px",
              fontSize: "395px",
              lineHeight: 0.82,
              letterSpacing: "-10px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#6238F5" }}>F</span>
            <span style={{ color: "#2C1478" }}>O</span>
            <span style={{ color: "#6238F5" }}>R</span>
            <span style={{ color: "#2C1478" }}>S</span>
            <span style={{ color: "#6238F5" }}>P</span>
            <span style={{ color: "#E8307A" }}>A</span>
            <span style={{ color: "#2C1478" }}>R</span>
            <span style={{ color: "#6238F5" }}>K</span>
          </div>

          {/* Row 5: SPARKFOR y=1550, x=-40 */}
          <div
            style={{
              position: "absolute",
              top: "1550px",
              left: "-40px",
              fontSize: "395px",
              lineHeight: 0.82,
              letterSpacing: "-10px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#6238F5" }}>S</span>
            <span style={{ color: "#2C1478" }}>P</span>
            <span style={{ color: "#E8307A" }}>A</span>
            <span style={{ color: "#6238F5" }}>R</span>
            <span style={{ color: "#C5E800" }}>K</span>
            <span style={{ color: "#2C1478" }}>F</span>
            <span style={{ color: "#6238F5" }}>O</span>
            <span style={{ color: "#2C1478" }}>R</span>
          </div>

          {/* Soft vignette overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(20, 10, 58, 0) 45%, rgba(8, 3, 28, 0.45) 100%)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* 2. Peeking Pink Cards (behind the main card, partly off-canvas) */}
          {/* Top-right card: center at (1050, 330), rotated -4deg */}
          <div
            style={{
              position: "absolute",
              left: "910px", // 1050 - 140
              top: "135px", // 330 - 195
              width: "280px",
              height: "390px",
              transform: "rotate(-4deg)",
              backgroundColor: "#FFFFFF",
              boxShadow: "14px 22px 50px rgba(0, 0, 0, 0.55)",
              borderRadius: "2px",
              overflow: "hidden",
              zIndex: 3,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "14%",
                top: "14%",
                right: "8%",
                bottom: "20%",
                backgroundColor: "#E8307A",
                overflow: "hidden",
              }}
            >
              <img
                src={sparkLogo}
                alt="Spark Logo"
                style={{
                  position: "absolute",
                  left: "14%",
                  top: "30%",
                  width: "250px",
                  height: "auto",
                  maxWidth: "none",
                  display: "block",
                }}
              />
            </div>
          </div>

          {/* Bottom-left card: center at (10, 1500), rotated -5deg */}
          <div
            style={{
              position: "absolute",
              left: "-130px", // 10 - 140
              top: "1305px", // 1500 - 195
              width: "280px",
              height: "390px",
              transform: "rotate(-5deg)",
              backgroundColor: "#FFFFFF",
              boxShadow: "14px 22px 50px rgba(0, 0, 0, 0.55)",
              borderRadius: "2px",
              overflow: "hidden",
              zIndex: 3,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "14%",
                top: "14%",
                right: "8%",
                bottom: "20%",
                backgroundColor: "#E8307A",
                overflow: "hidden",
              }}
            >
              <img
                src={sparkLogo}
                alt="Spark Logo"
                style={{
                  position: "absolute",
                  left: "22%",
                  top: "27%",
                  width: "175px",
                  height: "auto",
                  maxWidth: "none",
                  display: "block",
                }}
              />
            </div>
          </div>

          {/* 3. Main White Card: 780x1260, centered at (540, 960), rotated -3.5deg */}
          <div
            id="story-main-card"
            style={{
              position: "absolute",
              left: "150px", // 540 - 390
              top: "330px", // 960 - 630
              width: "780px",
              height: "1260px",
              transform: "rotate(-3.5deg)",
              backgroundColor: "#FFFFFF",
              boxShadow: "16px 26px 60px rgba(0, 0, 0, 0.55)",
              borderRadius: "2px",
              zIndex: 5,
            }}
          >
            {/* 3a. Photo frame: left 30, top 30, width 720, height 870 */}
            <div
              style={{
                position: "absolute",
                left: "30px",
                top: "30px",
                width: "720px",
                height: "870px",
                overflow: "hidden",
                background: "linear-gradient(180deg, #6238F5 0%, #9E2EB9 100%)",
              }}
            >
              {screenshotUrl ? (
                <img
                  src={screenshotUrl}
                  alt="Website Viewport"
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: fitMode === "contain" ? "contain" : "cover",
                    objectPosition: fitMode === "contain" ? "center" : "top center",
                    display: "block",
                  }}
                />
              ) : (
                /* Fallback gradient with club logo & dashed stitch guide */
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <img
                      src={sparkLogo}
                      alt="Spark Club Logo"
                      style={{
                        width: "320px",
                        height: "auto",
                        objectFit: "contain",
                        filter: "drop-shadow(0 12px 28px rgba(0, 0, 0, 0.45))",
                      }}
                    />
                  </div>

                  <svg
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "16px",
                      width: "688px",
                      height: "838px",
                      pointerEvents: "none",
                    }}
                  >
                    <rect
                      x="1.5"
                      y="1.5"
                      width="685"
                      height="835"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth="2.5"
                      strokeDasharray="14, 10"
                    />
                  </svg>
                </>
              )}
            </div>

            {/* 3b. Lime name tag: x=200 to 580 (width 380), y=870 to 936 (height 66), background #C5E800 */}
            <div
              style={{
                position: "absolute",
                left: "200px",
                top: "870px",
                width: "380px",
                height: "66px",
                backgroundColor: "#C5E800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "'Anton', Impact, sans-serif",
                  fontSize: `${tagFontSize}px`,
                  lineHeight: 1,
                  color: "#0E0A18",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  marginTop: "2px",
                }}
              >
                HEY, I AM {displayName}
              </span>
            </div>

            {/* 3c. Title */}
            <div
              style={{
                position: "absolute",
                left: "38px",
                top: "960px",
                fontFamily: "'Anton', Impact, sans-serif",
                fontSize: `${line1FontSize}px`,
                lineHeight: 1,
                color: "#0E0A18",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              {cleanLine1}
            </div>

            <div
              style={{
                position: "absolute",
                left: "38px",
                top: "1037px",
                fontFamily: "'Anton', Impact, sans-serif",
                fontSize: `${line2FontSize}px`,
                lineHeight: 1,
                color: "#0E0A18",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              {firstPart}
              <span style={{ color: "#6238F5" }}>{lastWord}</span>
            </div>

            {/* 3d. Bottom bars */}
            {/* Left bar: x=30 to 450, y=1160 to 1216 (width 420, height 56), background #0E0A18 */}
            <div
              style={{
                position: "absolute",
                left: "30px",
                top: "1160px",
                width: "420px",
                height: "56px",
                backgroundColor: "#0E0A18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: "24px",
                  color: "#FFFFFF",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                SPARK CLUB
              </span>
            </div>

            {/* Right box: x=480 to 750 (width 270, height 56), 4px solid #0E0A18 border, white fill */}
            <div
              style={{
                position: "absolute",
                left: "480px",
                top: "1160px",
                width: "270px",
                height: "56px",
                border: "4px solid #0E0A18",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 800,
                  fontSize: "24px",
                  color: "#0E0A18",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                26-27 TEAM
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
