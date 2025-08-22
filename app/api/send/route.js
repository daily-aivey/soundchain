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

// Minimalistic email template that matches the landing page vibe
function getWelcomeEmailHtml(siteUrl, xUrl, igUrl) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Welcome to SoundChain</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="background-color:#ffffff;padding:40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:480px;margin:0 auto;">
        
        <!-- Main Content Card -->
        <tr>
          <td>
            <!-- Gradient Border Wrapper -->
            <div style="background:linear-gradient(135deg,#8B5FFF 0%,#A78BFA 25%,#4FC3F7 50%,#C084FC 75%,#8B5FFF 100%);padding:4px;border-radius:20px;">
              <div style="background-color:#ffffff;border-radius:16px;padding:48px 32px;text-align:center;">
            
            <!-- Logo -->
            <div style="margin-bottom:32px;text-align:center;">
              <div style="width:64px;height:64px;margin:0 auto;background:linear-gradient(135deg,#8B5FFF,#4FC3F7);border-radius:16px;line-height:64px;text-align:center;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-1px;">SC</div>
            </div>
            
            <!-- Main Message -->
            <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:700;color:#000000;letter-spacing:-0.5px;">Welcome to SoundChain</h1>
            
            <p style="margin:0 0 32px 0;font-size:16px;line-height:1.5;color:#6b7280;">Thanks for joining the waitlist.<br>We'll keep you updated.</p>
            
            <!-- Minimal Features -->
            <div style="margin-bottom:32px;padding:24px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
              <p style="margin:0;font-size:14px;color:#8B5FFF;font-weight:600;margin-bottom:8px;">What you'll get:</p>
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                Early access • Tester features • Special rewards
              </p>
            </div>
            
            <!-- Social Links -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px auto;">
              <tr>
                <td style="padding:0 6px;">
                  <a href="${xUrl}" style="display:inline-block;padding:12px 16px;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;text-decoration:none;color:#000000;font-size:16px;font-weight:700;font-family:Arial,sans-serif;">X</a>
                </td>
                <td style="padding:0 6px;">
                  <a href="${igUrl}" style="display:inline-block;padding:12px 16px;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;text-decoration:none;color:#000000;font-size:16px;font-weight:700;font-family:Arial,sans-serif;">IG</a>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <p style="margin:0;font-size:12px;color:#6b7280;">SoundChain 2025 • <a href="${siteUrl}" style="color:#8B5FFF;text-decoration:none;">sndchain.xyz</a></p>
            
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>`
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