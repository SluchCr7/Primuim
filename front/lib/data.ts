import { NavLink, StoreCategory, StoreProduct } from "./types";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Search,
  Truck,
  Banknote,
  Camera,
  ChevronRight,
  Globe2,
  HeartHandshake,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
  Heart,
  Lock
} from "lucide-react";
export const stats = [
  {
    value: "25K+",
    label: "Happy Customers",
  },
  {
    value: "15K+",
    label: "Orders Delivered",
  },
  {
    value: "500+",
    label: "Premium Products",
  },
  {
    value: "99%",
    label: "Positive Reviews",
  },
];


export const Links: NavLink[] = [

  // يمكنك ترك هذه الروابط الثابتة أو دمجها ديناميكياً مع القادمة من الـ API
  { name: "New Arrivals", href: "/new-arrivals", type: "commercial" },
  { name: "Best Sellers", href: "/best-sellers", type: "commercial" },
  
  // --- روابط المحتوى والتعريف (Editorial) ---
  { name: "Blog", href: "/blog", type: "editorial" },
  { name: "Our Story", href: "/about", type: "editorial" },
];

export const languages = [  
  { value: "en", label: "English", flag: "US" },
  { value: "es", label: "Español", flag: "ES" },
  { value: "fr", label: "Français", flag: "FR" },
  {value : "de", label: "Deutsch", flag: "DE" },
  { value: "ar", label: "العربية", flag: "EG" },
]



export const fallbackCategories: StoreCategory[] = [
  {
    _id: "cat-fashion",
    name: "Signature Fashion",
    slug: "signature-fashion",
    description: "Statement silhouettes, elevated essentials, and capsule pieces built around modern luxury.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=900&auto=format&fit=crop",
  },
  {
    _id: "cat-home",
    name: "Home Curations",
    slug: "home-curations",
    description: "Refined objects, ambient decor, and tactile details that make interiors feel collected.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=900&auto=format&fit=crop",
  },
  {
    _id: "cat-tech",
    name: "Modern Tech",
    slug: "modern-tech",
    description: "Beautifully engineered devices, accessories, and tools that fit a premium workflow.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=900&auto=format&fit=crop",
  },
  {
    _id: "cat-gifts",
    name: "Gifting Studio",
    slug: "gifting-studio",
    description: "Curated edits and gift-ready bundles for launches, milestones, and private events.",
    image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=900&auto=format&fit=crop",
  },
];

export const fallbackProducts: StoreProduct[] = [
  {
    _id: "demo1",
    title: "Signature Gold Signet Ring",
    brand: "L'Auréole",
    slug: "signature-gold-signet-ring",
    price: 3200,
    images: [{ url: "https://images.unsplash.com/photo-1603974372039-adc49044b6bd?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 4.9,
    sold: 120,
  },
  {
    _id: "demo2",
    title: "Alabaster Ceramic Vase",
    brand: "Maison Blanc",
    slug: "alabaster-ceramic-vase",
    price: 1850,
    images: [{ url: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 4.8,
    sold: 95,
  },
  {
    _id: "demo3",
    title: "Suede Shearling Jacket",
    brand: "Atelier Paris",
    slug: "suede-shearling-jacket",
    price: 14500,
    images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 5.0,
    sold: 45,
  },
  {
    _id: "demo4",
    title: "Noir Chronograph Watch",
    brand: "Kronos",
    slug: "noir-chronograph-watch",
    price: 9200,
    images: [{ url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 4.7,
    sold: 80,
  },
];

export const fallbackSellers = [
  {
    id: "seller1",
    storeName: "Maison de L'Élégance",
    brandName: "L'Élégance",
    storeSlug: "maison-de-l-elegance",
    storeLogo: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=200&auto=format&fit=crop",
    storeDescription: "Curated premium Parisian designer wear and fine accessories.",
    storeRating: 4.9,
    followersCount: 1420,
    responseTime: "Within 2 hours"
  },
  {
    id: "seller2",
    storeName: "Aura Home Curations",
    brandName: "Aura",
    storeSlug: "aura-home-curations",
    storeLogo: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=200&auto=format&fit=crop",
    storeDescription: "Handcrafted ceramics, ambient lighting, and luxury home design.",
    storeRating: 4.8,
    followersCount: 890,
    responseTime: "Within 1 hour"
  },
  {
    id: "seller3",
    storeName: "Kronos Horology",
    brandName: "Kronos",
    storeSlug: "kronos-horology",
    storeLogo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=200&auto=format&fit=crop",
    storeDescription: "Precision timepiece engineering and luxury vintage restorations.",
    storeRating: 5.0,
    followersCount: 2300,
    responseTime: "Within 24 hours"
  }
];

export const fallbackArticles = [
  {
    _id: "art1",
    title: "The Art of Capsule Wardrobe: Quality Over Quantity",
    slug: "art-of-capsule-wardrobe",
    excerpt: "Discover the philosophy of minimalist luxury and how to curate a timeless selection of statement pieces.",
    coverImage: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=900&auto=format&fit=crop",
    author: { storeName: "Atelier Paris" },
    readTime: 5,
    createdAt: "2026-06-12T10:00:00Z"
  },
  {
    _id: "art2",
    title: "Designing Ambient Spaces: A Guide to Light and Texture",
    slug: "designing-ambient-spaces",
    excerpt: "How ambient decor and carefully placed lighting transform modern residential spaces into peaceful sanctuaries.",
    coverImage: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=900&auto=format&fit=crop",
    author: { storeName: "Studio Noon" },
    readTime: 4,
    createdAt: "2026-06-10T14:30:00Z"
  },
  {
    _id: "art3",
    title: "Crafting Precision: Inside the Modern Watchmaker Workshop",
    slug: "inside-watchmaker-workshop",
    excerpt: "A deep dive into horological engineering and the incredible craftsmanship behind mechanical movements.",
    coverImage: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=900&auto=format&fit=crop",
    author: { storeName: "Kronos" },
    readTime: 7,
    createdAt: "2026-06-08T09:15:00Z"
  }
];

export const trustPoints = [
  { icon: ShieldCheck, title: "Protected checkout", description: "Tokenized payments and secure session restoration keep accounts safe across devices." },
  { icon: Truck, title: "Fast delivery", description: "Same-day dispatch on selected Cairo drops, with clear tracking from warehouse to door." },
  { icon: HeartHandshake, title: "White-glove support", description: "Concierge-grade help for product selection, order follow-up, and post-purchase care." },
];

export const journey = [
  { step: "01", title: "Discover", description: "Explore editorial collections, seasonal drops, and focused category edits." },
  { step: "02", title: "Compare", description: "Save favorites, review details, and compare premium pieces across collections." },
  { step: "03", title: "Checkout", description: "Use secure checkout with automatic session restoration and cart persistence." },
  { step: "04", title: "Receive", description: "Track every order from confirmation to delivery with post-purchase support." },
];

export const testimonials = [
  { quote: "The layout feels like a flagship fashion house, but it still moves like a modern commerce platform.", name: "Mona A.", title: "Lifestyle curator" },
  { quote: "I closed the browser, came back later, and my account was still signed in. That is the kind of polish users notice.", name: "Karim S.", title: "Returning customer" },
  { quote: "The homepage finally feels premium enough to represent the product catalog and the brand story.", name: "Dina H.", title: "Creative director" },
];

export const faqs = [
  { question: "How does my login stay active after reopening the website?", answer: "The refresh cookie is restored on load, then the app fetches your profile again and repopulates Redux state automatically." },
  { question: "Can guests still shop without an account?", answer: "Yes. Guest carts stay in local storage and can be merged into the account cart once the user signs in." },
  { question: "What makes the homepage different from a basic store front?", answer: "It is built like a real brand landing page: editorial hero, category storytelling, product curation, trust signals, and a conversion-focused CTA flow." },
];

export const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&auto=format&fit=crop",
    tag: "Private Drop",
    badge: "Limited Availability",
    title: "The Modern Luxury Capsule",
    description: "Flagship-grade presentation across every curation. Rebuilt for modern premium standards.",
    link: "/products"
  },
  {
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop",
    tag: "Designer Edit",
    badge: "New Collection",
    title: "Signature Fashion Drops",
    description: "Statement silhouettes, elevated essentials, and private boutique designs.",
    link: "/category/signature-fashion"
  },
  {
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1400&auto=format&fit=crop",
    tag: "Exclusive Tech",
    badge: "Pre-order Open",
    title: "Engineered Horological Devices",
    description: "Tactile gear, vintage restorations, and beautifully engineered items for premium setups.",
    link: "/category/modern-tech"
  }
];
