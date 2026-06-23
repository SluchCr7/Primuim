import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  sellerStatus?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  currency: "EGP" | "USD" | "EUR";
}

const getInitialCurrency = (): "EGP" | "USD" | "EUR" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("selected_currency");
    if (saved === "USD" || saved === "EUR" || saved === "EGP") {
      return saved;
    }
  }
  return "EGP";
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  currency: getInitialCurrency(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserProfile; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    setCurrency: (state, action: PayloadAction<"EGP" | "USD" | "EUR">) => {
      state.currency = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("selected_currency", action.payload);
      }
    },
  },
});

export const { setCredentials, logOut, setCurrency } = authSlice.actions;

export default authSlice.reducer;
