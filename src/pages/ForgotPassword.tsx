import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email) { toast.error("Enter your email"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your email for the reset link");
    } catch (e: any) {
      toast.error(e.message || "Failed to send reset email");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="animated-blob bg-primary/40 w-96 h-96 top-0 left-0" />
      <div className="animated-blob bg-accent/40 w-96 h-96 bottom-0 right-0" style={{ animationDelay: "6s" }} />

      <div className="glow-card w-full max-w-md p-8 relative z-10 animate-fade-up">
        <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl gradient-text">TalentAI</span>
        </div>

        <h2 className="font-display text-2xl font-bold mb-2">Forgot password?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the email for your candidate or recruiter account and we'll send a reset link.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button variant="hero" className="w-full" disabled={busy} onClick={submit}>
            {busy ? "Sending..." : "Send reset link"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/auth")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
