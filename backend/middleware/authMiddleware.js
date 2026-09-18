import { jwtVerify, createRemoteJWKSet } from "jose";

const SUPABASE_URL = process.env.SUPABASE_URL;

const JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authHeader.substring(7);

    const { payload } = await jwtVerify(token, JWKS);

    req.user = {
      id: payload.sub,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);

    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};
