export interface NavLink {
  name: string;
  href: string;
  type?: 'commercial' | 'editorial' | 'account'; // لتسهيل الفرز والتوزيع في التصميم
}

export type StoreProduct = {
  _id: string;
  title: string;
  brand?: string;
  slug?: string;
  price: number;
  comparePrice?: number;
  images?: Array<{ url: string }>;
  ratingAverage?: number;
  sold?: number;
  stock?: number;
  isDigital?: boolean;
  seller?: any;
};

export type StoreCategory = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
};