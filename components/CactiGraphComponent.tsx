"use client";
import { CactiGraph } from "@/lib/types";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  graphId: number;
};

export default function CactiGraphComponent({ graphId }: Props) {
  const [graph, setGraph] = useState<CactiGraph | null>(null);

  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);

    fetch(
      `/api/cacti/graph?local_graph_id=${graphId}&graph_start=${now - 1800}&graph_end=${now}`,
    )
      .then((r) => r.json())
      .then(setGraph);
  }, [graphId]);

  if (!graph) return null;

  return (
    <div className="w-full flex items-center justify-start px-5 py-2 bg-[#1B263B]">
      <div className="relative h-12 w-30">
        <Image
          src="/images/ricklee-logo.png"
          alt={`Graph ${graphId}`}
          fill
          priority
          sizes="500px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
