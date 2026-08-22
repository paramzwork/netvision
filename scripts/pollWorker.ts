import { pollTraffic } from "../lib/services/snmp/pollTraffic";
import { prisma } from "../lib/prisma";

const DEFAULT_RETENTION_MONTHS = 2;
let shuttingDown = false;

async function pollAllDevices() {
  const devices = await prisma.devices.findMany();

  if (devices.length === 0) {
    console.log("No devices found.");
    return;
  }

  for (const device of devices) {
    if (shuttingDown) {
      break;
    }

    try {
      if (!device.community) {
        console.warn(`Skipping ${device.ipAddress}: missing SNMP community`);
        continue;
      }

      console.log(`Polling ${device.ipAddress}`);

      await pollTraffic(device.ipAddress, device.community);

      console.log(`✓ ${device.ipAddress} completed`);
    } catch (error) {
      console.error(`✗ Failed to poll ${device.ipAddress}:`, error);
    }
  }
}
async function getTrafficRetentionMonths() {
  const setting = await prisma.system_settings.findUnique({
    where: {
      key: "traffic_retention_months",
    },
  });

  if (!setting) {
    return DEFAULT_RETENTION_MONTHS;
  }

  const months = Number(setting.value);

  if (!Number.isInteger(months) || months <= 0) {
    return DEFAULT_RETENTION_MONTHS;
  }

  return months;
}
async function deleteOldTrafficData() {
  const retentionMonths = await getTrafficRetentionMonths();

  const cutoffDate = new Date();

  cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

  const result = await prisma.interface_statistics.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(
    `🧹 Deleted ${result.count} traffic records older than ${retentionMonths} month(s).`,
  );
}

async function start() {
  console.log("Traffic poller started.");

  while (!shuttingDown) {
    try {
      await pollAllDevices();
      await deleteOldTrafficData();
    } catch (error) {
      console.error("Poller cycle failed:", error);
    }

    if (!shuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
    }
  }

  await prisma.$disconnect();

  console.log("Traffic poller stopped.");
}

process.on("SIGINT", () => {
  console.log("Received SIGINT");
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM");
  shuttingDown = true;
});

start().catch(async (error) => {
  console.error("Poller crashed:", error);

  await prisma.$disconnect();

  process.exit(1);
});
