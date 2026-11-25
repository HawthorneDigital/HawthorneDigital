export default async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");

    // Only allow POST requests
    if (req.method !== "POST") {

        res.setHeader("Allow", "POST");

        return res.status(405).json({
            error: "Method not allowed"
        });

    }

    // Retrieve submitted form details
    const {
        email = "",
        website = ""
    } = req.body || {};

    // Validate customer email
    if (
        typeof email !== "string" ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {

        return res.status(400).json({
            error: "Please enter a valid email address."
        });

    }

    const customerEmail = email.trim().toLowerCase();

    // Validate website address
    if (
        typeof website !== "string" ||
        !website.trim() ||
        website.length > 2048
    ) {

        return res.status(400).json({
            error: "Please enter a valid website address."
        });

    }

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

            throw new Error("Invalid website address");

        }

    } catch {

        return res.status(400).json({
            error: "Please enter a valid website address."
        });

    }

    // Retrieve Resend API key
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {

        console.error("Missing RESEND_API_KEY");

        return res.status(500).json({
            error: "Email service is not configured."
        });

    }

    // Generate request timestamp
    const requestDate = new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London"
    });

    // Send email through Resend
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

                    subject: "New Website Health Check Request",

                    text: `
HAWTHORNE DIGITAL

NEW WEBSITE HEALTH CHECK REQUEST

A customer has submitted a request for a free website health check through the Hawthorne Digital website.

----------------------------------------

CUSTOMER DETAILS

Email Address:
${customerEmail}

Website Address:
${websiteUrl.href}

Date and Time Received:
${requestDate}

----------------------------------------

NEXT STEPS

Please review the customer's website, including:

- Website performance
- Mobile responsiveness
- Search engine optimisation
- Accessibility
- Website security
- Design and user experience

Once the review has been completed, please contact the customer using the email address provided.

You can reply directly to this email to contact the customer.

----------------------------------------

This is an automated notification from the Hawthorne Digital Website Health Check System.

Hawthorne Digital
Premium Websites Without the Premium Price

www.hawthornedigital.co.uk
hello@hawthornedigital.co.uk
                    `.trim()

                })

            }
        );

        // Handle Resend errors
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

        console.log(
            "Website health check request sent successfully."
        );

        // Return successful response
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
