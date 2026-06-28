"use client";

import React, { useEffect, useState } from "react";
import { API_BASE_URL, useRefreshTokenMutation, ecommerceApi } from "../../lib/api";
import { useAppDispatch, useAppSelector } from "../../lib/store";
import { setCredentials, logOut, setSocketConnected } from "../../lib/authSlice";
import { getSocket, disconnectSocket } from "../../lib/socket";
import { playNotificationChime } from "../../lib/sound";
import { useToast } from "./Toast";

export const SessionInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshSession] = useRefreshTokenMutation();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const refreshResult = await refreshSession(undefined).unwrap();
        if (refreshResult && refreshResult.accessToken) {
          // Always fetch /me to get the most up-to-date role and sellerStatus
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
                  sellerStatus: userData.user.sellerStatus || null,
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

  // Manage WebSocket connection for real-time notifications
  useEffect(() => {
    if (isAuthenticated && user?.id && accessToken) {
      const socket = getSocket(user.id, accessToken);

      const handleConnect = () => {
        console.log("[Socket] Connected to server successfully");
        dispatch(setSocketConnected(true));
      };

      const handleDisconnect = () => {
        console.log("[Socket] Disconnected from server");
        dispatch(setSocketConnected(false));
      };

      // Set initial state
      dispatch(setSocketConnected(socket.connected));

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);

      socket.on("notification", (notification: any) => {
        console.log("Real-time notification received:", notification);
        playNotificationChime();
        showToast(notification.title ? `${notification.title}: ${notification.message}` : notification.message, "info");
        dispatch(ecommerceApi.util.invalidateTags(["Notification"]));
      });

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("notification");
        disconnectSocket();
        dispatch(setSocketConnected(false));
      };
    } else {
      disconnectSocket();
      dispatch(setSocketConnected(false));
    }
  }, [isAuthenticated, user?.id, accessToken, dispatch, showToast]);


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
