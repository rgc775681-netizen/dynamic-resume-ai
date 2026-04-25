import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, DollarSign, ArrowLeft } from "lucide-react";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("jobs").select("*").eq("id", id).maybeSingle().then(({ data }) => setJob(data));
  }, [id]);

  if (!job) return <div className="min-h-screen"><Navbar /><div className="container mx-auto px-4 py-10">Loading...</div></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="mr-1" /> Back</Button>
        <div className="glow-card p-8 animate-fade-up">
          <h1 className="font-display text-4xl font-bold mb-2">{job.title}</h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.company}</span>
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>}
            {job.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary_range}</span>}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {job.required_skills?.map((s: string) => <Badge key={s} className="bg-gradient-primary text-white border-0">{s}</Badge>)}
          </div>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{job.description}</p>
        </div>
      </main>
    </div>
  );
};

export default JobDetail;
