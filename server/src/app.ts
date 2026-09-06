import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { openApiSpec } from "./config/swagger";

import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import ticketsRoutes from "./routes/tickets.routes";
import categoriesRoutes from "./routes/categories.routes";
import usersRoutes from "./routes/users.routes";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // CORS: allow only the configured frontend origin, with credentials so
  // the HTTP-only session cookie can be sent/received cross-origin during
  // local development (frontend on :5173, API on :5000). Wildcard origin is
  // never valid alongside credentials: true.
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  // Swagger UI -- interactive docs/testing surface for the REST API.
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/tickets", ticketsRoutes);
  app.use("/api/categories", categoriesRoutes);
  app.use("/api/users", usersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
