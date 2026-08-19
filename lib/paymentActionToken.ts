import crypto from "crypto";

type PaymentAction = "paid" | "not_yet";

type TokenPayload = {
  userId: string;
  clientId: string;
  action: PaymentAction;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.PAYMENT_ACTION_SECRET;

  if (!secret) {
    throw new Error("PAYMENT_ACTION_SECRET is not configured");
  }

  return secret;
}

function createSignature(payload: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
}

export function createPaymentActionToken(
  userId: string,
  clientId: string,
  action: PaymentAction,
  expiresInHours = 72
) {
  const payload: TokenPayload = {
    userId,
    clientId,
    action,
    expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  const signature = createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyPaymentActionToken(token: string) {
  try {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = createSignature(encodedPayload);

    if (signature.length !== expectedSignature.length) {
      return null;
    }

    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!signaturesMatch) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as TokenPayload;

    if (!payload.userId || !payload.clientId || !payload.action) {
      return null;
    }

    if (payload.action !== "paid" && payload.action !== "not_yet") {
      return null;
    }

    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
