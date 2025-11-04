import { useCallback, useState } from "react";
import type { AdminStatus } from "./types";
import { useOnAuthenticatedRef } from "./useOnAuthenticatedRef";
import { useAdminStatusFetcher } from "./useAdminStatusFetcher";

type UseAdminLoginOptions = {
  onAuthenticated?: () => void;
};

type UseAdminLoginResult = {
  password: string;
  setPassword: (value: string) => void;
  status: AdminStatus | null;
  statusLoading: boolean;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
};

export function useAdminLogin(options: UseAdminLoginOptions = {}): UseAdminLoginResult {
  const { onAuthenticated } = options;
  const onAuthenticatedRef = useOnAuthenticatedRef(onAuthenticated);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status, statusLoading, fetchStatus } = useAdminStatusFetcher(onAuthenticatedRef);

  const login = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "ログインに失敗しました");
        return;
      }

      setPassword("");
      await fetchStatus();
    } catch (err) {
      console.error("Login error:", err);
      setError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [fetchStatus, loading, password]);

  return {
    password,
    setPassword,
    status,
    statusLoading,
    loading,
    error,
    login,
  };
}

export type { AdminStatus } from "./types";
