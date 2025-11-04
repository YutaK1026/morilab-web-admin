import { NextRequest, NextResponse } from "next/server";
import { checkAuth, getClientIP, isAllowedIP } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const ipAllowed = isAllowedIP(clientIP);
  console.log("clientIP", clientIP);
  console.log("ipAllowed", ipAllowed);
  const { authenticated } = await checkAuth();

  return NextResponse.json({
    ip: clientIP,
    ipAllowed,
    authenticated,
  });
}
