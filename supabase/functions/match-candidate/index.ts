import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resume, job } = await req.json();
    if (!resume || !job) {
      return new Response(JSON.stringify({ error: "resume and job are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Score this candidate for the job (0-100) based on skills, experience, and overall fit.

JOB:
Title: ${job.title}
Company: ${job.company}
Required skills: ${(job.required_skills || []).join(", ")}
Min experience: ${job.experience_years || 0} years
Description: ${job.description}

CANDIDATE:
Name: ${resume.full_name}
Skills: ${(resume.skills || []).join(", ")}
Experience: ${resume.experience_years || 0} years
Summary: ${resume.summary || ""}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert technical recruiter. Be objective and concise." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_match",
            description: "Score the candidate-job fit",
            parameters: {
              type: "object",
              properties: {
                match_score: { type: "number", description: "0-100 fit score" },
                reasoning: { type: "string", description: "2-3 sentence explanation" },
                matched_skills: { type: "array", items: { type: "string" } },
                missing_skills: { type: "array", items: { type: "string" } },
              },
              required: ["match_score", "reasoning", "matched_skills", "missing_skills"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_match" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No structured output");
    return new Response(args, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("match-candidate error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
