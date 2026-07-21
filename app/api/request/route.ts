import { signToken } from "../../../lib/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getUserByCredentials } from "@/lib/users";
export const runtime = "nodejs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
function tripleEncode(input: string): string {
  return btoa(btoa(btoa(input)));
}
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reqType = searchParams.get("type");
  // const kill = searchParams.get("kill");

  if (reqType === "cacti-dev") {
    try {
      const url = "http://10.0.3.161/cacti/host.php";
      const cookieStore = await cookies();
      const cacti = cookieStore.get("Cacti")?.value;
      const remember = cookieStore.get("cacti_remembers")?.value;

      const cookieHeader = [
        cacti && `Cacti=${cacti}`,
        remember && `cacti_remembers=${remember}`,
      ]
        .filter(Boolean)
        .join("; ");

      const res = await fetch(url, {
        headers: {
          Cookie: cookieHeader,
        },
      });
      return NextResponse.json(res);
    } catch (error) {
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
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reqType = searchParams.get("type");

  if (reqType === "sign-in") {
    const { username, password } = await req.json();
    const user = getUserByCredentials(username, password);
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
    const kill = tripleEncode("paramz");
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
    fs.mkdirSync(dir, { recursive: true });

    const logsPath = path.join(dir, "logins.json");

    let logs = [];

    if (fs.existsSync(logsPath)) {
      logs = JSON.parse(fs.readFileSync(logsPath, "utf8"));
    }

    logs.push(logEntry);

    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

    const response = NextResponse.json({ message: "Sign in successful" });
    response.cookies.set(kill, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    // Cacti Request__________________________________________________________
    // const targetUrl = "http://10.0.3.161/cacti/index.php";
    // // First GET request
    // const loginPage = await fetch(targetUrl);
    // const html = await loginPage.text();
    // const initialCookie = loginPage.headers.get("set-cookie");
    // const csrfInput = html.match(/<input[^>]*__csrf_magic[^>]*>/i)?.[0];
    // const csrf = csrfInput?.match(/value=["']([^"']+)["']/i)?.[1];

    // if (!csrf) {
    //   return NextResponse.json(
    //     { error: "Unable to retrieve Cacti CSRF token" },
    //     { status: 500 },
    //   );
    // }
    // const form = new URLSearchParams();

    // form.append("__csrf_magic", csrf);
    // form.append("action", "login");
    // form.append("login_username", "admin_nichole");
    // form.append("login_password", "Admin@101");
    // form.append("remember_me", "on");

    // const cactiRes = await fetch(targetUrl, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/x-www-form-urlencoded",
    //     Cookie: initialCookie ?? "",
    //   },
    //   body: form.toString(),
    //   redirect: "manual",
    // });

    // const setCookie = cactiRes.headers.get("set-cookie");
    // const cactiMatches = [...(setCookie?.matchAll(/Cacti=([^;]+)/g) ?? [])];
    // const cactiCookie = cactiMatches.at(-1)?.[1];
    // const rememberCookie = setCookie?.match(/cacti_remembers=([^;]+)/)?.[1];
    // console.log("SET COOKIE", setCookie);
    // console.log("CACTI COOKIE", cactiCookie);
    // console.log("REMEMBER COOKIE", rememberCookie);

    // if (cactiCookie) {
    //   response.cookies.set("Cacti", cactiCookie, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "strict",
    //     path: "/",
    //     maxAge: 60 * 60,
    //   });
    // }

    // if (rememberCookie) {
    //   response.cookies.set("cacti_remembers", rememberCookie, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "strict",
    //     path: "/",
    //     maxAge: 60 * 60,
    //   });
    // }

    return response;
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
    cookieStore.delete("Cacti");
    cookieStore.delete("cacti_remembers");
    return NextResponse.json({ message: "Logged out successfully" });
  }
}
