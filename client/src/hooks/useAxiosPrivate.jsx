import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import axiosPrivate from "../api/axiosPrivate";
import useAuth from "./useAuth";
import axios from "../api/axios";

const REFRESH_URL = "/api/auth/refresh";

// Shared state across all instances to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export default function useAxiosPrivate() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const authRef = useRef(auth);

  // Keep authRef in sync with auth
  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  useEffect(() => {
    // Request interceptor - adds access token to every request
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${authRef.current?.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handles token refresh on 401 errors
    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response, // Pass through successful responses
      async (error) => {
        const originalRequest = error?.config;

        // Check if error is 401 and we haven't already retried this request
        if (error?.response?.status === 401 && !originalRequest?._retry) {
          if (isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return axiosPrivate(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Try to refresh the token
            const response = await axios.post(
              REFRESH_URL,
              { refreshToken: authRef.current?.refreshToken },
              {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
              }
            );

            const newAccessToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshToken;

            // Update auth context with new tokens
            setAuth((prev) => ({
              ...prev,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            }));

            // Process all queued requests with new token
            processQueue(null, newAccessToken);

            // Retry the original request with new access token
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivate(originalRequest);
          } catch (refreshError) {
            // Refresh token is invalid/expired - log user out
            processQueue(refreshError, null);
            console.error("Refresh token expired:", refreshError);
            setAuth({}); // Clear auth state
            navigate("/login", { replace: true });
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup function - remove interceptors when component unmounts
    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [setAuth, navigate]);

  return axiosPrivate;
}
