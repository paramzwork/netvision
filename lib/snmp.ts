import snmp from "net-snmp";
import {
  InterfaceDiscovery,
  NetworkInterface,
  SnmpConfig,
  SnmpVarbind,
} from "./types";

export function createSession(config: SnmpConfig) {
  return snmp.createSession(config.host, config.community, {
    version: snmp.Version2c,
    retries: 2,
    timeout: 5000,
  });
}

export function snmpGetMany(
  config: SnmpConfig,
  oids: string[],
): Promise<SnmpVarbind[]> {
  return new Promise((resolve, reject) => {
    const session = createSession(config);

    session.get(oids, (err, varbinds) => {
      session.close();

      if (err) {
        reject(err);
        return;
      }

      resolve(varbinds as SnmpVarbind[]);
    });
  });
}

export function snmpWalk(
  config: SnmpConfig,
  oid: string,
): Promise<SnmpVarbind[]> {
  return new Promise((resolve, reject) => {
    const session = createSession(config);

    const results: SnmpVarbind[] = [];

    session.subtree(
      oid,
      (varbinds) => {
        results.push(...(varbinds as SnmpVarbind[]));
      },
      (err) => {
        session.close();

        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      },
    );
  });
}

export function parseInterfaces(varbinds: SnmpVarbind[]): InterfaceDiscovery[] {
  return varbinds.map((vb) => ({
    index: Number(vb.oid.split(".").pop()),
    name: Buffer.isBuffer(vb.value) ? vb.value.toString() : String(vb.value),
  }));
}

export function toMap<T>(
  varbinds: SnmpVarbind[],
  parser: (value: SnmpVarbind["value"]) => T,
): Map<number, T> {
  const map = new Map<number, T>();

  for (const vb of varbinds) {
    const index = Number(vb.oid.split(".").pop());

    map.set(index, parser(vb.value));
  }

  return map;
}

export function mergeInterfaces(
  interfaces: InterfaceDiscovery[],

  admin: Map<number, number>,
  oper: Map<number, number>,
  speed: Map<number, number>,

  inOctets: Map<number, number>,
  outOctets: Map<number, number>,

  inErrors: Map<number, number>,
  outErrors: Map<number, number>,
): NetworkInterface[] {
  return interfaces.map((iface) => ({
    index: iface.index,

    name: iface.name,

    adminStatus: admin.get(iface.index) ?? 0,

    operStatus: oper.get(iface.index) ?? 0,

    speedMbps: speed.get(iface.index) ?? 0,

    inOctets: Number(inOctets.get(iface.index) ?? 0n),

    outOctets: Number(outOctets.get(iface.index) ?? 0n),

    inErrors: inErrors.get(iface.index) ?? 0,

    outErrors: outErrors.get(iface.index) ?? 0,
  }));
}
