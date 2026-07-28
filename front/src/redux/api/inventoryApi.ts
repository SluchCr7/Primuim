import { baseApi } from "./baseApi";

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createWarehouse: builder.mutation({
      query: (warehouseData) => ({
        url: "/inventory/warehouses",
        method: "POST",
        body: warehouseData,
      }),
      invalidatesTags: ["WarehouseInventory"],
    }),
    adjustStock: builder.mutation({
      query: (adjustmentData) => ({
        url: "/inventory/stock-adjustment",
        method: "POST",
        body: adjustmentData,
      }),
      invalidatesTags: ["WarehouseInventory", "Product"],
    }),
    getTurnoverReport: builder.query<any, { startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: "/inventory/turnover-report",
        params: params || {},
      }),
      providesTags: ["WarehouseInventory"],
    }),
    reserveCartStock: builder.mutation({
      query: (reservationData) => ({
        url: "/inventory/reserve",
        method: "POST",
        body: reservationData,
      }),
      invalidatesTags: ["WarehouseInventory"],
    }),
    processReturn: builder.mutation({
      query: (returnData) => ({
        url: "/orders/return",
        method: "POST",
        body: returnData,
      }),
      invalidatesTags: ["Order", "WarehouseInventory", "Product"],
    }),
    adjustProductInventory: builder.mutation({
      query: ({ productId, adjustData }) => ({
        url: `/admin/products/${productId}/inventory`,
        method: "PATCH",
        body: adjustData,
      }),
      invalidatesTags: ["Product"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateWarehouseMutation,
  useAdjustStockMutation,
  useGetTurnoverReportQuery,
  useReserveCartStockMutation,
  useProcessReturnMutation,
  useAdjustProductInventoryMutation,
} = inventoryApi;
