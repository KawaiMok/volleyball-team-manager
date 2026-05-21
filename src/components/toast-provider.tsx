"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useCapacitorNative } from "@/hooks/use-capacitor-native";

type ToastVariant = "error" | "success" | "hint";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  /** 顯示錯誤 toast（註解：類似手機底部彈出提示）。 */
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  /** 中性提示（註解：如「再按一次退出」）。 */
  showHint: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4200;

/**
 * 全域 toast（註解：固定於螢幕下方，含 safe-area，適合手機 WebView）。
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const native = useCapacitorNative();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      idRef.current += 1;
      setToast({ id: idRef.current, message: trimmed, variant });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const showError = useCallback((message: string) => show(message, "error"), [show]);
  const showSuccess = useCallback((message: string) => show(message, "success"), [show]);
  const showHint = useCallback((message: string) => show(message, "hint"), [show]);

  useEffect(() => () => dismiss(), [dismiss]);

  const toastBottomPad =
    native ?
      "pb-[calc(4.5rem+max(1rem,env(safe-area-inset-bottom)))]"
    : "pb-[max(1rem,env(safe-area-inset-bottom))]";

  return (
    <ToastContext.Provider value={{ showError, showSuccess, showHint }}>
      {children}
      {toast ?
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 ${toastBottomPad}`}
          role="presentation"
        >
          <div
            key={toast.id}
            role="alert"
            aria-live="assertive"
            className={`toast-pop pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-center text-sm font-medium shadow-lg ${
              toast.variant === "error" ?
                "border border-red-300 bg-red-600 text-white dark:border-red-800 dark:bg-red-700"
              : toast.variant === "success" ?
                "border border-emerald-300 bg-emerald-600 text-white dark:border-emerald-800 dark:bg-emerald-700"
              : "border border-zinc-300 bg-zinc-800 text-white dark:border-zinc-600 dark:bg-zinc-700"
            }`}
          >
            {toast.message}
          </div>
        </div>
      : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast 須在 ToastProvider 內使用");
  }
  return ctx;
}
