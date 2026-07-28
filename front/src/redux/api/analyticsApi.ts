import { baseApi } from "./baseApi";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logAnalyticsEvent: builder.mutation({
      query: (eventData) => ({
        url: "/analytics/event",
        method: "POST",
        body: eventData,
      }),
    }),
    getAdminDashboard: builder.query({
      query: () => "/admin/analytics/dashboard",
    }),
    getAdminSales: builder.query({
      query: () => "/admin/analytics/sales",
    }),
    getAdminInventory: builder.query({
      query: () => "/admin/analytics/inventory",
      providesTags: ["Product"],
    }),
    getFunnelAnalytics: builder.query({
      query: () => "/analytics/funnel",
    }),
    getCohortAnalytics: builder.query({
      query: () => "/analytics/cohort",
    }),
  }),
  overrideExisting: false,
});

export const {
  useLogAnalyticsEventMutation,
  useGetAdminDashboardQuery,
  useGetAdminSalesQuery,
  useGetAdminInventoryQuery,
  useGetFunnelAnalyticsQuery,
  useGetCohortAnalyticsQuery,
} = analyticsApi;
