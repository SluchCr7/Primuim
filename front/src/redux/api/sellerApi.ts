import { baseApi } from "./baseApi";

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
    getApprovedSellers: builder.query({
      query: (params = {}) => ({
        url: "/sellers",
        params,
      }),
      providesTags: ["User"],
    }),
    getPublicStoreBySlug: builder.query({
      query: (slug) => `/sellers/store/slug/${slug}`,
      providesTags: (result, error, slug) => [
        { type: "User", id: slug },
        "Product",
        "Article",
        "Review",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadStoreLogoMutation,
  useUploadStoreCoverMutation,
  useApplyAsSellerMutation,
  useGetMyApplicationStatusQuery,
  useGetSellerStatsQuery,
  useGetSellerOrdersQuery,
  useUpdateSellerOrderStatusMutation,
  useRequestPayoutMutation,
  useUpdateSellerStoreProfileMutation,
  useGetSellerRequestsAdminQuery,
  useModerateSellerRequestAdminMutation,
  useGetApprovedSellersQuery,
  useGetPublicStoreBySlugQuery,
} = sellerApi;
