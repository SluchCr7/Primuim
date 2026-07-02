"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// مكون فرعي داخلي لاستخدام دالة t() داخل كود الكلاس القديم
function ErrorBoundaryView({ error, handleReset }: { error: Error | null, handleReset: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-screen flex flex-col bg-background text-foreground items-center justify-center p-6 text-center">
      <div className="luxury-card p-8 max-w-md flex flex-col items-center gap-6 border-error shadow-xl">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error animate-pulse">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-xl font-bold tracking-wider text-error">
            {t("Uncaught error captured by Sentry Boundary:", "Uncaught error captured by Sentry Boundary:")}
          </h2>
          <p className="text-xs text-muted max-w-sm leading-relaxed">
            {error?.message || t("An unexpected error occurred in the system.", "An unexpected error occurred in the system.")}
          </p>
        </div>

        {error && (
          <div className="w-full bg-background p-3 rounded border border-card-border text-left font-mono text-[10px] text-error overflow-auto max-h-[100px]">
            {error.toString()}
          </div>
        )}

        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-1/2 h-10 border border-card-border hover:bg-muted-light rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t("Reload Portal", "Reload Portal")}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-1/2 h-10 bg-foreground text-background hover:bg-gold hover:text-luxury-white rounded text-xs font-semibold uppercase tracking-wider transition-all"
          >
            {t("Go to Lobby", "Go to Lobby")}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] text-muted font-light">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <span>{t("Sentry Telemetry Shield active & bull; E-Commerce Portal 2026", "Sentry Telemetry Shield active • E-Commerce Portal 2026")}</span>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by Sentry Boundary:", error, errorInfo);
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo });
    }
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorBoundaryView error={this.state.error} handleReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;