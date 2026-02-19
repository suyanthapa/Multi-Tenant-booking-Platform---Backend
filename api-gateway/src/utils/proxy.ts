// src/utils/proxy.ts
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { Request } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}
export const createServiceProxy = (target: string) => {
  const options: Options = {
    target,
    changeOrigin: true,
    // Professional touch: Pass the full original URL to the microservice
    pathRewrite: async (_path, req) =>
      (req as AuthenticatedRequest).originalUrl,

    on: {
      proxyReq: (proxyReq, req: any) => {
        // 1. Logging for Observability
        console.log(
          `[Gateway] ${req.method} ${req.originalUrl} -> ${target}${proxyReq.path}`,
        );

        // 2. Identity Propagation (X-Headers)
        if (req.user) {
          console.log(
            " [Gateway] Propagating User:",
            req.user.email || req.user.id,
          );
          proxyReq.setHeader("x-user-id", String(req.user.id));
          proxyReq.setHeader("x-user-role", String(req.user.role));
          proxyReq.setHeader("x-user-email", String(req.user.email));
        } else {
          console.log(" [Gateway] Unauthenticated request");
        }
      },
      proxyRes: (proxyRes, _req, _res) => {
        // Custom header to track which service handled the request
        proxyRes.headers["x-proxy-service"] = target;
      },
      error: (err, _req, res: any) => {
        // Clean error handling
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
