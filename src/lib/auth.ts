import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey =
  process.env.AUTH_SECRET || "default-secret-key-change-in-production";
const key = new TextEncoder().encode(secretKey);

export interface AuthPayload {
  ip: string;
  timestamp: number;
}

/**
 * JWTトークンを生成
 */
export async function createToken(ip: string): Promise<string> {
  const token = await new SignJWT({ ip, timestamp: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);

  return token;
}

/**
 * JWTトークンを検証
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * 許可されたIPアドレスかチェック
 */
export function isAllowedIP(ip: string): boolean {
  const allowedIPs = process.env.ALLOWED_IPS || "";
  if (!allowedIPs) {
    // 環境変数が設定されていない場合は全て許可（開発環境用）
    return true;
  }

  const ipList = allowedIPs.split(",").map((ip) => ip.trim());
  return ipList.includes(ip);
}

/**
 * パスワードを検証
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  return password === adminPassword;
}

/**
 * リクエストからクライアントIPを取得
 */
export function getClientIP(request: Request): string {
  // X-Forwarded-Forヘッダーから取得（プロキシ経由の場合）
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",");
    return ips[0]?.trim() || "unknown";
  }

  // X-Real-IPヘッダーから取得
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  // フォールバック
  return "unknown";
}

/**
 * 認証状態をチェック
 */
export async function checkAuth(): Promise<{
  authenticated: boolean;
  ip?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return { authenticated: false };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { authenticated: false };
  }

  return { authenticated: true, ip: payload.ip };
}
