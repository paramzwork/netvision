"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

export default function SignInComponent() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const toastID = toast.loading("Signing in..");
    const newUsername = username.trim();
    const newPassword = password.trim();
    try {
      const res = await fetch("/api/auth/signin", {
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
      router.replace("/dashboard");
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
        ANIMATION CSS (Grid, Orbs, Entrance)
        ========================================
      */}
      <style>{`
        /* 1. Moving Background Grid */
        @keyframes pan-grid {
          0% { background-position: 0px 0px; }
          100% { background-position: 48px 48px; } /* Matches bg-size to loop perfectly */
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
          from { 
            opacity: 0; 
            transform: translateY(24px); 
            filter: blur(4px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
            filter: blur(0);
          }
        }
        .animate-fade-in {
          opacity: 0; /* Start hidden */
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* Stagger Delays */
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>

      {/* 1. MOVING TECH GRID */}
      {/* We apply the "animate-grid" class here to make it scroll continuously */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)] pointer-events-none animate-grid" />

      {/* 2. Floating glowing orbs (Blue, Indigo, Cyan) */}
      <div className="absolute top-[20%] left-[30%] w-75 h-75 sm:w-125 sm:h-125 bg-indigo-600/20 rounded-full blur-[100px] animate-float-1 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] right-[30%] w-75 h-75 sm:w-150 sm:h-150 bg-blue-600/20 rounded-full blur-[120px] animate-float-2 mix-blend-screen pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-50 h-50 sm:w-100 sm:h-100 bg-cyan-500/20 rounded-full blur-[100px] animate-float-3 mix-blend-screen pointer-events-none" />

      {/* 
        ========================================
        LOGIN CARD SECTION
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
            Welcome Back
          </CardTitle>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="space-y-2 animate-fade-in delay-300">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-zinc-300"
              >
                Username
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                <Input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Enter your username"
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-white transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
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

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm py-1 animate-fade-in delay-500">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-black/20 accent-white text-black focus:ring-white/30 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Remember me
                </span>
              </label>
              <Link
                href="#"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              type="submit"
              className="w-full h-12 mt-2 flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-white/10 animate-fade-in delay-500"
            >
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm mt-8 text-zinc-400 animate-fade-in delay-500">
            Don’t have an account?{" "}
            <Link
              href="#"
              className="text-white hover:underline underline-offset-4 font-medium transition-colors"
            >
              Contact Admin
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
