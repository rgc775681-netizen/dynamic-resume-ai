import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, FileSearch, Sparkles, Target, Users, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-ai.jpg";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-blob bg-primary/40 w-96 h-96 -top-20 -left-20" />
      <div className="animated-blob bg-accent/40 w-[500px] h-[500px] top-40 -right-32" style={{ animationDelay: "5s" }} />
      <div className="animated-blob bg-secondary/30 w-96 h-96 top-[60vh] left-1/3" style={{ animationDelay: "10s" }} />

      <Navbar />

      <section className="container mx-auto px-4 pt-16 pb-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Powered by AI · DBMS Mini Project</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[1.05]">
              Hire smarter with{" "}
              <span className="gradient-text-hero">AI-driven</span> talent matching
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Dynamic recruitment + intelligent resume parsing. Upload a resume and our AI extracts skills, experience, and education — then matches candidates to jobs in seconds.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>
                Get Started Free <ArrowRight className="ml-1" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
                I'm a Recruiter
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
              {["AI-powered parsing", "Smart matching", "Realtime DB"].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" /> {t}
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-30 rounded-full" />
            <img src={heroImg} alt="AI brain processing resumes" width={1536} height={1024}
              className="relative rounded-3xl shadow-[var(--shadow-elegant)] border border-white/40" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14 animate-fade-up">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            One platform. <span className="gradient-text">Endless possibilities.</span>
          </h2>
          <p className="text-muted-foreground text-lg">A modern DBMS-backed recruitment system with AI superpowers.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI Resume Parsing", desc: "Paste any resume — our AI extracts name, skills, experience, education and a professional summary instantly.", color: "from-primary to-accent" },
            { icon: Target, title: "Smart Matching", desc: "Each application is scored 0–100 against the job. See matched skills, missing skills and AI reasoning.", color: "from-secondary to-primary" },
            { icon: Zap, title: "Dynamic Requirements", desc: "Recruiters post jobs with flexible skill requirements. Candidates apply, the system ranks them automatically.", color: "from-accent to-warning" },
            { icon: FileSearch, title: "Searchable Database", desc: "Every parsed resume is structured and stored in a relational DB — query by skill, experience, or fit.", color: "from-primary to-secondary" },
            { icon: Users, title: "Dual Dashboards", desc: "Beautiful, role-specific workspaces for recruiters and candidates. RLS keeps data secure.", color: "from-accent to-primary" },
            { icon: Sparkles, title: "Modern UX", desc: "Glassmorphism, gradients, animations — designed to impress at your project demo.", color: "from-warning to-accent" },
          ].map((f, i) => (
            <div key={f.title} className="glow-card p-6 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-[var(--shadow-glow)]`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl p-12 md:p-16 text-center bg-gradient-hero relative overflow-hidden shadow-[var(--shadow-elegant)]">
          <div className="relative z-10 text-white space-y-6">
            <h2 className="font-display text-4xl md:text-5xl font-bold">Ready to revolutionize hiring?</h2>
            <p className="text-white/90 text-lg max-w-xl mx-auto">Join as a recruiter or candidate and explore the full AI-powered workflow.</p>
            <Button size="lg" onClick={() => navigate("/auth")} className="bg-white text-primary hover:bg-white/90 font-semibold">
              Launch the App <ArrowRight className="ml-1" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        Built with Lovable AI · DBMS Mini Project © 2026
      </footer>
    </div>
  );
};

export default Index;
