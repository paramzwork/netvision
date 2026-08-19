export const OIDS = {
  // System
  sysName: "1.3.6.1.2.1.1.5.0",
  sysDescr: "1.3.6.1.2.1.1.1.0",
  sysUpTime: "1.3.6.1.2.1.1.3.0",
  sysObjectID: "1.3.6.1.2.1.1.2.0",
  sysLocation: "1.3.6.1.2.1.1.6.0",
  sysContact: "1.3.6.1.2.1.1.4.0",

  // Interfaces
  ifPhysAddress: "1.3.6.1.2.1.2.2.1.6",
  ifDescr: "1.3.6.1.2.1.2.2.1.2",
  ifAdminStatus: "1.3.6.1.2.1.2.2.1.7",
  ifOperStatus: "1.3.6.1.2.1.2.2.1.8",
  ifAlias: "1.3.6.1.2.1.31.1.1.1.18",

  // Use HighSpeed instead of ifSpeed
  ifHighSpeed: "1.3.6.1.2.1.31.1.1.1.15",

  ifHCInOctets: "1.3.6.1.2.1.31.1.1.1.6",
  ifHCOutOctets: "1.3.6.1.2.1.31.1.1.1.10",

  ifInErrors: "1.3.6.1.2.1.2.2.1.14",
  ifOutErrors: "1.3.6.1.2.1.2.2.1.20",

  lldpRemSysName: "1.0.8802.1.1.2.1.4.1.1.9",
  lldpRemPortId: "1.0.8802.1.1.2.1.4.1.1.7",
  lldpRemPortDesc: "1.0.8802.1.1.2.1.4.1.1.8",
  lldpRemChassisId: "1.0.8802.1.1.2.1.4.1.1.5",

  // Huawei enterprise tree
  huawei: "1.3.6.1.4.1.2011",
  // Huawei CPU MIB subtree
  huaweiCpu: "1.3.6.1.4.1.2011.6.3",
} as const;
