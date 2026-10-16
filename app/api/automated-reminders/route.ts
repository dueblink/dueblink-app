import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getAdminAuth } from "@/lib/firebaseAdminAuth";
import { createPaymentActionToken } from "@/lib/paymentActionToken";
import { generateEmailReminder } from "@/lib/generateReminder";
import {
  sendAutomatedReminderEmail,
  sendOwnerPaymentStatusEmail,
  sendProExpiryReminderEmail,
} from "@/lib/emailService";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const cronSecret = process.env.CRON_SECRET;

// ------------------------------------------------------------
// Reminder stages, in order. A client only ever moves forward:
// first -> follow-up -> final. Each stage is sent at most once.
// ------------------------------------------------------------
const STAGE_ORDER: Record<string, number> = {
  first: 1,
  "follow-up": 2,
  final: 3,
};

// Never send two automatic reminders to the same client
// less than this many days apart.
const MIN_DAYS_BETWEEN_REMINDERS = 2;

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

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

// The stage a client SHOULD be at, based on how late they are.
// Uses ranges (3 days or more), not exact days, so a missed run
// or an invoice added late still gets reminded.
function getStageForDaysOverdue(daysOverdue: number): string | null {
  if (daysOverdue >= 7) {
    return "final";
  }

  if (daysOverdue >= 3) {
    return "follow-up";
  }

  if (daysOverdue >= 0) {
    return "first";
  }

  return null;
}

function toDateOrNull(value: any): Date | null {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);

  return isNaN(date.getTime()) ? null : date;
}

// The freelancer's email (for reply-to and the digest) and name
// (to sign the reminder).
async function getOwnerInfo(
  adminAuth: ReturnType<typeof getAdminAuth>,
  userId: string
): Promise<{ email: string | null; name: string }> {
  try {
    const userRecord = await adminAuth.getUser(userId);

    return {
      email: userRecord.email || null,
      name: (userRecord.displayName || "").trim(),
    };
  } catch (error) {
    console.error(`Could not get owner info for user ${userId}:`, error);

    return { email: null, name: "" };
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
          (today.getTime() - dueDateObject.getTime()) / ONE_DAY_MS
        );

        const reminderStage = getStageForDaysOverdue(daysOverdue);

        // How many calendar days (India time) since the last
        // automatic reminder. null = never sent one.
        const lastSentAt = toDateOrNull(
          data.lastAutomatedReminderSentAt
        );

        const daysSinceLastReminder = lastSentAt
          ? Math.floor(
              (today.getTime() -
                parseDateOnly(getIndiaDate(lastSentAt)).getTime()) /
                ONE_DAY_MS
            )
          : null;

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
          // The client's reminder language (old clients: English).
          language: data.language || "english",
          // The add-client form saves "invoiceNumber"; older records may use "invoiceRef".
          invoiceRef: data.invoiceRef || data.invoiceNumber || "",
          reminderStage,
          lastAutomatedReminderStage:
            (data.lastAutomatedReminderStage as string | undefined) ||
            null,
          daysSinceLastReminder,
          reminderHistory: Array.isArray(data.reminderHistory)
            ? data.reminderHistory
            : [],
        };
      })
      .filter((client) => {
        if (client === null || client.reminderStage === null) {
          return false;
        }

        // Only send if the client has reached a LATER stage than
        // the last one sent. This stops repeats, and if a client is
        // already 10 days late it sends one firm reminder, not three.
        const targetStageNumber = STAGE_ORDER[client.reminderStage];

        const lastStageNumber = client.lastAutomatedReminderStage
          ? STAGE_ORDER[client.lastAutomatedReminderStage] || 0
          : 0;

        if (targetStageNumber <= lastStageNumber) {
          return false;
        }

        // Leave a gap between reminders so a client never gets
        // two automatic emails on back-to-back days.
        if (
          client.daysSinceLastReminder !== null &&
          client.daysSinceLastReminder < MIN_DAYS_BETWEEN_REMINDERS
        ) {
          return false;
        }

        return true;
      });

    const results = [];

    const ownerProStatus = new Map<string, boolean>();

    for (const client of eligibleClients) {
      if (!client || !client.reminderStage) {
        continue;
      }

      let isOwnerPro = ownerProStatus.get(client.userId);

      if (isOwnerPro === undefined) {
        const ownerSnapshot = await db
          .collection("users")
          .doc(client.userId)
          .get();

        if (!ownerSnapshot.exists) {
          isOwnerPro = false;
        } else {
          const ownerData = ownerSnapshot.data() || {};

          isOwnerPro = Boolean(ownerData.isPro);

          if (isOwnerPro && ownerData.proExpiresAt) {
            const expirationDate =
              typeof ownerData.proExpiresAt.toDate === "function"
                ? ownerData.proExpiresAt.toDate()
                : new Date(ownerData.proExpiresAt);

            if (new Date() >= expirationDate) {
              isOwnerPro = false;
            }
          }
        }

        ownerProStatus.set(client.userId, isOwnerPro);
      }

      if (!isOwnerPro) {
        continue;
      }

      if (!client.email) {
        continue;
      }

      try {
        // The freelancer's email (reply-to + digest) and name (sign-off).
        const owner = await getOwnerInfo(adminAuth, client.userId);
        const ownerEmail = owner.email;

        // Write the email with the shared reminder rules: short, amount
        // and days late first, one question, signed with the
        // freelancer's name, no invented invoice numbers.
        const generatedEmail = await generateEmailReminder({
          clientName: client.name || "Client",
          currency: client.currency,
          amount: client.amount || "0",
          daysOverdue: client.daysOverdue,
          invoiceRef: client.invoiceRef,
          tone: client.tone,
          paymentLink: client.paymentLink,
          // The email shows a "Pay Now" button for the link.
          paymentLinkShownAsButton: Boolean(client.paymentLink),
          stage: client.reminderStage,
          dueDate: client.dueDate,
          senderName: owner.name,
          // Writes the email in the client's language.
          language: client.language,
          // Original stage instructions, with the real number of days late.
          variationInstruction:
            client.reminderStage === "first"
              ? `Write a polite first payment reminder. The payment is ${
                  client.daysOverdue === 0 ? "due today" : `${client.daysOverdue} days overdue`
                }.`
              : client.reminderStage === "follow-up"
              ? `Write a fresh follow-up for a payment that is ${client.daysOverdue} days overdue. Do not sound repetitive.`
              : `Write a final but professional follow-up for a payment that is ${client.daysOverdue} days overdue. Remain respectful and clear.`,
          // Earlier emails to this client, so the new one is different.
          previousReminders: client.reminderHistory
            .filter((r: any) => r && r.email_body)
            .map((r: any) => ({
              email_subject: r.email_subject || "",
              email_body: r.email_body || "",
            })),
        });

        // Send the email — now with the payment link (so the "Pay Now"
        // button actually renders) and the owner's email as reply-to
        // (so a client hitting "Reply" reaches the freelancer, not no-reply@).
        const sendResult = await sendAutomatedReminderEmail(
          client.email,
          generatedEmail.email_subject,
          generatedEmail.email_body,
          client.paymentLink,
          ownerEmail || undefined
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

    // ------------------------------------------------------------
    // PRO ENDING SOON: email Pro users whose plan ends within 3 days,
    // once per plan period. Never let this break the reminder job.
    // ------------------------------------------------------------
    let proExpiryEmailsSent = 0;

    try {
      const now = new Date();
      const inThreeDays = new Date(now.getTime() + 3 * ONE_DAY_MS);

      const endingSoon = await db
        .collection("users")
        .where("proExpiresAt", ">", now)
        .where("proExpiresAt", "<=", inThreeDays)
        .get();

      for (const userDoc of endingSoon.docs) {
        const userData = userDoc.data() || {};
        if (!userData.isPro) continue;

        const expiry =
          typeof userData.proExpiresAt?.toDate === "function"
            ? userData.proExpiresAt.toDate()
            : new Date(userData.proExpiresAt);
        if (isNaN(expiry.getTime())) continue;

        // One email per plan period: skip if already sent for this end date.
        const expiryKey = getIndiaDate(expiry);
        if (userData.proExpiryReminderFor === expiryKey) continue;

        const owner = await getOwnerInfo(adminAuth, userDoc.id);
        const email = owner.email || userData.email || userData.emailAddress;
        if (!email) continue;

        const endsOn = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(expiry);

        const sent = await sendProExpiryReminderEmail(
          email,
          owner.name || userData.name || userData.displayName || "there",
          endsOn
        );

        if (sent.success) {
          await userDoc.ref.update({ proExpiryReminderFor: expiryKey });
          proExpiryEmailsSent++;
        }
      }
    } catch (proReminderError) {
      console.error("Pro expiry reminder step failed:", proReminderError);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
      proExpiryEmailsSent,
    });
  } catch (error: any) {
    console.error("Automated reminders route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process automated reminders.",
      },
      { status: 500 }
    );
  }
}
