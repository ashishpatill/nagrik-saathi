import path from "node:path";
import type { NextConfig } from "next";

// Content-Security-Policy notes:
// - 'unsafe-inline' scripts are required by Next.js hydration (no nonce
//   without middleware). Production never allows eval; the development
//   server needs it for React's debugging features, so it is added only
//   outside production.
// - 'wasm-unsafe-eval' + cdn.jsdelivr.net: Tesseract.js loads its OCR
//   worker and WASM core from the CDN; tessdata.projectnaptha.com serves
//   the trained language data. pdf.js and the WebMCP polyfill are bundled
//   locally ('self', blob: workers).
// - SerpApi is called server-side from the route handler, so the browser
//   never needs serpapi.com in connect-src.
const devScriptSrc = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net${devScriptSrc}`,
  "worker-src 'self' blob:",
  "connect-src 'self' https://cdn.jsdelivr.net https://tessdata.projectnaptha.com",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "tools=(self)",
          },
          {
            key: "Origin-Agent-Cluster",
            value: "?1",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
