import { baseApi } from "./baseApi";

export const loyaltyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLoyaltyWallet: builder.query({
      query: () => "/loyalty/wallet",
      providesTags: ["Loyalty"],
    }),
    getLoyaltyTransactions: builder.query({
      query: () => "/loyalty/transactions",
      providesTags: ["Loyalty"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLoyaltyWalletQuery,
  useGetLoyaltyTransactionsQuery,
} = loyaltyApi;
