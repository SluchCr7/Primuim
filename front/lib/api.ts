import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut } from "./authSlice";

// In the browser, use the relative "/api" path so requests go through the
// Next.js proxy rewrite (same-origin → cookies work everywhere, no CORS).
// On the server-side (SSR), fall back to the absolute backend URL.
export const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api");


const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Access token can be read from the local state
    const state = getState() as { auth: { accessToken: string | null } };
    const token = state.auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
  // Crucial for cookie transmission
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // try to get a new token
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const data = refreshResult.data as { accessToken: string };
      // store the new token in store
      const state = api.getState() as { auth: { user: any } };
      const user = state.auth.user;
      
      api.dispatch(setCredentials({ user, accessToken: data.accessToken }));
      
      // retry the initial query
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }

  return result;
};

export const ecommerceApi = createApi({
  reducerPath: "ecommerceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Product", "Category", "Cart", "Checkout", "Order", "Review", "Payment", "Coupon", "Article", "SellerRequest", "Testimonial", "Notification"], 
  endpoints: (builder) => ({
    // --- AUTHENTICATION ---
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User", "Cart"],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    uploadImage: builder.mutation({
      query: (formData) => ({
        url: "/upload/image",
        method: "POST",
        body: formData,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Cart"],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),
    getMe: builder.query({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: "/users/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),
    getAddresses: builder.query({
      query: () => "/users/addresses",
      providesTags: ["User"],
    }),
    addAddress: builder.mutation({
      query: (addressData) => ({
        url: "/users/addresses",
        method: "POST",
        body: addressData,
      }),
      invalidatesTags: ["User"],
    }),
    updateAddress: builder.mutation({
      query: ({ addressId, addressData }) => ({
        url: `/users/addresses/${addressId}`,
        method: "PUT",
        body: addressData,
      }),
      invalidatesTags: ["User"],
    }),
    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `/users/addresses/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    setDefaultAddress: builder.mutation({
      query: (addressId) => ({
        url: `/users/addresses/${addressId}/default`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
    getWishlist: builder.query({
      query: () => "/users/wishlist",
      providesTags: ["User"],
    }),
    toggleWishlist: builder.mutation({
      query: (productId) => ({
        url: `/users/wishlist/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["User", "Product"],
    }),
    verifyOTP: builder.mutation({
      query: (otpData) => ({
        url: "/auth/otp/verify",
        method: "POST",
        body: otpData,
      }),
      invalidatesTags: ["User"],
    }),
    sendOTP: builder.mutation({
      query: () => ({
        url: "/auth/otp/send",
        method: "POST",
      }),
    }),
    socialLogin: builder.mutation({
      query: (socialData) => ({
        url: "/auth/social-login",
        method: "POST",
        body: socialData,
      }),
      invalidatesTags: ["User", "Cart"],
    }),
    forgotPassword: builder.mutation({
      query: (emailData) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: emailData,
      }),
    }),
    resetPassword: builder.mutation({
      query: (resetData) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: resetData,
      }),
    }),

    // --- PRODUCTS ---
    getProducts: builder.query({
      query: (params = {}) => ({
        url: "/products",
        params,
      }),
      providesTags: ["Product"],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    getProductBySlug: builder.query({
      query: (slug) => `/products/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Product", id: slug }],
    }),
    getSearchSuggestions: builder.query({
      query: (q) => `/products/search/suggest?q=${encodeURIComponent(q)}`,
    }),
    getTrendingSearches: builder.query({
      query: () => "/products/search/trending",
    }),
    getAdvancedSearch: builder.query({
      query: (params: {
        q?: string;
        category?: string;
        brand?: string;
        tags?: string;
        minPrice?: string;
        maxPrice?: string;
        rating?: string;
        inStock?: string;
        sort?: string;
        page?: number;
        limit?: number;
      } = {}) => ({
        url: "/products/search",
        params,
      }),
      providesTags: ["Product"],
    }),
    getMyProducts: builder.query({
      query: () => "/products/mine",
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation({
      query: (formData) => ({
        url: "/products",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, productData }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
    togglePublishProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/publish`,
        method: "PATCH",
      }),
      invalidatesTags: ["Product"],
    }),

    // --- CATEGORIES ---
    getCategories: builder.query({
      query: (params = { tree: "true" }) => ({
        url: "/categories",
        params,
      }),
      providesTags: ["Category"],
    }),
    getCategoryById: builder.query({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),
    getCategoryBySlug: builder.query({
      query: (slug) => `/categories/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Category", id: slug }],
    }),

    // --- CART ---
    getCart: builder.query({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation({
      query: (item) => ({
        url: "/cart/items",
        method: "POST",
        body: item,
      }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItemQuantity: builder.mutation({
      query: (item) => ({
        url: "/cart/items",
        method: "PUT",
        body: item,
      }),
      invalidatesTags: ["Cart"],
    }),
    removeFromCart: builder.mutation({
      query: (productId) => ({
        url: `/cart/items/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    clearCart: builder.mutation({
      query: () => ({
        url: "/cart",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    mergeCart: builder.mutation({
      query: (guestCart) => ({
        url: "/cart/merge",
        method: "POST",
        body: guestCart,
      }),
      invalidatesTags: ["Cart"],
    }),

    // --- CHECKOUT ---
    startCheckout: builder.mutation({
      query: () => ({
        url: "/checkout/start",
        method: "POST",
      }),
      invalidatesTags: ["Checkout"],
    }),
    saveShipping: builder.mutation({
      query: (shippingData) => ({
        url: "/checkout/shipping",
        method: "POST",
        body: shippingData,
      }),
      invalidatesTags: ["Checkout"],
    }),
    savePaymentMethod: builder.mutation({
      query: (paymentData) => ({
        url: "/checkout/payment",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Checkout"],
    }),
    validateAddress: builder.mutation({
      query: (addressData) => ({
        url: "/checkout/validate-address",
        method: "POST",
        body: addressData,
      }),
    }),
    getCheckoutState: builder.query({
      query: () => "/checkout/state",
      providesTags: ["Checkout"],
    }),

    // --- ORDERS & PAYMENTS ---
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/orders",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Order", "Cart", "Checkout"],
    }),
    getMyOrders: builder.query({
      query: () => "/orders/mine",
      providesTags: ["Order"],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["Order", "Product"],
    }),
    createPayment: builder.mutation({
      query: ({ orderId, paymentData }) => ({
        url: `/payments/orders/${orderId}`,
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Payment", "Order"],
    }),

    // --- REVIEWS ---
    getProductReviews: builder.query({
      query: (productSlug) => `/reviews/product/${productSlug}`,
      providesTags: ["Review"],
    }),
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: "/reviews",
        method: "POST",
        body: reviewData,
      }),
      invalidatesTags: ["Review", "Product"],
    }),
    voteHelpful: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}/helpful`,
        method: "PATCH",
      }),
      invalidatesTags: ["Review"],
    }),

    // --- ANALYTICS ---
    logAnalyticsEvent: builder.mutation({
      query: (eventData) => ({
        url: "/analytics/event",
        method: "POST",
        body: eventData,
      }),
    }),
    getAdminDashboard: builder.query({
      query: () => "/admin/analytics/dashboard",
    }),
    getAdminSales: builder.query({
      query: () => "/admin/analytics/sales",
    }),
    getAdminInventory: builder.query({
      query: () => "/admin/analytics/inventory",
      providesTags: ["Product"],
    }),
    adjustProductInventory: builder.mutation({
      query: ({ productId, adjustData }) => ({
        url: `/admin/products/${productId}/inventory`,
        method: "PATCH",
        body: adjustData,
      }),
      invalidatesTags: ["Product"],
    }),
    getFunnelAnalytics: builder.query({
      query: () => "/analytics/funnel",
    }),
    getCohortAnalytics: builder.query({
      query: () => "/analytics/cohort",
    }),
    getPendingReviews: builder.query({
      query: () => "/reviews/admin/pending",
      providesTags: ["Review"],
    }),
    moderateReview: builder.mutation({
      query: ({ reviewId, moderateData }) => ({
        url: `/reviews/admin/${reviewId}/moderate`,
        method: "PATCH",
        body: moderateData,
      }),
      invalidatesTags: ["Review"],
    }),
    uploadProfilePhoto: builder.mutation({
      query: (formData) => ({
        url: "/users/profile-photo",
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
    deleteProfilePhoto: builder.mutation({
      query: () => ({
        url: "/users/profile-photo",
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    uploadStoreLogo: builder.mutation({
      query: (formData) => ({
        url: "/sellers/store-logo",
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
    uploadStoreCover: builder.mutation({
      query: (formData) => ({
        url: "/sellers/store-cover",
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
    toggle2FA: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/toggle",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    getCoupons: builder.query({
      query: () => "/discounts",
      providesTags: ["Coupon"],
    }),
    createCoupon: builder.mutation({
      query: (couponData) => ({
        url: "/discounts",
        method: "POST",
        body: couponData,
      }),
      invalidatesTags: ["Coupon"],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/discounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupon"],
    }),
    getAllUsers: builder.query({
      query: () => "/admin/users",
      providesTags: ["User"],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["User"],
    }),

    // --- ARTICLES (BLOG) ---
    getArticles: builder.query({
      query: (params = {}) => ({
        url: "/articles",
        params,
      }),
      providesTags: ["Article"],
    }),
    getArticleBySlug: builder.query({
      query: (slug) => `/articles/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Article", id: slug }],
    }),
    getAdminArticles: builder.query({
      query: () => "/articles/admin/all",
      providesTags: ["Article"],
    }),
    getMyArticles: builder.query({
      query: () => "/articles/mine",
      providesTags: ["Article"],
    }),
    createArticle: builder.mutation({
      query: (formData) => ({
        url: "/articles",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Article"],
    }),
    updateArticle: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/articles/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Article"],
    }),
    deleteArticle: builder.mutation({
      query: (id) => ({
        url: `/articles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Article"],
    }),
    likeArticle: builder.mutation({
      query: (id) => ({
        url: `/articles/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Article"],
    }),
    commentArticle: builder.mutation({
      query: ({ id, text }) => ({
        url: `/articles/${id}/comments`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Article"],
    }),
    deleteComment: builder.mutation({
      query: ({ articleId, commentId }) => ({
        url: `/articles/${articleId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Article"],
    }),
    getAllTestimonials : builder.query({
      query : ()=>({
        url : `/testimonials`,
      }),
      providesTags: ["Testimonial"],
    }),
    // --- SELLER ---
    applyAsSeller: builder.mutation({
      query: (sellerData) => ({
        url: "/sellers/apply",
        method: "POST",
        body: sellerData,
      }),
      invalidatesTags: ["User", "SellerRequest"],
    }),
    getMyApplicationStatus: builder.query({
      query: () => "/sellers/application-status",
      providesTags: ["SellerRequest"],
    }),
    getSellerStats: builder.query({
      query: () => "/sellers/stats",
      providesTags: ["Product", "Order"],
    }),
    getSellerOrders: builder.query({
      query: () => "/sellers/orders",
      providesTags: ["Order"],
    }),
    updateSellerOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: `/sellers/orders/${orderId}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Order"],
    }),
    requestPayout: builder.mutation({
      query: ({ amount }) => ({
        url: "/sellers/payout",
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["User"],
    }),
    updateSellerStoreProfile: builder.mutation({
      query: (storeData) => ({
        url: "/sellers/profile",
        method: "PUT",
        body: storeData,
      }),
      invalidatesTags: ["User"],
    }),

    // --- ADMIN SELLER ONBOARDING ---
    getSellerRequestsAdmin: builder.query({
      query: () => "/admin/seller-requests",
      providesTags: ["SellerRequest"],
    }),
    moderateSellerRequestAdmin: builder.mutation({
      query: ({ id, status, adminNotes }) => ({
        url: `/admin/seller-requests/${id}`,
        method: "PATCH",
        body: { status, adminNotes },
      }),
      invalidatesTags: ["SellerRequest", "User"],
    }),

    // --- ENTERPRISE MARKETPLACE ENHANCEMENTS ---
    getApprovedSellers: builder.query({
      query: (params = {}) => ({
        url: "/sellers",
        params,
      }),
      providesTags: ["User"],
    }),
    getPublicStoreBySlug: builder.query({
      query: (slug) => `/sellers/store/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "User", id: slug }, "Product", "Article", "Review"],
    }),
    followSeller: builder.mutation({
      query: (sellerId) => ({
        url: `/users/follow/${sellerId}`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    getSharedWishlist: builder.query({
      query: (userId) => `/users/wishlist/share/${userId}`,
      providesTags: ["User"],
    }),
    replyToReview: builder.mutation({
      query: ({ reviewId, comment }) => ({
        url: `/reviews/${reviewId}/reply`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: ["Review"],
    }),
    duplicateArticle: builder.mutation({
      query: (id) => ({
        url: `/articles/${id}/duplicate`,
        method: "POST",
      }),
      invalidatesTags: ["Article"],
    }),
    moderateArticle: builder.mutation({
      query: ({ id, status, rejectionReason, isFeatured }) => ({
        url: `/articles/${id}/moderate`,
        method: "PATCH",
        body: { status, rejectionReason, isFeatured },
      }),
      invalidatesTags: ["Article"],
    }),
    getPendingArticles: builder.query({
      query: () => "/articles/admin/pending",
      providesTags: ["Article"],
    }),
    getArticleAnalyticsDashboard: builder.query({
      query: () => "/articles/analytics/dashboard",
      providesTags: ["Article"],
    }),
    getSingleArticleAnalytics: builder.query({
      query: ({ id, days }) => `/articles/analytics/${id}?days=${days || 30}`,
      providesTags: ["Article"],
    }),
    getSystemSettings: builder.query({
      query: () => "/superadmin/settings",
    }),
    updateSystemSettings: builder.mutation({
      query: (settingsData) => ({
        url: "/superadmin/settings",
        method: "PUT",
        body: settingsData,
      }),
    }),
    getAuditLogs: builder.query({
      query: (params = {}) => ({
        url: "/superadmin/audit-logs",
        params,
      }),
    }),
    getExchangeRates: builder.query({
      query: () => "/currency/rates",
    }),

    // --- SMART FIT & SIZE GUIDE ---
    // Sends clothing and/or shoe measurements to the server.
    // The server applies the sizing matrix + ISO formula and persists the result.
    updateSizeProfile: builder.mutation({
      query: (sizeData) => ({
        url: "/users/size-profile",
        method: "PUT",
        body: sizeData,
      }),
      // Invalidate "User" so useGetMeQuery re-fetches and the dashboard
      // and product page always see the latest sizeProfile.
      invalidatesTags: ["User"],
    }),
    // --- AUTHENTICATION ---
    verifyAccount: builder.mutation({
      query: ({ id, token }) => ({
        url: `/auth/verify/${id}/${token}`,
        method: "GET",
      }),
      // يمكنك جعلها تقوم بعمل invalidate لبيانات المستخدم لتحديث حالته فوراً إذا كان مسجلاً
      invalidatesTags: ["User"], 
    }),
    // --- NOTIFICATIONS ---
    getNotifications: builder.query({
      query: (params = {}) => ({
        url: "/notifications",
        params,
      }),
      providesTags: ["Notification"],
    }),
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "PUT",
      }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
    clearAllNotifications: builder.mutation({
      query: () => ({
        url: "/notifications",
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
    broadcastNotification: builder.mutation({
      query: (body) => ({
        url: "/notifications/broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useVerifyOTPMutation,
  useSendOTPMutation,
  useSocialLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetSearchSuggestionsQuery,
  useGetTrendingSearchesQuery,
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetCategoryBySlugQuery,
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useGetProductBySlugQuery,
  useMergeCartMutation,
  useStartCheckoutMutation,
  useSaveShippingMutation,
  useSavePaymentMethodMutation,
  useValidateAddressMutation,
  useGetCheckoutStateQuery,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useCreatePaymentMutation,
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useVoteHelpfulMutation,
  useLogAnalyticsEventMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useGetAdminDashboardQuery,
  useGetAdminSalesQuery,
  useGetAdminInventoryQuery,
  useAdjustProductInventoryMutation,
  useGetFunnelAnalyticsQuery,
  useGetCohortAnalyticsQuery,
  useGetPendingReviewsQuery,
  useModerateReviewMutation,
  useUploadProfilePhotoMutation,
  useDeleteProfilePhotoMutation,
  useToggle2FAMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  // --- ARTICLES ---
  useGetArticlesQuery,
  useGetArticleBySlugQuery,
  useGetAdminArticlesQuery,
  useGetMyArticlesQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useLikeArticleMutation,
  useCommentArticleMutation,
  useDeleteCommentMutation,
  // --- SELLER ---
  useApplyAsSellerMutation,
  useGetMyApplicationStatusQuery,
  useGetSellerStatsQuery,
  useGetSellerOrdersQuery,
  useUpdateSellerOrderStatusMutation,
  useRequestPayoutMutation,
  useUpdateSellerStoreProfileMutation,
  useUploadStoreLogoMutation,
  useUploadStoreCoverMutation,
  useGetMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useTogglePublishProductMutation,
  // --- ADMIN SELLER ---
  useGetSellerRequestsAdminQuery,
  useModerateSellerRequestAdminMutation,
  // --- ENTERPRISE MARKETPLACE ENHANCEMENTS ---
  useGetApprovedSellersQuery,
  useGetPublicStoreBySlugQuery,
  useFollowSellerMutation,
  useGetSharedWishlistQuery,
  useReplyToReviewMutation,
  useDuplicateArticleMutation,
  useModerateArticleMutation,
  useGetPendingArticlesQuery,
  useGetArticleAnalyticsDashboardQuery,
  useGetSingleArticleAnalyticsQuery,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetAuditLogsQuery,
  useGetExchangeRatesQuery,
  // --- TESTIMONIALS ---
  useGetAllTestimonialsQuery,
  // --- UPLOAD ---
  useUploadImageMutation,
  // --- SMART FIT & SIZE GUIDE ---
  useUpdateSizeProfileMutation,
  useVerifyAccountMutation,
  // --- ADVANCED SEARCH ---
  useGetAdvancedSearchQuery,
  // --- NOTIFICATIONS ---
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useBroadcastNotificationMutation,
} = ecommerceApi;


