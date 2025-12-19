import express from "express";
import cors from "cors";
import { ENV } from "./env.js";

import authRoutes from "./routes/auth";
import listingsRoutes from "./routes/listings";
import bookmarksRoutes from "./routes/bookmarks";
import reviewsRoutes from "./routes/reviews";
import dbTestRoute from "./routes/dbTest";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Mount routes
app.use("/auth", authRoutes);
app.use("/listings", listingsRoutes);
app.use("/bookmarks", bookmarksRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/api/db-test", dbTestRoute);

// Not found handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Error handler (very simple for MVP)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  // Don't expose internal error details
  res.status(500).json({ error: "An unexpected error occurred. Please try again." });
});

app.listen(ENV.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${ENV.PORT}`);
});
