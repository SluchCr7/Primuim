import { baseApi } from "./baseApi";

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
    replyToReview: builder.mutation({
      query: ({ reviewId, comment }) => ({
        url: `/reviews/${reviewId}/reply`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: ["Review"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useVoteHelpfulMutation,
  useGetPendingReviewsQuery,
  useModerateReviewMutation,
  useReplyToReviewMutation,
} = reviewApi;
