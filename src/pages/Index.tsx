import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Brain, FileSearch, Sparkles, Target, Users, Zap, ArrowRight, CheckCircle2, Star, Shield, Rocket } from "lucide-react";
import heroImg from "@/assets/hero-ai.jpg";

const Index = () => {
  const navigate = useNavigate();

  const stats = [
    { value: "98%", label: "Match accuracy" },
    { value: "<5s", label: "Resume parsing" },
    { value: "24/7", label: "Always on" },
    { value: "100%", label: "Secure & private" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-blob bg-primary/40 w-96 h-96 -top-20 -left-20" />
      <div className="animated-blob bg-accent/40 w-[500px] h-[500px] top-40 -right-32" style={{ animationDelay: "5s" }} />
      <div className="animated-blob bg-secondary/30 w-96 h-96 top-[60vh] left-1/3" style={{ animationDelay: "10s" }} />

      <Navbar />

      {/* HERO */}
      <section className="container mx-auto px-4 pt-16 pb-20 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Smart Recruitment Platform</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gradient-primary text-white text-[10px] font-bold tracking-wide">NEW</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[1.05]">
              Where <span className="gradient-text-hero">extraordinary talent</span> meets unstoppable opportunity
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Say goodbye to endless resume piles and guesswork. RecruitPro turns hiring into a beautifully simple craft — surfacing the right people, for the right roles, at the speed of thought.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>
                Parse My Resume <ArrowRight className="ml-1" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/auth")} className="backdrop-blur bg-white/40 border-white/60 hover:bg-white/60">
                I'm Hiring for a Role
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-3 text-sm text-muted-foreground">
              {[
                { icon: CheckCircle2, t: "Smart parsing" },
                { icon: Shield, t: "Secure by design" },
                { icon: Rocket, t: "Lightning fast" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-success" /> {t}
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute -inset-6 bg-gradient-hero blur-3xl opacity-30 rounded-full" />
            <img src={heroImg} alt="Modern recruitment dashboard" width={1536} height={1024}
              className="relative rounded-3xl shadow-[var(--shadow-elegant)] border border-white/40" />
            {/* Floating chips */}
            <div className="hidden md:flex absolute -left-6 top-10 glass rounded-2xl px-4 py-3 items-center gap-2 shadow-[var(--shadow-card)] animate-fade-up">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Match score</div>
                <div className="font-bold text-sm gradient-text">94 / 100</div>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-4 bottom-8 glass rounded-2xl px-4 py-3 items-center gap-2 shadow-[var(--shadow-card)] animate-fade-up" style={{ animationDelay: "200ms" }}>
              <div className="w-9 h-9 rounded-xl bg-gradient-secondary flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Top candidate</div>
                <div className="font-bold text-sm">Shortlisted ✨</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={s.label} className="glow-card p-5 text-center animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-3xl font-display font-extrabold gradient-text">{s.value}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14 animate-fade-up max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider">Features</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            One platform. <span className="gradient-text">Endless possibilities.</span>
          </h2>
          <p className="text-muted-foreground text-lg">A modern recruitment system with smart matching and a delightful experience.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "Smart Resume Parsing", desc: "Upload any resume — name, skills, experience, education and a professional summary extracted instantly.", color: "from-primary to-accent" },
            { icon: Target, title: "Skill Matching", desc: "Each application is scored 0–100 against the job. See matched skills, missing skills, and detailed reasoning.", color: "from-secondary to-primary" },
            { icon: Zap, title: "Dynamic Requirements", desc: "Recruiters post jobs with flexible skill sets. Candidates apply, the system ranks them automatically.", color: "from-accent to-warning" },
            { icon: FileSearch, title: "Searchable Database", desc: "Every parsed resume is structured and stored — query by skill, experience, or fit in seconds.", color: "from-primary to-secondary" },
            { icon: Users, title: "Dual Dashboards", desc: "Beautiful, role-specific workspaces for recruiters and candidates with secure data isolation.", color: "from-accent to-primary" },
            { icon: Sparkles, title: "Modern Experience", desc: "Glassmorphism, gradients, and fluid motion — designed to feel premium on every screen.", color: "from-warning to-accent" },
          ].map((f, i) => (
            <div key={f.title} className="glow-card p-6 animate-fade-up group" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14 animate-fade-up">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="text-muted-foreground text-lg">Three simple steps from upload to shortlist.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          {[
            { step: "01", title: "Post or apply", desc: "Recruiters publish roles. Candidates upload a PDF resume in one click." },
            { step: "02", title: "Auto-match", desc: "We extract skills and score each candidate against the role with clear reasoning." },
            { step: "03", title: "Decide faster", desc: "Review ranked candidates with rich context, then shortlist or notify in seconds." },
          ].map((s, i) => (
            <div key={s.step} className="glow-card p-7 animate-fade-up relative overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="absolute -right-3 -top-3 text-7xl font-display font-extrabold opacity-10 gradient-text">{s.step}</div>
              <div className="text-xs font-bold tracking-widest text-primary mb-2">STEP {s.step}</div>
              <h3 className="font-display font-bold text-2xl mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-3xl p-12 md:p-16 text-center bg-gradient-hero relative overflow-hidden shadow-[var(--shadow-elegant)]">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0px, transparent 40%), radial-gradient(circle at 80% 80%, white 0px, transparent 40%)" }} />
          <div className="relative z-10 text-white space-y-6">
            <h2 className="font-display text-4xl md:text-5xl font-bold">Ready to revolutionize hiring?</h2>
            <p className="text-white/90 text-lg max-w-xl mx-auto">Join as a candidate or recruiter and explore the full smart matching workflow.</p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button size="lg" onClick={() => navigate("/auth")} className="bg-white text-primary hover:bg-white/90 font-semibold">
                I'm a Candidate <ArrowRight className="ml-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="bg-white/10 text-white border-white/40 hover:bg-white/20 hover:text-white">
                I'm a Recruiter
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="container mx-auto px-4 py-10 text-center text-sm text-muted-foreground space-y-1 border-t border-white/30 mt-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold gradient-text">RecruitPro</span>
        </div>
        <p>Built by <span className="font-semibold text-foreground">Raghavendra G C</span></p>
        <p>© {new Date().getFullYear()} RecruitPro · All rights reserved</p>
      </footer>
    </div>
  );
};

export default Index;
