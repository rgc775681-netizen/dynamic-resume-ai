import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Briefcase, MapPin, ArrowRight, CheckCircle2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Resume { id: string; full_name: string; email: string; phone: string; skills: string[]; experience_years: number; summary: string; }
interface Job { id: string; title: string; company: string; location: string; required_skills: string[]; salary_range: string; experience_years: number; description: string; }

const CandidateDashboard = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState("");
  const [resume, setResume] = useState<Resume | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [appData, setAppData] = useState<Record<string, { status: string; match_score: number; matched_skills: string[]; missing_skills: string[] }>>({});
  const [parsing, setParsing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/auth");
    if (role && role !== "candidate") return navigate("/recruiter");
    if (role === "candidate") loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, loading]);

  const loadAll = async () => {
    const [rRes, jRes, aRes] = await Promise.all([
      supabase.from("resumes").select("*").eq("candidate_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("applications").select("job_id, status, match_score, matched_skills, missing_skills").eq("candidate_id", user!.id),
    ]);
    setResume((rRes.data as Resume | null) ?? null);
    setJobs((jRes.data as Job[]) || []);
    const map: Record<string, { status: string; match_score: number; matched_skills: string[]; missing_skills: string[] }> = {};
    (aRes.data || []).forEach((x: any) => {
      map[x.job_id] = {
        status: x.status || "pending",
        match_score: x.match_score || 0,
        matched_skills: x.matched_skills || [],
        missing_skills: x.missing_skills || [],
      };
    });
    setAppData(map);
    setAppliedIds(new Set(Object.keys(map)));
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it: any) => it.str).join(" ") + "\n\n";
    }
    return text.trim();
  };

  const onPdfSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Only PDF files are accepted"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("PDF must be under 10MB"); return; }
    setExtracting(true);
    try {
      const text = await extractPdfText(file);
      if (text.length < 50) throw new Error("Could not extract text — is this a scanned PDF?");
      toast.success(`Extracted ${text.length.toLocaleString()} characters from PDF`);
      await parseResume(text);
    } catch (err: any) {
      toast.error(err.message || "Failed to read PDF");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const parseResume = async (overrideText?: string) => {
    const text = (overrideText ?? resumeText).trim();
    if (text.length < 50) { toast.error("Resume text too short (50+ chars)."); return; }
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-resume", { body: { resumeText: text } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: saved, error: insErr } = await supabase.from("resumes").insert({
        candidate_id: user!.id, raw_text: text,
        full_name: data.full_name, email: data.email, phone: data.phone,
        skills: data.skills || [], experience_years: data.experience_years || 0,
        education: data.education || [], experience: data.experience || [], summary: data.summary,
      }).select().single();
      if (insErr) throw insErr;
      setResume(saved as Resume);
      setResumeText("");
      toast.success("Resume parsed and saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to parse resume");
    } finally { setParsing(false); }
  };


  const apply = async (job: Job) => {
    if (!resume) { toast.error("Upload a resume first."); return; }
    setApplying(job.id);
    try {
      const { data: scoreData, error } = await supabase.functions.invoke("match-candidate", {
        body: { resume, job },
      });
      if (error) throw error;
      if (scoreData?.error) throw new Error(scoreData.error);

      const score = Math.round(scoreData.match_score || 0);
      // Auto-decision: >=75 shortlist, <40 reject, else pending
      const autoStatus = score >= 75 ? "shortlisted" : score < 40 ? "rejected" : "pending";
      const matched = scoreData.matched_skills || [];
      const missing = scoreData.missing_skills || [];

      const { error: appErr } = await supabase.from("applications").insert({
        job_id: job.id, candidate_id: user!.id, resume_id: resume.id,
        match_score: score,
        match_reasoning: scoreData.reasoning,
        matched_skills: matched,
        missing_skills: missing,
        status: autoStatus,
      });
      if (appErr) throw appErr;
      setAppliedIds(new Set([...appliedIds, job.id]));
      setAppData(prev => ({ ...prev, [job.id]: { status: autoStatus, match_score: score, matched_skills: matched, missing_skills: missing } }));
      const msg = autoStatus === "shortlisted" ? `🎉 Auto-shortlisted! Match: ${score}/100`
        : autoStatus === "rejected" ? `Not a fit (score ${score}/100). Build missing skills and try again.`
        : `Applied! Pending review · Match: ${score}/100`;
      toast.success(msg);
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally { setApplying(null); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="animate-fade-up">
          <h1 className="font-display text-4xl font-bold">Candidate <span className="gradient-text">Dashboard</span></h1>
          <p className="text-muted-foreground mt-1">Upload your resume and let AI find the best matches.</p>
        </div>

        <div className="glow-card p-6 animate-fade-up">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Your Resume
          </h2>
          {resume ? (
            <div className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs uppercase">Name</p><p className="font-semibold">{resume.full_name}</p></div>
                <div><p className="text-muted-foreground text-xs uppercase">Email</p><p className="font-semibold">{resume.email || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs uppercase">Experience</p><p className="font-semibold">{resume.experience_years} years</p></div>
              </div>
              {resume.summary && <p className="text-sm text-muted-foreground italic">"{resume.summary}"</p>}
              <div className="flex flex-wrap gap-1.5">
                {resume.skills?.map(s => <Badge key={s} className="bg-gradient-primary text-white border-0">{s}</Badge>)}
              </div>
              <Button variant="outline" size="sm" onClick={() => setResume(null)}>Upload new resume</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Upload your resume as a PDF. Our AI will extract skills, experience, education, and more — automatically.</p>
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfSelected} />
              <Button variant="hero" type="button" disabled={extracting || parsing} onClick={() => fileInputRef.current?.click()}>
                {extracting ? <><Loader2 className="mr-1 animate-spin" /> Reading PDF...</>
                  : parsing ? <><Sparkles className="mr-1" /> AI Parsing...</>
                  : <><Upload className="mr-1" /> Upload PDF Resume</>}
              </Button>
              <p className="text-xs text-muted-foreground">PDF only · max 10MB</p>
            </div>
          )}
        </div>

        {Object.values(appData).length > 0 && (() => {
          const apps = Object.values(appData);
          const sl = apps.filter(a => a.status === "shortlisted").length;
          const rj = apps.filter(a => a.status === "rejected").length;
          const pd = apps.filter(a => a.status === "pending").length;
          return (
            <div className="grid grid-cols-3 gap-3 animate-fade-up">
              <div className="glow-card p-4 text-center border-success/30">
                <p className="text-xs uppercase text-muted-foreground">Shortlisted</p>
                <p className="text-3xl font-bold text-success">{sl}</p>
              </div>
              <div className="glow-card p-4 text-center">
                <p className="text-xs uppercase text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-warning">{pd}</p>
              </div>
              <div className="glow-card p-4 text-center border-destructive/30">
                <p className="text-xs uppercase text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold text-destructive">{rj}</p>
              </div>
            </div>
          );
        })()}

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Open Positions</h2>
          {jobs.length === 0 ? (
            <div className="glow-card p-8 text-center text-muted-foreground">No open jobs right now.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {jobs.map((job, i) => {
                const applied = appliedIds.has(job.id);
                return (
                  <div key={job.id} className="glow-card p-5 animate-fade-up flex flex-col" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-bold">{job.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1 mb-3">
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.company}</span>
                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.required_skills.slice(0, 5).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    </div>
                    {applied ? (() => {
                      const a = appData[job.id];
                      const st = a?.status || "pending";
                      const score = a?.match_score ?? 0;
                      const matched = a?.matched_skills || [];
                      const missing = a?.missing_skills || [];
                      const total = matched.length + missing.length || 1;
                      const matchedPct = (matched.length / total) * 100;
                      const scoreColor = score >= 75 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
                      return (
                        <div className="space-y-3">
                          {st === "shortlisted" && (
                            <div className="rounded-xl border-2 border-success bg-success/15 p-3 text-center">
                              <p className="text-2xl">🎉</p>
                              <p className="font-display font-bold text-success text-lg">SELECTED</p>
                              <p className="text-xs text-success/80">You've been shortlisted for this role</p>
                            </div>
                          )}
                          {st === "rejected" && (
                            <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-center">
                              <p className="text-2xl">❌</p>
                              <p className="font-display font-bold text-destructive text-lg">REJECTED</p>
                              <p className="text-xs text-destructive/80">Skill match below threshold</p>
                            </div>
                          )}
                          {st === "pending" && (
                            <div className="rounded-xl border-2 border-warning/50 bg-warning/10 p-3 text-center">
                              <p className="text-2xl">⏳</p>
                              <p className="font-display font-bold text-warning text-lg">UNDER REVIEW</p>
                              <p className="text-xs text-muted-foreground">Application submitted</p>
                            </div>
                          )}

                          <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs uppercase text-muted-foreground tracking-wide">AI Match</span>
                              <span className={`text-2xl font-bold ${scoreColor}`}>{score}<span className="text-xs text-muted-foreground">/100</span></span>
                            </div>
                            {/* Skill-gap stacked bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>{matched.length} matched</span>
                                <span>{missing.length} missing</span>
                              </div>
                              <div className="flex h-2.5 rounded-full overflow-hidden bg-destructive/20">
                                <div className="bg-success transition-all" style={{ width: `${matchedPct}%` }} />
                              </div>
                            </div>
                            {matched.length > 0 && (
                              <div>
                                <p className="text-[11px] uppercase text-muted-foreground mb-1">You have</p>
                                <div className="flex flex-wrap gap-1">
                                  {matched.map(s => <Badge key={s} className="bg-success/15 text-success border-0 text-[11px]">✓ {s}</Badge>)}
                                </div>
                              </div>
                            )}
                            {missing.length > 0 && (
                              <div>
                                <p className="text-[11px] uppercase text-muted-foreground mb-1">Skills to learn</p>
                                <div className="flex flex-wrap gap-1">
                                  {missing.map(s => <Badge key={s} variant="outline" className="text-destructive border-destructive/30 text-[11px]">✗ {s}</Badge>)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })() : (
                      <Button variant="hero" disabled={!resume || applying === job.id} onClick={() => apply(job)}>
                        {applying === job.id ? "AI Matching..." : <>Apply with AI <ArrowRight className="ml-1" /></>}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboard;
