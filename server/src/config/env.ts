import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  port: Number(process.env.PORT ?? 5000),
  clientUrl: required("CLIENT_URL", "http://localhost:5173"),
  sessionSecret: required("SESSION_SECRET", "dev-only-secret-change-me"),
  databaseUrl: required("DATABASE_URL", "file:./dev.db"),
};
