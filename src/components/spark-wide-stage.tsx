import { useMemo, forwardRef, type HTMLAttributes } from "react";
import sparkLogo from "@/assets/spark_logo_transparent.png";

export interface SparkWideStageProps extends HTMLAttributes<HTMLDivElement> {
  studentName?: string;
  websiteUrl?: string;
  screenshotUrl?: string | null;
  scale?: number;
  titleLine1?: string;
  titleLine2?: string;
}

/**
 * Exact 1920 × 1080 Landscape Showcase Poster Stage
 * Designed to showcase the complete desktop website viewport without vertical/horizontal cropping.
 * Perfect for desktop displays, LinkedIn, Twitter/X, Discord, and portfolios.
 */
export const SparkWideStage = forwardRef<HTMLDivElement, SparkWideStageProps>(
  function SparkWideStage(
    { studentName, websiteUrl, screenshotUrl, scale = 1, titleLine1, titleLine2, className, style, ...props },
    ref
  ) {
    // Sanitize and format name: default "DFB", max 24 chars
    const displayName = useMemo(() => {
      const clean = (typeof studentName === "string" ? studentName : "").trim().toUpperCase();
      if (!clean) return "DFB";
      return clean.length > 24 ? clean.slice(0, 24) : clean;
    }, [studentName]);

    // Format clean display URL for browser address capsule
    const displayUrl = useMemo(() => {
      if (!websiteUrl) return "spark-build-station.vercel.app";
      try {
        const u = new URL(websiteUrl);
        return u.hostname + (u.pathname !== "/" ? u.pathname : "");
      } catch {
        return websiteUrl.replace(/^https?:\/\//i, "").slice(0, 48);
      }
    }, [websiteUrl]);

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

    return (
      <div
        className={className}
        style={{
          width: `${1920 * scale}px`,
          height: `${1080 * scale}px`,
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
        {...props}
      >
        <div
          ref={ref}
          id="spark-wide-canvas"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "1920px",
            height: "1080px",
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            backgroundColor: "#140A3A",
            overflow: "hidden",
            userSelect: "none",
            WebkitUserSelect: "none",
            fontFamily: "'Anton', Impact, sans-serif",
          }}
        >
          {/* 1. Background Anton Letters (Across 1920px width) */}
          {/* Row 1: SEARCH FOR SPARK y=10, x=-20 */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "-20px",
              fontSize: "270px",
              lineHeight: 0.82,
              letterSpacing: "-6px",
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
            <span style={{ color: "transparent" }}>{" "}</span>
            <span style={{ color: "#2C1478" }}>F</span>
            <span style={{ color: "#6238F5" }}>O</span>
            <span style={{ color: "#2C1478" }}>R</span>
            <span style={{ color: "transparent" }}>{" "}</span>
            <span style={{ color: "#E8307A" }}>S</span>
            <span style={{ color: "#6238F5" }}>P</span>
            <span style={{ color: "#2C1478" }}>A</span>
            <span style={{ color: "#6238F5" }}>R</span>
            <span style={{ color: "#2C1478" }}>K</span>
          </div>

          {/* Row 2: FOR SPARK SEARCH y=370, x=-120 */}
          <div
            style={{
              position: "absolute",
              top: "370px",
              left: "-120px",
              fontSize: "270px",
              lineHeight: 0.82,
              letterSpacing: "-6px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}
          >
            <span style={{ color: "#2C1478" }}>F</span>
            <span style={{ color: "#6238F5" }}>O</span>
            <span style={{ color: "#2C1478" }}>R</span>
            <span style={{ color: "transparent" }}>{" "}</span>
            <span style={{ color: "#E8307A" }}>S</span>
            <span style={{ color: "#6238F5" }}>P</span>
            <span style={{ color: "#2C1478" }}>A</span>
            <span style={{ color: "#6238F5" }}>R</span>
            <span style={{ color: "#2C1478" }}>K</span>
            <span style={{ color: "transparent" }}>{" "}</span>
            <span style={{ color: "#6238F5" }}>S</span>
            <span style={{ color: "#2C1478" }}>E</span>
            <span style={{ color: "#6238F5" }}>A</span>
            <span style={{ color: "#E8307A" }}>R</span>
            <span style={{ color: "#2C1478" }}>C</span>
            <span style={{ color: "#6238F5" }}>H</span>
          </div>

          {/* Row 3: SPARK FOR SEARCH y=730, x=-50 */}
          <div
            style={{
              position: "absolute",
              top: "730px",
              left: "-50px",
              fontSize: "270px",
              lineHeight: 0.82,
              letterSpacing: "-6px",
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
            <span style={{ color: "transparent" }}>{" "}</span>
            <span style={{ color: "#2C1478" }}>F</span>
            <span style={{ color: "#6238F5" }}>O</span>
            <span style={{ color: "#2C1478" }}>R</span>
            <span style={{ color: "transparent" }}>{" "}</span>
            <span style={{ color: "#6238F5" }}>S</span>
            <span style={{ color: "#2C1478" }}>E</span>
            <span style={{ color: "#E8307A" }}>A</span>
            <span style={{ color: "#6238F5" }}>R</span>
            <span style={{ color: "#2C1478" }}>C</span>
            <span style={{ color: "#6238F5" }}>H</span>
          </div>

          {/* Soft vignette overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(20, 10, 58, 0) 50%, rgba(8, 3, 28, 0.5) 100%)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* Peeking Pink Cards */}
          {/* Top-right card */}
          <div
            style={{
              position: "absolute",
              left: "1720px",
              top: "80px",
              width: "260px",
              height: "360px",
              transform: "rotate(4deg)",
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
                  width: "230px",
                  height: "auto",
                  maxWidth: "none",
                  display: "block",
                }}
              />
            </div>
          </div>

          {/* Bottom-left card */}
          <div
            style={{
              position: "absolute",
              left: "-90px",
              top: "760px",
              width: "260px",
              height: "360px",
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
                  width: "160px",
                  height: "auto",
                  maxWidth: "none",
                  display: "block",
                }}
              />
            </div>
          </div>

          {/* Main White Showcase Card: 1540x910, centered, rotated -1.2deg */}
          <div
            id="wide-main-card"
            style={{
              position: "absolute",
              left: "190px",
              top: "85px",
              width: "1540px",
              height: "910px",
              transform: "rotate(-1.2deg)",
              backgroundColor: "#FFFFFF",
              boxShadow: "18px 28px 70px rgba(0, 0, 0, 0.55)",
              borderRadius: "4px",
              zIndex: 5,
            }}
          >
            {/* Viewport Frame with macOS Window Bar */}
            <div
              style={{
                position: "absolute",
                left: "25px",
                top: "25px",
                width: "1490px",
                height: "710px",
                overflow: "hidden",
                borderRadius: "3px",
                backgroundColor: "#0E0A18",
                border: "2px solid #0E0A18",
              }}
            >
              {/* Window Chrome / Title Bar */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "44px",
                  backgroundColor: "#1C1138",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 18px",
                  zIndex: 10,
                  boxSizing: "border-box",
                }}
              >
                {/* 3 macOS Traffic Light Dots */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "13px", height: "13px", borderRadius: "50%", backgroundColor: "#FF5F56" }} />
                  <div style={{ width: "13px", height: "13px", borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
                  <div style={{ width: "13px", height: "13px", borderRadius: "50%", backgroundColor: "#27C93F" }} />
                </div>

                {/* Center Address Capsule */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "4px 24px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "13px",
                    fontFamily: "'Inter', monospace, sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    maxWidth: "600px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span style={{ color: "#27C93F", fontSize: "10px" }}>●</span>
                  <span>{displayUrl}</span>
                </div>

                {/* Right Badge */}
                <div
                  style={{
                    marginLeft: "auto",
                    fontFamily: "'Anton', Impact, sans-serif",
                    fontSize: "13px",
                    color: "#C5E800",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  SPARK BUILD
                </div>
              </div>

              {/* Website Screenshot / Canvas Viewport */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "44px",
                  width: "100%",
                  height: "666px",
                  overflow: "hidden",
                  backgroundColor: "#0B061A",
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
                      objectFit: "cover",
                      objectPosition: "top center",
                      display: "block",
                    }}
                  />
                ) : (
                  /* Fallback gradient with club logo */
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, #6238F5 0%, #9E2EB9 100%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={sparkLogo}
                      alt="Spark Club Logo"
                      style={{
                        width: "360px",
                        height: "auto",
                        objectFit: "contain",
                        filter: "drop-shadow(0 12px 28px rgba(0, 0, 0, 0.45))",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Card Bar: Lime Tag, Headline & Badges */}
            {/* Lime Name Tag: left 25, top 750, height 60, padding 0 28px */}
            <div
              style={{
                position: "absolute",
                left: "25px",
                top: "750px",
                height: "60px",
                padding: "0 28px",
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
                  fontSize: "40px",
                  lineHeight: 1,
                  color: "#0E0A18",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  marginTop: "2px",
                }}
              >
                HEY, I AM {displayName}
              </span>
            </div>

            {/* Headline: left 25, top 826px */}
            <div
              style={{
                position: "absolute",
                left: "25px",
                top: "826px",
                fontFamily: "'Anton', Impact, sans-serif",
                fontSize: "48px",
                lineHeight: 1,
                color: "#0E0A18",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              <span>{cleanLine1} — {firstPart}</span>
              <span style={{ color: "#6238F5" }}>{lastWord}</span>
            </div>

            {/* Right Badges */}
            <div
              style={{
                position: "absolute",
                right: "25px",
                top: "765px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              {/* SPARK CLUB bar */}
              <div
                style={{
                  width: "250px",
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

              {/* 26-27 TEAM box */}
              <div
                style={{
                  width: "190px",
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

              {/* Spark Logo */}
              <img
                src={sparkLogo}
                alt="Spark Club Logo"
                style={{
                  width: "56px",
                  height: "auto",
                  display: "block",
                  marginLeft: "4px",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
