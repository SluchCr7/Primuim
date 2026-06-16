"use client";

import React, { useEffect, useState } from "react";
import { API_BASE_URL, useRefreshTokenMutation } from "../../lib/api";
import { useAppDispatch } from "../../lib/store";
import { setCredentials, logOut } from "../../lib/authSlice";

export const SessionInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [refreshSession] = useRefreshTokenMutation();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const refreshResult = await refreshSession(undefined).unwrap();
        if (refreshResult && refreshResult.accessToken) {
          const userResult = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
              authorization: `Bearer ${refreshResult.accessToken}`,
            },
            credentials: "include",
          });
          if (!userResult.ok) {
            throw new Error("Failed to load authenticated user");
          }
          const userData = await userResult.json();
          if (userData.success && userData.user) {
            dispatch(
              setCredentials({
                user: {
                  id: userData.user._id,
                  username: userData.user.username,
                  email: userData.user.email,
                  role: userData.user.role,
                },
                accessToken: refreshResult.accessToken,
              })
            );
          } else {
            throw new Error("Missing user profile");
          }
        }
      } catch (err) {
        dispatch(logOut());
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [dispatch, refreshSession]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
          <span className="font-serif text-sm tracking-widest text-gold animate-pulse">
            SHOP PREMIUM
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionInitializer;
