import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const GOAL = 5000;

async function readCountSafe() {
  try {
    return 0; // fallback, protože na Vercelu se do FS neukládá
  } catch (e) {
    console.log('readCount failed:', e);
    return 0;
  }
}

async function writeCountSafe(_count) {
  try {
    return true; // zatím jen noop
  } catch (e) {
    console.log('writeCount failed:', e);
    return false;
  }
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    console.log("Received email request for:", email);
    console.log("Using API Key:", process.env.RESEND_API_KEY ? "Loaded" : "Missing");

    // Define URLs for website & socials (fixed)
    const siteUrl = 'https://sndchain.xyz/';
    const xUrl = 'https://x.com/joinsoundchain';
    const igUrl = 'https://www.instagram.com/joinsoundchain/?utm_source=ig_web_button_share_sheet';

    const result = await resend.emails.send({
      from: 'SoundChain <noreply@sndchain.xyz>',
      to: email,
      subject: 'Welcome to SoundChain - We’re excited to have you on board',
      html: getWelcomeEmailHtml(siteUrl, xUrl, igUrl),
    });

    console.log('Resend API response:', result);

    if (result?.error) {
      return new Response(
        JSON.stringify({ ok: false, error: result.error }),
        { status: 422, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
      );
    }

    // increment signup counter on success using safe functions
    let current = 0;
    try {
      current = await readCountSafe();
    } catch (e) {
      console.log('readCountSafe failed:', e);
      current = 0;
    }
    try {
      await writeCountSafe(current + 1);
    } catch (e) {
      console.log('writeCountSafe failed:', e);
    }

    return new Response(
      JSON.stringify({ ok: true, id: result?.data?.id, count: current + 1, goal: GOAL }),
      { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ ok: false, message: error?.message || 'send_failed' }),
      { status: 500, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
    );
  }
}

// Publicly reachable PNGs (update to your URLs when you deploy)
function getWelcomeEmailHtml(siteUrl, xUrl, igUrl) {
  // Publicly reachable PNGs (update to your URLs when you deploy)
  const LOGO_PNG = 'https://sndchain.xyz/email/logo-72.png';
  const X_PNG    = 'https://sndchain.xyz/email/x-32.png';
  const IG_PNG   = 'https://sndchain.xyz/email/ig-32.png';

  return `
  <span style="color:transparent;display:none;opacity:0;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;">
    Welcome to SoundChain! We’re excited to have you on board.
  </span>
  <div style="margin:0;padding:0;background:#0b0712;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,'Noto Sans',sans-serif;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0;padding:24px 0;background:#0b0712;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" border="0" cellspacing="0" cellpadding="0" style="border-radius:22px;overflow:hidden;background:#120a1b;">
            <!-- Header gradient bar to echo site background -->
            <tr>
              <td height="8" style="background: radial-gradient(120% 140% at 20% 10%, #2a0f63 0%, rgba(42,15,99,0) 40%), radial-gradient(120% 140% at 80% 15%, #6d1bb6 0%, rgba(109,27,182,0) 45%), radial-gradient(120% 140% at 50% 90%, #0ea5e9 0%, rgba(14,165,233,0) 45%), linear-gradient(180deg,#130a20 0%, #0b0712 100%);"></td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 32px 8px 32px;">
                <img src="${LOGO_PNG}" width="72" height="72" alt="SoundChain" style="display:block;border:0;border-radius:16px;background:#0b0b0f;">
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 32px;">
                <h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:800;letter-spacing:-.3px;color:#ffffff;">Welcome to SoundChain!</h1>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:14px 32px 0 32px;">
                <p style="margin:0;font-size:16px;line-height:1.65;color:#d1d5db;">Thanks for signing up! We're excited to have you with us on the journey to a new music era. We'll keep you posted about launch updates and early access perks.</p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:22px 32px 0 32px;">
                <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;border-radius:12px;padding:14px 28px;font-weight:700;font-size:16px;letter-spacing:.02em;color:#ffffff;background:linear-gradient(90deg,#7c3aed 0%, #9333ea 30%, #4f46e5 65%, #06b6d4 100%); box-shadow:0 6px 22px rgba(124,58,237,.35);">Visit SoundChain</a>
              </td>
            </tr>

            <!-- Divider that matches the dark theme -->
            <tr>
              <td style="padding:28px 32px 0 32px;"><hr style="border:none;border-top:1px solid #241a36;margin:0;"></td>
            </tr>

            <tr>
              <td align="center" style="padding:14px 32px 8px 32px;">
                <p style="margin:0;font-size:14px;color:#a1a1aa;">Follow us</p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:4px 0 26px 0;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding:0 10px;">
                      <a href="${xUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;">
                        <img src="${X_PNG}" width="32" height="32" alt="X (Twitter)" style="display:block;border:0;">
                      </a>
                    </td>
                    <td align="center" style="padding:0 10px;">
                      <a href="${igUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;">
                        <img src="${IG_PNG}" width="32" height="32" alt="Instagram" style="display:block;border:0;">
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 32px 32px 32px;color:#9ca3af;">
                <p style="margin:0;font-size:12px;">&copy; ${new Date().getFullYear()} SoundChain. All rights reserved.</p>
                <p style="margin:6px 0 0 0;font-size:12px;"><a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="color:#67e8f9;text-decoration:none;">sndchain.xyz</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function GET() {
  try {
    const count = await readCountSafe();
    return new Response(
      JSON.stringify({ count, goal: GOAL }),
      { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ count: 0, goal: GOAL }),
      { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }
    );
  }
}