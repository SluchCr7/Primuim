import { baseApi } from "./baseApi";

export const articleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      query: ({ id, days }: { id: string; days?: number }) =>
        `/articles/analytics/${id}?days=${days || 30}`,
      providesTags: ["Article"],
    }),
  }),
  overrideExisting: false,
});

export const {
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
  useDuplicateArticleMutation,
  useModerateArticleMutation,
  useGetPendingArticlesQuery,
  useGetArticleAnalyticsDashboardQuery,
  useGetSingleArticleAnalyticsQuery,
} = articleApi;
