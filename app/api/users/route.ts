import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { User } from "@/lib/types";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(),"public", "data", "users.json");

    const users: User[] = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );

    const safeUsers = users.map((u) => {
      const {  ...rest } = u;
      return rest;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Failed to read users:", error);

    return NextResponse.json(
      { message: "Failed to load users" },
      { status: 500 }
    );
  }
}