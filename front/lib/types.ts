export interface NavLink {
  name: string;
  href: string;
  type?: 'commercial' | 'editorial' | 'account'; // لتسهيل الفرز والتوزيع في التصميم
}