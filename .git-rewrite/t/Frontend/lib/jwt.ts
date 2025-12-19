// JWT token utilities

export interface DecodedToken {
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Decode JWT token without verification (client-side only)
 * Note: This doesn't verify the signature, only decodes the payload
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Get current user ID from token
 */
export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.id || null;
}

/**
 * Get current user role from token (always "owner" if authenticated)
 */
export function getCurrentUserRole(): "owner" | null {
  if (typeof window === "undefined") return null;
  
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  
  // If token exists, user is an owner
  return "owner";
}
