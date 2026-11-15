import { baseApi } from "./baseApi";

export interface HomeTestimonial {
  _id: string;
  body: string;
  User: {
    name?: string;
    username?: string;
    profileName?: string;
  } | null;
}

interface TestimonialsResponse {
  data: HomeTestimonial[];
}

export const testimonialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHomeTestimonials: builder.query<TestimonialsResponse, void>({
      query: () => "/testimonials?limit=3",
      providesTags: ["Testimonial"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetHomeTestimonialsQuery } = testimonialApi;
