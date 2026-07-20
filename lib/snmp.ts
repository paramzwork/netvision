import snmp from "net-snmp";

export function createSession(host: string, community: string) {
  return snmp.createSession(host, community, {
    timeout: 5000,
    retries: 1,
  });
}

export async function snmpGet(host: string, community: string, oid: string) {
  return new Promise((resolve, reject) => {
    const session = createSession(host, community);

    session.get([oid], (err, varbinds) => {
      session.close();

      if (err) {
        reject(err);
        return;
      }

      resolve(varbinds?.[0].value);
    });
  });
}
export async function snmpGetMany(
  host: string,
  community: string,
  oids: string[],
) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const session = snmp.createSession(host, community);

    session.get(oids, (err, varbinds) => {
      session.close();

      if (err) {
        reject(err);
        return;
      }

      const result: Record<string, unknown> = {};

      varbinds?.forEach((vb) => {
        result[vb.oid] = vb.value;
      });

      resolve(result);
    });
  });
}
