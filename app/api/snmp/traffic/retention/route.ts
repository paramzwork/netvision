import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_RETENTION_MONTHS = 2;

const ALLOWED_RETENTION_MONTHS = [
  1,
  2,
  3,
  6,
  12,
];

export async function GET() {
  try {
    const setting =
      await prisma.system_settings.findUnique({
        where: {
          key: "traffic_retention_months",
        },
      });

    const months = setting
      ? Number(setting.value)
      : DEFAULT_RETENTION_MONTHS;

    return NextResponse.json({
      months,
    });
  } catch (error) {
    console.error(
      "Failed to get traffic retention:",
      error,
    );

    return NextResponse.json(
      {
        message: "Failed to get traffic retention setting.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const months = Number(body.months);

    if (!ALLOWED_RETENTION_MONTHS.includes(months)) {
      return NextResponse.json(
        {
          message: "Invalid retention period.",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.system_settings.upsert({
      where: {
        key: "traffic_retention_months",
      },
      update: {
        value: String(months),
      },
      create: {
        key: "traffic_retention_months",
        value: String(months),
      },
    });

    return NextResponse.json({
      message: "Traffic retention updated successfully.",
      months,
    });
  } catch (error) {
    console.error(
      "Failed to update traffic retention:",
      error,
    );

    return NextResponse.json(
      {
        message: "Failed to update traffic retention.",
      },
      {
        status: 500,
      },
    );
  }
}