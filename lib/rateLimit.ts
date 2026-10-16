import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "dueblink:password-reset",
});

export const reminderGenerationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "15 m"),
  analytics: true,
  prefix: "dueblink:reminder-generation",
});

export const contactRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "dueblink:contact",
});

export const createOrderRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  analytics: true,
  prefix: "dueblink:create-order",
});

export const proRecoveryAssistantRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "15 m"),
  analytics: true,
  prefix: "dueblink:pro-recovery-assistant",
});

export const sendWelcomeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
  analytics: true,
  prefix: "dueblink:send-welcome",
});

export const verifyPaymentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  analytics: true,
  prefix: "dueblink:verify-payment",
});
// Blink chat on the landing page (visitors, no login):
// 15 messages per visitor per day...
export const landingChatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "1 d"),
  analytics: true,
  prefix: "dueblink:landing-chat",
});

// ...and a safety cap for the whole site, so a flood of visitors
// (or bots) can never run up the OpenAI bill.
export const landingChatGlobalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2000, "1 d"),
  analytics: true,
  prefix: "dueblink:landing-chat-global",
});
