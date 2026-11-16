import { baseApi } from "./baseApi";

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation({
      query: (item: { productId: string; quantity: number; variantSku?: string }) => ({
        url: "/cart/items",
        method: "POST",
        body: item,
      }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItemQuantity: builder.mutation({
      query: (item: { productId: string; quantity: number; variantSku?: string }) => ({
        url: "/cart/items",
        method: "PUT",
        body: item,
      }),
      invalidatesTags: ["Cart"],
    }),
    removeFromCart: builder.mutation({
      query: ({ productId, variantSku }: { productId: string; variantSku?: string }) => ({
        url: `/cart/items/${productId}${variantSku ? `?variantSku=${encodeURIComponent(variantSku)}` : ""}`,
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
  }),
  overrideExisting: false,
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useMergeCartMutation,
} = cartApi;
