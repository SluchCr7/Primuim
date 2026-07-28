import { baseApi } from "./baseApi";

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => "/admin/users",
      providesTags: ["User"],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["User"],
    }),
    getAuditLogs: builder.query({
      query: (params = {}) => ({
        url: "/superadmin/audit-logs",
        params,
      }),
    }),
    getAdminOrders: builder.query({
      query: (params = {}) => ({
        url: "/admin/orders",
        params,
      }),
      providesTags: ["Order"],
    }),
    updateAdminOrderStatus: builder.mutation({
      query: ({ id, orderStatus, trackingNumber }) => ({
        url: `/admin/orders/${id}`,
        method: "PATCH",
        body: { orderStatus, trackingNumber },
      }),
      invalidatesTags: ["Order"],
    }),
    getAdminProducts: builder.query({
      query: (params = {}) => ({
        url: "/admin/products",
        params,
      }),
      providesTags: ["Product"],
    }),
    toggleAdminProductStatus: builder.mutation({
      query: ({ id, action }) => ({
        url: `/admin/products/${id}`,
        method: "PATCH",
        body: { action },
      }),
      invalidatesTags: ["Product"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useGetAuditLogsQuery,
  useGetAdminOrdersQuery,
  useUpdateAdminOrderStatusMutation,
  useGetAdminProductsQuery,
  useToggleAdminProductStatusMutation,
} = adminApi;
