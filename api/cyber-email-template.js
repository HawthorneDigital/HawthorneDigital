
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

export function cyberEmailTemplate(name, code) {
  const customer = escapeHtml(name);
  const promoCode = escapeHtml(code);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:32px 12px;background:#f3f3f3;font-family:Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0"
    style="max-width:600px;width:100%;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:#111111;padding:35px 25px;text-align:center;">
        <img src="https://www.hawthornedigital.co.uk/Hawthorne-Digital-logo.png"
          alt="Hawthorne Digital" width="190"
          style="max-width:100%;height:auto;">
        <h1 style="color:#ffdc35;font-size:30px;margin:30px 0 8px;">
          CYBER MONDAY
        </h1>
        <p style="color:#ffffff;font-size:23px;font-weight:bold;margin:0;">
          50% OFF
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:35px 30px;text-align:center;">
        <h2 style="color:#202b4c;">Hi ${customer}!</h2>
        <p style="color:#444;line-height:1.7;">
          Thanks for your interest in Hawthorne Digital.
          Your exclusive Cyber Monday discount code is ready!
        </p>
        <p style="font-weight:bold;margin-top:28px;">
          YOUR UNIQUE DISCOUNT CODE
        </p>
        <div style="background:#ffdc35;color:#111;padding:18px 12px;border-radius:8px;font-size:24px;font-weight:bold;letter-spacing:1px;">
          ${promoCode}
        </div>
        <p style="color:#555;line-height:1.7;">
          Quote this code when contacting our team to claim
          50% off eligible web design packages.
        </p>
        <a href="https://www.hawthornedigital.co.uk/contact"
          style="display:inline-block;margin-top:15px;background:#111;color:#fff;text-decoration:none;padding:15px 28px;border-radius:6px;font-weight:bold;">
          Claim Your Offer
        </a>
      </td>
    </tr>
    <tr>
      <td style="background:#f5f5f5;padding:24px;text-align:center;color:#666;font-size:12px;line-height:1.7;">
        Hawthorne Digital<br>
        Premium Websites Without the Premium Price<br>
        www.hawthornedigital.co.uk<br><br>
        Terms and conditions apply. Offer applies to eligible
        web design packages only. Discount subject to verification.
      </td>
    </tr>
  </table>
</body>
</html>`;
}
