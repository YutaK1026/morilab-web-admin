import { useCallback, useEffect, useRef, useState } from "react";

export type AdminStatus = {
  ip: string;
  ipAllowed: boolean;
  authenticated: boolean;
};

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
  const onAuthenticatedRef = useRef(onAuthenticated);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await fetch("/api/admin/status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "認証状態の取得に失敗しました");
      }

      setStatus(data);
      if (data.authenticated) {
        onAuthenticatedRef.current?.();
      }
    } catch (err) {
      console.error("Status fetch error:", err);
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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
