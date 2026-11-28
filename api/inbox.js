
const { ImapFlow } = require("imapflow");

const SUPABASE_URL =
  "https://pmtwrbgjzcxtjdjygxps.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_lyGr71TWY7VpI73wPeJdMg_U6knl2s_";

const MAILBOX = "hello@hawthornedigital.co.uk";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  let client;

  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: authorization
    };

    // Verify Supabase user
    const userResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      { headers }
    );

    if (!userResponse.ok) {
      return res.status(401).json({
        error: "Invalid or expired session"
      });
    }

    const user = await userResponse.json();

    // Verify active staff membership
    const staffResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_staff?user_id=eq.${encodeURIComponent(user.id)}&select=active,role`,
      { headers }
    );

    if (!staffResponse.ok) {
      return res.status(500).json({
        error: "Staff verification failed"
      });
    }

    const staff = await staffResponse.json();

    if (!staff.length || staff[0].active !== true) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    // Verify mailbox permissions
    const permissionResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/mailbox_permissions?user_id=eq.${encodeURIComponent(user.id)}&mailbox=eq.${encodeURIComponent(MAILBOX)}&select=read_access`,
      { headers }
    );

    if (!permissionResponse.ok) {
      return res.status(500).json({
        error: "Permission verification failed"
      });
    }

    const permissions = await permissionResponse.json();

    if (
      !permissions.length ||
      permissions[0].read_access !== true
    ) {
      return res.status(403).json({
        error: "Mailbox access denied"
      });
    }

    // Verify server configuration
    if (
      !process.env.IMAP_HOST ||
      !process.env.IMAP_PASSWORD ||
      process.env.IMAP_USER !== MAILBOX
    ) {
      return res.status(500).json({
        error: "Mailbox configuration is incomplete"
      });
    }

    // Connect securely to Fasthosts
    client = new ImapFlow({
      host: process.env.IMAP_HOST,
      port: Number(process.env.IMAP_PORT || 993),
      secure: true,

      auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASSWORD
      },

      tls: {
        rejectUnauthorized: true
      },

      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      logger: false
    });

    client.on("error", () => {
      console.error("IMAP connection error");
    });

    await client.connect();

    const lock = await client.getMailboxLock(
      "INBOX",
      { readOnly: true }
    );

    const emails = [];

    try {
      const total = client.mailbox.exists;

      if (total > 0) {
        const start = Math.max(1, total - 19);

        for await (const message of client.fetch(
          `${start}:${total}`,
          {
            uid: true,
            envelope: true,
            flags: true,
            internalDate: true
          }
        )) {
          emails.push({
            uid: message.uid,

            subject:
              message.envelope?.subject ||
              "(No subject)",

            from:
              message.envelope?.from || [],

            to:
              message.envelope?.to || [],

            date:
              message.envelope?.date ||
              message.internalDate,

            read:
              message.flags?.has("\\Seen") || false
          });
        }
      }

      emails.reverse();

      return res.status(200).json({
        success: true,
        mailbox: MAILBOX,
        total,
        uidValidity: String(client.mailbox.uidValidity),
        emails
      });

    } finally {
      lock.release();
    }

  } catch (error) {
    console.error("Inbox API failure", {
      code: error.code || "UNKNOWN"
    });

    return res.status(500).json({
      error: "Unable to connect to or retrieve emails"
    });

  } finally {
    if (client) {
      client.close();
    }
  }
};
