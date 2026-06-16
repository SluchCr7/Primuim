"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by Sentry Boundary:", error, errorInfo);
    
    // Simulate Sentry SDK call
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
      return (
        <div className="min-h-screen w-screen flex flex-col bg-background text-foreground items-center justify-center p-6 text-center">
          <div className="luxury-card p-8 max-w-md flex flex-col items-center gap-6 border-error shadow-xl">
            <div className="rounded-full bg-error/10 p-5 text-error">
              <AlertTriangle className="h-10 w-10 animate-pulse" />
            </div>
            
            <div>
              <span className="text-[10px] font-bold tracking-widest text-error uppercase">Security & Integrity Boundary</span>
              <h2 className="font-serif text-2xl font-bold mt-1">Portal Rendering Interrupted</h2>
              <p className="text-xs text-muted font-light leading-relaxed mt-2">
                A fatal runtime error was captured by our telemetry hooks. The concierge desk has been notified.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-background p-3 rounded border border-card-border text-left font-mono text-[10px] text-error overflow-auto max-h-[100px]">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-1/2 h-10 border border-card-border hover:bg-muted-light rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reload Portal
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-1/2 h-10 bg-foreground text-background hover:bg-gold hover:text-luxury-white rounded text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Go to Lobby
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] text-muted font-light">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span>Sentry Telemetry Shield active &bull; E-Commerce Portal 2026</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
