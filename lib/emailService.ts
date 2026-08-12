import "server-only";
import { Resend } from "resend";

// Safe runtime environment check
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Missing RESEND_API_KEY. Check your .env.local file.");
  }

  return new Resend(apiKey);
};

const EMAIL_FROM = "DueBlink <no-reply@dueblink.com>";

// ============================================================
// Welcome Email (Clean Light Mode SaaS UI/UX)
// ============================================================
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
) {
  try {
    const resend = getResendClient();

    // Parse first name cleanly for a friendly greeting
    const displayName = userName ? userName.split(" ")[0] : "there";

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [toEmail],
      subject: "Welcome to DueBlink! 🚀 Let's recover your overdue payments",

      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DueBlink</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>

        <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0F172A;">

          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="table-layout: fixed; background-color: #F8FAFC; padding: 48px 16px;"
          >
            <tr>
              <td align="center">

                <!-- MAIN WRAPPER -->
                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);"
                >

                  <!-- HEADER / BRANDING -->
                  <tr>
                    <td
                      align="center"
                      style="padding: 40px 40px 24px 40px; background-color: #ffffff; border-bottom: 1px solid #F1F5F9;"
                    >
                      <a href="https://dueblink.com" target="_blank" style="text-decoration: none;">
                        <img
                          src="https://dueblink.com/logo.png"
                          alt="DueBlink Logo"
                          width="180"
                          style="display: block; height: auto; border: 0;"
                        />
                      </a>
                    </td>
                  </tr>

                  <!-- HERO BODY -->
                  <tr>
                    <td style="padding: 40px 40px 32px 40px;">

                      <!-- BADGE -->
                      <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td style="background-color: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 100px; padding: 6px 14px;">
                            <span style="font-size: 12px; font-weight: 800; color: #0D9488; letter-spacing: 0.5px; text-transform: uppercase;">
                              ✨ Welcome Onboard
                            </span>
                          </td>
                        </tr>
                      </table>

                      <h1
                        style="font-size: 28px; font-weight: 900; color: #0F172A; margin: 0 0 16px 0; letter-spacing: -0.8px; line-height: 1.2;"
                      >
                        Let’s get your hard-earned money back, ${displayName}.
                      </h1>

                      <p
                        style="font-size: 16px; line-height: 1.65; color: #475569; margin: 0 0 28px 0; font-weight: 400;"
                      >
                        You're officially set up on <strong>DueBlink</strong>—the AI-powered payment recovery workspace built for freelancers, agencies, and consultants. No more awkward follow-ups or manual stress.
                      </p>

                      <!-- QUICKSTART CARD -->
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        style="background-color: #F8FAFC; border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 1px solid #E2E8F0;"
                      >
                        <tr>
                          <td>
                            <p
                              style="font-size: 12px; font-weight: 900; color: #245B92; margin: 0 0 18px 0; text-transform: uppercase; letter-spacing: 1px;"
                            >
                              🚀 Your 3-Step Action Plan:
                            </p>

                            <!-- STEP 1 -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                              <tr>
                                <td width="32" valign="top">
                                  <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #245B92, #20B8BE); border-radius: 50%; color: #ffffff; text-align: center; font-size: 12px; font-weight: 800; line-height: 24px;">1</div>
                                </td>
                                <td style="font-size: 14px; color: #1E293B; font-weight: 600; line-height: 1.5;">
                                  <strong>Add your first client:</strong> Import or enter client contact details in seconds.
                                </td>
                              </tr>
                            </table>

                            <!-- STEP 2 -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                              <tr>
                                <td width="32" valign="top">
                                  <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #245B92, #20B8BE); border-radius: 50%; color: #ffffff; text-align: center; font-size: 12px; font-weight: 800; line-height: 24px;">2</div>
                                </td>
                                <td style="font-size: 14px; color: #1E293B; font-weight: 600; line-height: 1.5;">
                                  <strong>Generate AI reminders:</strong> Choose your tone (polite, firm, or urgent) and let AI draft perfect messages.
                                </td>
                              </tr>
                            </table>

                            <!-- STEP 3 -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td width="32" valign="top">
                                  <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #245B92, #20B8BE); border-radius: 50%; color: #ffffff; text-align: center; font-size: 12px; font-weight: 800; line-height: 24px;">3</div>
                                </td>
                                <td style="font-size: 14px; color: #1E293B; font-weight: 600; line-height: 1.5;">
                                  <strong>Dispatch via Email & WhatsApp:</strong> Send reminders directly and monitor payment statuses live.
                                </td>
                              </tr>
                            </table>

                          </td>
                        </tr>
                      </table>

                      <!-- PRIMARY CTA BUTTON -->
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        style="margin-bottom: 32px;"
                      >
                        <tr>
                          <td align="center">
                            <a
                              href="https://dueblink.com/dashboard"
                              target="_blank"
                              style="font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 14px; background: linear-gradient(90deg, #245B92 0%, #20B8BE 100%); display: inline-block; box-shadow: 0 10px 15px -3px rgba(32, 184, 190, 0.3); text-align: center;"
                            >
                              Open Your Dashboard &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- PRO TIP CALLOUT -->
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        style="border-left: 4px solid #20B8BE; background-color: #F0FDFA; border-radius: 0 16px 16px 0; padding: 18px 20px;"
                      >
                        <tr>
                          <td>
                            <p style="font-size: 13px; font-weight: 800; color: #0F766E; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                              💡 Pro Tip
                            </p>
                            <p style="font-size: 13px; line-height: 1.55; color: #115E59; margin: 0;">
                              You start with <strong>15 Free Monthly Reminders</strong>. Track your open payments early to see how automated reminders cut recovery time in half.
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td
                      align="center"
                      style="padding: 32px 40px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9;"
                    >
                      <p style="font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 8px 0;">
                        DueBlink — Smart AI Payment Recovery
                      </p>

                      <p style="font-size: 12px; color: #94A3B8; margin: 0 0 16px 0; line-height: 1.5;">
                        Know who owes you money. Know exactly what to do next.
                      </p>

                      <div style="font-size: 12px; color: #64748B; margin-bottom: 16px;">
                        <a href="https://dueblink.com/privacy" style="color: #64748B; text-decoration: underline; margin: 0 8px;">Privacy Policy</a> • 
                        <a href="https://dueblink.com/terms" style="color: #64748B; text-decoration: underline; margin: 0 8px;">Terms of Service</a> • 
                        <a href="mailto:support@dueblink.com" style="color: #64748B; text-decoration: underline; margin: 0 8px;">Contact Support</a>
                      </div>

                      <p style="font-size: 11px; color: #CBD5E1; margin: 0;">
                        © 2026 DueBlink. All rights reserved.<br/>
                        You are receiving this automated email because an account was registered with ${toEmail}.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
      `,
    });

    return {
      success: true,
      data,
    };

  } catch (error) {
    console.error("Failed to send welcome email:", error);

    return {
      success: false,
      error,
    };
  }
}