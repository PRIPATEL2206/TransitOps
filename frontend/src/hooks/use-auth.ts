import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import { post, get } from "@/lib/api-client";
import { setTokens as storeTokens, clearTokens } from "@/lib/api-client";

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  fetchCurrentUser: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist(
    (set, getState) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await post<AuthTokens>("/auth/token", {
            username,
            password,
          });

          // Store tokens (backend returns access_token / refresh_token)
          storeTokens(response.access_token, response.refresh_token);
          set({ isAuthenticated: true });

          // Fetch user profile
          try {
            const user = await get<User>("/auth/me");
            set({ user, isLoading: false });
          } catch {
            // If /me fails, still keep authenticated (token is valid)
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      clearAuth: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const user = await get<User>("/auth/me");
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          getState().clearAuth();
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "transitops-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * useAuth — primary hook for consuming auth state and actions.
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    clearAuth,
    fetchCurrentUser,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    clearAuth,
    fetchCurrentUser,
  };
}

export default useAuthStore;
