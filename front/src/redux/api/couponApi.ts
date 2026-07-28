import { baseApi } from "./baseApi";

export const couponApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
  overrideExisting: false,
});

export const {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useDeleteCouponMutation,
} = couponApi;
