import { NextRequest, NextResponse } from "next/server";
import { cactiFetch } from "@/lib/cacti";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const localGraphId = searchParams.get("local_graph_id");
  const graphStart = searchParams.get("graph_start");
  const graphEnd = searchParams.get("graph_end");
  const width = searchParams.get("graph_width") ?? "600";
  const height = searchParams.get("graph_height") ?? "150";

  const url =
    `http://10.0.3.161/cacti/graph_json.php?` +
    new URLSearchParams({
      rra_id: "0",
      local_graph_id: localGraphId!,
      graph_start: graphStart!,
      graph_end: graphEnd!,
      graph_width: width,
      graph_height: height,
    });

  const res = await cactiFetch(url);

  const data = await res.json();

  return NextResponse.json(data);
}