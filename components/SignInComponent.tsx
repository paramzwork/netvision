"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
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
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Try again.");
      setLoading(false);
    } finally {
      toast.dismiss(toastID);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2b2a2a]">
      {/* <DotLottieReact src="/images/network.lottie" loop autoplay className="w-[1600px] h-[930px]"/> */}
      <Card className="w-full max-w-md rounded-sm! transition-all duration-300 bg-[#5c5c5c] backdrop-blur-2xl">
        <CardHeader className="w-full space-y-2 text-center">
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="relative h-35 w-40">
              <Image
                src="/images/nv-logo.png"
                alt="NetVision Logo"
                fill
                priority
                sizes="500px"
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-lexend! -mt-10 text-white">
            Sign In
          </CardTitle>
          {/* <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription> */}
        </CardHeader>

        <CardContent className="pb-5">
          <form onSubmit={handleLogin} className="space-y-4 p-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Username
              </Label>
              <div className="relative text-white">
                <Mail className="absolute left-3 top-3.25 h-4 w-4 text-white" />
                <Input
                  id="text"
                  type="text"
                  required
                  className="pl-9 h-11! focus-within:border! focus-within:border-white! focus-within:shadow-white focus-within:shadow-sm! rounded-sm"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <div className="relative text-white">
                <Lock className="absolute left-3 top-3.25 h-4 w-4 text-white" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 h-11! focus-within:border! focus-within:border-white! focus-within:shadow-white focus-within:shadow-sm! rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-white" />
                  ) : (
                    <Eye className="h-4 text-white w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-primary" />
                Remember me
              </label>

              <Link href="#" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div> */}

            {/* Submit */}
            <button
              disabled={loading}
              type="submit"
              className={`w-full bg-white text-[#5c5c5c] py-3 rounded-sm border
                       transition-all duration-200 font-medium
                       disabled:opacity-60 ${loading ? "cursor-not-allowed" : "cursor-pointer hover:bg-transparent hover:text-white hover:border-white"}`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm mt-6 text-white">
            Don’t have an account?{" "}
            <Link href="#" className="underline">
              Contact Admin
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
