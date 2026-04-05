import path from "path";
import fs from "fs";
import yaml from "js-yaml";

const docsDir = path.join(__dirname, "../../docs");

function loadYaml(file: string) {
  return yaml.load(fs.readFileSync(path.join(docsDir, file), "utf8")) as Record<
    string,
    unknown
  >;
}

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description: "Authentication and Authorization Microservice",
  },
  servers: [{ url: "http://localhost:3001", description: "Local" }],
  tags: [{ name: "Health" }, { name: "Auth" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: loadYaml("components/schemas.yaml"),
    responses: loadYaml("components/response.yaml"),
  },
  paths: {
    ...loadYaml("paths/health.yaml"),
    ...loadYaml("paths/auth.yaml"),
    ...loadYaml("paths/user.yaml"),
  },
};
