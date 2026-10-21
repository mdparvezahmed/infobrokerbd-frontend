import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — the best shops, services and places in Bangladesh, reviewed by locals`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share image for every page that has no photo of its own. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: "linear-gradient(135deg, #059669 0%, #047857 55%, #064e3b 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#ffffff" fillOpacity="0.18" />
            <path
              d="M16 6.5c-4 0-7 3-7 6.9 0 4.9 5.6 10.6 6.3 11.3a1 1 0 0 0 1.4 0c.7-.7 6.3-6.4 6.3-11.3 0-3.9-3-6.9-7-6.9Z"
              fill="#fff"
            />
            <circle cx="16" cy="13.4" r="3.1" fill="#f43f5e" />
          </svg>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 800 }}>
            InfoBroker<span style={{ color: "#a7f3d0" }}>BD</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 }}>
            Find the best in Bangladesh — from people who&apos;ve been there.
          </div>
          <div style={{ fontSize: 32, color: "#d1fae5" }}>
            Phone repair · Electricians · Tour guides · Food · Places · Tips & warnings
          </div>
        </div>
      </div>
    ),
    size,
  );
}
