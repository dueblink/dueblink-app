import "server-only";
import { Resend } from "resend";

// ============================================================
// Safe runtime environment check
// ============================================================

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "Missing RESEND_API_KEY. Check your .env.local file."
    );
  }

  return new Resend(apiKey);
};

const EMAIL_FROM = "DueBlink <no-reply@dueblink.com>";

// ============================================================
// Welcome Email
// ============================================================

export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
) {
  try {
    const resend = getResendClient();

    const displayName = userName
      ? userName.trim()
      : "there";

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [toEmail],

      subject:
        "Welcome to DueBlink! 🚀 Your account is ready",

      html: `
        <!DOCTYPE html>
        <html lang="en">

        <head>
          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>Welcome to DueBlink</title>

          <style>
            @media screen and (max-width: 600px) {

              .content-padding {
                padding: 28px 20px !important;
              }

              .header-padding {
                padding: 22px 20px 18px !important;
              }

              .footer-padding {
                padding: 22px 20px !important;
              }

              .welcome-title {
                font-size: 24px !important;
                line-height: 1.25 !important;
              }

              .welcome-text {
                font-size: 14px !important;
                line-height: 1.6 !important;
              }

              .step-td {
                display: block !important;
                width: 100% !important;
                padding: 0 0 10px 0 !important;
              }

              .step-td-last {
                padding-bottom: 0 !important;
              }

              .step-card {
                width: 100% !important;
              }

              .dashboard-button {
                display: block !important;
                width: auto !important;
                max-width: 100% !important;
                padding: 14px 22px !important;
                font-size: 14px !important;
              }

              .outer-container {
                border-radius: 18px !important;
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

        <body
          style="
            margin:0;
            padding:0;
            background-color:#F8FAFC;
            font-family:-apple-system,BlinkMacSystemFont,
            'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
            -webkit-font-smoothing:antialiased;
            color:#0F172A;
          "
        >

          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="
              table-layout:fixed;
              background-color:#F8FAFC;
              padding:32px 12px;
            "
          >

            <tr>
              <td align="center">

                <!-- MAIN CONTAINER -->

                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  class="outer-container"
                  style="
                    max-width:620px;
                    background-color:#ffffff;
                    border-radius:24px;
                    overflow:hidden;
                    border:1px solid #E2E8F0;
                    box-shadow:
                      0 10px 25px -5px rgba(0,0,0,0.04),
                      0 8px 10px -6px rgba(0,0,0,0.04);
                  "
                >

                  <!-- ==================================================
                      HEADER
                  =================================================== -->

                  <tr>
                    <td
                      align="left"
                      class="header-padding"
                      style="
                        padding:28px 36px 20px;
                        background-color:#ffffff;
                        border-bottom:1px solid #F1F5F9;
                      "
                    >

                      <a
                        href="https://dueblink.com/"
                        target="_blank"
                        style="
                          text-decoration:none;
                          display:inline-block;
                        "
                      >

                        <img
                          src="https://dueblink.com/logo.png"
                          alt="DueBlink Logo"
                          width="130"
                          style="
                            display:block;
                            width:130px;
                            height:auto;
                            border:0;
                            outline:none;
                            text-decoration:none;
                          "
                        />

                      </a>

                    </td>
                  </tr>

                  <!-- ==================================================
                      BODY
                  =================================================== -->

                  <tr>
                    <td
                      class="content-padding"
                      style="
                        padding:36px 36px 28px;
                      "
                    >

                      <!-- BADGE -->

                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        style="margin-bottom:16px;"
                      >

                        <tr>
                          <td
                            style="
                              background:#ffffff;
                              border:1px solid #E2E8F0;
                              border-radius:100px;
                              padding:5px 12px;
                            "
                          >

                            <span
                              style="
                                font-size:11px;
                                font-weight:800;
                                color:#0F172A;
                                letter-spacing:.5px;
                                text-transform:uppercase;
                              "
                            >
                              ✨ WELCOME ONBOARD
                            </span>

                          </td>
                        </tr>

                      </table>

                      <!-- HEADLINE -->

                      <h1
                        class="welcome-title"
                        style="
                          font-size:26px;
                          font-weight:900;
                          color:#0F172A;
                          margin:0 0 14px;
                          letter-spacing:-.6px;
                          line-height:1.25;
                        "
                      >
                        Welcome to DueBlink,
                        ${displayName}! 🎉
                      </h1>

                      <!-- INTRO -->

                      <p
                        class="welcome-text"
                        style="
                          font-size:15px;
                          line-height:1.6;
                          color:#475569;
                          margin:0 0 16px;
                          font-weight:400;
                        "
                      >
                        Your DueBlink account is ready.
                      </p>

                      <p
                        class="welcome-text"
                        style="
                          font-size:15px;
                          line-height:1.6;
                          color:#475569;
                          margin:0 0 24px;
                          font-weight:400;
                        "
                      >
                        You've already started recovering payments
                        with DueBlink. Now your account gives you a
                        place to organize your clients, manage your
                        reminders, and keep track of your payment
                        recovery in one workspace.
                      </p>

                      <!-- ==================================================
                            3 STEP WORKSPACE CARD
                      =================================================== -->

                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        style="
                          background:#FAFBFD;
                          border-radius:16px;
                          margin-bottom:24px;
                          border:1px solid #E2E8F0;
                        "
                      >

                        <tr>
                          <td style="padding:18px;">

                            <p
                              style="
                                font-size:11px;
                                font-weight:900;
                                color:#245B92;
                                margin:0 0 14px;
                                text-transform:uppercase;
                                letter-spacing:.8px;
                              "
                            >
                              🚀 NOW THAT YOU HAVE AN ACCOUNT
                            </p>

                            <!-- STEPS -->

                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                            >

                              <tr>

                                <!-- STEP 1 -->

                                <td
                                  width="33.33%"
                                  valign="top"
                                  class="step-td"
                                  style="
                                    padding-right:8px;
                                  "
                                >

                                  <table
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    width="100%"
                                    class="step-card"
                                    style="
                                      background:#ffffff;
                                      border:1px solid #E2E8F0;
                                      border-radius:12px;
                                    "
                                  >

                                    <tr>
                                      <td style="padding:12px;">

                                        <div
                                          style="
                                            font-size:11px;
                                            font-weight:900;
                                            color:#245B92;
                                            margin-bottom:3px;
                                          "
                                        >
                                          ①
                                        </div>

                                        <div
                                          style="
                                            font-size:11px;
                                            font-weight:800;
                                            color:#0F172A;
                                            line-height:1.3;
                                            margin-bottom:3px;
                                          "
                                        >
                                          ADD CLIENTS
                                        </div>

                                        <div
                                          style="
                                            font-size:10px;
                                            color:#64748B;
                                            line-height:1.4;
                                          "
                                        >
                                          Add & organize clients.
                                        </div>

                                      </td>
                                    </tr>

                                  </table>

                                </td>

                                <!-- STEP 2 -->

                                <td
                                  width="33.33%"
                                  valign="top"
                                  class="step-td"
                                  style="
                                    padding-left:4px;
                                    padding-right:4px;
                                  "
                                >

                                  <table
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    width="100%"
                                    class="step-card"
                                    style="
                                      background:#ffffff;
                                      border:1px solid #E2E8F0;
                                      border-radius:12px;
                                    "
                                  >

                                    <tr>
                                      <td style="padding:12px;">

                                        <div
                                          style="
                                            font-size:11px;
                                            font-weight:900;
                                            color:#245B92;
                                            margin-bottom:3px;
                                          "
                                        >
                                          ②
                                        </div>

                                        <div
                                          style="
                                            font-size:11px;
                                            font-weight:800;
                                            color:#0F172A;
                                            line-height:1.3;
                                            margin-bottom:3px;
                                          "
                                        >
                                          REMINDERS
                                        </div>

                                        <div
                                          style="
                                            font-size:10px;
                                            color:#64748B;
                                            line-height:1.4;
                                          "
                                        >
                                          Manage payment alerts.
                                        </div>

                                      </td>
                                    </tr>

                                  </table>

                                </td>

                                <!-- STEP 3 -->

                                <td
                                  width="33.33%"
                                  valign="top"
                                  class="step-td step-td-last"
                                  style="
                                    padding-left:8px;
                                  "
                                >

                                  <table
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    width="100%"
                                    class="step-card"
                                    style="
                                      background:#ffffff;
                                      border:1px solid #E2E8F0;
                                      border-radius:12px;
                                    "
                                  >

                                    <tr>
                                      <td style="padding:12px;">

                                        <div
                                          style="
                                            font-size:11px;
                                            font-weight:900;
                                            color:#245B92;
                                            margin-bottom:3px;
                                          "
                                        >
                                          ③
                                        </div>

                                        <div
                                          style="
                                            font-size:11px;
                                            font-weight:800;
                                            color:#0F172A;
                                            line-height:1.3;
                                            margin-bottom:3px;
                                          "
                                        >
                                          TRACK RECOVERY
                                        </div>

                                        <div
                                          style="
                                            font-size:10px;
                                            color:#64748B;
                                            line-height:1.4;
                                          "
                                        >
                                          Monitor from dashboard.
                                        </div>

                                      </td>
                                    </tr>

                                  </table>

                                </td>

                              </tr>

                            </table>

                          </td>
                        </tr>

                      </table>

                      <!-- ==================================================
                            CTA
                      =================================================== -->

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="margin-bottom:24px;"
                      >

                        <tr>
                          <td align="center">

                            <a
                              href="https://dueblink.com/dashboard"
                              target="_blank"
                              class="dashboard-button"
                              style="
                                font-size:14px;
                                font-weight:800;
                                color:#ffffff;
                                text-decoration:none;
                                padding:15px 32px;
                                border-radius:14px;
                                background:#245B92;
                                display:inline-block;
                                text-align:center;
                              "
                            >
                              Open Your Dashboard →
                            </a>

                          </td>
                        </tr>

                      </table>

                      <!-- ==================================================
                            PRO TIP
                      =================================================== -->

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                          border-left:4px solid #20B8BE;
                          background:#F0FDFA;
                          border-radius:0 12px 12px 0;
                        "
                      >

                        <tr>

                          <td style="padding:14px 16px;">

                            <p
                              style="
                                font-size:11px;
                                font-weight:900;
                                color:#0F766E;
                                margin:0 0 3px;
                                text-transform:uppercase;
                                letter-spacing:.5px;
                              "
                            >
                              💡 PRO TIP
                            </p>

                            <p
                              style="
                                font-size:12px;
                                line-height:1.5;
                                color:#115E59;
                                margin:0;
                                font-weight:500;
                              "
                            >
                              Keep your client records and payment
                              follow-ups organized in one place so
                              no overdue payment gets forgotten.
                            </p>

                          </td>

                        </tr>

                      </table>

                    </td>
                  </tr>

                  <!-- ==================================================
                      FOOTER
                  =================================================== -->

                  <tr>
                    <td
                      align="center"
                      class="footer-padding"
                      style="
                        padding:24px 36px;
                        background:#F8FAFC;
                        border-top:1px solid #F1F5F9;
                      "
                    >

                      <p
                        style="
                          font-size:11px;
                          color:#94A3B8;
                          margin:0 0 4px;
                          line-height:1.4;
                        "
                      >
                        © 2026 DueBlink. All rights reserved.
                      </p>

                      <p
                        style="
                          font-size:11px;
                          color:#94A3B8;
                          margin:0;
                          line-height:1.4;
                        "
                      >
                        You are receiving this email because
                        you created an account on DueBlink.
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
    console.error(
      "Failed to send welcome email:",
      error
    );

    return {
      success: false,
      error,
    };
  }
}

// ============================================================
// Pro Upgrade / Purchase Email
// ============================================================

export async function sendProWelcomeEmail(
  toEmail: string,
  userName: string
) {
  try {
    const resend = getResendClient();

    const displayName = userName
      ? userName.trim()
      : "there";

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [toEmail],

      subject:
        "🎉 Welcome to DueBlink Pro — You're upgraded!",

      html: `
        <!DOCTYPE html>
        <html lang="en">

        <head>

          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>Welcome to DueBlink Pro</title>

          <style>

            @media screen and (max-width:600px) {

              .pro-content-padding {
                padding:28px 20px !important;
              }

              .pro-header-padding {
                padding:22px 20px 18px !important;
              }

              .pro-footer-padding {
                padding:22px 20px !important;
              }

              .pro-title {
                font-size:25px !important;
                line-height:1.25 !important;
              }

              .pro-text {
                font-size:14px !important;
                line-height:1.6 !important;
              }

              .pro-feature-td {
                display:block !important;
                width:100% !important;
                padding:0 0 10px 0 !important;
              }

              .pro-feature-last {
                padding-bottom:0 !important;
              }

              .pro-feature-card {
                width:100% !important;
              }

              .pro-dashboard-button {
                display:block !important;
                width:auto !important;
                max-width:100% !important;
                padding:14px 22px !important;
                font-size:14px !important;
              }

              .pro-container {
                border-radius:18px !important;
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

        <body
          style="
            margin:0;
            padding:0;
            background:#F8FAFC;
            font-family:-apple-system,BlinkMacSystemFont,
            'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
            -webkit-font-smoothing:antialiased;
            color:#0F172A;
          "
        >

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              background:#F8FAFC;
              padding:32px 12px;
              table-layout:fixed;
            "
          >

            <tr>

              <td align="center">

                <!-- ==================================================
                    MAIN PRO CONTAINER
                =================================================== -->

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  class="pro-container"
                  style="
                    max-width:620px;
                    background:#ffffff;
                    border-radius:24px;
                    overflow:hidden;
                    border:1px solid #E2E8F0;
                    box-shadow:
                      0 10px 25px -5px rgba(0,0,0,0.04),
                      0 8px 10px -6px rgba(0,0,0,0.04);
                  "
                >

                  <!-- ==================================================
                      HEADER
                  =================================================== -->

                  <tr>

                    <td
                      align="left"
                      class="pro-header-padding"
                      style="
                        padding:28px 36px 20px;
                        background:#ffffff;
                        border-bottom:1px solid #F1F5F9;
                      "
                    >

                      <a
                        href="https://dueblink.com/"
                        target="_blank"
                        style="
                          text-decoration:none;
                          display:inline-block;
                        "
                      >

                        <img
                          src="https://dueblink.com/logo.png"
                          alt="DueBlink Logo"
                          width="130"
                          style="
                            display:block;
                            width:130px;
                            height:auto;
                            border:0;
                            outline:none;
                            text-decoration:none;
                          "
                        />

                      </a>

                    </td>

                  </tr>

                  <!-- ==================================================
                      BODY
                  =================================================== -->

                  <tr>

                    <td
                      class="pro-content-padding"
                      style="
                        padding:36px 36px 28px;
                      "
                    >

                      <!-- PRO BADGE -->

                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                        style="margin-bottom:16px;"
                      >

                        <tr>

                          <td
                            style="
                              background:#F0FDFA;
                              border:1px solid #99F6E4;
                              border-radius:100px;
                              padding:6px 13px;
                            "
                          >

                            <span
                              style="
                                font-size:11px;
                                font-weight:900;
                                color:#0F766E;
                                letter-spacing:.5px;
                                text-transform:uppercase;
                              "
                            >
                              ✨ PRO ACTIVATED
                            </span>

                          </td>

                        </tr>

                      </table>

                      <!-- ==================================================
                          HEADLINE
                      =================================================== -->

                      <h1
                        class="pro-title"
                        style="
                          font-size:28px;
                          font-weight:900;
                          color:#0F172A;
                          margin:0 0 14px;
                          letter-spacing:-.7px;
                          line-height:1.25;
                        "
                      >
                        Welcome to DueBlink Pro,
                        ${displayName}! 🎉
                      </h1>

                      <!-- ==================================================
                          INTRO
                      =================================================== -->

                      <p
                        class="pro-text"
                        style="
                          font-size:15px;
                          line-height:1.6;
                          color:#475569;
                          margin:0 0 16px;
                        "
                      >
                        Your Pro upgrade is now active.
                      </p>

                      <p
                        class="pro-text"
                        style="
                          font-size:15px;
                          line-height:1.6;
                          color:#475569;
                          margin:0 0 24px;
                        "
                      >
                        Your payment was successfully verified
                        and your account has been upgraded to
                        DueBlink Pro.
                      </p>

                      <!-- ==================================================
                          PRO FEATURES CONTAINER
                      =================================================== -->

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                          background:#FAFBFD;
                          border:1px solid #E2E8F0;
                          border-radius:16px;
                          margin-bottom:24px;
                        "
                      >

                        <tr>

                          <td style="padding:18px;">

                            <!-- SECTION TITLE -->

                            <p
                              style="
                                font-size:12px;
                                font-weight:900;
                                color:#245B92;
                                margin:0 0 14px;
                                text-transform:uppercase;
                                letter-spacing:.7px;
                              "
                            >
                              🚀 YOUR PRO ACCESS INCLUDES
                            </p>

                            <!-- ==================================================
                                    FEATURE ROW 1
                            =================================================== -->

                            <table
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                              border="0"
                            >

                              <tr>

                                <!-- AI REMINDERS -->

                                <td
                                  width="50%"
                                  valign="top"
                                  class="pro-feature-td"
                                  style="padding-right:5px;"
                                >

                                  <table
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    class="pro-feature-card"
                                    style="
                                      background:#ffffff;
                                      border:1px solid #E2E8F0;
                                      border-radius:14px;
                                    "
                                  >

                                    <tr>

                                      <td style="padding:14px;">

                                        <div
                                          style="
                                            font-size:12px;
                                            font-weight:900;
                                            color:#245B92;
                                            margin-bottom:5px;
                                            line-height:1.3;
                                          "
                                        >
                                          ✨ AI REMINDERS
                                        </div>

                                        <div
                                          style="
                                            font-size:11px;
                                            color:#64748B;
                                            line-height:1.5;
                                          "
                                        >
                                          Create smarter payment
                                          follow-ups with AI.
                                        </div>

                                      </td>

                                    </tr>

                                  </table>

                                </td>

                                <!-- AI ASSISTANT -->

                                <td
                                  width="50%"
                                  valign="top"
                                  class="pro-feature-td"
                                  style="padding-left:5px;"
                                >

                                  <table
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    class="pro-feature-card"
                                    style="
                                      background:#ffffff;
                                      border:1px solid #E2E8F0;
                                      border-radius:14px;
                                    "
                                  >

                                    <tr>

                                      <td style="padding:14px;">

                                        <div
                                          style="
                                            font-size:12px;
                                            font-weight:900;
                                            color:#245B92;
                                            margin-bottom:5px;
                                            line-height:1.3;
                                          "
                                        >
                                          🤖 AI ASSISTANT
                                        </div>

                                        <div
                                          style="
                                            font-size:11px;
                                            color:#64748B;
                                            line-height:1.5;
                                          "
                                        >
                                          Get intelligent recovery
                                          assistance.
                                        </div>

                                      </td>

                                    </tr>

                                  </table>

                                </td>

                              </tr>

                            </table>

                            <!-- ==================================================
                                    FEATURE ROW 2
                            =================================================== -->

                            <table
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                              border="0"
                              style="margin-top:10px;"
                            >

                              <tr>

                                <!-- TRACKING -->

                                <td
                                  width="50%"
                                  valign="top"
                                  class="pro-feature-td"
                                  style="padding-right:5px;"
                                >

                                  <table
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    class="pro-feature-card"
                                    style="
                                      background:#ffffff;
                                      border:1px solid #E2E8F0;
                                      border-radius:14px;
                                    "
                                  >

                                    <tr>

                                      <td style="padding:14px;">

                                        <div
                                          style="
                                            font-size:12px;
                                            font-weight:900;
                                            color:#245B92;
                                            margin-bottom:5px;
                                            line-height:1.3;
                                          "
                                        >
                                          📊 TRACKING
                                        </div>

                                        <div
                                          style="
                                            font-size:11px;
                                            color:#64748B;
                                            line-height:1.5;
                                          "
                                        >
                                          Track payments and
                                          recovery history.
                                        </div>

                                      </td>

                                    </tr>

                                  </table>

                                </td>

                                <!-- UNLIMITED CLIENTS -->

                                <td
                                  width="50%"
                                  valign="top"
                                  class="pro-feature-td pro-feature-last"
                                  style="padding-left:5px;"
                                >

                                  <table
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    class="pro-feature-card"
                                    style="
                                      background:#ffffff;
                                      border:1px solid #E2E8F0;
                                      border-radius:14px;
                                    "
                                  >

                                    <tr>

                                      <td style="padding:14px;">

                                        <div
                                          style="
                                            font-size:12px;
                                            font-weight:900;
                                            color:#245B92;
                                            margin-bottom:5px;
                                            line-height:1.3;
                                          "
                                        >
                                          👥 UNLIMITED CLIENTS
                                        </div>

                                        <div
                                          style="
                                            font-size:11px;
                                            color:#64748B;
                                            line-height:1.5;
                                          "
                                        >
                                          Manage your client
                                          recovery workspace.
                                        </div>

                                      </td>

                                    </tr>

                                  </table>

                                </td>

                              </tr>

                            </table>

                          </td>

                        </tr>

                      </table>

                      <!-- ==================================================
                          CTA
                      =================================================== -->

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="margin-bottom:24px;"
                      >

                        <tr>

                          <td align="center">

                            <a
                              href="https://dueblink.com/dashboard"
                              target="_blank"
                              class="pro-dashboard-button"
                              style="
                                font-size:14px;
                                font-weight:800;
                                color:#ffffff;
                                text-decoration:none;
                                padding:15px 32px;
                                border-radius:14px;
                                background:#245B92;
                                display:inline-block;
                                text-align:center;
                              "
                            >
                              Open Your Pro Dashboard →
                            </a>

                          </td>

                        </tr>

                      </table>

                      <!-- ==================================================
                          PRO TIP
                      =================================================== -->

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                          border-left:4px solid #20B8BE;
                          background:#F0FDFA;
                          border-radius:0 12px 12px 0;
                        "
                      >

                        <tr>

                          <td style="padding:14px 16px;">

                            <p
                              style="
                                font-size:11px;
                                font-weight:900;
                                color:#0F766E;
                                margin:0 0 3px;
                                text-transform:uppercase;
                                letter-spacing:.5px;
                              "
                            >
                              💡 PRO TIP
                            </p>

                            <p
                              style="
                                font-size:12px;
                                line-height:1.5;
                                color:#115E59;
                                margin:0;
                                font-weight:500;
                              "
                            >
                              Start by adding your clients and
                              let DueBlink help you stay on top
                              of every payment follow-up.
                            </p>

                          </td>

                        </tr>

                      </table>

                    </td>

                  </tr>

                  <!-- ==================================================
                      FOOTER
                  =================================================== -->

                  <tr>

                    <td
                      align="center"
                      class="pro-footer-padding"
                      style="
                        padding:24px 36px;
                        background:#F8FAFC;
                        border-top:1px solid #F1F5F9;
                      "
                    >

                      <p
                        style="
                          font-size:11px;
                          color:#94A3B8;
                          margin:0 0 4px;
                          line-height:1.4;
                        "
                      >
                        © 2026 DueBlink. All rights reserved.
                      </p>

                      <p
                        style="
                          font-size:11px;
                          color:#94A3B8;
                          margin:0;
                          line-height:1.4;
                        "
                      >
                        You are receiving this email because
                        you upgraded your account to DueBlink Pro.
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
    console.error(
      "Failed to send Pro welcome email:",
      error
    );

    return {
      success: false,
      error,
    };
  }
}

// ============================================================
// Password Reset Email
// ============================================================

export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string
) {
  try {
    const resend = getResendClient();

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [toEmail],

      subject: "Reset your DueBlink password",

      html: `
        <!DOCTYPE html>
        <html lang="en">

        <head>
          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>Reset your DueBlink password</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background-color:#F8FAFC;
            font-family:-apple-system,BlinkMacSystemFont,
            'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
            color:#0F172A;
          "
        >

          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="
              background-color:#F8FAFC;
              padding:32px 12px;
            "
          >

            <tr>
              <td align="center">

                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    max-width:620px;
                    background-color:#ffffff;
                    border-radius:24px;
                    overflow:hidden;
                    border:1px solid #E2E8F0;
                  "
                >

                  <!-- HEADER -->

                  <tr>
                    <td
                      style="
                        padding:28px 36px 20px;
                        background-color:#ffffff;
                        border-bottom:1px solid #F1F5F9;
                      "
                    >

                      <a
                        href="https://dueblink.com/"
                        target="_blank"
                        style="
                          text-decoration:none;
                          display:inline-block;
                        "
                      >

                        <img
                          src="https://dueblink.com/logo.png"
                          alt="DueBlink Logo"
                          width="130"
                          style="
                            display:block;
                            width:130px;
                            height:auto;
                            border:0;
                          "
                        />

                      </a>

                    </td>
                  </tr>

                  <!-- BODY -->

                  <tr>
                    <td
                      style="
                        padding:40px 36px 36px;
                      "
                    >

                      <h1
                        style="
                          margin:0 0 14px;
                          font-size:28px;
                          line-height:1.25;
                          font-weight:800;
                          color:#0F172A;
                        "
                      >
                        Reset your password
                      </h1>

                      <p
                        style="
                          margin:0 0 18px;
                          font-size:15px;
                          line-height:1.7;
                          color:#475569;
                        "
                      >
                        We received a request to reset your
                        DueBlink password.
                      </p>

                      <p
                        style="
                          margin:0 0 28px;
                          font-size:15px;
                          line-height:1.7;
                          color:#475569;
                        "
                      >
                        Click the button below to create a new
                        password for your account.
                      </p>

                      <!-- RESET BUTTON -->

                      <table
                        border="0"
                        cellpadding="0"
                        cellspacing="0"
                      >
                        <tr>
                          <td
                            style="
                              border-radius:10px;
                              background-color:#245B92;
                            "
                          >

                            <a
                              href="${resetLink}"
                              target="_blank"
                              style="
                                display:inline-block;
                                padding:14px 24px;
                                color:#ffffff;
                                text-decoration:none;
                                font-size:14px;
                                font-weight:700;
                                border-radius:10px;
                              "
                            >
                              Reset Password
                            </a>

                          </td>
                        </tr>
                      </table>

                      <p
                        style="
                          margin:28px 0 0;
                          font-size:13px;
                          line-height:1.6;
                          color:#64748B;
                        "
                      >
                        If you didn't request a password reset,
                        you can safely ignore this email.
                      </p>

                      <p
                        style="
                          margin:18px 0 0;
                          font-size:12px;
                          line-height:1.6;
                          color:#94A3B8;
                        "
                      >
                        For your security, this password reset
                        link is temporary and can only be used
                        once.
                      </p>

                    </td>
                  </tr>

                  <!-- FOOTER -->

                  <tr>
                    <td
                      align="center"
                      style="
                        padding:24px 36px;
                        background:#F8FAFC;
                        border-top:1px solid #F1F5F9;
                      "
                    >

                      <p
                        style="
                          font-size:11px;
                          color:#94A3B8;
                          margin:0;
                        "
                      >
                        © 2026 DueBlink. All rights reserved.
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
    console.error(
      "Failed to send password reset email:",
      error
    );

    return {
      success: false,
      error,
    };
  }
}

// ============================================================
// Automated Payment Reminder Email
// ============================================================

export async function sendAutomatedReminderEmail(
  toEmail: string,
  subject: string,
  body: string,
  paymentLink?: string
) {
  try {
    const resend = getResendClient();

    const emailBody = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />");

    const safePaymentLink =
      typeof paymentLink === "string" &&
      paymentLink.trim().length > 0
        ? paymentLink.trim()
        : "";

    const paymentButton = safePaymentLink
      ? `
        <div
          style="
            margin:32px 0;
            text-align:center;
          "
        >
          <a
            href="${safePaymentLink}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display:inline-block;
              padding:14px 28px;
              background:#159A9F;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:14px;
              font-weight:700;
            "
          >
            Pay Now
          </a>
        </div>
      `
      : "";

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [toEmail],
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">

        <head>
          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>${subject}</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background-color:#F8FAFC;
            font-family:-apple-system,BlinkMacSystemFont,
            'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
            color:#0F172A;
          "
        >

          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="
              background-color:#F8FAFC;
              padding:32px 12px;
            "
          >

            <tr>
              <td align="center">

                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    max-width:620px;
                    background-color:#ffffff;
                    border-radius:24px;
                    overflow:hidden;
                    border:1px solid #E2E8F0;
                  "
                >

                  <!-- HEADER -->

                  <tr>
                    <td
                      style="
                        padding:28px 36px 20px;
                        background-color:#ffffff;
                        border-bottom:1px solid #F1F5F9;
                      "
                    >

                      <a
                        href="https://dueblink.com/"
                        target="_blank"
                        style="
                          text-decoration:none;
                          display:inline-block;
                        "
                      >

                        <img
                          src="https://dueblink.com/logo.png"
                          alt="DueBlink Logo"
                          width="130"
                          style="
                            display:block;
                            width:130px;
                            height:auto;
                            border:0;
                          "
                        />

                      </a>

                    </td>
                  </tr>

                  <!-- BODY -->

                  <tr>
                    <td
                      style="
                        padding:40px 36px 36px;
                      "
                    >

                      <div
                        style="
                          font-size:15px;
                          line-height:1.7;
                          color:#475569;
                        "
                      >
                        ${emailBody}
                      </div>

                      ${paymentButton}

                    </td>
                  </tr>

                  <!-- FOOTER -->

                  <tr>
                    <td
                      align="center"
                      style="
                        padding:24px 36px;
                        background:#F8FAFC;
                        border-top:1px solid #F1F5F9;
                      "
                    >

                      <p
                        style="
                          font-size:11px;
                          color:#94A3B8;
                          margin:0;
                        "
                      >
                        Sent automatically by DueBlink.
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
    console.error(
      "Failed to send automated reminder email:",
      error
    );

    return {
      success: false,
      error,
    };
  }
}

// ============================================================
// Owner Payment Status Email
// ============================================================

export type OwnerPaymentStatusItem = {
  clientName: string;
  amount: string;
  paidLink: string;
  notYetLink: string;
};

export async function sendOwnerPaymentStatusEmail(
  toEmail: string,
  items: OwnerPaymentStatusItem[]
) {
  try {
    const resend = getResendClient();

    if (!toEmail || items.length === 0) {
      return {
        success: false,
        error: "Missing owner email or payment status items.",
      };
    }

    const clientRows = items
      .map((item) => {
        const safeClientName = item.clientName
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

        const safeAmount = item.amount
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

        return `
          <div
            style="
              padding:20px 0;
              border-bottom:1px solid #E2E8F0;
            "
          >

            <div
              style="
                font-size:16px;
                font-weight:700;
                color:#0F172A;
                margin-bottom:6px;
              "
            >
              ${safeClientName}
            </div>

            <div
              style="
                font-size:14px;
                color:#64748B;
                margin-bottom:16px;
              "
            >
              Outstanding: ${safeAmount}
            </div>

            <table
              border="0"
              cellpadding="0"
              cellspacing="0"
            >
              <tr>

                <td
                  style="
                    border-radius:8px;
                    background:#159A9F;
                  "
                >
                  <a
                    href="${item.paidLink}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      display:inline-block;
                      padding:11px 16px;
                      color:#ffffff;
                      text-decoration:none;
                      font-size:13px;
                      font-weight:700;
                      border-radius:8px;
                    "
                  >
                    ✓ Yes, Paid
                  </a>
                </td>

                <td style="width:10px;"></td>

                <td
                  style="
                    border-radius:8px;
                    background:#F1F5F9;
                    border:1px solid #E2E8F0;
                  "
                >
                  <a
                    href="${item.notYetLink}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      display:inline-block;
                      padding:11px 16px;
                      color:#334155;
                      text-decoration:none;
                      font-size:13px;
                      font-weight:700;
                      border-radius:8px;
                    "
                  >
                    Not Yet
                  </a>
                </td>

              </tr>
            </table>

          </div>
        `;
      })
      .join("");

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [toEmail],
      subject:
        items.length === 1
          ? `Payment status — ${items[0].clientName}`
          : `DueBlink — Payment status for ${items.length} clients`,

      html: `
        <!DOCTYPE html>
        <html lang="en">

        <head>
          <meta charset="utf-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>DueBlink Payment Status</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background-color:#F8FAFC;
            font-family:-apple-system,BlinkMacSystemFont,
            'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
            color:#0F172A;
          "
        >

          <table
            border="0"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="
              background-color:#F8FAFC;
              padding:32px 12px;
            "
          >

            <tr>
              <td align="center">

                <table
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  width="100%"
                  style="
                    max-width:620px;
                    background-color:#ffffff;
                    border-radius:24px;
                    overflow:hidden;
                    border:1px solid #E2E8F0;
                  "
                >

                  <!-- HEADER -->

                  <tr>
                    <td
                      style="
                        padding:28px 36px 20px;
                        background-color:#ffffff;
                        border-bottom:1px solid #F1F5F9;
                      "
                    >

                      <a
                        href="https://dueblink.com/"
                        target="_blank"
                        style="
                          text-decoration:none;
                          display:inline-block;
                        "
                      >

                        <img
                          src="https://dueblink.com/logo.png"
                          alt="DueBlink Logo"
                          width="130"
                          style="
                            display:block;
                            width:130px;
                            height:auto;
                            border:0;
                          "
                        />

                      </a>

                    </td>
                  </tr>

                  <!-- BODY -->

                  <tr>
                    <td
                      style="
                        padding:40px 36px 36px;
                      "
                    >

                      <h1
                        style="
                          margin:0 0 12px;
                          font-size:24px;
                          line-height:1.3;
                          font-weight:800;
                          color:#0F172A;
                        "
                      >
                        Payment status
                      </h1>

                      <p
                        style="
                          margin:0 0 20px;
                          font-size:15px;
                          line-height:1.6;
                          color:#475569;
                        "
                      >
                        Did these clients pay their outstanding
                        invoices?
                      </p>

                      ${clientRows}

                      <p
                        style="
                          margin:24px 0 0;
                          font-size:12px;
                          line-height:1.6;
                          color:#94A3B8;
                        "
                      >
                        You can also update payment status from
                        your DueBlink dashboard.
                      </p>

                    </td>
                  </tr>

                  <!-- FOOTER -->

                  <tr>
                    <td
                      align="center"
                      style="
                        padding:24px 36px;
                        background:#F8FAFC;
                        border-top:1px solid #F1F5F9;
                      "
                    >

                      <p
                        style="
                          font-size:11px;
                          color:#94A3B8;
                          margin:0;
                        "
                      >
                        Sent by DueBlink.
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
    console.error(
      "Failed to send owner payment status email:",
      error
    );

    return {
      success: false,
      error,
    };
  }
}