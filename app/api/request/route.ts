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

  if (reqType === "sign-in") {
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

    // one file per sign-in (simple approach)
    const fileName = `${Date.now()}.json`;
    const logsPath = path.join(dir, fileName);

    fs.writeFileSync(logsPath, JSON.stringify(logEntry, null, 2));

    return NextResponse.json({ message: "Sign in successful" });
  } else if (reqType === "cacti-sign-in") {
    try {
      const targetUrl = "http://10.0.3.161/cacti/index.php";
      const loginPage = await fetch(targetUrl);
      const html = await loginPage.text();
      const cookie = loginPage.headers.get("set-cookie");
      const input = html.match(/<input[^>]*__csrf_magic[^>]*>/i)?.[0];
      console.log(input);
      const csrf = input?.match(/value=["']([^"']+)["']/i)?.[1];
      if (!csrf) {
        return NextResponse.json(
          { error: "Unable to retrieve CSRF token" },
          { status: 500 },
        );
      }

      const payload = await req.json();

      const formData = new URLSearchParams();

      formData.append("__csrf_magic", csrf);
      formData.append("action", "login");
      formData.append("login_username", payload.login_username);
      formData.append("login_password", payload.login_password);
      formData.append("remember_me", "on");
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookie ?? "",
        },
        body: formData.toString(),
        redirect: "manual",
      });
      const text = await res.text();

      console.log("Status:", res.status);
      console.log("Location:", res.headers.get("location"));
      console.log("Set-Cookie:", res.headers.get("set-cookie"));
      console.log(text);
      return NextResponse.json({
        status: res.status,
        cookie: res.headers.get("set-cookie"),
      });
    } catch (error: unknown) {
      console.error("Sign in Request Error:", error);
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
  } else if (reqType === "sign-out") {
    const cookieStore = await cookies();
    const kill = tripleEncode("paramz");
    // Delete cookie
    cookieStore.set(kill, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
    cookieStore.delete(kill);
    return NextResponse.json({ message: "Logged out successfully" });
  }
}
