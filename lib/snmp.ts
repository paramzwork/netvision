import snmp from "net-snmp";
import { SnmpConfig, SnmpVarbind } from "./types";

export function createSession(config: SnmpConfig) {
  console.log("CONFIG RECEIVED:", config);
  return snmp.createSession(config.host, config.community, {
    port: config.port ?? 161,
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
    console.log("========== SNMP ==========");
    console.log("Host:", config.host);
    console.log("Community:", config.community);
    console.log("Version:", snmp.Version2c);
    console.log("OIDs:", oids);
    console.log("==========================");

    const session = createSession(config);

    session.get(oids, (err, varbinds) => {
      console.log("Callback reached");
      console.log("Error:", err);
      console.log("Varbinds:", varbinds);

      session.close();

      if (err) {
        reject(err);
        return;
      }

      resolve(varbinds as SnmpVarbind[]);
    });
  });
}
