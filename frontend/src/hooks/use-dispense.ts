import { useCallback, useState } from "react";

import { sendDispense } from "@/lib/api";
import { FEEDBACK_DURATION_MS, POUR_TIMEOUT_MS } from "@/lib/constants";

export type DispenseState = "idle" | "requesting" | "pouring" | "error";

interface UseDispenseOptions {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

/**
 * Encapsulates the dispense workflow:
 *  idle → requesting → pouring → idle
 *  idle → requesting → error → idle
 */
export function useDispense({ onSuccess, onError }: UseDispenseOptions = {}) {
  const [dispenseState, setDispenseState] = useState<DispenseState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dispense = useCallback(
    async (amountMl: number, userToken: string) => {
      setDispenseState("requesting");
      setErrorMessage(null);

      try {
        const result = await sendDispense({
          amount_ml: amountMl,
          user_token: userToken,
        });

        if (result.success) {
          setDispenseState("pouring");
          onSuccess?.();

          // Return to idle after simulated pour duration
          setTimeout(() => {
            setDispenseState("idle");
          }, POUR_TIMEOUT_MS);
        } else {
          throw new Error(result.reason ?? "Dispense failed");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setDispenseState("error");
        setErrorMessage(message);
        onError?.(message);

        setTimeout(() => {
          setDispenseState("idle");
          setErrorMessage(null);
        }, FEEDBACK_DURATION_MS);
      }
    },
    [onSuccess, onError],
  );

  return { dispenseState, errorMessage, dispense } as const;
}
