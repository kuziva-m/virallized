/**
 * Global toast singleton.
 * Call toast.success / toast.error / toast.info from anywhere.
 * The ToastContainer component registers the handler on mount.
 */

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

type Handler = (msg: ToastMessage) => void;
let _handler: Handler | null = null;

function fire(message: string, type: ToastType) {
  const id = Math.random().toString(36).slice(2);
  if (_handler) {
    _handler({ id, message, type });
  } else {
    // fallback if ToastContainer not mounted yet
    if (type === "error") console.error("[toast]", message);
    else console.log("[toast]", message);
  }
}

export const toast = {
  success: (message: string) => fire(message, "success"),
  error:   (message: string) => { console.error(message); fire(message, "error"); },
  info:    (message: string) => fire(message, "info"),
  /** Called by ToastContainer on mount */
  _register:   (h: Handler)  => { _handler = h; },
  _unregister: ()            => { _handler = null; },
};
