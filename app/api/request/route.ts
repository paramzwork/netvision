import { signToken } from "../../../lib/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { User } from "@/lib/types";
export const runtime = "nodejs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
function tripleEncode(input: string): string {
  return btoa(btoa(btoa(input)));
}
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reqType = searchParams.get("type");

  if (reqType === "login") {
    const filePath = path.join(process.cwd(), "public", "data", "users.json");

    const fileData = fs.readFileSync(filePath, "utf-8");
    const users: User[] = JSON.parse(fileData);

    const { username, password } = await req.json();

    const user = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    const kill = tripleEncode("paramz");
    cookieStore.set(kill, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: user.role === "superadmin" ? 60 * 60 * 8 : 60 * 60,
    });
    const logEntry = {
      userId: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      timestamp: new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      }),
    };
    const dir = path.join(process.cwd(), "public/data/logs/logins");

    // ensure folder exists
    fs.mkdirSync(dir, { recursive: true });

    // one file per login (simple approach)
    const fileName = `${Date.now()}.json`;
    const logsPath = path.join(dir, fileName);

    fs.writeFileSync(logsPath, JSON.stringify(logEntry, null, 2));

    return NextResponse.json({ message: "Login successful" });
  } else if (reqType === "cacti-login") {
    const targetUrl = "http://10.0.3.161/cacti/index.php";

    try {
      const payload = await req.json();
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("CACTI DATA:", data);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Login failed", details: data },
          { status: res.status },
        );
      }

      // Assuming the server returns a token, you can send it back to your frontend
      return NextResponse.json(data, { status: 200 });
    } catch (error: unknown) {
      console.error("Login Request Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      return NextResponse.json(
        {
          error: "Failed to connect to authentication server",
          message: errorMessage,
        },
        { status: 500 },
      );
    }
  } else if (reqType === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");

    return NextResponse.json({ message: "Logged out" });
  }
}
