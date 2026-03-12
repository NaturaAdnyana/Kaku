"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PasswordInput,
  PasswordInputStrengthChecker,
} from "@/components/ui/password-input";
import { Turnstile } from "@marsidev/react-turnstile";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) throw new Error(signInError.message);

        // redirect to home
        window.location.href = "/";
      } else {
        const { error: signUpError } = await authClient.signUp.email(
          {
            email,
            password,
            name: name || email.split("@")[0],
          },
          {
            headers: {
              "x-turnstile-token": turnstileToken || "",
            },
          },
        );
        if (signUpError) throw new Error(signUpError.message);

        // automatically signed in (configured in auth.ts)
        window.location.href = "/";
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 py-4">
            <CardTitle className="text-3xl font-extrabold text-center tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center text-zinc-500 dark:text-zinc-400">
              {isLogin
                ? "Enter your credentials to continue your journey"
                : "Join Kaku! and start mastering Kanji today"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pb-8 px-8">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="name"
                      className="text-sm font-semibold ml-1"
                    >
                      Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 transition-colors group-focus-within:text-zinc-900 dark:group-focus-within:text-white" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12 text-base rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 focus-visible:ring-zinc-900 dark:focus-visible:ring-white transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold ml-1">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 transition-colors group-focus-within:text-zinc-900 dark:group-focus-within:text-white" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-base rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 focus-visible:ring-zinc-900 dark:focus-visible:ring-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold ml-1"
                  >
                    Password
                  </Label>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="space-y-2"
                    inputGroupClassName="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 focus-within:ring-zinc-900 dark:focus-within:ring-white transition-all"
                    icon={
                      <Lock className="w-5 h-5 text-zinc-400 transition-colors group-focus-within:text-zinc-900 dark:group-focus-within:text-white" />
                    }
                  >
                    {!isLogin && <PasswordInputStrengthChecker />}
                  </PasswordInput>
                </div>

                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center pt-2"
                  >
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                      onSuccess={(token) => setTurnstileToken(token)}
                      options={{
                        theme: "light",
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-8 px-8">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-lg transition-all active:scale-[0.98] bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Get Started"
                )}
              </Button>

              <div
                className="text-sm font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors text-center py-2"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Don't have an account? " : "Already using Kaku! "}
                <span className="text-zinc-900 dark:text-white font-bold underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700">
                  {isLogin ? "Sign up now" : "Go to login"}
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
