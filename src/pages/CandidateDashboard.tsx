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
    if (file.type !== "application/pdf") { toast.error("Please upload a PDF file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("PDF must be under 10MB"); return; }
    setExtracting(true);
    try {
      const text = await extractPdfText(file);
      if (text.length < 50) throw new Error("Could not extract text — is this a scanned PDF?");
      setResumeText(text);
      toast.success(`Extracted ${text.length.toLocaleString()} characters from PDF`);
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
              <p className="text-sm text-muted-foreground">Upload a PDF resume or paste text. Our AI will extract skills, experience, education, and more.</p>
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfSelected} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={extracting || parsing} onClick={() => fileInputRef.current?.click()}>
                  {extracting ? <><Loader2 className="mr-1 animate-spin" /> Reading PDF...</> : <><Upload className="mr-1" /> Upload PDF</>}
                </Button>
                <span className="text-xs text-muted-foreground self-center">— or paste text below —</span>
              </div>
              <Textarea rows={10} value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder={"John Doe\njohn@example.com · +1 555 0123\n\nEXPERIENCE\nSenior Engineer at Acme (2020-2024)\n- Built scalable APIs in Python and PostgreSQL..."} />
              <Button variant="hero" disabled={parsing || extracting} onClick={() => parseResume()}>
                <Sparkles className="mr-1" /> {parsing ? "AI Parsing..." : "Parse with AI"}
              </Button>
            </div>
          )}
        </div>

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
                    {applied ? (
                      (() => {
                        const st = appStatuses[job.id] || "pending";
                        if (st === "shortlisted") return <Button disabled className="bg-success/15 text-success border-0 hover:bg-success/15"><CheckCircle2 className="mr-1" /> Shortlisted 🎉</Button>;
                        if (st === "rejected") return <Button disabled variant="outline" className="text-destructive border-destructive/30">Not selected</Button>;
                        return <Button disabled variant="outline"><CheckCircle2 className="mr-1 text-success" /> Applied · Pending review</Button>;
                      })()
                    ) : (
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
