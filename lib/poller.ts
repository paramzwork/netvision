import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function pollDevice(deviceId: number) {
  console.log(`Polling ${deviceId}`);
}

async function pollAllDevices() {
  const devices = await prisma.devices.findMany();

  for (const device of devices) {
    await pollDevice(device.id);
  }
}

async function start() {
  while (true) {
    try {
      await pollAllDevices();
    } catch (err) {
      console.error(err);
    }

    await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
  }
}

start();
