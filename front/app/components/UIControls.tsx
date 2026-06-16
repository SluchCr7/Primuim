"use client";

import React, { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { HelpCircle } from "lucide-react";

// ==========================================
// ACCESSIBLE BUTTON
// ==========================================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  isLoading?: boolean;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded font-semibold text-xs uppercase tracking-widest transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none h-11 px-6 shadow-sm";
  
  const variants = {
    primary: "bg-foreground text-background hover:bg-gold hover:text-luxury-white",
    secondary: "bg-gold text-luxury-white hover:bg-gold-hover",
    outline: "border border-card-border bg-transparent text-foreground hover:border-gold hover:text-gold",
    danger: "bg-error text-luxury-white hover:bg-error/90",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Processing
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// ==========================================
// ACCESSIBLE INPUT
// ==========================================
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = "",
  type = "text",
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 transition-all ${error ? "border-error focus:border-error" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-error font-medium">
          {error}
        </span>
      )}
    </div>
  );
};

// ==========================================
// ACCESSIBLE TEXTAREA
// ==========================================
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  id,
  className = "",
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 transition-all ${error ? "border-error focus:border-error" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${textareaId}-error`} className="text-xs text-error font-medium">
          {error}
        </span>
      )}
    </div>
  );
};

// ==========================================
// ACCESSIBLE SELECT
// ==========================================
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  id,
  children,
  className = "",
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 transition-all ${error ? "border-error focus:border-error" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span id={`${selectId}-error`} className="text-xs text-error font-medium">
          {error}
        </span>
      )}
    </div>
  );
};

// ==========================================
// STATISTIC CARD
// ==========================================
interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
}

export const StatisticCard: React.FC<StatCardProps> = ({ label, value, icon, description }) => {
  return (
    <div className="luxury-card p-5 flex items-center gap-4 hover:border-gold/30 transition-all duration-300 shadow-sm">
      <div className="rounded bg-gold/10 p-3 text-gold flex-shrink-0">
        {icon}
      </div>
      <div className="flex-grow">
        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">{label}</span>
        <span className="text-xl font-bold text-foreground block mt-0.5">{value}</span>
        {description && (
          <span className="text-[10px] text-success font-medium mt-1 block">{description}</span>
        )}
      </div>
    </div>
  );
};

// ==========================================
// EMPTY STATE
// ==========================================
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionLink?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  actionLink,
}) => {
  return (
    <div className="text-center py-16 px-6 luxury-card flex flex-col items-center gap-5 max-w-lg mx-auto shadow-sm">
      {icon && (
        <div className="rounded-full bg-gold/10 p-5 text-gold mb-1">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-xl font-bold">{title}</h3>
      <p className="text-sm text-muted max-w-sm leading-relaxed font-light">{description}</p>
      {actionText && (
        <div className="mt-2">
          {actionLink ? (
            <a
              href={actionLink}
              className="inline-flex h-11 items-center justify-center rounded bg-foreground px-6 text-xs font-semibold uppercase tracking-wider text-background hover:bg-gold hover:text-luxury-white transition-all shadow-md"
            >
              {actionText}
            </a>
          ) : (
            <Button onClick={onAction}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// TOOLTIP (ACCESSIBLE POPOVER)
// ==========================================
interface TooltipProps {
  content: string;
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 z-50 p-2 text-[10px] leading-relaxed text-luxury-white bg-luxury-black/95 dark:bg-card-bg border border-card-border rounded shadow-lg text-center"
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};
