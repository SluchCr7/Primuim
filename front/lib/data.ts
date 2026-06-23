import { NavLink } from "./types";

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