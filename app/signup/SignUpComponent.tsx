"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

export default function SignUpComponent() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const signUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const toastID = toast.loading("Signing up..");
    const newUsername = username.trim();
    const newPassword = password.trim();
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message, {
          description: "Incorrect username or password.",
        });
        setLoading(false);
        return;
      }
      toast.dismiss(toastID);
      router.replace("/signin");
    } catch {
      toast.error("Something went wrong. Try again.");
      setLoading(false);
    } finally {
      toast.dismiss(toastID);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden px-4">
      {/* 
        ========================================
        ANIMATION CSS (Grid, Orbs, Entrance, TRAFFIC)
        ========================================
      */}
      <style>{`
        /* 1. Moving Background Grid */
        @keyframes pan-grid {
          0% { background-position: 0px 0px; }
          100% { background-position: 48px 48px; }
        }
        .animate-grid {
          animation: pan-grid 4s linear infinite;
        }

        /* 2. Background Floating Orbs */
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-float-1 { animation: float 15s infinite ease-in-out; }
        .animate-float-2 { animation: float 18s infinite ease-in-out; animation-delay: -5s; }
        .animate-float-3 { animation: float 20s infinite ease-in-out; animation-delay: -10s; }

        /* 3. UI Entrance Animations */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-in {
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }

        /* 4. TRAFFIC FLOW ANIMATIONS */
        @keyframes traffic-flow {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        
        /* Different speeds and dash lengths for realism */
        .traffic-fast {
          stroke-dasharray: 100 600; /* Long dash, very long gap */
          animation: traffic-flow 3s linear infinite;
        }
        .traffic-medium {
          stroke-dasharray: 60 400;
          animation: traffic-flow 5s linear infinite reverse;
        }
        .traffic-slow {
          stroke-dasharray: 40 300;
          animation: traffic-flow 8s linear infinite;
        }
        .traffic-burst {
          stroke-dasharray: 150 800;
          animation: traffic-flow 2s linear infinite;
        }

        /* 5. Pulsing Intersections */
        @keyframes hub-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        .hub-node {
          transform-origin: center;
          animation: hub-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* 1. MOVING TECH GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)] pointer-events-none animate-grid opacity-60" />

      {/* 2. FIBER OPTIC TRAFFIC FLOW SVG */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none opacity-80"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Heavy glow filter for the traffic streaks */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- BASE NETWORK TRACKS (Faint underlying wires) --- */}
        <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="2" fill="none">
          <path d="M -100 200 L 400 200 L 600 400 L 1200 400 L 1400 200 L 2000 200" />
          <path d="M 200 -100 L 200 500 L 500 800 L 1500 800 L 1800 500 L 1800 -100" />
          <path d="M -100 800 L 400 800 L 700 500 L 1300 500 L 1600 800 L 2000 800" />
          <path d="M 600 400 L 700 500" />
          <path d="M 1200 400 L 1300 500" />
          <path d="M 500 800 L 400 800" />
          <path d="M 1500 800 L 1600 800" />
        </g>

        {/* --- TRAFFIC STREAKS (Glowing moving lines) --- */}
        <g filter="url(#neonGlow)" fill="none">
          {/* Fast Cyan Burst */}
          <path
            d="M -100 200 L 400 200 L 600 400 L 1200 400 L 1400 200 L 2000 200"
            stroke="#22d3ee"
            strokeWidth="3"
            className="traffic-burst"
          />
          {/* Medium Blue Flow */}
          <path
            d="M 200 -100 L 200 500 L 500 800 L 1500 800 L 1800 500 L 1800 -100"
            stroke="#3b82f6"
            strokeWidth="2.5"
            className="traffic-medium"
          />
          {/* Slow Indigo Flow */}
          <path
            d="M -100 800 L 400 800 L 700 500 L 1300 500 L 1600 800 L 2000 800"
            stroke="#6366f1"
            strokeWidth="2"
            className="traffic-slow"
          />

          {/* Secondary Fast Lane */}
          <path
            d="M 2000 800 L 1600 800 L 1300 500 L 700 500 L 400 800 L -100 800"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="traffic-fast"
          />
        </g>

        {/* --- INTERSECTION HUBS (Glowing Dots) --- */}
        <g fill="#38bdf8" filter="url(#neonGlow)">
          <circle
            cx="400"
            cy="200"
            r="4"
            className="hub-node"
            style={{ animationDelay: "0s" }}
          />
          <circle
            cx="600"
            cy="400"
            r="4"
            className="hub-node"
            style={{ animationDelay: "1s" }}
          />
          <circle
            cx="1200"
            cy="400"
            r="4"
            className="hub-node"
            style={{ animationDelay: "2s" }}
          />
          <circle
            cx="1400"
            cy="200"
            r="4"
            className="hub-node"
            style={{ animationDelay: "0.5s" }}
          />

          <circle
            cx="200"
            cy="500"
            r="4"
            className="hub-node"
            style={{ animationDelay: "1.5s" }}
          />
          <circle
            cx="500"
            cy="800"
            r="4"
            className="hub-node"
            style={{ animationDelay: "0.2s" }}
          />
          <circle
            cx="1500"
            cy="800"
            r="4"
            className="hub-node"
            style={{ animationDelay: "2.5s" }}
          />
          <circle
            cx="1800"
            cy="500"
            r="4"
            className="hub-node"
            style={{ animationDelay: "1.2s" }}
          />

          <circle
            cx="400"
            cy="800"
            r="4"
            className="hub-node"
            style={{ animationDelay: "0.8s" }}
          />
          <circle
            cx="700"
            cy="500"
            r="4"
            className="hub-node"
            style={{ animationDelay: "1.8s" }}
          />
          <circle
            cx="1300"
            cy="500"
            r="4"
            className="hub-node"
            style={{ animationDelay: "0.4s" }}
          />
          <circle
            cx="1600"
            cy="800"
            r="4"
            className="hub-node"
            style={{ animationDelay: "2.2s" }}
          />
        </g>
      </svg>

      {/* 3. Ambient Background Orbs */}
      <div className="absolute top-[20%] left-[30%] w-75 h-75 sm:w-125 sm:h-125 bg-indigo-600/20 rounded-full blur-[100px] animate-float-1 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] right-[30%] w-75 h-75 sm:w-150 sm:h-150 bg-blue-600/20 rounded-full blur-[120px] animate-float-2 mix-blend-screen pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-50 h-50 sm:w-100 sm:h-100 bg-cyan-500/20 rounded-full blur-[100px] animate-float-3 mix-blend-screen pointer-events-none" />

      {/* 
        ========================================
        SIGN UP CARD SECTION
        ========================================
      */}
      <Card className="w-full max-w-105 border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-2xl z-10 animate-fade-in">
        <CardHeader className="pt-10 pb-6 space-y-4 text-center">
          <div className="flex justify-center items-center animate-fade-in delay-100">
            <div className="relative h-28 w-36 drop-shadow-2xl hover:scale-105 transition-transform duration-500">
              <Image
                src="/images/nv-logo.png"
                alt="NetVision Logo"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-white font-lexend animate-fade-in delay-200">
            Create an Account
          </CardTitle>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <form onSubmit={signUp} className="space-y-5">
            {/* Username */}
            <div className="space-y-2 animate-fade-in delay-300">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-zinc-300"
              >
                Username
              </Label>
              <div className="relative group">
                {/* Fixed: Swapped Mail icon for User icon */}
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                <Input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Choose a username"
                  className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/50 rounded-xl transition-all"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2 animate-fade-in delay-400">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-zinc-300"
              >
                Password
              </Label>
              <div className="relative group">
                {/* Fixed: Icons are now perfectly vertically centered */}
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="h-12 pl-10 pr-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/50 rounded-xl transition-all"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors outline-none focus-visible:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              type="submit"
              className="w-full h-12 mt-4 flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-white/10 animate-fade-in delay-500"
            >
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              )}
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          {/* Footer - Replaced commented out code with standard Sign In link */}
          {/* <p className="text-center text-sm mt-8 text-zinc-400 animate-fade-in delay-600">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:underline underline-offset-4 font-medium transition-colors">
              Sign In
            </Link>
          </p> */}
        </CardContent>
      </Card>
    </div>
  );
}
