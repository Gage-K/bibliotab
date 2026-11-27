import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { env } from "./common/config/env.config";
import { UserRepository } from "./data/repositories/user.repository";
import { TabRepository } from "./data/repositories/tab.repository";
import { AuthService } from "./core/services/auth.service";
import { TabService } from "./core/services/tab.service";
import { createAuthRouter } from "./api/routes/auth.routes";
import { authMiddleware } from "./api/middleware/auth.middleware";
import { errorHandler } from "./api/middleware/error.middleware";
import { createTabRouter } from "./api/routes/tab.routes";
import { createUserRouter } from "./api/routes/user.routes";
import { dbConfig } from "./data/db.config";
import { runMigrations } from "./data/migrate";

// Create database pool
const pool = new Pool(dbConfig);

// Initialize repositories
const userRepository = new UserRepository(pool);
const tabRepository = new TabRepository(pool);

// Initialize services
const authService = new AuthService(userRepository);
const tabService = new TabService(tabRepository);

// Initialize express app
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: env.FE_API,
    credentials: true,
  })
);

// Create routes
app.use("/api/auth", createAuthRouter(authService));
app.use("/api/user", createUserRouter(userRepository, authService));
app.use("/api/tabs", createTabRouter(tabService, userRepository));

// Error middleware
app.use(errorHandler);

// Start server, but only once the schema matches this code. A failed migration exits
// the process before it listens, so a broken deploy never serves requests.
runMigrations(dbConfig).then(
  () => {
    app.listen(3000, () => {
      console.log(`Application running on port ${env.PORT || 3000}`);
    });
  },
  (error: unknown) => {
    console.error("Not starting: database migration failed.", error);
    process.exit(1);
  },
);
