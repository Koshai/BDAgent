"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const ToastCtx = createContext<(msg: string) => void>(() => undefined);

export function useToast() {
  return useContext(ToastCtx);
}

export function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([]);
  const toast = useCallback((msg: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastCtx.Provider value={toast}>
        {children}
        <div className="toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              {t.msg}
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    </ThemeProvider>
  );
}
