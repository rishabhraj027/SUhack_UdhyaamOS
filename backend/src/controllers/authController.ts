import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/db.js';
import { config } from '../config/index.js';
import type { AuthPayload } from '../middleware/auth.js';

const SALT_ROUNDS = 12;
const googleClient = new OAuth2Client(config.google.clientId);

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'name, email, password, and role are required' });
      return;
    }

    if (!['Business', 'JuniorPro'].includes(role)) {
      res.status(400).json({ error: 'role must be Business or JuniorPro' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

// POST /api/auth/google
// Expects { idToken, role } from the frontend (Google Sign-In id_token)
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const validRole = ['Business', 'JuniorPro'].includes(role) ? role : 'JuniorPro';

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          role: validRole,
          avatarUrl: payload.picture || null,
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[googleAuth]', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
}

// GET /api/auth/google/init  — redirect-based OAuth flow
// Frontend calls this to initiate Google OAuth. Redirects browser to Google consent.
export async function googleAuthInit(req: Request, res: Response): Promise<void> {
  const role = (req.query.role as string) || 'JuniorPro';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.google.clientId}` +
    `&redirect_uri=${encodeURIComponent(config.google.redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&state=${role}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(authUrl);
}

// GET /api/auth/google/callback — Google redirects here after consent
export async function googleAuthCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code, state: role } = req.query;

    if (!code) {
      res.redirect(`${config.frontendUrl}/login?error=no_code`);
      return;
    }

    const validRole = ['Business', 'JuniorPro'].includes(role as string) ? (role as string) : 'JuniorPro';

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json() as { id_token?: string; error?: string };
    if (!tokens.id_token) {
      res.redirect(`${config.frontendUrl}/login?error=token_exchange_failed`);
      return;
    }

    // Verify the id_token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.redirect(`${config.frontendUrl}/login?error=invalid_token`);
      return;
    }

    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          role: validRole as any,
          avatarUrl: payload.picture || null,
        },
      });
    }

    const jwtToken = signToken({ userId: user.id, email: user.email, role: user.role });

    // Redirect to frontend with token and user data (matches LoginSuccess.tsx expectations)
    const userPayload = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatarUrl,
      score: user.score,
      bio: user.bio,
      skills: user.skills,
      bannerColor: user.bannerColor,
      cin: user.cin,
      gstin: user.gstin,
      yearEstablished: user.yearEstablished,
      industry: user.industry,
      website: user.website,
      officialEmail: user.officialEmail,
      contactPhone: user.contactPhone,
      address: user.address,
      companyDescription: user.companyDescription,
    }));

    res.redirect(`${config.frontendUrl}/login-success?token=${jwtToken}&user=${userPayload}`);
  } catch (err) {
    console.error('[googleAuthCallback]', err);
    res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
  }
}
