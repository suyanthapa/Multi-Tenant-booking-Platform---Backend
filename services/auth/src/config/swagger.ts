import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "Authentication and Authorization Microservice",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "user@example.com" },
            password: { type: "string", example: "password123" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["email", "password", "username"],
          properties: {
            email: { type: "string", example: "user@example.com" },
            password: { type: "string", example: "password123" },
            username: { type: "string", example: "johndoe" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                username: { type: "string" },
                role: {
                  type: "string",
                  enum: ["CUSTOMER", "VENDOR", "ADMIN"],
                },
                status: { type: "string" },
              },
            },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // reads JSDoc from route files
};

export const swaggerSpec = swaggerJsdoc(options);
