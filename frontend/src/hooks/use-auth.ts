import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, AuthTokens } from "@/types";
import { post, get } from "@/lib/api-client";
import { setTokens as storeTokens, clearTokens } from "@/lib/api-client";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  clearAuth: () => void;
  fetchCurrentUser: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const tokens = await post<AuthTokens>("/auth/token/", {
            username,
            password,
          });

          // Persist tokens to localStorage and set cookie for middleware
          storeTokens(tokens.access, tokens.refresh);

          set({ tokens, isAuthenticated: true });

          // Fetch user profile
          const user = await get<User>("/auth/users/me/");
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false, user: null, tokens: null });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (tokens) => {
        if (tokens) {
          storeTokens(tokens.access, tokens.refresh);
        } else {
          clearTokens();
        }
        set({ tokens, isAuthenticated: !!tokens });
      },

      clearAuth: () => {
        clearTokens();
        set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
      },

      fetchCurrentUser: async () => {
        const state = get();
        if (!state.tokens) return;
        set({ isLoading: true });
        try {
          const user = await get<User>("/auth/users/me/");
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          state.clearAuth();
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "transitops-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist tokens and user; re-hydrate on mount
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * useAuth — primary hook for consuming auth state and actions.
 * Hydrates from localStorage on first mount and keeps the cookie in sync.
 */
export function useAuth() {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setTokens,
    clearAuth,
    fetchCurrentUser,
  } = useAuthStore();

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setTokens,
    clearAuth,
    fetchCurrentUser,
  };
}

export default useAuthStore;
