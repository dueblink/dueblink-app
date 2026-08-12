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
// Welcome Email (Refined SaaS UI/UX Matching Exact Specification)
// ============================================================
export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
) {
  try {
    const resend = getResendClient();

    // Parse first name cleanly for a friendly greeting if available, or full fallback
    const displayName = userName ? userName.trim() : "there";

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [toEmail],
      subject: "Welcome to DueBlink! 🚀 Your account is ready",

      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DueBlink</title>
          <style>
            @media screen and (max-width: 600px) {
              .step-td {
                display: block !important;
                width: 100% !important;
                padding-right: 0 !important;
                padding-bottom: 10px !important;
              }
              .step-td-last {
                padding-bottom: 0 !important;
              }
              .content-padding {
                padding: 24px 20px !important;
              }
            }
          </style>
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
            style="table-layout: fixed; background-color: #F8FAFC; padding: 40px 16px;"
          >
            <tr>
              <td align="center">

                <!-- MAIN SAAS CONTAINER (600–640px Desktop Width) -->
                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="max-width: 620px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04);"
                >

                  <!-- 1. HEADER -->
                  <tr>
                    <td
                      align="left"
                      style="padding: 28px 36px 20px 36px; background-color: #ffffff; border-bottom: 1px solid #F1F5F9;"
                    >
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <a href="https://dueblink.com" target="_blank" style="text-decoration: none; display: inline-block;">
                              <img
                                src="https://dueblink.com/logo.png"
                                alt="DueBlink Logo"
                                width="130"
                                style="display: block; width: 130px; height: auto; border: 0; outline: none; text-decoration: none;"
                              />
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- HERO BODY -->
                  <tr>
                    <td class="content-padding" style="padding: 36px 36px 28px 36px;">

                      <!-- 2. WELCOME BADGE -->
                      <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td style="background-color: #ffffff; border: 1px solid #E2E8F0; border-radius: 100px; padding: 5px 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-right: 6px;">
                                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #20B8BE;"></span>
                                </td>
                                <td>
                                  <span style="font-size: 11px; font-weight: 800; color: #0F172A; letter-spacing: 0.5px; text-transform: uppercase;">
                                    ✨ WELCOME ONBOARD
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- 3. HEADLINE -->
                      <h1
                        style="font-size: 26px; font-weight: 900; color: #0F172A; margin: 0 0 14px 0; letter-spacing: -0.6px; line-height: 1.25;"
                      >
                        Welcome to DueBlink, ${displayName}! 🎉
                      </h1>

                      <!-- 4. INTRO -->
                      <p
                        style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; font-weight: 400;"
                      >
                        Your DueBlink account is ready.
                      </p>

                      <p
                        style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; font-weight: 400;"
                      >
                        You've already started recovering payments with DueBlink. Now your account gives you a place to organize your clients, manage your reminders, and keep track of your payment recovery in one workspace.
                      </p>

                      <!-- 5. 3-STEP WORKSPACE CARD -->
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        style="background-color: #FAFBFD; border-radius: 16px; padding: 18px; margin-bottom: 24px; border: 1px solid #E2E8F0;"
                      >
                        <tr>
                          <td>
                            <p
                              style="font-size: 11px; font-weight: 900; color: #245B92; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.8px;"
                            >
                              🚀 NOW THAT YOU HAVE AN ACCOUNT
                            </p>

                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <!-- STEP 1 -->
                                <td width="33.33%" valign="top" class="step-td" style="padding-right: 8px;">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px; height: 100%;">
                                    <tr>
                                      <td>
                                        <div style="font-size: 11px; font-weight: 900; color: #245B92; margin-bottom: 2px;">①</div>
                                        <div style="font-size: 11px; font-weight: 800; color: #0F172A; line-height: 1.3; margin-bottom: 2px;">ADD CLIENTS</div>
                                        <div style="font-size: 10px; color: #64748B; line-height: 1.3;">Add & organize clients.</div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>

                                <!-- STEP 2 -->
                                <td width="33.33%" valign="top" class="step-td" style="padding-right: 8px; padding-left: 4px;">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px; height: 100%;">
                                    <tr>
                                      <td>
                                        <div style="font-size: 11px; font-weight: 900; color: #245B92; margin-bottom: 2px;">②</div>
                                        <div style="font-size: 11px; font-weight: 800; color: #0F172A; line-height: 1.3; margin-bottom: 2px;">REMINDERS</div>
                                        <div style="font-size: 10px; color: #64748B; line-height: 1.3;">Manage payment alerts.</div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>

                                <!-- STEP 3 -->
                                <td width="33.33%" valign="top" class="step-td step-td-last" style="padding-left: 8px;">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px; height: 100%;">
                                    <tr>
                                      <td>
                                        <div style="font-size: 11px; font-weight: 900; color: #245B92; margin-bottom: 2px;">③</div>
                                        <div style="font-size: 11px; font-weight: 800; color: #0F172A; line-height: 1.3; margin-bottom: 2px;">TRACK RECOVERY</div>
                                        <div style="font-size: 10px; color: #64748B; line-height: 1.3;">Monitor from dashboard.</div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>

                          </td>
                        </tr>
                      </table>

                      <!-- 6. PRIMARY CTA -->
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        style="margin-bottom: 24px;"
                      >
                        <tr>
                          <td align="center">
                            <a
                              href="https://dueblink.com/dashboard"
                              target="_blank"
                              style="font-size: 14px; font-weight: 800; color: #ffffff; text-decoration: none; padding: 15px 32px; border-radius: 14px; background: linear-gradient(90deg, #245B92 0%, #20B8BE 100%); display: inline-block; box-shadow: 0 4px 12px rgba(32, 184, 190, 0.25); text-align: center;"
                            >
                              Open Your Dashboard &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- 7. PRO TIP -->
                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        style="border-left: 4px solid #20B8BE; background-color: #F0FDFA; border-radius: 0 12px 12px 0; padding: 14px 16px;"
                      >
                        <tr>
                          <td>
                            <p style="font-size: 11px; font-weight: 900; color: #0F766E; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                              💡 PRO TIP
                            </p>
                            <p style="font-size: 12px; line-height: 1.5; color: #115E59; margin: 0; font-weight: 500;">
                              Keep your client records and payment follow-ups organized in one place so no overdue payment gets forgotten.
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- 8. FOOTER -->
                  <tr>
                    <td
                      align="center"
                      style="padding: 24px 36px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9;"
                    >
                      <p style="font-size: 11px; color: #94A3B8; margin: 0 0 4px 0; line-height: 1.4;">
                        © 2026 DueBlink. All rights reserved.
                      </p>
                      <p style="font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.4;">
                        You are receiving this email because you created an account on DueBlink.
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