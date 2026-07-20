import { snmpGetMany } from "@/lib/snmp";
import { SnmpConfig } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  console.log({
    host: process.env.SNMP_HOST,
    community: process.env.SNMP_COMMUNITY,
  });

  try {
    const config: SnmpConfig = {
      host: process.env.SNMP_HOST!,
      community: process.env.SNMP_COMMUNITY!,
      port: 169,
    };
    console.log("CONFIG SENT:", config);

    const result = await snmpGetMany(config, [
      "1.3.6.1.2.1.1.5.0", // Hostname
      //   "1.3.6.1.2.1.1.1.0", // Description
      //   "1.3.6.1.2.1.1.3.0", // Uptime
      //   "1.3.6.1.2.1.1.4.0", // Contact
      //   "1.3.6.1.2.1.1.6.0", // Location
    ]);
    console.log("RESULT",result);
    return NextResponse.json({
      success: true,
      data: {
        hostname: String(result[0].value),
        description: String(result[1].value),
        uptime: String(result[2].value),
        contact: String(result[3].value),
        location: String(result[4].value),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
