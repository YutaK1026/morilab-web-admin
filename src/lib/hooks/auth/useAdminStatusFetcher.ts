import { useCallback, useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import type { AdminStatus } from "./types";

type AuthenticatedHandler = (() => void) | undefined;

type UseAdminStatusFetcherResult = {
  status: AdminStatus | null;
  statusLoading: boolean;
  fetchStatus: () => Promise<void>;
};

export function useAdminStatusFetcher(
  onAuthenticatedRef: MutableRefObject<AuthenticatedHandler>
): UseAdminStatusFetcherResult {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

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
  }, [onAuthenticatedRef]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    statusLoading,
    fetchStatus,
  };
}

