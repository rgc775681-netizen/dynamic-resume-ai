import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Detect recovery tokens in URL (hash or query) — enables form immediately
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const hasRecoveryToken =
      hash.includes("access_token") ||
      hash.includes("type=recovery") ||
      search.includes("code=") ||
      search.includes("type=recovery");
    if (hasRecoveryToken) setReady(true);

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || session) {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // Failsafe: enable form after 2s so users aren't blocked if events don't fire
    const t = setTimeout(() => setReady(true), 2000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const submit = async () => {
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match — please retype them"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Force a fresh session with the new password
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      toast.success("Password updated! You're signed in.");
      navigate(session ? "/candidate" : "/auth");
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("same") || msg.includes("different from")) {
        toast.error("New password must be different from your current one.");
      } else if (msg.includes("session")) {
        toast.error("Your reset link expired. Request a new password reset email.");
      } else {
        toast.error(e?.message || "Failed to update password");
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="animated-blob bg-primary/40 w-96 h-96 top-0 left-0" />
      <div className="animated-blob bg-accent/40 w-96 h-96 bottom-0 right-0" style={{ animationDelay: "6s" }} />

      <div className="glow-card w-full max-w-md p-8 relative z-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl gradient-text">RecruitPro</span>
        </div>

        <h2 className="font-display text-2xl font-bold mb-2">Set a new password</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {ready ? "Choose a new password for your account." : "Validating your reset link..."}
        </p>

        <div className="space-y-4">
          <div>
            <Label>New password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button variant="hero" className="w-full" disabled={busy || !ready} onClick={submit}>
            {busy ? "Updating..." : "Update password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
