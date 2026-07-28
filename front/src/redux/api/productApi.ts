import { baseApi } from "./baseApi";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useGetSearchSuggestionsQuery,
  useGetTrendingSearchesQuery,
  useGetAdvancedSearchQuery,
  useGetMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useTogglePublishProductMutation,
} = productApi;
