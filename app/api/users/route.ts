import { NextResponse } from "next/server";
import { getUsers } from "@/lib/users";

export async function GET() {
  return NextResponse.json(getUsers());
}