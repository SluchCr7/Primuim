"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, ChevronRight, ChevronLeft, Package, Palette,
  Tag, Upload, Check, Loader2, AlertCircle, Cpu, Layers,
  ShoppingBag, Image as ImageIcon, Sparkles,
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  useCreateProductMutation,
  useGetCategoriesQuery,
  useUploadImageMutation,
} from "../../../lib/api";
import { useAppSelector } from "../../../lib/store";
import { useToast } from "../../components/Toast";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AttributeRow {
  id: string;
  name: string;
  inputValue: string;
  values: string[];
}

interface VariantRow {
  sku: string;
  combination: Record<string, string>;
  stock: number;
  price: number;
}

interface SpecRow {
  id: string;
  name: string;
  value: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Cartesian product of N arrays → array of combination objects */
function cartesianProduct(axes: { name: string; values: string[] }[]): Record<string, string>[] {
  if (axes.length === 0) return [];
  return axes.reduce<Record<string, string>[]>((acc, axis) => {
    if (acc.length === 0) return axis.values.map((v) => ({ [axis.name]: v }));
    return acc.flatMap((combo) => axis.values.map((v) => ({ ...combo, [axis.name]: v })));
  }, []);
}

/** Slugify a title for auto-SKU generation */
function toSkuBase(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 10);
}

/** Generate a unique id */
const uid = () => Math.random().toString(36).slice(2, 9);

// ─────────────────────────────────────────────────────────────────────────────
// Category-type detection
// ─────────────────────────────────────────────────────────────────────────────

type CategoryType = "clothing" | "shoes" | "electronics" | "generic";

function detectCategoryType(name: string): CategoryType {
  const n = name.toLowerCase();
  if (n.includes("cloth") || n.includes("apparel") || n.includes("fashion") || n.includes("shirt") || n.includes("dress") || n.includes("jacket") || n.includes("top")) return "clothing";
  if (n.includes("shoe") || n.includes("footwear") || n.includes("boot") || n.includes("sneaker")) return "shoes";
  if (n.includes("electron") || n.includes("tech") || n.includes("phone") || n.includes("laptop") || n.includes("computer") || n.includes("gadget")) return "electronics";
  return "generic";
}

// ─────────────────────────────────────────────────────────────────────────────
// Default attribute presets per category
// ─────────────────────────────────────────────────────────────────────────────

const CLOTHING_ATTRIBUTES: AttributeRow[] = [
  { id: uid(), name: "Color", inputValue: "", values: [] },
  { id: uid(), name: "Size",  inputValue: "", values: ["XS", "S", "M", "L", "XL", "XXL"] },
];
const SHOES_ATTRIBUTES: AttributeRow[] = [
  { id: uid(), name: "Color", inputValue: "", values: [] },
  { id: uid(), name: "Size",  inputValue: "", values: ["EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"] },
];
const ELECTRONICS_SPECS: SpecRow[] = [
  { id: uid(), name: "RAM",     value: "" },
  { id: uid(), name: "Storage", value: "" },
  { id: uid(), name: "CPU",     value: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ["Basic Info", "Attributes & Variants", "Images & Publish"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={[
                "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300",
                i < current
                  ? "bg-gold border-gold text-background"
                  : i === current
                  ? "border-gold text-gold bg-gold/10"
                  : "border-card-border text-muted",
              ].join(" ")}
            >
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap ${i === current ? "text-gold" : "text-muted"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 max-w-[60px] transition-all duration-500 ${i < current ? "bg-gold" : "bg-card-border"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Chip tag input
// ─────────────────────────────────────────────────────────────────────────────

interface ChipInputProps {
  label: string;
  placeholder?: string;
  values: string[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onAdd: () => void;
  onRemove: (val: string) => void;
  colorMode?: boolean;
}

function ChipInput({ label, placeholder, values, inputValue, onInputChange, onAdd, onRemove, colorMode }: ChipInputProps) {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</label>
      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          className="flex-1 h-10 rounded-xl bg-card-bg border border-card-border px-3.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!inputValue.trim()}
          className="h-10 px-4 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold hover:bg-gold hover:text-background transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Chips */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          <AnimatePresence>
            {values.map((v) => (
              <motion.span
                key={v}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full border text-[11px] font-semibold transition-colors"
                style={
                  colorMode
                    ? { backgroundColor: v, borderColor: "transparent", color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }
                    : {}
                }
              >
                {!colorMode && <span className="text-foreground">{v}</span>}
                {colorMode && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: v }} />
                    <span>{v}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(v)}
                  className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-error/20 hover:text-error transition-colors text-muted"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AddProductPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { showToast } = useToast();

  // ── Auth guard ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isAuthenticated) router.push("/login");
    else if (user?.role !== "admin" && user?.role !== "seller") router.push("/dashboard");
  }, [isAuthenticated, user, router]);

  // ── API hooks ─────────────────────────────────────────────────────────────
  const { data: categoriesData } = useGetCategoriesQuery(undefined);
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);

  // ── Step 1: Basic Info ────────────────────────────────────────────────────
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [categoryId, setCategoryId]     = useState("");
  const [brand, setBrand]               = useState("");
  const [price, setPrice]               = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock]               = useState("");
  const [sku, setSku]                   = useState("");
  const [tags, setTags]                 = useState<string[]>([]);
  const [tagInput, setTagInput]         = useState("");

  // ── Step 2: Attributes & Variants ────────────────────────────────────────
  const [attributes, setAttributes]     = useState<AttributeRow[]>([]);
  const [variants, setVariants]         = useState<VariantRow[]>([]);
  const [specs, setSpecs]               = useState<SpecRow[]>([]);

  // ── Step 3: Images & Publish ──────────────────────────────────────────────
  const [uploadedImages, setUploadedImages] = useState<{ publicId: string; url: string }[]>([]);
  const [isPublished, setIsPublished]       = useState(true);

  // ── Derived category type ─────────────────────────────────────────────────
  const categories = categoriesData?.categories || [];
  const selectedCategory = categories.find((c: any) => c._id === categoryId);
  const categoryType = selectedCategory ? detectCategoryType(selectedCategory.name) : "generic";

  // When category changes, reset and pre-populate attribute templates
  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId(id);
    setVariants([]);
    const cat = categories.find((c: any) => c._id === id);
    if (!cat) return;
    const type = detectCategoryType(cat.name);
    if (type === "clothing") { setAttributes(CLOTHING_ATTRIBUTES.map(a => ({ ...a, id: uid() }))); setSpecs([]); }
    else if (type === "shoes") { setAttributes(SHOES_ATTRIBUTES.map(a => ({ ...a, id: uid() }))); setSpecs([]); }
    else if (type === "electronics") { setAttributes([]); setSpecs(ELECTRONICS_SPECS.map(s => ({ ...s, id: uid() }))); }
    else { setAttributes([]); setSpecs([]); }
  }, [categories]);

  // ── Attribute management ──────────────────────────────────────────────────
  const addAttributeRow = () => setAttributes((prev) => [...prev, { id: uid(), name: "", inputValue: "", values: [] }]);
  const removeAttributeRow = (id: string) => setAttributes((prev) => prev.filter((a) => a.id !== id));
  const updateAttrName = (id: string, name: string) =>
    setAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
  const updateAttrInput = (id: string, val: string) =>
    setAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, inputValue: val } : a)));
  const addAttrValue = (id: string) =>
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === id && a.inputValue.trim() && !a.values.includes(a.inputValue.trim())
          ? { ...a, values: [...a.values, a.inputValue.trim()], inputValue: "" }
          : a
      )
    );
  const removeAttrValue = (id: string, val: string) =>
    setAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, values: a.values.filter((v) => v !== val) } : a)));

  // ── Auto-generate variants from attributes ────────────────────────────────
  const generateVariants = useCallback(() => {
    const validAxes = attributes.filter((a) => a.name && a.values.length > 0);
    if (validAxes.length === 0) { showToast("Add at least one attribute with values first.", "error"); return; }
    const combos = cartesianProduct(validAxes);
    const skuBase = toSkuBase(title || "PROD");
    const generated: VariantRow[] = combos.map((combo, i) => ({
      combination: combo,
      sku: `${skuBase}-${Object.values(combo).map((v) => v.slice(0, 3).toUpperCase()).join("-")}-${i + 1}`,
      stock: 0,
      price: parseFloat(price) || 0,
    }));
    setVariants(generated);
    showToast(`Generated ${generated.length} variants.`, "success");
  }, [attributes, title, price, showToast]);

  const updateVariantField = (idx: number, field: "stock" | "price", value: number) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  // ── Spec management ───────────────────────────────────────────────────────
  const addSpecRow = () => setSpecs((prev) => [...prev, { id: uid(), name: "", value: "" }]);
  const removeSpecRow = (id: string) => setSpecs((prev) => prev.filter((s) => s.id !== id));
  const updateSpec = (id: string, field: "name" | "value", val: string) =>
    setSpecs((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files).slice(0, 6 - uploadedImages.length);
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("image", file);
      try {
        const res = await uploadImage(fd).unwrap();
        setUploadedImages((prev) => [...prev, { publicId: res.publicId || res.public_id, url: res.url || res.secure_url }]);
      } catch {
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }
  };

  // ── Step validation ───────────────────────────────────────────────────────
  const step1Valid = title.trim().length >= 3 && description.trim().length >= 10 && categoryId && parseFloat(price) >= 0;

  const step2Valid = (() => {
    if (categoryType === "electronics") return true; // specs optional
    if (attributes.length > 0) {
      const allHaveValues = attributes.every((a) => a.name && a.values.length > 0);
      return allHaveValues;
    }
    return true;
  })();

  // ── Tags ──────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags((prev) => [...prev, t]); setTagInput(""); }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", categoryId);
    formData.append("price", price);
    if (comparePrice) formData.append("comparePrice", comparePrice);
    if (brand) formData.append("brand", brand);
    if (sku) formData.append("sku", sku);
    formData.append("isPublished", String(isPublished));
    if (tags.length > 0) formData.append("tags", tags.join(","));

    // Attributes & Variants
    if (attributes.length > 0) {
      const cleanAttrs = attributes
        .filter((a) => a.name && a.values.length > 0)
        .map(({ name, values }) => ({ name, values }));
      formData.append("attributes", JSON.stringify(cleanAttrs));
    }
    if (variants.length > 0) {
      formData.append("variants", JSON.stringify(variants));
    } else {
      formData.append("stock", stock || "0");
    }

    // Specifications (electronics)
    if (specs.length > 0) {
      const cleanSpecs = specs.filter((s) => s.name && s.value).map(({ name, value }) => ({ name, value }));
      if (cleanSpecs.length > 0) formData.append("specifications", JSON.stringify(cleanSpecs));
    }

    // Images (already uploaded to cloud, pass metadata as JSON)
    if (uploadedImages.length > 0) {
      formData.append("images", JSON.stringify(uploadedImages));
    }

    try {
      await createProduct(formData).unwrap();
      showToast("Product created successfully! 🎉", "success");
      router.push("/seller");
    } catch (err: any) {
      const msg = err?.data?.errors?.[0] || err?.data?.message || "Failed to create product.";
      showToast(msg, "error");
    }
  };

  // ── Variant table total stock ─────────────────────────────────────────────
  const totalVariantStock = useMemo(() => variants.reduce((s, v) => s + (v.stock || 0), 0), [variants]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const inputCls = "w-full h-11 rounded-xl bg-card-bg border border-card-border px-4 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors";
  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-muted";
  const fieldCls = "flex flex-col gap-1.5";

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 JSX
  // ─────────────────────────────────────────────────────────────────────────

  const step1 = (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className={`${fieldCls} md:col-span-2`}>
          <label className={labelCls}>Product Title *</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Premium Slim-Fit Oxford Shirt" />
        </div>

        {/* Description */}
        <div className={`${fieldCls} md:col-span-2`}>
          <label className={labelCls}>Description *</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the product — materials, design, use-case…"
            className="w-full rounded-xl bg-card-bg border border-card-border px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors resize-none"
          />
        </div>

        {/* Category */}
        <div className={fieldCls}>
          <label className={labelCls}>Category *</label>
          <select
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">Select category…</option>
            {categories.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div className={fieldCls}>
          <label className={labelCls}>Brand</label>
          <input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Nike, Apple, IKEA" />
        </div>

        {/* Price */}
        <div className={fieldCls}>
          <label className={labelCls}>Price (USD) *</label>
          <input type="number" min="0" step="0.01" className={inputCls} value={price}
            onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </div>

        {/* Compare Price */}
        <div className={fieldCls}>
          <label className={labelCls}>Compare Price (optional)</label>
          <input type="number" min="0" step="0.01" className={inputCls} value={comparePrice}
            onChange={(e) => setComparePrice(e.target.value)} placeholder="Original price before discount" />
        </div>

        {/* Stock — only shown when no variants will be used */}
        {categoryType !== "clothing" && categoryType !== "shoes" && (
          <div className={fieldCls}>
            <label className={labelCls}>Stock Quantity</label>
            <input type="number" min="0" className={inputCls} value={stock}
              onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </div>
        )}

        {/* SKU */}
        <div className={fieldCls}>
          <label className={labelCls}>SKU (optional)</label>
          <input className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. PROD-001 (auto-generated if blank)" />
        </div>

        {/* Tags */}
        <div className={`${fieldCls} md:col-span-2`}>
          <ChipInput
            label="Tags"
            placeholder="Type a tag and press Enter…"
            values={tags}
            inputValue={tagInput}
            onInputChange={setTagInput}
            onAdd={addTag}
            onRemove={(v) => setTags((prev) => prev.filter((t) => t !== v))}
          />
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 JSX — Attributes, Variants, Specs
  // ─────────────────────────────────────────────────────────────────────────

  const step2 = (
    <div className="flex flex-col gap-8">

      {/* Category type indicator pill */}
      {categoryType !== "generic" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full border border-gold/30 bg-gold/5 text-[10px] font-bold uppercase tracking-widest text-gold"
        >
          {categoryType === "electronics" ? <Cpu className="h-3 w-3" /> : <Palette className="h-3 w-3" />}
          {categoryType} mode active
        </motion.div>
      )}

      {/* ── ELECTRONICS: Specifications ─────────────────────────────────── */}
      {categoryType === "electronics" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Technical Specifications</h3>
              <p className="text-[11px] text-muted mt-0.5">Key-value pairs shown on the product detail page.</p>
            </div>
            <button type="button" onClick={addSpecRow}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gold/30 bg-gold/5 text-gold text-xs font-semibold hover:bg-gold hover:text-background transition-all">
              <Plus className="h-3.5 w-3.5" /> Add Spec
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {specs.map((spec) => (
              <div key={spec.id} className="flex gap-3 items-center">
                <input
                  value={spec.name}
                  onChange={(e) => updateSpec(spec.id, "name", e.target.value)}
                  placeholder="Spec name (e.g. RAM)"
                  className="flex-1 h-10 rounded-xl bg-card-bg border border-card-border px-3.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
                />
                <input
                  value={spec.value}
                  onChange={(e) => updateSpec(spec.id, "value", e.target.value)}
                  placeholder="Value (e.g. 16GB)"
                  className="flex-1 h-10 rounded-xl bg-card-bg border border-card-border px-3.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
                />
                <button type="button" onClick={() => removeSpecRow(spec.id)}
                  className="h-9 w-9 rounded-xl border border-error/30 text-error hover:bg-error/10 flex items-center justify-center transition-colors flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {specs.length === 0 && (
              <p className="text-[11px] text-muted py-4 text-center border border-dashed border-card-border rounded-xl">
                No specifications yet. Click "Add Spec" to start.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── CLOTHING / SHOES / GENERIC: Attributes & Variants ───────────── */}
      {categoryType !== "electronics" && (
        <>
          {/* Attributes builder */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Product Attributes</h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Define the options customers will choose from (Color, Size, Material, etc.)
                </p>
              </div>
              <button type="button" onClick={addAttributeRow}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-gold/30 bg-gold/5 text-gold text-xs font-semibold hover:bg-gold hover:text-background transition-all">
                <Plus className="h-3.5 w-3.5" /> Add Attribute
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {attributes.map((attr) => (
                <motion.div
                  key={attr.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl border border-card-border bg-card-bg/50 p-4 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <input
                      value={attr.name}
                      onChange={(e) => updateAttrName(attr.id, e.target.value)}
                      placeholder="Attribute name (e.g. Color)"
                      className="flex-1 h-10 rounded-xl bg-background border border-card-border px-3.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors font-semibold"
                    />
                    <button type="button" onClick={() => removeAttributeRow(attr.id)}
                      className="h-9 w-9 rounded-xl border border-error/30 text-error hover:bg-error/10 flex items-center justify-center transition-colors flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <ChipInput
                    label={`${attr.name || "Attribute"} values`}
                    placeholder={attr.name?.toLowerCase() === "color" ? "e.g. Red, #1a1a2e" : "Type a value and press Enter…"}
                    values={attr.values}
                    inputValue={attr.inputValue}
                    onInputChange={(val) => updateAttrInput(attr.id, val)}
                    onAdd={() => addAttrValue(attr.id)}
                    onRemove={(val) => removeAttrValue(attr.id, val)}
                    colorMode={attr.name?.toLowerCase() === "color" || attr.name?.toLowerCase() === "colour"}
                  />
                </motion.div>
              ))}
              {attributes.length === 0 && (
                <div className="border border-dashed border-card-border rounded-2xl py-10 flex flex-col items-center gap-3 text-center">
                  <Layers className="h-8 w-8 text-muted/40" />
                  <p className="text-[11px] text-muted max-w-xs">
                    No attributes yet. Add Color, Size, or any custom axis. Then generate variants below.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generate variants button */}
          {attributes.length > 0 && (
            <div className="flex items-center justify-between py-4 border-y border-card-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Variant Matrix</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Auto-generate all combinations from the attributes above.
                  {variants.length > 0 && ` (${variants.length} variants, ${totalVariantStock} total stock)`}
                </p>
              </div>
              <button
                type="button"
                onClick={generateVariants}
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-gold text-background text-xs font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {variants.length > 0 ? "Re-generate" : "Generate Variants"}
              </button>
            </div>
          )}

          {/* Variant table */}
          {variants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="rounded-2xl border border-card-border overflow-hidden">
                {/* Table header */}
                <div className="grid bg-card-bg/80 border-b border-card-border px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-muted"
                  style={{ gridTemplateColumns: `1fr repeat(${Object.keys(variants[0].combination).length}, 80px) 100px 110px` }}>
                  <span>SKU</span>
                  {Object.keys(variants[0].combination).map((k) => <span key={k}>{k}</span>)}
                  <span>Stock</span>
                  <span>Price (USD)</span>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-card-border max-h-72 overflow-y-auto">
                  {variants.map((v, i) => (
                    <div
                      key={i}
                      className="grid items-center px-4 py-2.5 hover:bg-card-bg/40 transition-colors"
                      style={{ gridTemplateColumns: `1fr repeat(${Object.keys(v.combination).length}, 80px) 100px 110px` }}
                    >
                      <span className="text-[11px] font-mono text-muted truncate pr-3">{v.sku}</span>
                      {Object.values(v.combination).map((val, ci) => (
                        <span key={ci} className="text-[11px] font-semibold text-foreground">{val}</span>
                      ))}
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateVariantField(i, "stock", parseInt(e.target.value) || 0)}
                        className="w-20 h-8 rounded-lg bg-background border border-card-border px-2 text-sm text-foreground focus:outline-none focus:border-gold transition-colors text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => updateVariantField(i, "price", parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 rounded-lg bg-background border border-card-border px-2 text-sm text-foreground focus:outline-none focus:border-gold transition-colors text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-muted text-right">
                {variants.length} variants · Total stock: <strong className="text-foreground">{totalVariantStock}</strong>
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3 JSX — Images & Publish
  // ─────────────────────────────────────────────────────────────────────────

  const step3 = (
    <div className="flex flex-col gap-8">
      {/* Image upload */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Product Images</h3>
          <p className="text-[11px] text-muted mt-0.5">Upload up to 6 images (JPG, PNG, WEBP). First image = cover.</p>
        </div>

        {/* Upload zone */}
        {uploadedImages.length < 6 && (
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-card-border rounded-2xl py-10 cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-card-bg border border-card-border flex items-center justify-center group-hover:border-gold/40 transition-colors">
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-gold" /> : <Upload className="h-5 w-5 text-muted" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{isUploading ? "Uploading…" : "Click to upload images"}</p>
              <p className="text-[11px] text-muted mt-0.5">{uploadedImages.length}/6 uploaded</p>
            </div>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={handleImageUpload} disabled={isUploading} />
          </label>
        )}

        {/* Image previews */}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative h-24 w-24 rounded-2xl overflow-hidden border border-card-border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[8px] font-bold uppercase tracking-wider bg-gold text-background px-1.5 py-0.5 rounded-md">Cover</span>
                )}
                <button
                  type="button"
                  onClick={() => setUploadedImages((prev) => prev.filter((_, pi) => pi !== i))}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-error/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish toggle */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-card-border bg-card-bg/50">
        <div>
          <p className="text-sm font-semibold text-foreground">Publish immediately</p>
          <p className="text-[11px] text-muted mt-0.5">
            {isPublished ? "Product will be live and visible to customers." : "Save as draft — visible only to you."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPublished((p) => !p)}
          className={[
            "relative h-7 w-12 rounded-full transition-colors duration-200",
            isPublished ? "bg-gold" : "bg-card-border",
          ].join(" ")}
        >
          <span className={[
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200",
            isPublished ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")} />
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-card-border p-5 bg-card-bg/50 flex flex-col gap-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">Summary</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {[
            ["Title", title || "—"],
            ["Category", selectedCategory?.name || "—"],
            ["Price", price ? `$${parseFloat(price).toFixed(2)}` : "—"],
            ["Brand", brand || "—"],
            ["Attributes", attributes.filter((a) => a.values.length > 0).length ? `${attributes.filter((a) => a.values.length > 0).length} axes` : "None"],
            ["Variants", variants.length ? `${variants.length} SKUs` : "None"],
            ["Images", `${uploadedImages.length} uploaded`],
            ["Status", isPublished ? "Live" : "Draft"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted/70">{k}</span>
              <span className="text-[12px] font-semibold text-foreground truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto w-full max-w-3xl px-4 py-12">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-muted mb-4">
            <Link href="/seller" className="hover:text-gold transition-colors">Seller Hub</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Add New Product</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">New Product</h1>
              <p className="text-[11px] text-muted mt-0.5">Create a listing with dynamic attributes and variants.</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-card-border bg-card-bg/60 backdrop-blur-sm shadow-xl shadow-black/5 p-8">
          <StepIndicator current={step} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && step1}
              {step === 1 && step2}
              {step === 2 && step3}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-card-border">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 h-11 px-5 rounded-xl border border-card-border text-sm font-semibold text-muted hover:text-foreground hover:border-gold/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                disabled={step === 0 ? !step1Valid : !step2Valid}
                className="flex items-center gap-2 h-11 px-6 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-gold hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isCreating}
                className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gold text-background text-sm font-bold hover:bg-gold/90 transition-all disabled:opacity-60 shadow-lg shadow-gold/25"
              >
                {isCreating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
                ) : (
                  <><Check className="h-4 w-4" /> Publish Product</>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
