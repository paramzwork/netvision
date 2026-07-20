import { NextRequest, NextResponse } from "next/server";
import { cactiFetch } from "@/lib/cacti";
import * as cheerio from "cheerio";
import { CactiDevice } from "@/lib/types";
import { oneDecode, tripleDecode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const reqType = oneDecode(type || "");

  let request = "";
  const url = "http://10.0.3.161/cacti/";
  try {
    if (reqType === "device") {
      const id = tripleDecode(searchParams.get("id") || "");
      console.log(id)
      console.log(reqType)
      console.log("DEVICE TRIGGERED");
      request = `${url}graph_view.php?action=tree&node=tbranch-${id}&host_id=${id}&site_id=-1&host_template_id=-1&hgd=&hyper=true`;
    } else {
      request = `${url}host.php`;
    }
    const res = await cactiFetch(request);
    const html = await res.text();

    if (reqType === "device") {
      return NextResponse.json(res);
    } else {
      const $ = cheerio.load(html);
      const devices: CactiDevice[] = [];

      $("#host2_child tr.tableRow").each((_, row) => {
        const td = $(row).find("td");

        devices.push({
          description: td.eq(0).text().trim(),
          hostname: td.eq(1).text().trim(),
          id: td.eq(2).text().trim(),
          graphs: td.eq(3).text().trim(),
          dataSources: td.eq(4).text().trim(),
          status: td.eq(5).text().trim(),
          inState: td.eq(6).text().trim(),
          uptime: td.eq(7).text().trim(),
          pollTime: td.eq(8).text().trim(),
          currentMs: td.eq(9).text().trim(),
          averageMs: td.eq(10).text().trim(),
          availability: td.eq(11).text().trim(),
        });
      });
      console.log(res)
      return NextResponse.json(devices);
    }
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { message: "Unable to fetch devices" },
      { status: 500 },
    );
  }
}
