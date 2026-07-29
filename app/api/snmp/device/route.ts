import { NextResponse } from "next/server";
import snmp from "net-snmp";
import { SnmpResult } from "@/lib/types";

export async function GET() {
  const host = process.env.SNMP_HOST!;
  const community = process.env.SNMP_COMMUNITY!;

  const session = snmp.createSession(host, community);

  const results: SnmpResult[] = [];

  return new Promise<Response>((resolve) => {
    session.subtree(
      "1.3.6.1.4.1",
      (varbinds) => {
        for (const varbind of varbinds) {
          if (snmp.isVarbindError(varbind)) continue;

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
            NextResponse.json({ message: error.message }, { status: 500 }),
          );
          return;
        }

        resolve(NextResponse.json(results));
      },
    );
  });
}
