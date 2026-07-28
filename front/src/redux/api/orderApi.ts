import { baseApi } from "./baseApi";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
  overrideExisting: false,
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useCreatePaymentMutation,
} = orderApi;
