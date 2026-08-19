import { NextResponse } from "next/server";
import snmp from "net-snmp";
import { SnmpResult } from "@/lib/types";

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

function getIndex(oid: string) {
  return oid.split(".").pop()!;
}

export async function GET() {
  const host = process.env.SNMP_HOST;
  const community = process.env.SNMP_COMMUNITY;

  if (!host || !community) {
    return NextResponse.json(
      {
        message: "SNMP configuration is missing.",
      },
      {
        status: 500,
      },
    );
  }

  const session = snmp.createSession(host, community, {
    version: snmp.Version2c,
    timeout: 5000,
    retries: 1,
  });

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

    /*
     * Create a map using the SNMP index.
     *
     * Example:
     *
     * 16847105
     *    ├── col1
     *    ├── col2
     *    ├── col3
     *    ├── col4
     *    └── usage
     */

    const cpuMap = new Map<
      string,
      {
        index: string;
        col1?: string;
        col2?: string;
        col3?: string;
        col4?: string;
        usage?: number;
      }
    >();

    for (const item of col1) {
      const index = getIndex(item.oid);

      cpuMap.set(index, {
        index,
        col1: item.value,
      });
    }

    for (const item of col2) {
      const index = getIndex(item.oid);

      const existing = cpuMap.get(index) ?? {
        index,
      };

      existing.col2 = item.value;

      cpuMap.set(index, existing);
    }

    for (const item of col3) {
      const index = getIndex(item.oid);

      const existing = cpuMap.get(index) ?? {
        index,
      };

      existing.col3 = item.value;

      cpuMap.set(index, existing);
    }

    for (const item of col4) {
      const index = getIndex(item.oid);

      const existing = cpuMap.get(index) ?? {
        index,
      };

      existing.col4 = item.value;

      cpuMap.set(index, existing);
    }

    for (const item of usage) {
      const index = getIndex(item.oid);

      const existing = cpuMap.get(index) ?? {
        index,
      };

      existing.usage = Number(item.value);

      cpuMap.set(index, existing);
    }

    const cpu = Array.from(cpuMap.values());

    return NextResponse.json({
      message: "CPU information retrieved successfully.",
      cpu,
    });
  } catch (err) {
    console.error("SNMP CPU error:", err);

    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : String(err),
      },
      {
        status: 500,
      },
    );
  } finally {
    session.close();
  }
}