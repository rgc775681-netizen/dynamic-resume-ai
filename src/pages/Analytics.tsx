import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Briefcase, Users, Target, TrendingUp, Award, Activity } from "lucide-react";

interface Job { id: string; title: string; status: string; required_skills: string[]; created_at: string; }
interface AppRow {
  id: string; job_id: string; match_score: number; status: string;
  matched_skills: string[]; created_at: string;
  resumes: { skills: string[]; experience_years: number } | null;
  jobs?: { title: string };
}

const PALETTE = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--secondary))"];

const KPI = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <div className="glow-card p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="font-display text-3xl font-bold">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

const Analytics = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/auth");
    if (role && role !== "recruiter") return navigate("/candidate");
    if (role === "recruiter") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, loading]);

  const load = async () => {
    const { data: jobsData } = await supabase.from("jobs").select("*").eq("recruiter_id", user!.id);
    const j = (jobsData as Job[]) || [];
    setJobs(j);
    if (j.length) {
      const { data: appData } = await supabase
        .from("applications")
        .select("*, resumes(skills, experience_years), jobs(title)")
        .in("job_id", j.map(x => x.id));
      setApps((appData as AppRow[]) || []);
    }
    setReady(true);
  };

  const stats = useMemo(() => {
    const totalApps = apps.length;
    const avgScore = totalApps ? Math.round(apps.reduce((a, b) => a + (b.match_score || 0), 0) / totalApps) : 0;
    const strong = apps.filter(a => a.match_score >= 75).length;
    const openJobs = jobs.filter(j => j.status === "open").length;

    // skill demand from job postings
    const demand: Record<string, number> = {};
    jobs.forEach(j => j.required_skills?.forEach(s => { demand[s] = (demand[s] || 0) + 1; }));
    const topDemand = Object.entries(demand).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));

    // skill supply from candidates
    const supply: Record<string, number> = {};
    apps.forEach(a => a.resumes?.skills?.forEach(s => { supply[s] = (supply[s] || 0) + 1; }));
    const topSupply = Object.entries(supply).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));

    // score distribution
    const buckets = [
      { range: "0-25", count: 0, fill: "hsl(var(--destructive))" },
      { range: "26-50", count: 0, fill: "hsl(var(--warning))" },
      { range: "51-75", count: 0, fill: "hsl(var(--accent))" },
      { range: "76-100", count: 0, fill: "hsl(var(--success))" },
    ];
    apps.forEach(a => {
      const s = a.match_score || 0;
      if (s <= 25) buckets[0].count++;
      else if (s <= 50) buckets[1].count++;
      else if (s <= 75) buckets[2].count++;
      else buckets[3].count++;
    });

    // applications per job
    const perJob: Record<string, { name: string; applications: number; avg: number; total: number }> = {};
    apps.forEach(a => {
      const t = a.jobs?.title || "Job";
      perJob[a.job_id] ||= { name: t.slice(0, 18), applications: 0, avg: 0, total: 0 };
      perJob[a.job_id].applications++;
      perJob[a.job_id].total += a.match_score || 0;
    });
    const jobBreakdown = Object.values(perJob).map(p => ({ ...p, avg: Math.round(p.total / p.applications) }));

    // applications over time (last 14 days)
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().slice(5, 10)] = 0;
    }
    apps.forEach(a => {
      const k = new Date(a.created_at).toISOString().slice(5, 10);
      if (k in days) days[k]++;
    });
    const timeline = Object.entries(days).map(([date, count]) => ({ date, count }));

    // status pie
    const statusCounts: Record<string, number> = {};
    apps.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { totalApps, avgScore, strong, openJobs, topDemand, topSupply, buckets, jobBreakdown, timeline, statusData };
  }, [jobs, apps]);

  if (!ready) return <div className="min-h-screen"><Navbar /><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading analytics...</div></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="animate-fade-up">
          <h1 className="font-display text-4xl font-bold">Hiring <span className="gradient-text">Analytics</span></h1>
          <p className="text-muted-foreground mt-1">Real-time insights from your jobs & AI-matched candidates.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI icon={Briefcase} label="Open Jobs" value={stats.openJobs} sub={`${jobs.length} total`} />
          <KPI icon={Users} label="Applications" value={stats.totalApps} />
          <KPI icon={Target} label="Avg Match" value={`${stats.avgScore}`} sub="out of 100" />
          <KPI icon={Award} label="Strong Fits" value={stats.strong} sub="≥ 75 score" />
        </div>

        {apps.length === 0 ? (
          <div className="glow-card p-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-xl font-bold mb-2">No data yet</h3>
            <p className="text-muted-foreground">Post jobs and receive applications to unlock insights.</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glow-card p-6">
                <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Applications (last 14 days)</h3>
                <p className="text-xs text-muted-foreground mb-4">Daily inflow trend</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={stats.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glow-card p-6">
                <h3 className="font-display text-lg font-bold mb-1">Match Score Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">How well candidates fit your jobs</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.buckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {stats.buckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glow-card p-6">
                <h3 className="font-display text-lg font-bold mb-1">Top Skills in Demand</h3>
                <p className="text-xs text-muted-foreground mb-4">Most-requested skills across your jobs</p>
                {stats.topDemand.length === 0 ? <p className="text-sm text-muted-foreground">No skills listed.</p> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.topDemand} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis dataKey="skill" type="category" width={90} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="glow-card p-6">
                <h3 className="font-display text-lg font-bold mb-1">Top Skills in Candidate Pool</h3>
                <p className="text-xs text-muted-foreground mb-4">Most common skills among applicants</p>
                {stats.topSupply.length === 0 ? <p className="text-sm text-muted-foreground">No skills yet.</p> : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {stats.topSupply.map((s, i) => (
                      <Badge key={s.skill} className="bg-gradient-primary text-white border-0 text-sm py-1.5 px-3" style={{ opacity: 1 - i * 0.07 }}>
                        {s.skill} <span className="ml-1.5 opacity-80">×{s.count}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="glow-card p-6 lg:col-span-2">
                <h3 className="font-display text-lg font-bold mb-1">Applications & Avg Match per Job</h3>
                <p className="text-xs text-muted-foreground mb-4">Performance breakdown</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.jobBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avg" name="avg match" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glow-card p-6">
                <h3 className="font-display text-lg font-bold mb-1">Pipeline Status</h3>
                <p className="text-xs text-muted-foreground mb-4">Application states</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {stats.statusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;
