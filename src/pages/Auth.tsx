import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  full_name: z.string().trim().max(100).optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });

  useEffect(() => {
    if (!loading && user) {
      navigate(role === "recruiter" ? "/recruiter" : "/candidate");
    }
  }, [user, role, loading, navigate]);

  const submit = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { emailRedirectTo: `${window.location.origin}/candidate`, data: { full_name: form.full_name } },
        });
        if (error) throw error;
        toast.success("Account created! You can now sign in as a candidate.");
      } else {
        const email = form.email.trim().toLowerCase();
        const { error } = await supabase.auth.signInWithPassword({ email, password: form.password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();
      const code = e?.code || "";
      if (code === "invalid_credentials" || msg.includes("invalid login")) {
        toast.error("Email or password is incorrect. Check for typos, caps lock, or use 'Forgot password?' to reset.");
      } else if (msg.includes("email not confirmed")) {
        toast.error("Please confirm your email first — check your inbox for the verification link.");
      } else if (msg.includes("user already registered")) {
        toast.error("An account with this email already exists. Try signing in instead.");
      } else if (msg.includes("rate")) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else {
        toast.error(e?.message || "Authentication failed");
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="animated-blob bg-primary/40 w-96 h-96 top-0 left-0" />
      <div className="animated-blob bg-accent/40 w-96 h-96 bottom-0 right-0" style={{ animationDelay: "6s" }} />

      <div className="glow-card w-full max-w-md p-8 relative z-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl gradient-text">RecruitPro</span>
        </div>
        <h1 className="font-display text-2xl font-bold mt-3">Welcome 👋</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to continue or create a new candidate account.</p>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <Button variant="hero" className="w-full" disabled={busy} onClick={() => submit("signin")}>{busy ? "Signing in..." : "Sign In"}</Button>
            <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-primary hover:underline w-full text-center">
              Forgot password?
            </button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div><Label>Full name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <Button variant="hero" className="w-full" disabled={busy} onClick={() => submit("signup")}>{busy ? "Creating..." : "Create Account"}</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
