const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export interface AnalyticsSummary {
  totalSessions: number;
  verifiedSessions: number;
  conversionRate: number;
  actualCostUsd: number;
  baselineCostUsd: number;
  totalSavedUsd: number;
  totalAttemptsCount: number;
  fallbackToSmsAvoidedCount: number;
}

export interface DeliveryAttempt {
  id: string;
  stepOrder: number;
  channel: "TELEGRAM" | "FLASH_CALL" | "SMS" | "WHATSAPP";
  provider: string;
  costUsd: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  createdAt: string;
  errorMessage?: string;
}

export interface SessionStatus {
  id: string;
  phone: string;
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "BLOCKED";
  currentStepIndex: number;
  attemptsCount: number;
  expiresAt: string;
  verifiedAt?: string;
  cascade: {
    name: string;
    steps: Array<{
      stepOrder: number;
      channel: "TELEGRAM" | "FLASH_CALL" | "SMS" | "WHATSAPP";
      timeoutSeconds: number;
    }>;
  };
  timeline: DeliveryAttempt[];
}

export interface StartVerificationResult {
  sessionId: string;
  phone: string;
  status: string;
  expiresAt: string;
  devOtpCode?: string;
}

export const api = {
  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/verify/analytics/summary`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },

  async startVerification(phone: string): Promise<StartVerificationResult> {
    const res = await fetch(`${API_BASE}/verify/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to start verification");
    }
    return res.json();
  },

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const res = await fetch(`${API_BASE}/verify/session/${sessionId}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch session");
    return res.json();
  },

  async confirmCode(
    sessionId: string,
    code: string,
  ): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/verify/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, code }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Verification failed");
    }
    return res.json();
  },
};
