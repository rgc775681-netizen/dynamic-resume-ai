import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, User } from "lucide-react";
import { toast } from "sonner";

const RoleSelect = () => {
  const navigate = useNavigate();
  const { user, loading, refreshRole } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const pick = async (role: "recruiter" | "candidate") => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (error) { toast.error(error.message); setBusy(false); return; }
    await refreshRole();
    toast.success(`Welcome, ${role}!`);
    navigate(role === "recruiter" ? "/recruiter" : "/candidate");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="animated-blob bg-primary/40 w-96 h-96 top-10 left-10" />
      <div className="animated-blob bg-accent/40 w-96 h-96 bottom-10 right-10" style={{ animationDelay: "5s" }} />
      <div className="max-w-3xl w-full relative z-10 animate-fade-up">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">Choose your <span className="gradient-text">role</span></h1>
          <p className="text-muted-foreground">This will personalize your dashboard.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { role: "recruiter" as const, icon: Briefcase, title: "Recruiter", desc: "Post jobs with dynamic requirements and review AI-ranked candidates." },
            { role: "candidate" as const, icon: User, title: "Candidate", desc: "Upload your resume, let AI extract your profile, and apply to top jobs." },
          ].map(opt => (
            <button key={opt.role} disabled={busy} onClick={() => pick(opt.role)}
              className="glow-card p-8 text-left hover:scale-[1.02] active:scale-[0.99] transition-transform group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-5 shadow-[var(--shadow-glow)] group-hover:animate-pulse-glow">
                <opt.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">{opt.title}</h3>
              <p className="text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
