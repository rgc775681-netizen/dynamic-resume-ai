import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

interface Body {
  to: string;
  candidateName: string;
  jobTitle: string;
  company: string;
  status: "shortlisted" | "rejected" | "pending";
  matchScore: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  reasoning?: string;
}

const renderEmail = (b: Body) => {
  const isShortlisted = b.status === "shortlisted";
  const isRejected = b.status === "rejected";
  const headlineColor = isShortlisted ? "#10b981" : isRejected ? "#ef4444" : "#6366f1";
  const headline = isShortlisted
    ? "🎉 You've been shortlisted!"
    : isRejected
    ? "Application update"
    : "Application received";
  const intro = isShortlisted
    ? `Great news! Your profile is a strong match for <b>${b.jobTitle}</b> at <b>${b.company}</b>. The recruiter will reach out shortly.`
    : isRejected
    ? `Thanks for applying to <b>${b.jobTitle}</b> at <b>${b.company}</b>. Unfortunately your profile didn't meet the minimum match threshold this time — but the skills below will help you get there.`
    : `Your application to <b>${b.jobTitle}</b> at <b>${b.company}</b> is under review.`;

  const subject = isShortlisted
    ? `🎉 Shortlisted: ${b.jobTitle} at ${b.company}`
    : isRejected
    ? `Application update: ${b.jobTitle} at ${b.company}`
    : `Application received: ${b.jobTitle} at ${b.company}`;

  const matched = (b.matchedSkills || []).map(s =>
    `<span style="display:inline-block;background:#ecfdf5;color:#047857;padding:4px 10px;border-radius:999px;font-size:12px;margin:2px 4px 2px 0;">✓ ${s}</span>`
  ).join("");
  const missing = (b.missingSkills || []).map(s =>
    `<span style="display:inline-block;background:#fef2f2;color:#b91c1c;padding:4px 10px;border-radius:999px;font-size:12px;margin:2px 4px 2px 0;">✗ ${s}</span>`
  ).join("");

  const html = `
<!DOCTYPE html>
<html><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
        <tr><td style="padding:32px 40px 16px;">
          <div style="font-size:13px;letter-spacing:1px;color:#64748b;text-transform:uppercase;font-weight:600;">ResumeAI · Hire Smarter</div>
        </td></tr>
        <tr><td style="padding:0 40px;">
          <h1 style="margin:8px 0 16px;font-size:26px;line-height:1.25;color:${headlineColor};">${headline}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">Hi ${b.candidateName || "there"},</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">${intro}</p>

          <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
            <div style="font-size:11px;letter-spacing:1.5px;color:#64748b;text-transform:uppercase;font-weight:600;">AI Match Score</div>
            <div style="font-size:48px;font-weight:800;color:${headlineColor};line-height:1;margin-top:6px;">${b.matchScore}<span style="font-size:20px;color:#94a3b8;font-weight:600;">/100</span></div>
          </div>

          ${matched ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Skills Matched</div>${matched}</div>` : ""}
          ${missing ? `<div style="margin-bottom:18px;"><div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Skills To Build</div>${missing}</div>` : ""}
          ${b.reasoning ? `<div style="background:#faf5ff;border-left:3px solid #a855f7;padding:14px 16px;border-radius:8px;margin:18px 0;"><div style="font-size:11px;font-weight:700;color:#7e22ce;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">AI Reasoning</div><div style="font-size:14px;color:#475569;line-height:1.5;font-style:italic;">"${b.reasoning}"</div></div>` : ""}

          <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">This is an automated double-verification email so you don't need to log in to check your status.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #e2e8f0;margin-top:24px;">
          <div style="font-size:12px;color:#94a3b8;text-align:center;">© ResumeAI · Intelligent talent matching</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, html };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const body = (await req.json()) as Body;
    if (!body?.to || !body?.jobTitle || !body?.company || typeof body?.matchScore !== "number") {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = renderEmail(body);

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "ResumeAI <onboarding@resend.dev>",
        to: [body.to],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error", res.status, data);
      throw new Error(`Resend failed [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("send-application-email error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
