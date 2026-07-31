import { NextResponse } from "next/server";
import snmp from "net-snmp";
import { SnmpResult } from "@/lib/types";

// export async function GET() {
//   const host = process.env.SNMP_HOST;
//   const community = process.env.SNMP_COMMUNITY;

//   if (!host || !community) {
//     return NextResponse.json(
//       { message: "SNMP configuration is missing." },
//       { status: 500 },
//     );
//   }

//   const session = snmp.createSession(host, community);

//   const cpuOID = "1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5";

//   const results: SnmpResult[] = [];

//   return new Promise<Response>((resolve) => {
//     session.subtree(
//       cpuOID,
//       (varbinds) => {
//         for (const vb of varbinds) {
//           if (snmp.isVarbindError(vb)) {
//             console.error(snmp.varbindError(vb));
//             continue;
//           }

//           results.push({
//             oid: vb.oid,
//             type: vb.type ?? 0,
//             value: String(vb.value),
//           });
//         }
//       },
//       (error) => {
//         session.close();

//         if (error) {
//           resolve(
//             NextResponse.json(
//               { message: error.message },
//               { status: 500 },
//             ),
//           );
//           return;
//         }

//         resolve(
//           NextResponse.json({
//             total: results.length,
//             results,
//           }),
//         );
//       },
//     );
//   });
// }

function walk(session: snmp.Session, oid: string): Promise<SnmpResult[]> {
  return new Promise((resolve, reject) => {
    const results: SnmpResult[] = [];

    session.subtree(
      oid,
      (varbinds) => {
        for (const vb of varbinds) {
          if (snmp.isVarbindError(vb)) continue;

          results.push({
            oid: vb.oid,
            type: vb.type ?? 0,
            value: String(vb.value),
          });
        }
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      },
    );
  });
}
export async function GET() {
  const host = process.env.SNMP_HOST;
  const community = process.env.SNMP_COMMUNITY;

  if (!host || !community) {
    return NextResponse.json(
      { message: "SNMP configuration is missing." },
      { status: 500 },
    );
  }

  const session = snmp.createSession(host, community);

  try {
    const columns = {
      col1: "1.3.6.1.4.1.2011.5.25.31.1.1.1.1.1",
      col2: "1.3.6.1.4.1.2011.5.25.31.1.1.1.1.2",
      col3: "1.3.6.1.4.1.2011.5.25.31.1.1.1.1.3",
      col4: "1.3.6.1.4.1.2011.5.25.31.1.1.1.1.4",
      usage: "1.3.6.1.4.1.2011.5.25.31.1.1.1.1.5",
    };

    const [col1, col2, col3, col4, usage] = await Promise.all([
      walk(session, columns.col1),
      walk(session, columns.col2),
      walk(session, columns.col3),
      walk(session, columns.col4),
      walk(session, columns.usage),
    ]);

    session.close();

    return NextResponse.json({
      col1,
      col2,
      col3,
      col4,
      usage,
    });
  } catch (err) {
    session.close();

    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
