import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User", "Cart"],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Cart"],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),
    verifyOTP: builder.mutation({
      query: (otpData) => ({
        url: "/auth/otp/verify",
        method: "POST",
        body: otpData,
      }),
      invalidatesTags: ["User"],
    }),
    sendOTP: builder.mutation({
      query: () => ({
        url: "/auth/otp/send",
        method: "POST",
      }),
    }),
    socialLogin: builder.mutation({
      query: (socialData) => ({
        url: "/auth/social-login",
        method: "POST",
        body: socialData,
      }),
      invalidatesTags: ["User", "Cart"],
    }),
    forgotPassword: builder.mutation({
      query: (emailData) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: emailData,
      }),
    }),
    resetPassword: builder.mutation({
      query: (resetData) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: resetData,
      }),
    }),
    toggle2FA: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/toggle",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    verifyAccount: builder.mutation({
      query: ({ id, token }: { id: string; token: string }) => ({
        url: `/auth/verify/${id}/${token}`,
        method: "GET",
      }),
      invalidatesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useVerifyOTPMutation,
  useSendOTPMutation,
  useSocialLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useToggle2FAMutation,
  useVerifyAccountMutation,
} = authApi;
