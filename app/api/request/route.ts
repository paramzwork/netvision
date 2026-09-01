import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
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

  if (reqType === "sign-out") {
    const cookieStore = await cookies();
    const kill = tripleEncode("kill");
    // Delete cookie
    cookieStore.set(kill, "", {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
    cookieStore.delete(kill);
    return NextResponse.json({ message: "Logged out successfully" });
  }
}
