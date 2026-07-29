import { NextRequest, NextResponse } from "next/server";
import snmp from "net-snmp";
import { SnmpResult } from "@/lib/types";

export async function GET(req: NextRequest) {
  const host = process.env.SNMP_HOST;
  const community = process.env.SNMP_COMMUNITY;

  if (!host || !community) {
    return NextResponse.json(
      { message: "SNMP configuration is missing." },
      { status: 500 },
    );
  }

  const oid = req.nextUrl.searchParams.get("oid") ?? "1.3.6.1.2.1.1";

  const session = snmp.createSession(host, community);

  const results: SnmpResult[] = [];

  return new Promise<Response>((resolve) => {
    session.subtree(
      oid,
      (varbinds) => {
        for (const varbind of varbinds) {
          if (snmp.isVarbindError(varbind)) {
            console.error(snmp.varbindError(varbind));
            continue;
          }

          results.push({
            oid: varbind.oid,
            type: varbind.type ?? 0,
            value: String(varbind.value),
          });
        }
      },
      (error) => {
        session.close();

        if (error) {
          resolve(
            NextResponse.json(
              { message: error.message },
              { status: 500 },
            ),
          );
          return;
        }

        resolve(
          NextResponse.json({
            oid,
            total: results.length,
            results,
          }),
        );
      },
    );
  });
}