export default async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        email = "",
        website = "",
        companyFax = ""
    } = req.body || {};

    // Basic spam protection
    if (companyFax) {
        return res.status(400).json({
            error: "Invalid request."
        });
    }

    // Validate submitted details
    if (
        typeof email !== "string" ||
        typeof website !== "string" ||
        email.length > 254 ||
        website.length > 2048 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        return res.status(400).json({
            error: "Please enter a valid email and website."
        });
    }

    const customerEmail = email.trim().toLowerCase();

    // Validate website URL
    let websiteUrl;

    try {

        const address = website.trim();

        websiteUrl = new URL(
            /^[a-z][a-z0-9+.-]*:/i.test(address)
                ? address
                : "https://" + address
        );

        if (
            !["http:", "https:"].includes(websiteUrl.protocol) ||
            !websiteUrl.hostname.includes(".") ||
            websiteUrl.username ||
            websiteUrl.password
        ) {
            throw new Error("Invalid URL");
        }

    } catch {

        return res.status(400).json({
            error: "Please enter a valid website address."
        });

    }

    // Check Resend configuration
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {

        console.error("Missing RESEND_API_KEY");

        return res.status(500).json({
            error: "Email service is not configured."
        });

    }

    // Send email notification
    try {

        const response = await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${resendKey}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    from: "Hawthorne Digital <no-reply@hawthornedigital.co.uk>",

                    to: [
                        "hello@hawthornedigital.co.uk"
                    ],

                    reply_to: customerEmail,

                    subject: "New Free Website Health Check Request",

                    text: `
NEW WEBSITE HEALTH CHECK REQUEST

A customer has requested a free website health check.

Customer Email:
${customerEmail}

Website Address:
${websiteUrl.href}

Request Received:
${new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London"
})}

Please review the customer's website and contact
them with their health check findings.

----------------------------------------

Hawthorne Digital
Premium Websites Without the Premium Price
www.hawthornedigital.co.uk
                    `.trim()

                })
            }
        );

        if (!response.ok) {

            const details = await response.text();

            console.error(
                "Resend email error:",
                response.status,
                details
            );

            return res.status(502).json({
                error: "Unable to send email notification."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Your health check request has been received."
        });

    } catch (error) {

        console.error(
            "Website health check error:",
            error.message
        );

        return res.status(500).json({
            error: "Unable to process your request."
        });

    }

}
