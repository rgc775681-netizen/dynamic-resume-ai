import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, MapPin, DollarSign, Users, Sparkles, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

interface Job { id: string; title: string; company: string; location: string; description: string; required_skills: string[]; experience_years: number; salary_range: string; created_at: string; }
interface AppRow { id: string; job_id: string; match_score: number; status: string; matched_skills: string[]; missing_skills: string[]; match_reasoning: string; candidate_id: string; resumes: { full_name: string; email: string; skills: string[]; experience_years: number } | null; }

const RecruiterDashboard = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Record<string, AppRow[]>>({});
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", location: "", description: "", required_skills: "", experience_years: "0", salary_range: "" });

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/auth");
    if (role && role !== "recruiter") return navigate("/candidate");
    if (role === "recruiter") loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, loading]);

  const loadJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("recruiter_id", user!.id).order("created_at", { ascending: false });
    setJobs((data as Job[]) || []);
    if (data && data.length) {
      const { data: appData } = await supabase
        .from("applications")
        .select("*, resumes(full_name, email, skills, experience_years)")
        .in("job_id", data.map(j => j.id))
        .order("match_score", { ascending: false });
      const grouped: Record<string, AppRow[]> = {};
      (appData || []).forEach((a: any) => { (grouped[a.job_id] ||= []).push(a); });
      setApps(grouped);
    }
  };

  const createJob = async () => {
    if (!form.title || !form.company || !form.description) { toast.error("Title, company and description are required"); return; }
    setBusy(true);
    const skills = form.required_skills.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("jobs").insert({
      recruiter_id: user!.id, title: form.title, company: form.company, location: form.location,
      description: form.description, required_skills: skills,
      experience_years: parseInt(form.experience_years) || 0, salary_range: form.salary_range,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Job posted!");
    setOpen(false);
    setForm({ title: "", company: "", location: "", description: "", required_skills: "", experience_years: "0", salary_range: "" });
    loadJobs();
  };

  // Status is decided automatically by the AI match score on apply.

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-4xl font-bold">Recruiter <span className="gradient-text">Dashboard</span></h1>
            <p className="text-muted-foreground mt-1">Manage jobs and review AI-ranked candidates.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="hero" size="lg"><Plus className="mr-1" /> Post Job</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-2xl">Post a New Job</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Senior Backend Engineer" /></div>
                  <div><Label>Company *</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Corp" /></div>
                  <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Remote · Bangalore" /></div>
                  <div><Label>Min experience (years)</Label><Input type="number" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} /></div>
                </div>
                <div><Label>Required skills (comma separated)</Label><Input value={form.required_skills} onChange={e => setForm({ ...form, required_skills: e.target.value })} placeholder="Python, PostgreSQL, AWS" /></div>
                <div><Label>Salary range</Label><Input value={form.salary_range} onChange={e => setForm({ ...form, salary_range: e.target.value })} placeholder="$80k - $120k" /></div>
                <div><Label>Description *</Label><Textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will the candidate do?" /></div>
                <Button variant="hero" className="w-full" disabled={busy} onClick={createJob}>{busy ? "Posting..." : "Post Job"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {jobs.length === 0 ? (
          <div className="glow-card p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-xl font-bold mb-2">No jobs yet</h3>
            <p className="text-muted-foreground">Post your first job to start receiving AI-ranked applications.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job, i) => (
              <div key={job.id} className="glow-card p-6 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-display text-2xl font-bold">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.company}</span>
                      {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                      {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salary_range}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(apps[job.id] || []).length} applicants</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {job.required_skills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>

                <div className="border-t pt-4 mt-2">
                  <h4 className="font-semibold mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> AI-Ranked Candidates</h4>
                  {(apps[job.id] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No applications yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {(apps[job.id] || []).map(a => {
                        const status = a.status || "pending";
                        return (
                        <div key={a.id} className="p-4 rounded-xl bg-muted/40 border border-border">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-semibold">{a.resumes?.full_name || "Candidate"}</p>
                                <p className="text-xs text-muted-foreground">{a.resumes?.email} · {a.resumes?.experience_years || 0} yrs</p>
                              </div>
                              {status === "shortlisted" && <Badge className="bg-success/15 text-success border-0"><Check className="w-3 h-3 mr-0.5" /> Shortlisted</Badge>}
                              {status === "rejected" && <Badge variant="outline" className="text-destructive border-destructive/30"><X className="w-3 h-3 mr-0.5" /> Rejected</Badge>}
                              {status === "pending" && <Badge variant="secondary"><Clock className="w-3 h-3 mr-0.5" /> Pending</Badge>}
                            </div>
                            <div className="text-right">
                              <div className={`text-3xl font-bold ${a.match_score >= 75 ? "text-success" : a.match_score >= 50 ? "text-warning" : "text-destructive"}`}>{a.match_score}</div>
                              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">match</div>
                            </div>
                          </div>
                          {a.match_reasoning && <p className="text-sm text-muted-foreground mb-2 italic">"{a.match_reasoning}"</p>}
                          {a.matched_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {a.matched_skills.map(s => <Badge key={s} className="bg-success/15 text-success hover:bg-success/20 border-0">✓ {s}</Badge>)}
                            </div>
                          )}
                          {a.missing_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {a.missing_skills.map(s => <Badge key={s} variant="outline" className="text-destructive border-destructive/30">✗ {s}</Badge>)}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                            {status !== "shortlisted" && (
                              <Button size="sm" variant="hero" onClick={() => updateStatus(a.id, job.id, "shortlisted")}>
                                <Check className="w-4 h-4 mr-1" /> Shortlist
                              </Button>
                            )}
                            {status !== "rejected" && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, job.id, "rejected")}>
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            )}
                            {status !== "pending" && (
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(a.id, job.id, "pending")}>
                                Reset
                              </Button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default RecruiterDashboard;
