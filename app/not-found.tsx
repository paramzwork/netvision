"use client";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="relative flex flex-col min-h-screen items-center justify-end py-40 overflow-hidden bg-muted/40">
      <div className="relative w-300 h-140">
        <Image
          src={"/images/undraw_under-construction_c2y1.svg"}
          alt="Under contruction"
          fill
          sizes="600px"
          className="object-contain"
        />
      </div>
      <div className="absolute top-30 w-full h-150 max-w-xl text-center p-5">
        <div className="pt-10 space-y-6">
          {/* Text */}
          <div className="space-y-2">
            <h1 className="text-8xl font-bold tracking-tight">404</h1>
            <p className="text-lg font-medium">Page not found</p>
            <p className="text-sm text-muted-foreground">
              The page you are looking for doesn’t exist or may have been
              removed.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-15 gap-3 pb-8">
          <button
            className="flex flex-row cursor-pointer border bg-white/50 p-2 rounded-lg backdrop-blur-sm transition-transform duration-200 hover:scale-95 active:scale-80"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Return</p>
          </button>
        </div>
      </div>
    </div>
  );
}
