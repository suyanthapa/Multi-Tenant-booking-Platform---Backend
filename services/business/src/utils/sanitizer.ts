const SENSITIVE_FIELDS = [
  "password",
  "confirmPassword",
  "newPassword",
  "confirmNewPassword",
  "passwordHash",
  "resetToken",
  "refreshToken",
  "accessToken",
  "otp",
];

export const sanitizeBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};

  const sanitized = { ...(body as Record<string, unknown>) };

  SENSITIVE_FIELDS.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};
