
import { randomBytes } from "node:crypto";
import { cyberEmailTemplate } from "./cyber-email-template.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;

function respond(res, status, data) {
  return res.status(status).json(data);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Database error: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return respond(res, 405, {
      error: "Method not allowed."
    });
  }

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    return respond(res, 500, {
      error: "Server configuration incomplete."
    });
  }

  const origin = req.headers.origin;

  if (
    origin &&
    new URL(origin).hostname !== "hawthornedigital.co.uk" &&
    new URL(origin).hostname !== "www.hawthornedigital.co.uk" &&
    !new URL(origin).hostname.endsWith(".vercel.app")
  ) {
    return respond(res, 403, {
      error: "Request not permitted."
    });
  }

  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (
    name.length < 2 ||
    name.length > 100 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return respond(res, 400, {
      error: "Please enter a valid name and email."
    });
  }

  try {
    // Basic per-email rate limit
    const hourAgo = new Date(
      Date.now() - 60 * 60 * 1000
    ).toISOString();

    const query = new URLSearchParams({
      select: "id",
      email: `eq.${email}`,
      created_at: `gte.${hourAgo}`,
      limit: "3"
    });

    const recent = await supabaseRequest(
      `cyber_codes?${query.toString()}`
    );

    if (recent.length >= 3) {
      return respond(res, 429, {
        error: "Too many requests. Please try later."
      });
    }

    const code =
      "CYBER26-" +
      randomBytes(5).toString("hex").toUpperCase();

    const rows = await supabaseRequest(
      "cyber_codes",
      {
        method: "POST",
        headers: {
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          customer_name: name,
          email,
          code,
          status: "pending"
        })
      }
    );

    const record = rows[0];

    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Hawthorne Digital <no-reply@hawthornedigital.co.uk>",
          to: [email],
          subject: "Your Hawthorne Digital Cyber Monday Code",
          html: cyberEmailTemplate(name, code)
        })
      }
    );

    if (!emailResponse.ok) {
      console.error(
        "Email delivery request failed:",
        emailResponse.status
      );

      return respond(res, 502, {
        error: "We couldn't send your email. Please try again."
      });
    }

    await supabaseRequest(
      `cyber_codes?id=eq.${record.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "sent",
          sent_at: new Date().toISOString()
        })
      }
    );

    return respond(res, 200, {
      success: true,
      message: "Your unique code has been emailed."
    });

  } catch (error) {
    console.error("Cyber code error:", error.message);

    return respond(res, 500, {
      error: "Something went wrong. Please try again."
    });
  }
}
