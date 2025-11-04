import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { MAIN_PROJECT_PATH } from "@/lib/config";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * メインプロジェクトのビルドを実行
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const { authenticated } = await checkAuth();
    if (!authenticated) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ビルドを実行（NODE_ENV=productionを設定）
    const { stdout, stderr } = await execAsync("npm run build", {
      cwd: MAIN_PROJECT_PATH,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    });

    return NextResponse.json({
      success: true,
      stdout: stdout,
      stderr: stderr,
    });
  } catch (error: any) {
    console.error("Build error:", error);
    return NextResponse.json(
      {
        error: "ビルドに失敗しました",
        details: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
      },
      { status: 500 }
    );
  }
}
