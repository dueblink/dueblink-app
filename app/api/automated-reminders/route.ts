import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getAdminAuth } from "@/lib/firebaseAdminAuth";
import { createPaymentActionToken } from "@/lib/paymentActionToken";
import { generateEmailReminder } from "@/lib/generateReminder";
import {
  sendAutomatedReminderEmail,
  sendOwnerPaymentStatusEmail,
} from "@/lib/emailService";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const cronSecret = process.env.CRON_SECRET;

function getIndiaDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDateOnly(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

async function getOwnerEmail(
  adminAuth: ReturnType<typeof getAdminAuth>,
  userId: string
) {
  try {
    const userRecord = await adminAuth.getUser(userId);

    return userRecord.email || null;
  } catch (error) {
    console.error(`Could not get owner email for user ${userId}:`, error);

    return null;
  }
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (
    !cronSecret ||
    authorization !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const db = getAdminDb();
    const adminAuth = getAdminAuth();

    const ownerPaymentItems = new Map<
      string,
      {
        email: string;
        items: {
          clientName: string;
          amount: string;
          paidLink: string;
          notYetLink: string;
        }[];
      }
    >();

    const appOrigin = new URL(request.url).origin;

    const snapshot = await db
      .collection("clients")
      .where("automatedReminders", "==", true)
      .where("automationStatus", "==", "active")
      .where("status", "==", "Pending")
      .get();

    const todayString = getIndiaDate(new Date());
    const today = parseDateOnly(todayString);

    const eligibleClients = snapshot.docs
      .map((doc) => {
        const data = doc.data();

        let dueDate = "";

        if (typeof data.dueDate === "string") {
          dueDate = data.dueDate.substring(0, 10);
        } else if (
          data.dueDate &&
          typeof data.dueDate.toDate === "function"
        ) {
          dueDate = getIndiaDate(data.dueDate.toDate());
        }

        if (!dueDate) {
          return null;
        }

        const dueDateObject = parseDateOnly(dueDate);

        const daysOverdue = Math.floor(
          (today.getTime() - dueDateObject.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        let reminderStage: string | null = null;

        if (daysOverdue === 0) {
          reminderStage = "first";
        } else if (daysOverdue === 3) {
          reminderStage = "follow-up";
        } else if (daysOverdue === 7) {
          reminderStage = "final";
        }

        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          amount: data.amount,
          paymentLink: data.paymentLink || "",
          currency: data.currency || "₹",
          dueDate,
          daysOverdue,
          status: data.status,
          automatedReminders: data.automatedReminders,
          automationStatus: data.automationStatus,
          userId: data.userId,
          tone: data.tone || "professional",
          invoiceRef: data.invoiceRef || "",
          reminderStage,
          lastAutomatedReminderStage:
            data.lastAutomatedReminderStage || null,
        };
      })
      .filter(
        (client) =>
          client !== null &&
          client.reminderStage !== null &&
          client.lastAutomatedReminderStage !== client.reminderStage
      );

    const results = [];

    for (const client of eligibleClients) {
      if (!client || !client.email) {
        continue;
      }

      try {
        // Generate a unique email using the same AI reminder system.
        const generatedEmail = await generateEmailReminder({
          clientName: client.name || "Client",
          currency: client.currency,
          amount: client.amount || "0",
          daysOverdue: client.daysOverdue,
          invoiceRef: client.invoiceRef,
          tone: client.tone,
          paymentLink: client.paymentLink,
          variationInstruction:
            client.reminderStage === "first"
              ? "Write a polite first payment reminder appropriate for the due date."
              : client.reminderStage === "follow-up"
              ? "Write a fresh follow-up for a payment that is 3 days overdue. Do not sound repetitive."
              : "Write a final but professional follow-up for a payment that is 7 days overdue. Remain respectful and clear.",
        });

        // Send ONLY the email.
        const sendResult = await sendAutomatedReminderEmail(
          client.email,
          generatedEmail.email_subject,
          generatedEmail.email_body
        );

        if (!sendResult.success) {
          results.push({
            id: client.id,
            name: client.name,
            success: false,
            stage: client.reminderStage,
            error: "Email could not be sent.",
          });

          continue;
        }

        // ------------------------------------------------------------
        // EMAIL SENT SUCCESSFULLY
        // Save the automated reminder in the client's reminder history.
        // ------------------------------------------------------------
        await db.collection("clients").doc(client.id).update({
          lastAutomatedReminderStage: client.reminderStage,
          lastAutomatedReminderSentAt: new Date(),

          reminderHistory: FieldValue.arrayUnion({
            type: "automated",
            channel: "email",
            stage: client.reminderStage,
            email_subject: generatedEmail.email_subject,
            email_body: generatedEmail.email_body,
            paymentLink: client.paymentLink || "",
            sentAt: new Date(),
          }),
        });

        const ownerEmail = await getOwnerEmail(
          adminAuth,
          client.userId
        );

        if (ownerEmail) {
          const paidToken = createPaymentActionToken(
            client.userId,
            client.id,
            "paid"
          );

          const notYetToken = createPaymentActionToken(
            client.userId,
            client.id,
            "not_yet"
          );

          const paidLink =
            `${appOrigin}/api/payment-status?token=${encodeURIComponent(
              paidToken
            )}`;

          const notYetLink =
            `${appOrigin}/api/payment-status?token=${encodeURIComponent(
              notYetToken
            )}`;

          if (!ownerPaymentItems.has(ownerEmail)) {
            ownerPaymentItems.set(ownerEmail, {
              email: ownerEmail,
              items: [],
            });
          }

          ownerPaymentItems.get(ownerEmail)!.items.push({
            clientName: client.name || "Client",
            amount: `${client.currency}${client.amount || "0"}`,
            paidLink,
            notYetLink,
          });
        }

        results.push({
          id: client.id,
          name: client.name,
          email: client.email,
          success: true,
          stage: client.reminderStage,
        });
      } catch (error) {
        console.error(
          `Failed automated reminder for client ${client.id}:`,
          error
        );

        results.push({
          id: client.id,
          name: client.name,
          success: false,
          stage: client.reminderStage,
          error: "Failed to generate or send reminder.",
        });
      }
    }

    for (const owner of ownerPaymentItems.values()) {
      if (owner.items.length === 0) {
        continue;
      }

      await sendOwnerPaymentStatusEmail(
        owner.email,
        owner.items
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Automated reminders route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process automated reminders.",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}