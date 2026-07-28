import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: "/users/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),
    getAddresses: builder.query({
      query: () => "/users/addresses",
      providesTags: ["User"],
    }),
    addAddress: builder.mutation({
      query: (addressData) => ({
        url: "/users/addresses",
        method: "POST",
        body: addressData,
      }),
      invalidatesTags: ["User"],
    }),
    updateAddress: builder.mutation({
      query: ({ addressId, addressData }) => ({
        url: `/users/addresses/${addressId}`,
        method: "PUT",
        body: addressData,
      }),
      invalidatesTags: ["User"],
    }),
    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `/users/addresses/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    setDefaultAddress: builder.mutation({
      query: (addressId) => ({
        url: `/users/addresses/${addressId}/default`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
    getWishlist: builder.query({
      query: () => "/users/wishlist",
      providesTags: ["User"],
    }),
    toggleWishlist: builder.mutation({
      query: (productId) => ({
        url: `/users/wishlist/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["User", "Product"],
    }),
    uploadProfilePhoto: builder.mutation({
      query: (formData) => ({
        url: "/users/profile-photo",
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
    deleteProfilePhoto: builder.mutation({
      query: () => ({
        url: "/users/profile-photo",
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    updateSizeProfile: builder.mutation({
      query: (sizeData) => ({
        url: "/users/size-profile",
        method: "PUT",
        body: sizeData,
      }),
      invalidatesTags: ["User"],
    }),
    followSeller: builder.mutation({
      query: (sellerId) => ({
        url: `/users/follow/${sellerId}`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    getSharedWishlist: builder.query({
      query: (userId) => `/users/wishlist/share/${userId}`,
      providesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useUploadProfilePhotoMutation,
  useDeleteProfilePhotoMutation,
  useUpdateSizeProfileMutation,
  useFollowSellerMutation,
  useGetSharedWishlistQuery,
} = userApi;
