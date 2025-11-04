import { NextRequest, NextResponse } from "next/server";
import {
  createToken,
  getClientIP,
  isAllowedIP,
  verifyPassword,
} from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "パスワードが必要です" },
        { status: 400 }
      );
    }

    // IPアドレスチェック
    const clientIP = getClientIP(request);
    if (!isAllowedIP(clientIP)) {
      return NextResponse.json(
        { error: "アクセスが許可されていません", ip: clientIP },
        { status: 403 }
      );
    }

    // パスワード検証
    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "パスワードが正しくありません" },
        { status: 401 }
      );
    }

    // トークンを生成
    const token = await createToken(clientIP);

    // クッキーに保存
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24時間
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "ログインに失敗しました" },
      { status: 500 }
    );
  }
}
