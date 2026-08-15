import "dotenv/config";
import { pollTraffic } from "@/lib/services/snmp/pollTraffic";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function pollAllDevices() {
  const devices = await prisma.devices.findMany();
  if (devices.length === 0) {
    console.log("No devices found.");
    return;
  }

  for (const device of devices) {
    try {
      if (!device.community) {
        console.warn(`Skipping ${device.ipAddress}: missing SNMP community`);
        continue;
      }
      console.log(`Polling ${device.ipAddress} (${device.ipAddress})`);

      await pollTraffic(device.ipAddress, device.community);

      console.log(`✓ ${device.ipAddress} completed`);
    } catch (err) {
      console.error(`✗ Failed to poll ${device.ipAddress}:`, err);
    }
  }
}
async function deleteOldTrafficData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  const result = await prisma.interface_statistics.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`🧹 Deleted ${result.count} traffic records older than 7 days.`);
}
async function start() {
  console.log("Traffic poller started.");

  while (true) {
    await pollAllDevices();

    await deleteOldTrafficData();

    await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
  }
}
start();
