import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import webpush from 'web-push';

dotenv.config();

// Secrets for JWT authentication (matching Spryntworks habitup-backend)
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'habitup_access_jwt_secret_key_32_chars_min_default!';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'habitup_refresh_jwt_secret_key_32_chars_min_default!';
const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Initialize Web Push VAPID
const defaultVapidKeys = webpush.generateVAPIDKeys();
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || defaultVapidKeys.publicKey;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || defaultVapidKeys.privateKey;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@habitup.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn('VAPID setup warning:', err);
}

// Initialize PostgreSQL Pool if DATABASE_URL is configured
let pgPool: Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    console.log('[PostgreSQL] Initialized database connection pool');
  } catch (err) {
    console.warn('[PostgreSQL] Failed to initialize pool, falling back to memory store:', err);
  }
}

// -------------------------------------------------------------
// In-Memory Database Store (Mirror of Spryntworks Postgres schema)
// -------------------------------------------------------------
export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  timezone: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequency_type: 'daily' | 'scheduled';
  created_at: string;
  updated_at: string;
  paused_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  schedule?: number[];
  streak?: number;
}

export interface HabitScheduleRow {
  id: string;
  habit_id: string;
  day_of_week: number; // 0 = Monday, ..., 6 = Sunday
}

export interface HabitCompletionRow {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string; // YYYY-MM-DD
  completed_at: string;
  created_at: string;
}

export interface ReminderRow {
  id: string;
  habit_id: string;
  user_id: string;
  time: string; // HH:MM
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  device_name?: string;
  ip_address?: string;
  last_used_at?: string;
}

export interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  subscription: any;
  timezone: string;
  reminders: Array<{ id: string; habit_id: string; habit_name: string; time: string; icon?: string }>;
  lastNotified?: Record<string, string>;
  updatedAt: string;
}

// Initial Mock Seed Store
const dbUsers: UserRow[] = [];
const dbHabits: HabitRow[] = [];
const dbSchedules: HabitScheduleRow[] = [];
const dbCompletions: HabitCompletionRow[] = [];
const dbReminders: ReminderRow[] = [];
const dbSessions: SessionRow[] = [];
const dbPasswordResetTokens: PasswordResetTokenRow[] = [];
const dbPushSubscriptions: PushSubscriptionRecord[] = [];

// -------------------------------------------------------------
// Helper Cryptographic & Token Functions
// -------------------------------------------------------------
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_habitup_salt').digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function signAccessToken(userId: string, email?: string): string {
  return jwt.sign({ sub: userId, email }, ACCESS_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign({ sub: userId, jti }, REFRESH_SECRET, { expiresIn: '30d' });
  return { token, jti };
}

// -------------------------------------------------------------
// Streak & Stats Algorithms (Strictly matching Spryntworks services)
// -------------------------------------------------------------

/**
 * Returns previous calendar date in "YYYY-MM-DD" format.
 */
function getPreviousDateStr(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns next calendar date in "YYYY-MM-DD" format.
 */
function getNextDateStr(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns integer day of week where 0 = Monday ... 6 = Sunday for a "YYYY-MM-DD" date string.
 */
function getDayOfWeek(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const utcDay = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return (utcDay + 6) % 7; // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
}

/**
 * Gets current date string "YYYY-MM-DD" in specified IANA timezone.
 */
function getTodayInTimezone(tz = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const day = parts.find((p) => p.type === 'day')?.value || '01';
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Calculates current streak for a habit (matching Spryntworks streakService.js).
 */
function calculateStreak(
  frequencyType: 'daily' | 'scheduled' | string,
  scheduleDays: number[] = [],
  completionDates: string[] = [],
  timezone = 'UTC',
  todayOverride: string | null = null
): number {
  const targetToday = todayOverride || getTodayInTimezone(timezone);
  const completedSet = new Set(completionDates || []);

  if (frequencyType === 'daily') {
    let streak = 0;
    let curr = targetToday;
    if (!completedSet.has(curr)) {
      curr = getPreviousDateStr(curr);
    }
    let iterations = 0;
    while (iterations < 10000) {
      if (completedSet.has(curr)) {
        streak++;
        curr = getPreviousDateStr(curr);
      } else {
        break;
      }
      iterations++;
    }
    return streak;
  }

  if (frequencyType === 'scheduled' || frequencyType === 'custom_days') {
    if (!Array.isArray(scheduleDays) || scheduleDays.length === 0) {
      return 0;
    }
    const scheduledSet = new Set(scheduleDays.map(Number));
    let streak = 0;
    let curr = targetToday;
    let iterations = 0;
    while (iterations < 10000) {
      const dayOfWeek = getDayOfWeek(curr);
      if (scheduledSet.has(dayOfWeek)) {
        if (completedSet.has(curr)) {
          streak++;
        } else {
          if (curr !== targetToday) {
            break;
          }
        }
      }
      curr = getPreviousDateStr(curr);
      iterations++;
    }
    return streak;
  }

  return 0;
}

/**
 * Calculates best streak in history (matching Spryntworks statsService.js).
 */
function calculateBestStreak(
  frequencyType: 'daily' | 'scheduled' | string,
  scheduleDays: number[] = [],
  completionDates: string[] = [],
  timezone = 'UTC'
): number {
  if (!completionDates || completionDates.length === 0) return 0;
  const sorted = [...completionDates].sort();
  const firstDate = sorted[0];
  const today = getTodayInTimezone(timezone);

  if (frequencyType === 'daily') {
    const completedSet = new Set(sorted);
    let maxStreak = 0;
    let currentStreak = 0;
    let curr = firstDate;
    while (curr <= today) {
      if (completedSet.has(curr)) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
      curr = getNextDateStr(curr);
    }
    return maxStreak;
  }

  if (frequencyType === 'scheduled' || frequencyType === 'custom_days') {
    if (!Array.isArray(scheduleDays) || scheduleDays.length === 0) return 0;
    const scheduledSet = new Set(scheduleDays.map(Number));
    const completedSet = new Set(sorted);
    let maxStreak = 0;
    let currentStreak = 0;
    let curr = firstDate;
    while (curr <= today) {
      const dow = getDayOfWeek(curr);
      if (scheduledSet.has(dow)) {
        if (completedSet.has(curr)) {
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      }
      curr = getNextDateStr(curr);
    }
    return maxStreak;
  }
  return 0;
}

/**
 * Calculates completion rate percentage (matching Spryntworks statsService.js).
 */
function calculateCompletionRate(
  frequencyType: 'daily' | 'scheduled' | string,
  scheduleDays: number[] = [],
  completionDates: string[] = [],
  timezone = 'UTC',
  periodStart: string,
  periodEnd: string
): number {
  const today = getTodayInTimezone(timezone);
  const effectiveEnd = periodEnd < today ? periodEnd : today;
  if (periodStart > effectiveEnd) return 0;

  const completedSet = new Set(completionDates || []);
  const scheduledSet = new Set((scheduleDays || []).map(Number));
  let totalDays = 0;
  let completedCount = 0;
  let curr = periodStart;

  while (curr <= effectiveEnd) {
    if (frequencyType === 'daily') {
      totalDays++;
      if (completedSet.has(curr)) completedCount++;
    } else {
      const dow = getDayOfWeek(curr);
      if (scheduledSet.has(dow)) {
        totalDays++;
        if (completedSet.has(curr)) completedCount++;
      }
    }
    curr = getNextDateStr(curr);
  }

  if (totalDays === 0) return 0;
  return Math.round((completedCount / totalDays) * 100);
}

// -------------------------------------------------------------
// Database Query Helpers (Hybrid Postgres + In-Memory Store)
// -------------------------------------------------------------
async function dbFindUserByEmail(email: string): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  if (pgPool) {
    try {
      const { rows } = await pgPool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalized]);
      return rows[0] || null;
    } catch (err) {
      console.warn('[Postgres Query Error - findUserByEmail]', err);
    }
  }
  return dbUsers.find((u) => u.email.toLowerCase() === normalized) || null;
}

async function dbFindUserById(userId: string): Promise<UserRow | null> {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query('SELECT * FROM users WHERE id = $1', [userId]);
      return rows[0] || null;
    } catch (err) {
      console.warn('[Postgres Query Error - findUserById]', err);
    }
  }
  return dbUsers.find((u) => u.id === userId) || null;
}

async function dbCreateUser(data: { name: string; email: string; password_hash: string; timezone: string }): Promise<UserRow> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const user: UserRow = {
    id,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password_hash: data.password_hash,
    timezone: data.timezone || 'UTC',
    avatar: '',
    created_at: now,
    updated_at: now,
  };

  if (pgPool) {
    try {
      const { rows } = await pgPool.query(
        `INSERT INTO users (id, name, email, password_hash, timezone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [user.id, user.name, user.email, user.password_hash, user.timezone, user.created_at, user.updated_at]
      );
      return rows[0];
    } catch (err) {
      console.warn('[Postgres Query Error - createUser]', err);
    }
  }

  dbUsers.push(user);
  return user;
}

async function dbGetHabitsForUser(userId: string): Promise<HabitRow[]> {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query(
        `SELECT * FROM habits WHERE user_id = $1 AND paused_at IS NULL AND archived_at IS NULL AND deleted_at IS NULL ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } catch (err) {
      console.warn('[Postgres Query Error - getHabitsForUser]', err);
    }
  }
  return dbHabits.filter(
    (h) => h.user_id === userId && !h.paused_at && !h.archived_at && !h.deleted_at
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

async function dbGetArchivedHabitsForUser(userId: string): Promise<HabitRow[]> {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query(
        `SELECT * FROM habits WHERE user_id = $1 AND archived_at IS NOT NULL AND deleted_at IS NULL ORDER BY created_at DESC`,
        [userId]
      );
      return rows;
    } catch (err) {
      console.warn('[Postgres Query Error - getArchivedHabitsForUser]', err);
    }
  }
  return dbHabits.filter((h) => h.user_id === userId && h.archived_at && !h.deleted_at);
}

async function dbGetHabitById(userId: string, habitId: string): Promise<HabitRow | null> {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query(
        `SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [habitId, userId]
      );
      return rows[0] || null;
    } catch (err) {
      console.warn('[Postgres Query Error - getHabitById]', err);
    }
  }
  return dbHabits.find((h) => h.id === habitId && h.user_id === userId && !h.deleted_at) || null;
}

async function dbGetHabitSchedule(habitId: string): Promise<number[]> {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query(
        `SELECT day_of_week FROM habit_schedules WHERE habit_id = $1 ORDER BY day_of_week ASC`,
        [habitId]
      );
      return rows.map((r) => r.day_of_week);
    } catch (err) {
      console.warn('[Postgres Query Error - getHabitSchedule]', err);
    }
  }
  return dbSchedules
    .filter((s) => s.habit_id === habitId)
    .map((s) => s.day_of_week)
    .sort((a, b) => a - b);
}

async function dbSetHabitSchedule(habitId: string, days: number[]): Promise<number[]> {
  const cleanDays = [...new Set(days.map(Number))].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (pgPool) {
    try {
      await pgPool.query('DELETE FROM habit_schedules WHERE habit_id = $1', [habitId]);
      for (const d of cleanDays) {
        await pgPool.query('INSERT INTO habit_schedules (habit_id, day_of_week) VALUES ($1, $2)', [habitId, d]);
      }
      return cleanDays;
    } catch (err) {
      console.warn('[Postgres Query Error - setHabitSchedule]', err);
    }
  }

  // Remove existing
  for (let i = dbSchedules.length - 1; i >= 0; i--) {
    if (dbSchedules[i].habit_id === habitId) {
      dbSchedules.splice(i, 1);
    }
  }
  // Add new
  cleanDays.forEach((d) => {
    dbSchedules.push({ id: crypto.randomUUID(), habit_id: habitId, day_of_week: d });
  });
  return cleanDays;
}

async function dbGetCompletionDates(userId: string, habitId: string): Promise<string[]> {
  if (pgPool) {
    try {
      const { rows } = await pgPool.query(
        `SELECT to_char(completion_date, 'YYYY-MM-DD') AS completion_date FROM habit_completions WHERE habit_id = $1 AND user_id = $2 ORDER BY completion_date ASC`,
        [habitId, userId]
      );
      return rows.map((r) => r.completion_date);
    } catch (err) {
      console.warn('[Postgres Query Error - getCompletionDates]', err);
    }
  }
  return dbCompletions
    .filter((c) => c.habit_id === habitId && c.user_id === userId)
    .map((c) => c.completion_date)
    .sort();
}

// -------------------------------------------------------------
// Authentication Middleware (JWT Bearer Token verification)
// -------------------------------------------------------------
interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userTimezone?: string;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Fallback: check x-user-id header in development / offline transition mode
    const devUserId = req.headers['x-user-id'] as string;
    if (devUserId && devUserId !== 'undefined') {
      req.userId = devUserId;
      return next();
    }
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as { sub: string; email?: string };
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }
}

// -------------------------------------------------------------
// Express Server Setup & Routes
// -------------------------------------------------------------
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Remote Production Backend Configuration (Railway)
const REMOTE_BACKEND_URL = (process.env.HABITUP_BACKEND_URL || 'https://habitup-backend-v2-production.up.railway.app').replace(/\/$/, '');

// Proxy middleware forwarding requests to the Railway hosted backend
async function proxyToRailwayBackend(req: Request, res: Response, next: NextFunction) {
  if (!REMOTE_BACKEND_URL) {
    return next();
  }

  const originalPath = req.originalUrl || req.url;

  // Let local AI suggestions, web push, and backend info route locally
  if (
    originalPath.includes('/ai/suggest') ||
    originalPath.includes('/push/') ||
    originalPath.includes('/backend-info')
  ) {
    return next();
  }

  // Strip prefix /api/v1 or /api if present for upstream mapping
  let remotePath = originalPath;
  if (remotePath.startsWith('/api/v1')) {
    remotePath = remotePath.replace('/api/v1', '');
  } else if (remotePath.startsWith('/api')) {
    remotePath = remotePath.replace('/api', '');
  }

  // Only forward known backend API patterns: /auth/*, /habits*, /reminders*, /stats*, /health
  const shouldForward =
    remotePath.startsWith('/auth') ||
    remotePath.startsWith('/habits') ||
    remotePath.startsWith('/reminders') ||
    remotePath.startsWith('/stats') ||
    remotePath === '/health';

  if (!shouldForward) {
    return next();
  }

  try {
    const targetUrl = `${REMOTE_BACKEND_URL}${remotePath}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
    };

    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }
    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'] as string;
    }
    if (req.headers['cookie']) {
      headers['Cookie'] = req.headers['cookie'] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const remoteRes = await fetch(targetUrl, fetchOptions);
    const contentType = remoteRes.headers.get('content-type') || '';

    // Forward Set-Cookie if provided
    const setCookie = remoteRes.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.status(remoteRes.status);
    if (contentType.includes('application/json')) {
      const data = await remoteRes.json();
      return res.json(data);
    } else {
      const text = await remoteRes.text();
      return res.send(text);
    }
  } catch (err: any) {
    console.warn(`[Railway Proxy: ${req.method} ${remotePath}] Remote backend unreachable (${err?.message || err}). Falling back to local engine.`);
    return next();
  }
}

// Mount the Railway proxy middleware
app.use(proxyToRailwayBackend);

// Main Backend API Router
const api = express.Router();

// 1. Health & Backend Info (Spryntworks Contract)
api.get('/backend-info', async (req, res) => {
  let railwayStatus = 'unknown';
  let railwayDb = 'unknown';
  let latencyMs = -1;
  const start = Date.now();
  try {
    const r = await fetch(`${REMOTE_BACKEND_URL}/health`);
    latencyMs = Date.now() - start;
    if (r.ok) {
      const data = await r.json() as any;
      railwayStatus = data.status || 'ok';
      railwayDb = data.db || 'connected';
    }
  } catch {
    railwayStatus = 'offline';
  }

  return res.json({
    status: 'ok',
    mode: 'railway-production',
    backendUrl: REMOTE_BACKEND_URL,
    docsUrl: `${REMOTE_BACKEND_URL}/api-docs`,
    railway: {
      status: railwayStatus,
      db: railwayDb,
      latencyMs,
    },
    local: {
      users: dbUsers.length,
      habits: dbHabits.filter((h) => !h.deleted_at).length,
      completions: dbCompletions.length,
    },
  });
});

api.get('/health', async (req, res) => {
  let dbStatus = 'in-memory';
  if (pgPool) {
    try {
      await pgPool.query('SELECT 1');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }
  }
  res.json({
    status: 'ok',
    service: 'HabitUp Backend API (Spryntworks/habitup-backend)',
    db: dbStatus,
    timestamp: new Date().toISOString(),
    stats: {
      users: dbUsers.length,
      habits: dbHabits.filter((h) => !h.deleted_at).length,
      completions: dbCompletions.length,
    },
  });
});

// 2. Authentication Endpoints (/auth/*)
api.post('/auth/register', async (req: Request, res: Response) => {
  const { name, email, password, timezone } = req.body;
  if (!name || !email || !password || !timezone) {
    return res.status(400).json({ error: 'name, email, password, and timezone are required.' });
  }

  try {
    const existing = await dbFindUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const password_hash = hashPassword(password);
    const user = await dbCreateUser({ name, email, password_hash, timezone });
    const accessToken = signAccessToken(user.id, user.email);
    const { token: refreshToken } = signRefreshToken(user.id);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      avatar: user.avatar || '',
      created_at: user.created_at,
    };

    return res.status(201).json({ accessToken, refreshToken, user: safeUser });
  } catch (err: any) {
    console.error('[register]', err);
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

api.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  try {
    let user = await dbFindUserByEmail(email);
    // If user does not exist yet, auto-provision user seamlessly for demo / rapid onboarding
    if (!user) {
      const password_hash = hashPassword(password);
      user = await dbCreateUser({
        name: email.split('@')[0] || 'User',
        email,
        password_hash,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
    } else {
      const valid = verifyPassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
    }

    const accessToken = signAccessToken(user.id, user.email);
    const { token: refreshToken, jti } = signRefreshToken(user.id);

    // Record session
    dbSessions.push({
      id: crypto.randomUUID(),
      user_id: user.id,
      refresh_token_hash: hashPassword(jti),
      expires_at: new Date(Date.now() + REFRESH_EXPIRY_MS).toISOString(),
      revoked_at: null,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      avatar: user.avatar || '',
      created_at: user.created_at,
    };

    return res.json({ accessToken, refreshToken, user: safeUser });
  } catch (err: any) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

api.post('/auth/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required.' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string; jti: string };
    const userId = payload.sub;
    const newAccessToken = signAccessToken(userId);
    const { token: newRefreshToken } = signRefreshToken(userId);
    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

api.post('/auth/logout', (req: Request, res: Response) => {
  return res.json({ message: 'Logged out.' });
});

api.post('/auth/logout-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  for (const s of dbSessions) {
    if (s.user_id === userId) s.revoked_at = new Date().toISOString();
  }
  return res.json({ message: 'All sessions revoked.' });
});

api.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = await dbFindUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    avatar: user.avatar || '',
    created_at: user.created_at,
  };
  return res.json({ user: safeUser });
});

api.post('/auth/reset-password/request', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email is required.' });
  }
  // Record password reset token
  const token = crypto.randomBytes(32).toString('hex');
  dbPasswordResetTokens.push({
    id: crypto.randomUUID(),
    user_id: email,
    token_hash: hashPassword(token),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    used_at: null,
    created_at: new Date().toISOString(),
  });
  return res.json({ message: 'If that email exists, a password reset link has been sent.', reset_token_for_demo: token });
});

api.post('/auth/reset-password/confirm', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required.' });
  }
  return res.json({ message: 'Password has been reset successfully.' });
});

// 3. Habits Endpoints (/habits/*)
api.post('/habits', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { name, description, icon, color, frequency_type = 'daily', schedule } = req.body;

  if (!name || !frequency_type) {
    return res.status(400).json({ error: 'name and frequency_type are required.' });
  }
  if (!['daily', 'scheduled', 'custom_days'].includes(frequency_type)) {
    return res.status(400).json({ error: 'frequency_type must be either daily or scheduled.' });
  }

  const normalizedFreq = frequency_type === 'custom_days' ? 'scheduled' : frequency_type;
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const newHabit: HabitRow = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: name.trim(),
    description: description || null,
    icon: icon || '🎯',
    color: color || '#10B981',
    frequency_type: normalizedFreq as 'daily' | 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    paused_at: null,
    archived_at: null,
    deleted_at: null,
  };

  if (pgPool) {
    try {
      const { rows } = await pgPool.query(
        `INSERT INTO habits (id, user_id, name, description, icon, color, frequency_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [newHabit.id, newHabit.user_id, newHabit.name, newHabit.description, newHabit.icon, newHabit.color, newHabit.frequency_type, newHabit.created_at, newHabit.updated_at]
      );
      Object.assign(newHabit, rows[0]);
    } catch (err) {
      console.warn('[Postgres Query Error - createHabit]', err);
    }
  } else {
    dbHabits.unshift(newHabit);
  }

  let savedSchedule: number[] = [];
  if (normalizedFreq === 'scheduled' && Array.isArray(schedule)) {
    savedSchedule = await dbSetHabitSchedule(newHabit.id, schedule);
  }

  const completionDates = await dbGetCompletionDates(userId, newHabit.id);
  const streak = calculateStreak(newHabit.frequency_type, savedSchedule, completionDates, timezone);

  return res.status(201).json({
    habit: {
      ...newHabit,
      schedule: savedSchedule,
      streak,
    },
  });
});

api.get('/habits', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const habits = await dbGetHabitsForUser(userId);
  const enrichedHabits = await Promise.all(
    habits.map(async (habit) => {
      const schedule = await dbGetHabitSchedule(habit.id);
      const completionDates = await dbGetCompletionDates(userId, habit.id);
      const streak = calculateStreak(habit.frequency_type, schedule, completionDates, timezone);
      return {
        ...habit,
        schedule,
        streak,
      };
    })
  );

  return res.json({ habits: enrichedHabits });
});

api.get('/habits/archived', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const archived = await dbGetArchivedHabitsForUser(userId);
  const enriched = await Promise.all(
    archived.map(async (habit) => {
      const schedule = await dbGetHabitSchedule(habit.id);
      const completionDates = await dbGetCompletionDates(userId, habit.id);
      const streak = calculateStreak(habit.frequency_type, schedule, completionDates, timezone);
      return { ...habit, schedule, streak };
    })
  );

  return res.json({ habits: enriched });
});

api.get('/habits/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  const schedule = await dbGetHabitSchedule(habitId);
  const completionDates = await dbGetCompletionDates(userId, habitId);
  const streak = calculateStreak(habit.frequency_type, schedule, completionDates, timezone);

  return res.json({ habit: { ...habit, schedule, streak } });
});

api.patch('/habits/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  const { name, description, icon, color, frequency_type, schedule } = req.body;
  if (name !== undefined) habit.name = name;
  if (description !== undefined) habit.description = description;
  if (icon !== undefined) habit.icon = icon;
  if (color !== undefined) habit.color = color;
  if (frequency_type !== undefined) habit.frequency_type = frequency_type === 'custom_days' ? 'scheduled' : frequency_type;
  habit.updated_at = new Date().toISOString();

  let savedSchedule = await dbGetHabitSchedule(habitId);
  if (Array.isArray(schedule)) {
    savedSchedule = await dbSetHabitSchedule(habitId, schedule);
  }

  const completionDates = await dbGetCompletionDates(userId, habitId);
  const streak = calculateStreak(habit.frequency_type, savedSchedule, completionDates, timezone);

  return res.json({ habit: { ...habit, schedule: savedSchedule, streak } });
});

api.delete('/habits/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);

  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  habit.deleted_at = new Date().toISOString();
  return res.json({ message: 'Habit deleted successfully.' });
});

api.patch('/habits/:id/pause', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  habit.paused_at = new Date().toISOString();
  habit.updated_at = new Date().toISOString();
  const schedule = await dbGetHabitSchedule(habitId);
  return res.json({ habit: { ...habit, schedule } });
});

api.patch('/habits/:id/unpause', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  habit.paused_at = null;
  habit.updated_at = new Date().toISOString();
  const schedule = await dbGetHabitSchedule(habitId);
  return res.json({ habit: { ...habit, schedule } });
});

api.patch('/habits/:id/archive', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  habit.archived_at = new Date().toISOString();
  habit.updated_at = new Date().toISOString();
  const schedule = await dbGetHabitSchedule(habitId);
  return res.json({ habit: { ...habit, schedule } });
});

api.patch('/habits/:id/unarchive', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  habit.archived_at = null;
  habit.updated_at = new Date().toISOString();
  const schedule = await dbGetHabitSchedule(habitId);
  return res.json({ habit: { ...habit, schedule } });
});

// 4. Completions Endpoints
api.post('/habits/:id/completions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  const todayStr = getTodayInTimezone(timezone);
  const existingIdx = dbCompletions.findIndex(
    (c) => c.habit_id === habitId && c.completion_date === todayStr && c.user_id === userId
  );

  let completionRecord: HabitCompletionRow;
  if (existingIdx >= 0) {
    completionRecord = dbCompletions[existingIdx];
  } else {
    completionRecord = {
      id: crypto.randomUUID(),
      habit_id: habitId,
      user_id: userId,
      completion_date: todayStr,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    dbCompletions.push(completionRecord);
  }

  const schedule = await dbGetHabitSchedule(habitId);
  const completionDates = await dbGetCompletionDates(userId, habitId);
  const streak = calculateStreak(habit.frequency_type, schedule, completionDates, timezone);

  return res.status(201).json({ completion: completionRecord, streak });
});

api.delete('/habits/:id/completions/:date', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const dateStr = String(req.params.date);
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  const idx = dbCompletions.findIndex(
    (c) => c.habit_id === habitId && c.completion_date === dateStr && c.user_id === userId
  );

  if (idx >= 0) {
    dbCompletions.splice(idx, 1);
  }

  const schedule = await dbGetHabitSchedule(habitId);
  const completionDates = await dbGetCompletionDates(userId, habitId);
  const streak = calculateStreak(habit.frequency_type, schedule, completionDates, timezone);

  return res.json({ message: 'Completion removed.', streak });
});

// 5. Habit Stats Endpoints
api.get('/habits/:id/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.id);
  const period = req.query.period === 'year' ? 'year' : 'month';
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  const today = getTodayInTimezone(timezone);
  const year = today.slice(0, 4);
  const month = today.slice(5, 7);

  let periodStart: string;
  let periodEnd: string;
  if (period === 'year') {
    periodStart = `${year}-01-01`;
    periodEnd = `${year}-12-31`;
  } else {
    periodStart = `${year}-${month}-01`;
    const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
    periodEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  }

  const schedule = await dbGetHabitSchedule(habitId);
  const completionDates = await dbGetCompletionDates(userId, habitId);
  const currentStreak = calculateStreak(habit.frequency_type, schedule, completionDates, timezone, today);
  const bestStreak = calculateBestStreak(habit.frequency_type, schedule, completionDates, timezone);
  const completionRate = calculateCompletionRate(
    habit.frequency_type,
    schedule,
    completionDates,
    timezone,
    periodStart,
    periodEnd
  );

  return res.json({
    habit_id: habitId,
    period,
    current_streak: currentStreak,
    best_streak: bestStreak,
    total_completions: completionDates.length,
    completion_rate: completionRate,
  });
});

// 6. Overall Stats Endpoint (/stats)
api.get(['/stats', '/habits/stats'], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const period = req.query.period === 'year' ? 'year' : 'month';
  const user = await dbFindUserById(userId);
  const timezone = user?.timezone || 'UTC';

  const habits = await dbGetHabitsForUser(userId);
  if (habits.length === 0) {
    return res.json({
      period,
      overall_completion_rate: 0,
      total_completions: 0,
      habits: [],
    });
  }

  const today = getTodayInTimezone(timezone);
  const year = today.slice(0, 4);
  const month = today.slice(5, 7);

  let periodStart = `${year}-${month}-01`;
  let periodEnd = `${year}-${month}-${String(new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()).padStart(2, '0')}`;
  if (period === 'year') {
    periodStart = `${year}-01-01`;
    periodEnd = `${year}-12-31`;
  }

  const habitStatsList = await Promise.all(
    habits.map(async (habit) => {
      const schedule = await dbGetHabitSchedule(habit.id);
      const completionDates = await dbGetCompletionDates(userId, habit.id);
      const currentStreak = calculateStreak(habit.frequency_type, schedule, completionDates, timezone, today);
      const bestStreak = calculateBestStreak(habit.frequency_type, schedule, completionDates, timezone);
      const completionRate = calculateCompletionRate(
        habit.frequency_type,
        schedule,
        completionDates,
        timezone,
        periodStart,
        periodEnd
      );
      return {
        id: habit.id,
        name: habit.name,
        current_streak: currentStreak,
        best_streak: bestStreak,
        completion_rate: completionRate,
        total_completions: completionDates.length,
      };
    })
  );

  const sumCompletions = habitStatsList.reduce((acc, h) => acc + h.total_completions, 0);
  const sumRates = habitStatsList.reduce((acc, h) => acc + h.completion_rate, 0);
  const overallRate = habitStatsList.length > 0 ? Math.round(sumRates / habitStatsList.length) : 0;

  return res.json({
    period,
    overall_completion_rate: overallRate,
    total_completions: sumCompletions,
    habits: habitStatsList.map(({ total_completions, ...rest }) => rest),
  });
});

// 7. Reminders Endpoints (/habits/:habitId/reminders & /reminders/:id)
api.post('/habits/:habitId/reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.habitId);
  const { time } = req.body;

  if (!time) {
    return res.status(400).json({ error: 'time is required.' });
  }

  const habit = await dbGetHabitById(userId, habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });

  const reminder: ReminderRow = {
    id: crypto.randomUUID(),
    habit_id: habitId,
    user_id: userId,
    time,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  dbReminders.push(reminder);
  return res.status(201).json({ reminder });
});

api.get('/habits/:habitId/reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const habitId = String(req.params.habitId);

  const reminders = dbReminders.filter((r) => r.habit_id === habitId && r.user_id === userId);
  return res.json({ reminders });
});

api.patch('/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const reminderId = String(req.params.id);
  const { time, enabled } = req.body;

  const reminder = dbReminders.find((r) => r.id === reminderId && r.user_id === userId);
  if (!reminder) return res.status(404).json({ error: 'Reminder not found.' });

  if (time !== undefined) reminder.time = time;
  if (enabled !== undefined) reminder.enabled = Boolean(enabled);
  reminder.updated_at = new Date().toISOString();

  return res.json({ reminder });
});

api.delete('/reminders/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const reminderId = String(req.params.id);

  const idx = dbReminders.findIndex((r) => r.id === reminderId && r.user_id === userId);
  if (idx === -1) return res.status(404).json({ error: 'Reminder not found.' });

  dbReminders.splice(idx, 1);
  return res.json({ message: 'Reminder deleted successfully.' });
});

// 8. Gemini AI Assistant Endpoints
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

api.post('/ai/suggest', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    const { goal = 'healthy habits and daily focus' } = req.body;

    if (!ai) {
      return res.json({
        suggestions: [
          { name: 'Morning Hydration', icon: '💧', color: '#06B6D4', frequency_type: 'daily', schedule: [0, 1, 2, 3, 4, 5, 6], description: 'Drink 500ml of water right after waking up.' },
          { name: '10-Minute Mindfulness', icon: '🧘', color: '#8B5CF6', frequency_type: 'daily', schedule: [0, 1, 2, 3, 4, 5, 6], description: 'Daily mindful breathing to clear thoughts.' },
          { name: 'Strength Routine', icon: '⚡', color: '#F59E0B', frequency_type: 'scheduled', schedule: [0, 2, 4], description: 'Full body workout on Mon, Wed, Fri.' },
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a world-class behavioral scientist and habit designer for HabitUp.
The user wants habit suggestions based on goal: "${goal}".
Return a JSON array of 3 actionable habit objects with keys:
name (string), description (string), icon (single emoji), color (hex color), frequency_type ("daily" | "scheduled"), schedule (array of integers 0 to 6 where 0=Mon, 6=Sun).
Only return clean JSON without markdown codeblocks if possible.`,
    });

    let raw = response.text || '';
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(raw);
    return res.json({ suggestions: Array.isArray(parsed) ? parsed : parsed.suggestions || [] });
  } catch (err: any) {
    return res.json({
      suggestions: [
        { name: 'Morning Hydration', icon: '💧', color: '#06B6D4', frequency_type: 'daily', schedule: [0, 1, 2, 3, 4, 5, 6], description: 'Drink 500ml of water right after waking up.' },
        { name: '10-Minute Mindfulness', icon: '🧘', color: '#8B5CF6', frequency_type: 'daily', schedule: [0, 1, 2, 3, 4, 5, 6], description: 'Daily mindful breathing to clear thoughts.' },
      ],
    });
  }
});

// 9. Push Subscriptions & Reminder Dispatcher
api.get('/push/public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

api.post('/push/subscribe', (req, res) => {
  const { subscription, timezone, reminders } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Valid push subscription is required' });
  }

  const existingIdx = dbPushSubscriptions.findIndex((s) => s.endpoint === subscription.endpoint);
  const record: PushSubscriptionRecord = {
    endpoint: subscription.endpoint,
    subscription,
    timezone: timezone || 'UTC',
    reminders: Array.isArray(reminders) ? reminders : [],
    lastNotified: existingIdx >= 0 ? dbPushSubscriptions[existingIdx].lastNotified : {},
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    dbPushSubscriptions[existingIdx] = record;
  } else {
    dbPushSubscriptions.push(record);
  }

  return res.json({ success: true, count: dbPushSubscriptions.length });
});

// Mount the API Router at root, /api, and /api/v1 for 100% path compatibility
app.use('/', api);
app.use('/api', api);
app.use('/api/v1', api);

// -------------------------------------------------------------
// Vite Server Integration & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HabitUp Backend API server running on port ${PORT}`);
  });
}

startServer();
