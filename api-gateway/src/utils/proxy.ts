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
      proxyReq: (proxyReq, req: any, _res) => {
        console.log(`[Gateway] Final Target: ${target}${proxyReq.path}`);

        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
          proxyReq.setHeader("x-user-email", req.user.email);
        }
      },
      error: (err, _req, _res) => {
        console.error(`[Proxy Error]: ${err.message}`);
      },
    },
  });
