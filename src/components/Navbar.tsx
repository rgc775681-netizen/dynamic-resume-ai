import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut } from "lucide-react";

export const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl gradient-text">TalentAI</span>
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate(role === "recruiter" ? "/recruiter" : "/candidate")}>
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4 mr-1" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>Sign in</Button>
              <Button variant="hero" onClick={() => navigate("/auth")}>Get started</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
