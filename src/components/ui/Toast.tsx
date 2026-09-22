import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: { icon: CheckCircle2, className: "border-success-600 text-success-700" },
  error: { icon: XCircle, className: "border-danger-600 text-danger-700" },
  warning: { icon: AlertTriangle, className: "border-warning-600 text-warning-700" },
  info: { icon: Info, className: "border-accent-600 text-accent-700" },
};

/** The one global success/error/warning notification mechanism —
 * `useToast().toast({...})` is called from mutation handlers across
 * every feature, never a per-screen ad-hoc banner. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { ...message, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {messages.map((message) => {
          const { icon: Icon, className } = variantStyles[message.variant];
          return (
            <RadixToast.Root
              key={message.id}
              onOpenChange={(open) => {
                if (!open) dismiss(message.id);
              }}
              className={cn(
                "flex items-start gap-2 rounded-card border-l-4 bg-white p-3 pr-2 shadow-lg",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                className
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="flex-1">
                <RadixToast.Title className="text-sm font-medium text-slate-900">
                  {message.title}
                </RadixToast.Title>
                {message.description && (
                  <RadixToast.Description className="mt-0.5 text-xs text-slate-500">
                    {message.description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-80 max-w-full flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
