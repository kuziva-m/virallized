import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { toast } from "../lib/toast";
import type { ToastMessage } from "../lib/toast";

const DURATION = 4500; // ms before auto-dismiss

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  useEffect(() => {
    toast._register((msg) => {
      setToasts((prev) => [...prev.slice(-3), msg]); // keep max 4
      setTimeout(() => dismiss(msg.id), DURATION);
    });
    return () => toast._unregister();
  }, []);

  const dismiss = (id: string) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExiting((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, 350);
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2.5 items-stretch sm:items-end pointer-events-none">
      {toasts.map((t) => {
        const leaving = exiting.has(t.id);
        const cfg = CONFIGS[t.type];
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto w-full sm:w-auto sm:min-w-[300px] sm:max-w-[400px]
              flex items-start gap-3 px-4 py-3.5
              rounded-2xl shadow-2xl border
              ${cfg.bg} ${cfg.border}
              transition-all duration-300 ease-out
              ${leaving ? "opacity-0 translate-x-4 scale-95" : "opacity-100 translate-x-0 scale-100"}
            `}
            style={{ willChange: "transform, opacity" }}
          >
            <cfg.Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconColor}`} />
            <p className={`flex-1 text-sm font-semibold leading-snug ${cfg.text}`}>
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className={`shrink-0 mt-0.5 ${cfg.closeColor} hover:opacity-70 transition-opacity`}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const CONFIGS = {
  success: {
    bg:         "bg-white",
    border:     "border-emerald-200",
    iconColor:  "text-emerald-500",
    text:       "text-slate-800",
    closeColor: "text-slate-400",
    Icon:       CheckCircle,
  },
  error: {
    bg:         "bg-white",
    border:     "border-red-200",
    iconColor:  "text-[#f80d5d]",
    text:       "text-slate-800",
    closeColor: "text-slate-400",
    Icon:       XCircle,
  },
  info: {
    bg:         "bg-white",
    border:     "border-slate-200",
    iconColor:  "text-slate-400",
    text:       "text-slate-700",
    closeColor: "text-slate-300",
    Icon:       Info,
  },
};
