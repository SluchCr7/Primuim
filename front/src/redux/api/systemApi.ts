import { baseApi } from "./baseApi";

export const systemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSystemSettings: builder.query({
      query: () => "/admin/settings",
      providesTags: ["SystemSettings"],
    }),
    updateSystemSettings: builder.mutation({
      query: (settingsData) => ({
        url: "/admin/settings",
        method: "PUT",
        body: settingsData,
      }),
      invalidatesTags: ["SystemSettings"],
    }),
    getExchangeRates: builder.query({
      query: () => "/currency/rates",
    }),
    getAllTestimonials: builder.query({
      query: () => "/testimonials",
      providesTags: ["Testimonial"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetExchangeRatesQuery,
  useGetAllTestimonialsQuery,
} = systemApi;
