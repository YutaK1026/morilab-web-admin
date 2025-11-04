import { NextRequest, NextResponse } from "next/server";
import { checkAuth, getClientIP, isAllowedIP } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const ipAllowed = isAllowedIP(clientIP);
  const { authenticated } = await checkAuth();

  return NextResponse.json({
    ip: clientIP,
    ipAllowed,
    authenticated,
  });
}
