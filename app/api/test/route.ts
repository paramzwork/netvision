import { NextResponse } from "next/server";
import { snmpWalk } from "@/lib/snmp";

export async function GET() {
  try {
    const host = process.env.SNMP_HOST!;
    const community = process.env.SNMP_COMMUNITY!;

    const config = { host, community };
    const neighbors = await snmpWalk(config, "1.3.6.1.4.1.2011.2.62.2.18");

    console.log(neighbors);

    return NextResponse.json(neighbors);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to query LLDP." },
      { status: 500 },
    );
  }
}
