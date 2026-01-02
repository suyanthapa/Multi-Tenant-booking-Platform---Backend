import { createProxyMiddleware } from "http-proxy-middleware";

export const proxy = (target: string, prefix: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => {
      // (/api/auth, /api/bookings, etc.)
      return `${prefix}${path}`;
    },

    on: {
      proxyReq: (proxyReq, _req, _res) => {
        console.log(`[Gateway] Final Target: ${target}${proxyReq.path}`);
      },
      error: (err, _req, _res) => {
        console.error(`[Proxy Error]: ${err.message}`);
      },
    },
  });
