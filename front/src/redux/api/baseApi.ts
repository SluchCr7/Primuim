import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut } from "@/lib/authSlice";

// 1. تحديد عنوان الـ API الأساسي بناءً على مكان التشغيل (متصفح أو سيرفر)
export const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api" // في المتصفح: بنستخدم "/api" عشان يمر عبر Next.js Proxy (يمنع مشاكل الـ CORS ويسمح بإرسال الكوكيز)
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"); // على السيرفر (SSR): بنستخدم الرابط المباشر للباك إند


// 2. إعداد الاتصال الأساسي وإضافة الـ Token وإعدادات الكوكيز لكل الطلبات
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // قراءة الـ Access Token الحالي من الـ Redux Store
    const state = getState() as { auth: { accessToken: string | null } };
    const token = state.auth.accessToken;
    
    // لو الـ Token موجود، بنحطه تلقائياً في الـ Header بتاع كل طلب
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
  // ضروري جداً عشان المتصفح يقدر يبعت ويستقبل الـ Cookies (زي الـ Refresh Token) مع كل طلب
  credentials: "include",
});


// 3. دالة ذكية لإدارة الطلبات مع ميزة إعادة المحاولة وتجديد الـ Token تلقائياً عند انتهاء صلاحيته
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // بنجرب ننفذ الطلب الأساسي الأول
  let result = await baseQuery(args, api, extraOptions);

  // لو الطلب فشل ورجع خطأ 401 (Unauthorized - معناه إن الـ Access Token انتهى أو مش صالح)
  if (result.error && result.error.status === 401) {
    
    // بنبعت طلب جديد للباك إند عشان نطلب Access Token جديد باستخدام الـ Refresh Token
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    // لو عملية تجديد الـ Token نجحت وجاوبنا الباك إند ببيانات جديدة
    if (refreshResult.data) {
      const data = refreshResult.data as { accessToken: string };
      
      // بنجيب بيانات المستخدم الحالية من الـ Store
      const state = api.getState() as { auth: { user: any } };
      const user = state.auth.user;
      
      // بنحدث الـ Store بالـ Token الجديد
      api.dispatch(setCredentials({ user, accessToken: data.accessToken }));
      
      // بنعيد تنفيذ الطلب القديم اللي كان فاشل من شوية، بس المرة دي بالـ Token الجديد!
      result = await baseQuery(args, api, extraOptions);
    } else {
      // لو حتى طلب تجديد الـ Token فشل (يعني الـ Refresh Token انتهى هو كمان)، بنسجل خروج المستخدم تماماً
      api.dispatch(logOut());
    }
  }

  // بنرجع النتيجة النهائيه سواء نجحت من أول مرة أو بعد التجديد أو فشلت
  return result;
};

export const baseApi = createApi({
  reducerPath: "ecommerceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Product",
    "Category",
    "Cart",
    "Checkout",
    "Order",
    "Review",
    "Payment",
    "Coupon",
    "Article",
    "SellerRequest",
    "Testimonial",
    "Notification",
    "SystemSettings",
    "MediaAsset",
    "Loyalty",
    "WarehouseInventory",
  ],
  endpoints: () => ({}),
});

export const ecommerceApi = baseApi;
