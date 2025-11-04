import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { CsvFile, CsvResponse, CsvRow } from "../types";

type UnauthenticatedHandler = (() => void) | undefined;

type UseCsvLoaderArgs = {
  onUnauthenticatedRef: MutableRefObject<UnauthenticatedHandler>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSuccess: Dispatch<SetStateAction<string | null>>;
  setHasChanges: Dispatch<SetStateAction<boolean>>;
  setIsSaved: Dispatch<SetStateAction<boolean>>;
  onLoadSuccess?: (payload: { description: string; rows: CsvRow[] }) => void;
};

type UseCsvLoaderResult = {
  selectedFile: CsvFile;
  setSelectedFile: (file: CsvFile) => void;
  headers: string[];
  setHeaders: Dispatch<SetStateAction<string[]>>;
  rows: CsvRow[];
  setRows: Dispatch<SetStateAction<CsvRow[]>>;
  loading: boolean;
  initialLoading: boolean;
  loadCsv: (file: CsvFile) => Promise<void>;
  reload: () => Promise<void>;
  descriptionRef: MutableRefObject<string>;
};

export function useCsvLoader({
  onUnauthenticatedRef,
  setError,
  setSuccess,
  setHasChanges,
  setIsSaved,
  onLoadSuccess,
}: UseCsvLoaderArgs): UseCsvLoaderResult {
  const [selectedFile, setSelectedFileState] = useState<CsvFile>("members");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const descriptionRef = useRef<string>("");

  const loadCsv = useCallback(
    async (file: CsvFile) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch(`/api/admin/csv?file=${file}`);
        const data: CsvResponse = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            onUnauthenticatedRef.current?.();
            return;
          }
          setError(!data?.data ? null : "CSVファイルの読み込みに失敗しました");
          return;
        }

        descriptionRef.current = data.description;
        const headerList = data.header
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        setHeaders(headerList);
        setRows(data.data);
        setHasChanges(false);
        setIsSaved(false);
        onLoadSuccess?.({ description: data.description, rows: data.data });
      } catch (err) {
        console.error("Load CSV error:", err);
        setError("CSVファイルの読み込みに失敗しました");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [onUnauthenticatedRef, setError, setHasChanges, setIsSaved, setSuccess]
  );

  useEffect(() => {
    loadCsv(selectedFile);
  }, [loadCsv, selectedFile]);

  const reload = useCallback(async () => {
    await loadCsv(selectedFile);
  }, [loadCsv, selectedFile]);

  const setSelectedFile = useCallback(
    (file: CsvFile) => {
      setSelectedFileState(file);
      setSuccess(null);
      setError(null);
    },
    [setError, setSuccess]
  );

  return {
    selectedFile,
    setSelectedFile,
    headers,
    setHeaders,
    rows,
    setRows,
    loading,
    initialLoading,
    loadCsv,
    reload,
    descriptionRef,
  };
}
