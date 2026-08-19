import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyPaymentActionToken } from "@/lib/paymentActionToken";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Invalid payment action link.", {
        status: 400,
      });
    }

    const action = verifyPaymentActionToken(token);

    if (!action) {
      return new NextResponse(
        "This payment action link is invalid or has expired.",
        {
          status: 400,
        }
      );
    }

    const db = getAdminDb();

    const clientRef = db.collection("clients").doc(action.clientId);
    const clientSnap = await clientRef.get();

    if (!clientSnap.exists) {
      return new NextResponse("Client not found.", {
        status: 404,
      });
    }

    const client = clientSnap.data();

    if (!client || client.userId !== action.userId) {
      return new NextResponse("Unauthorized payment action.", {
        status: 403,
      });
    }

    if (action.action === "paid") {
      await clientRef.update({
        status: "Paid",
        paymentMarkedPaidAt: new Date(),
        paymentMarkedPaidVia: "email",
      });

      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Payment Updated - DueBlink</title>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1>✓ Payment marked as paid</h1>
            <p>${client.name || "Client"} — ${client.amount || ""}</p>
            <p>You can close this page.</p>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    if (action.action === "not_yet") {
      await clientRef.update({
        lastPaymentStatusCheckAt: new Date(),
        lastPaymentStatusResponse: "not_yet",
      });

      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Payment Still Pending - DueBlink</title>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1>Payment still pending</h1>
            <p>${client.name || "Client"} — ${client.amount || ""}</p>
            <p>We'll keep this invoice pending.</p>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    return new NextResponse("Invalid payment action.", {
      status: 400,
    });
  } catch (error) {
    console.error("Payment status action error:", error);

    return new NextResponse(
      "Something went wrong while processing the payment status.",
      {
        status: 500,
      }
    );
  }
}
