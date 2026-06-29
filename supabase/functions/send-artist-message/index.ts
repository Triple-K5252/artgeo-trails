import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  const {
    artist_email,
    sender_name,
    sender_email,
    message,
  } = await req.json();

  console.log("Incoming message:", {
    artist_email,
    sender_name,
    sender_email,
    message,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ArtGeo Trails <onboarding@resend.dev>",
      to: ["kelvinkama5252@gmail.com"],
      subject: "New Artwork Inquiry",
      html: `
        <h2>New Inquiry About Your Artwork</h2>

        <p><strong>Name:</strong> ${sender_name}</p>
        <p><strong>Email:</strong> ${sender_email}</p>

        <p><strong>Message:</strong></p>
        <p>${message}</p>

        <hr>

        <p>You can reply directly to ${sender_email}</p>
      `,
    }),
  });

  const data = await res.json();

  console.log("Resend response:", data);

  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status: 200,
  });
});