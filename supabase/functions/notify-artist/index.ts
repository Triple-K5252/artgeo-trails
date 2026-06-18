import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  const { record } = await req.json();

  // Only fire when status changes to approved or rejected
  if (!["approved", "rejected"].includes(record.status)) {
    return new Response("skipped", { status: 200 });
  }

  const isApproved = record.status === "approved";

  const emailBody = isApproved
    ? `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ArtGeo Trails</h1>
          <p style="color: #fed7aa; margin: 4px 0 0; font-size: 13px;">GIS-Powered Art & Tourism Platform</p>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <h2 style="color: #166534; margin-top: 0;">🎉 Your artwork has been approved!</h2>
          <p style="color: #475569;">Dear <strong>${record.artist_name}</strong>,</p>
          <p style="color: #475569;">We're excited to inform you that your artwork <strong>"${record.artwork_title}"</strong> has been <strong style="color: #16a34a;">approved</strong> and is now live on the ArtGeo Trails marketplace.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #166534; font-weight: 600;">What this means for you:</p>
            <ul style="color: #166534; margin: 8px 0 0; padding-left: 20px;">
              <li>Your work is now visible to tourists and art buyers exploring Nairobi</li>
              <li>Interested buyers can contact you directly through the platform</li>
              <li>Your artwork appears on our interactive GIS map</li>
              <li>You gain visibility across Nairobi's cultural tourism scene</li>
            </ul>
          </div>

          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #9a3412; font-weight: 600;">Your submission details:</p>
            <p style="margin: 4px 0; color: #7c3aed; font-size: 14px;">🎨 Artwork: ${record.artwork_title}</p>
            <p style="margin: 4px 0; color: #7c3aed; font-size: 14px;">🖌️ Type: ${record.art_type}</p>
            <p style="margin: 4px 0; color: #7c3aed; font-size: 14px;">📍 Location: ${record.location || "Nairobi"}</p>
          </div>

          <p style="color: #475569;">Buyers and tourists who discover your work will reach out to you directly at this email address. Make sure to respond promptly to inquiries.</p>
          
          <a href="https://artgeo-trails.vercel.app" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            View Your Art on ArtGeo Trails →
          </a>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            ArtGeo Trails · Nairobi, Kenya · GIS-Powered Art & Tourism Platform
          </p>
        </div>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ArtGeo Trails</h1>
          <p style="color: #fed7aa; margin: 4px 0 0; font-size: 13px;">GIS-Powered Art & Tourism Platform</p>
        </div>
        <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <h2 style="color: #991b1b; margin-top: 0;">Artwork submission update</h2>
          <p style="color: #475569;">Dear <strong>${record.artist_name}</strong>,</p>
          <p style="color: #475569;">Thank you for submitting your artwork <strong>"${record.artwork_title}"</strong> to ArtGeo Trails.</p>
          <p style="color: #475569;">After review, we were unable to approve this submission for our marketplace at this time.</p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">Common reasons for rejection:</p>
            <ul style="color: #991b1b; margin: 8px 0 0; padding-left: 20px;">
              <li>Image quality does not meet our standards</li>
              <li>Incomplete submission information</li>
              <li>Artwork does not align with our platform focus</li>
            </ul>
          </div>

          <p style="color: #475569;">You are welcome to submit again with an updated submission. We encourage you to review our guidelines and reapply.</p>

          <a href="https://artgeo-trails.vercel.app" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Submit Again →
          </a>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            ArtGeo Trails · Nairobi, Kenya · GIS-Powered Art & Tourism Platform
          </p>
        </div>
      </div>
    `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ArtGeo Trails <notifications@yourdomain.com>",
      to: [record.email],
      subject: isApproved
        ? `🎉 Your artwork "${record.artwork_title}" is now live on ArtGeo Trails!`
        : `Update on your ArtGeo Trails submission: ${record.artwork_title}`,
      html: emailBody,
    }),
  });

  const data = await res.json();
  console.log("Resend response:", data);

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});