import express from "express";
import cors from "cors";
import { ENV } from "./env.js";
import { supabase } from "./supabase.js";

import authRoutes from "./routes/auth.js";
import listingsRoutes from "./routes/listings.js";
import bookmarksRoutes from "./routes/bookmarks.js";
import reviewsRoutes from "./routes/reviews.js";
import dbTestRoute from "./routes/dbTest.js";

const app = express();

// Basic middleware
// CORS configuration - allow frontend and localhost for development
app.use(cors({
  origin: [
    "https://anexlk.vercel.app",
    "http://localhost:3000",
    process.env.FRONTEND_URL || "http://localhost:3000"
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Root route
app.get("/", (_req, res) => res.json({ ok: true, message: "Backend API is running" }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Database test endpoint
app.get("/db-test", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    console.error("DB TEST ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }

  return res.json({
    ok: true,
    data,
  });
});

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
