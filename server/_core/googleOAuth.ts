import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

const router = Router();

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/oauth/google/callback",
});

// Gera a URL de login do Google
export function getGoogleLoginUrl() {
  const scopes = ["openid", "email", "profile"];
  const url = googleClient.generateAuthUrl({
    access_type: "online",
    scope: scopes,
  });
  return url;
}

// Callback do Google OAuth
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    console.log("[Google OAuth] Callback initiated");
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      console.error("[Google OAuth] Missing authorization code");
      return res.status(400).json({ error: "Missing authorization code" });
    }

    console.log("[Google OAuth] Exchanging code for tokens...");
    // Trocar código por tokens
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      console.error("[Google OAuth] Invalid token payload");
      return res.status(400).json({ error: "Invalid token" });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email?.split("@")[0] || "User";

    console.log("[Google OAuth] User info retrieved:", { email, name, googleId });

    // Procurar ou criar usuário
    const db = await getDb();
    if (!db) {
      console.error("[Google OAuth] Database unavailable!");
      return res.status(500).json({ error: "Database unavailable" });
    }

    console.log("[Google OAuth] Database connected, querying user...");
    let userRecord = await db
      .select({
        id: users.id,
        openId: users.openId,
        googleId: users.googleId,
        name: users.name,
        email: users.email,
        loginMethod: users.loginMethod,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(eq(users.email, email!))
      .limit(1);
    
    let user = userRecord.length > 0 ? userRecord[0] : null;
    console.log("[Google OAuth] User found:", !!user, user?.id);

    if (!user) {
      console.log("[Google OAuth] Creating new user...");
      // Criar novo usuário
      const result = await db
        .insert(users)
        .values({
          email: email!,
          name,
          googleId,
          openId: `google_${googleId}`,
          loginMethod: "google",
          role: "user",
          nivel: "trainee",
        })
        .returning();

      user = result[0];
      console.log("[Google OAuth] User created:", user?.id, user?.email);
    } else if (!user.googleId) {
      console.log("[Google OAuth] Updating existing user with Google ID...");
      // Atualizar usuário existente com Google ID
      const result = await db
        .update(users)
        .set({ googleId, loginMethod: "google" })
        .where(eq(users.id, user.id))
        .returning();

      user = result[0];
      console.log("[Google OAuth] User updated:", user?.id);
    }

    // Criar JWT session usando a SDK
    // Mas primeiro preciso criar um openId para compatibilidade
    const openId = `google_${googleId}`;
    
    // Atualizar usuário para ter um openId
    if (!user.openId) {
      const result = await db
        .update(users)
        .set({ openId })
        .where(eq(users.id, user.id))
        .returning();

      user = result[0];
    }

    const sessionToken = jwt.sign(
      {
        openId: user.openId || openId,
        appId: process.env.VITE_APP_ID || "orcestra-dicom-app",
        name: user.name || "",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1y" }
    );

    // Definir cookie usando opções padronizadas
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    console.log("[Google OAuth] User logged in:", {
      userId: user.id,
      email: user.email,
      openId: user.openId || openId,
      cookieName: COOKIE_NAME,
      tokenCreated: true,
    });

    // Redirecionar para home ou dashboard
    res.redirect("/");
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Rota para logout
router.get("/google/logout", (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.clearCookie("auth", { path: "/" });
  res.clearCookie("session", { path: "/" });
  console.log("[Google OAuth] User logged out");
  res.redirect("/");
});

export default router;
