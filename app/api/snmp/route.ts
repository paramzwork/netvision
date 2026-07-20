import { NextResponse } from "next/server";
import { snmpGet } from "@/lib/snmp";

export async function GET() {
  try {
    const hostname = await snmpGet("10.0.3.11", "public", "1.3.6.1.2.1.1.5.0");

    return NextResponse.json({
      success: true,
      hostname,
    });
  } catch (err) {
    console.error("SNMP ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
