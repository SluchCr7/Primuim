import { baseApi } from "./baseApi";

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation({
      query: (formData) => ({
        url: "/upload/image",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MediaAsset"],
    }),
    getMediaAssets: builder.query({
      query: () => "/upload/assets",
      providesTags: ["MediaAsset"],
    }),
    deleteMediaAsset: builder.mutation({
      query: (id) => ({
        url: `/upload/assets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MediaAsset"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadImageMutation,
  useGetMediaAssetsQuery,
  useDeleteMediaAssetMutation,
} = uploadApi;
