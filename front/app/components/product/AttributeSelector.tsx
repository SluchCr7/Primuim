"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductAttribute {
  name: string;
  values: string[];
}

export interface ProductVariant {
  sku: string;
  price?: number;
  stock: number;
  /** New explicit combination map e.g. { Color: "Red", Size: "M" } */
  combination?: Record<string, string>;
  /** @deprecated legacy Map — kept for backward-compat */
  attributes?: Record<string, string>;
}

export interface AttributeSelectorProps {
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  selection: Record<string, string>;
  onSelectionChange: (newSelection: Record<string, string>) => void;
  /** Optional: the matched active variant (derived by parent) */
  activeVariant?: ProductVariant | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a variant's attributes into a plain Record<string,string>.
 * Handles both the new `combination` Map and the legacy `attributes` Map.
 */
function getVariantCombination(v: ProductVariant): Record<string, string> {
  if (v.combination && Object.keys(v.combination).length > 0) return v.combination;
  if (v.attributes && Object.keys(v.attributes).length > 0) return v.attributes as Record<string, string>;
  return {};
}

/**
 * Check whether a proposed partial selection (currentSelection + axisToPick:value)
 * has at least one variant with stock > 0.
 */
function isValueAvailable(
  axisName: string,
  value: string,
  currentSelection: Record<string, string>,
  variants: ProductVariant[]
): boolean {
  const proposed = { ...currentSelection, [axisName]: value };

  return variants.some((v) => {
    if (v.stock <= 0) return false;
    const combo = getVariantCombination(v);
    // The proposed selection must be a subset of the variant's combination
    return Object.entries(proposed).every(([k, val]) => combo[k] === val);
  });
}

/**
 * Try to detect if a string is a valid CSS named color or hex.
 * Used to decide whether to render a color swatch vs text pill.
 */
function isColorValue(value: string): boolean {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return true;
  const namedColors = new Set([
    "red","blue","green","black","white","gray","grey","yellow","orange",
    "purple","pink","brown","navy","teal","cyan","magenta","lime","indigo",
    "violet","gold","silver","coral","salmon","beige","ivory","khaki","maroon",
    "olive","aqua","turquoise","cream","mint","lavender","rose","charcoal",
  ]);
  return namedColors.has(value.toLowerCase().replace(/\s+/g, ""));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: single axis row
// ─────────────────────────────────────────────────────────────────────────────

interface AxisRowProps {
  axis: ProductAttribute;
  selection: Record<string, string>;
  variants: ProductVariant[];
  onSelect: (axisName: string, value: string) => void;
}

function AxisRow({ axis, selection, variants, onSelect }: AxisRowProps) {
  const isColorAxis =
    axis.name.toLowerCase() === "color" || axis.name.toLowerCase() === "colour";

  return (
    <div className="flex flex-col gap-2.5">
      {/* Axis label + current selection */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
          {axis.name}
        </span>
        {selection[axis.name] && (
          <motion.span
            key={selection[axis.name]}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-semibold text-gold"
          >
            {selection[axis.name]}
          </motion.span>
        )}
      </div>

      {/* Pills / swatches */}
      <div className="flex flex-wrap gap-2">
        {axis.values.map((val) => {
          const isSelected = selection[axis.name] === val;
          const available = isValueAvailable(axis.name, val, selection, variants);
          const showColorSwatch = isColorAxis && isColorValue(val);

          if (showColorSwatch) {
            return (
              <button
                key={val}
                title={val}
                disabled={!available}
                onClick={() => available && onSelect(axis.name, val)}
                aria-label={`${axis.name}: ${val}${!available ? " (out of stock)" : ""}`}
                className={[
                  "relative h-8 w-8 rounded-full border-2 transition-all duration-200 cursor-pointer",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                  isSelected
                    ? "border-gold scale-110 ring-2 ring-gold/20 shadow-md"
                    : "border-card-border hover:border-gold/60 hover:scale-105",
                  !available ? "opacity-40 cursor-not-allowed" : "",
                ].join(" ")}
                style={{ backgroundColor: val.toLowerCase() }}
              >
                {/* Out-of-stock overlay */}
                {!available && (
                  <span className="absolute inset-0 rounded-full overflow-hidden" aria-hidden>
                    <span className="absolute inset-0 bg-background/60" />
                  </span>
                )}
                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 12 10" className="h-2.5 w-2.5" fill="none">
                      <path d="M1 5l3 3 7-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            );
          }

          // Text pill
          return (
            <button
              key={val}
              disabled={!available}
              onClick={() => available && onSelect(axis.name, val)}
              aria-label={`${axis.name}: ${val}${!available ? " (out of stock)" : ""}`}
              className={[
                "relative px-4 py-2 text-[11px] font-semibold rounded-xl border transition-all duration-200 cursor-pointer",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                isSelected
                  ? "border-gold bg-gold/10 text-gold shadow-sm"
                  : "border-card-border text-muted hover:border-gold/50 hover:text-foreground",
                !available ? "opacity-40 cursor-not-allowed line-through decoration-muted/60" : "",
              ].join(" ")}
            >
              {val}
              {/* Out-of-stock dot */}
              {!available && (
                <span
                  title="Out of stock"
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-error border border-background"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────────────────────────────────────

export default function AttributeSelector({
  attributes,
  variants,
  selection,
  onSelectionChange,
  activeVariant,
}: AttributeSelectorProps) {
  const activeStock = useMemo(() => {
    if (!activeVariant) return null;
    return activeVariant.stock;
  }, [activeVariant]);

  const allSelected = useMemo(() => {
    return attributes.every((axis) => selection[axis.name] !== undefined);
  }, [attributes, selection]);

  const handleSelect = (axisName: string, value: string) => {
    onSelectionChange({ ...selection, [axisName]: value });
  };

  if (!attributes || attributes.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {attributes.map((axis) => (
        <AxisRow
          key={axis.name}
          axis={axis}
          selection={selection}
          variants={variants}
          onSelect={handleSelect}
        />
      ))}

      {/* Variant stock status badge — only shown after full selection */}
      {allSelected && (
        <motion.div
          key={activeVariant?.sku ?? "no-variant"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={[
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-semibold w-fit",
            activeStock !== null && activeStock > 0
              ? "bg-success/10 border border-success/30 text-success"
              : "bg-error/10 border border-error/30 text-error",
          ].join(" ")}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              activeStock !== null && activeStock > 0 ? "bg-success" : "bg-error"
            }`}
          />
          {activeStock === null
            ? "Select all options"
            : activeStock > 0
            ? `${activeStock} in stock for this combination`
            : "This combination is out of stock"}
        </motion.div>
      )}
    </div>
  );
}
