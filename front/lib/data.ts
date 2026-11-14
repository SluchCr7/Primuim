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



export const fallbackCategories: StoreCategory[] = [];
export const fallbackProducts: StoreProduct[] = [];
export const fallbackSellers: any[] = [];
export const fallbackArticles: any[] = [];

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
