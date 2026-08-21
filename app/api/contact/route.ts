import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      subject,
      message,
    } = await req.json();

    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // ======================================================
    // 1. Validate required fields
    // ======================================================

    if (!name || !email || !message) {
      return Response.json(
        {
          success: false,
          message: "Name, email and message are required.",
        },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(String(email).trim())) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 2. Send contact message through Resend
    // ======================================================

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "No subject");
    const safeMessage = escapeHtml(message);

    const { data, error } = await resend.emails.send({
      from: "DueBlink Support <support@dueblink.com>",
      to: ["support@dueblink.com"],

      // Important:
      // When you reply from Gmail, the reply goes to the
      // customer's email address.
      replyTo: email,

      subject: subject
        ? `[Contact Form] ${subject}`
        : `[Contact Form] Message from ${name}`,

      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >
          <title>New Contact Form Message</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#F8FAFC;
            font-family:-apple-system,BlinkMacSystemFont,
            'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
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
              padding:40px 16px;
            "
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    max-width:620px;
                    background:#ffffff;
                    border-radius:20px;
                    border:1px solid #E2E8F0;
                    overflow:hidden;
                  "
                >

                  <!-- HEADER -->

                  <tr>
                    <td
                      style="
                        padding:24px 30px;
                        border-bottom:1px solid #F1F5F9;
                      "
                    >
                      <img
                        src="https://dueblink.com/logo.png"
                        alt="DueBlink"
                        width="120"
                        style="
                          display:block;
                          width:120px;
                          height:auto;
                          border:0;
                        "
                      />
                    </td>
                  </tr>

                  <!-- CONTENT -->

                  <tr>
                    <td style="padding:30px;">

                      <p
                        style="
                          margin:0 0 8px;
                          font-size:11px;
                          font-weight:800;
                          color:#245B92;
                          text-transform:uppercase;
                          letter-spacing:.6px;
                        "
                      >
                        NEW CONTACT MESSAGE
                      </p>

                      <h1
                        style="
                          margin:0 0 24px;
                          font-size:24px;
                          line-height:1.3;
                          color:#0F172A;
                        "
                      >
                        Someone contacted DueBlink
                      </h1>

                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                          background:#F8FAFC;
                          border:1px solid #E2E8F0;
                          border-radius:14px;
                        "
                      >
                        <tr>
                          <td style="padding:18px;">

                            <p
                              style="
                                margin:0 0 10px;
                                font-size:13px;
                                color:#475569;
                              "
                            >
                              <strong>Name:</strong>
                              ${safeName}
                            </p>

                            <p
                              style="
                                margin:0 0 10px;
                                font-size:13px;
                                color:#475569;
                              "
                            >
                              <strong>Email:</strong>
                              ${safeEmail}
                            </p>

                            <p
                              style="
                                margin:0;
                                font-size:13px;
                                color:#475569;
                              "
                            >
                              <strong>Subject:</strong>
                              ${safeSubject}
                            </p>

                          </td>
                        </tr>
                      </table>

                      <div
                        style="
                          margin-top:20px;
                          padding:20px;
                          background:#F0FDFA;
                          border-left:4px solid #20B8BE;
                          border-radius:0 12px 12px 0;
                        "
                      >

                        <p
                          style="
                            margin:0 0 8px;
                            font-size:11px;
                            font-weight:800;
                            color:#0F766E;
                            text-transform:uppercase;
                          "
                        >
                          MESSAGE
                        </p>

                        <p
                          style="
                            margin:0;
                            font-size:14px;
                            line-height:1.6;
                            color:#115E59;
                            white-space:pre-wrap;
                          "
                        >
                          ${safeMessage}
                        </p>

                      </div>

                    </td>
                  </tr>

                  <!-- FOOTER -->

                  <tr>
                    <td
                      align="center"
                      style="
                        padding:20px 30px;
                        background:#F8FAFC;
                        border-top:1px solid #F1F5F9;
                      "
                    >
                      <p
                        style="
                          margin:0;
                          font-size:11px;
                          color:#94A3B8;
                        "
                      >
                        Sent from the DueBlink contact form.
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

    // ======================================================
    // 3. Handle Resend error
    // ======================================================

    if (error) {
      console.error(
        "Resend contact email error:",
        error
      );

      return Response.json(
        {
          success: false,
          message: "Failed to send contact message.",
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 4. Success
    // ======================================================

    return Response.json(
      {
        success: true,
        message: "Message sent successfully.",
        data,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "Contact form error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}