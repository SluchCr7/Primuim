import { baseApi } from "./baseApi";

export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
  overrideExisting: false,
});

export const {
  useStartCheckoutMutation,
  useSaveShippingMutation,
  useSavePaymentMethodMutation,
  useValidateAddressMutation,
  useGetCheckoutStateQuery,
} = checkoutApi;
