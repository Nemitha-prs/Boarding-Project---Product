import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../env.js";

export interface AuthUser {
  id: string;
}

declare global {
  namespace Express {
    // augment Request to include user
    interface Request {
      user?: AuthUser;
    }
  }
}

export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;
    if (!decoded?.id) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = { id: decoded.id };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  // All authenticated users are owners now
  return next();
}
