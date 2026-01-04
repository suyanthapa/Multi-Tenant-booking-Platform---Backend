// src/utils/proxy.ts
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Request } from "express";

export const createServiceProxy = (target: string) => {
  const options: Options = {
    target,
    changeOrigin: true,
    // Professional touch: Pass the full original URL to the microservice
    pathRewrite: async (_path, req) => (req as Request).originalUrl,

    on: {
      proxyReq: (proxyReq, req: any) => {
        // 1. Logging for Observability
        console.log(
          `[Gateway] ${req.method} ${req.originalUrl} -> ${target}${proxyReq.path}`
        );

        // 2. Identity Propagation (X-Headers)
        if (req.user) {
          proxyReq.setHeader("x-user-id", String(req.user.userId));
          proxyReq.setHeader("x-user-role", String(req.user.role));
          proxyReq.setHeader("x-user-email", String(req.user.email));
        }
      },
      proxyRes: (proxyRes, _req, _res) => {
        // 3. Custom header to track which service handled the request
        proxyRes.headers["x-proxy-service"] = target;
      },
      error: (err, _req, res: any) => {
        // 4. Clean error handling
        res.status(502).json({
          success: false,
          error: "Service Unavailable",
          message: err.message,
        });
      },
    },
  };

  return createProxyMiddleware(options);
};
