import { useCallback, useMemo, useState } from "react";
import type { CsvFile, CsvRow } from "./types";
import { useOnUnauthenticatedRef } from "./useOnUnauthenticatedRef";
import { useCsvLoader } from "./useCsvLoader";

type UseCsvEditorOptions = {
  onUnauthenticated?: () => void;
};

export type UseCsvEditorResult = {
  selectedFile: CsvFile;
  setSelectedFile: (file: CsvFile) => void;
  headers: string[];
  rows: CsvRow[];
  loading: boolean;
  initialLoading: boolean;
  saving: boolean;
  building: boolean;
  hasChanges: boolean;
  isSaved: boolean;
  error: string | null;
  success: string | null;
  reload: () => Promise<void>;
  save: () => Promise<void>;
  build: () => Promise<void>;
  addRowAtTop: () => void;
  addRowBelow: (index: number) => void;
  deleteRow: (index: number) => void;
  updateCell: (rowIndex: number, header: string, value: string) => void;
  logout: () => Promise<void>;
};

export function useCsvEditor(
  options: UseCsvEditorOptions = {}
): UseCsvEditorResult {
  const { onUnauthenticated } = options;
  const onUnauthenticatedRef = useOnUnauthenticatedRef(onUnauthenticated);

  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    selectedFile,
    setSelectedFile,
    headers,
    rows,
    setRows,
    loading,
    initialLoading,
    loadCsv,
    reload,
    descriptionRef,
  } = useCsvLoader({
    onUnauthenticatedRef,
    setError,
    setSuccess,
    setHasChanges,
    setIsSaved,
  });

  const markDirty = useCallback(() => {
    setHasChanges(true);
    setIsSaved(false);
    setSuccess(null);
  }, [setHasChanges, setIsSaved, setSuccess]);

  const addRowAtTop = useCallback(() => {
    setRows((prev) => {
      const newRow: CsvRow = {};
      headers.forEach((header) => {
        newRow[header] = "";
      });
      return [newRow, ...prev];
    });
    markDirty();
  }, [headers, markDirty, setRows]);

  const addRowBelow = useCallback(
    (index: number) => {
      setRows((prev) => {
        const newRow: CsvRow = {};
        headers.forEach((header) => {
          newRow[header] = "";
        });

        const next = [...prev];
        next.splice(index + 1, 0, newRow);
        return next;
      });
      markDirty();
    },
    [headers, markDirty, setRows]
  );

  const deleteRow = useCallback(
    (index: number) => {
      setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
      markDirty();
    },
    [markDirty, setRows]
  );

  const updateCell = useCallback(
    (rowIndex: number, header: string, value: string) => {
      setRows((prev) => {
        const next = [...prev];
        next[rowIndex] = {
          ...next[rowIndex],
          [header]: value,
        };
        return next;
      });
      markDirty();
    },
    [markDirty, setRows]
  );

  const save = useCallback(async () => {
    if (saving || !hasChanges) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: selectedFile,
          description: descriptionRef.current,
          header: headers.join(","),
          data: rows,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          onUnauthenticatedRef.current?.();
          return;
        }
        setError(data?.error ?? "CSVファイルの保存に失敗しました");
        return;
      }

      setHasChanges(false);
      setIsSaved(true);
      await loadCsv(selectedFile);
      setIsSaved(true);
      setSuccess("CSVファイルを保存しました");
    } catch (err) {
      console.error("Save CSV error:", err);
      setError("CSVファイルの保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [
    descriptionRef,
    hasChanges,
    headers,
    loadCsv,
    onUnauthenticatedRef,
    rows,
    saving,
    selectedFile,
    setError,
    setHasChanges,
    setIsSaved,
    setSuccess,
  ]);

  const build = useCallback(async () => {
    if (building) {
      return;
    }

    setBuilding(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/build", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          onUnauthenticatedRef.current?.();
          return;
        }

        let message = data?.error ?? "ビルドに失敗しました";
        if (data?.details) {
          message += `\n${data.details}`;
        }
        setError(message);
        return;
      }

      setSuccess("ビルドが完了しました");
      setIsSaved(false);
    } catch (err) {
      console.error("Build error:", err);
      setError("ビルドに失敗しました");
    } finally {
      setBuilding(false);
    }
  }, [building, onUnauthenticatedRef, setError, setIsSaved, setSuccess]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      onUnauthenticatedRef.current?.();
    }
  }, [onUnauthenticatedRef]);

  return useMemo(
    () => ({
      selectedFile,
      setSelectedFile,
      headers,
      rows,
      loading,
      initialLoading,
      saving,
      building,
      hasChanges,
      isSaved,
      error,
      success,
      reload,
      save,
      build,
      addRowAtTop,
      addRowBelow,
      deleteRow,
      updateCell,
      logout,
    }),
    [
      addRowAtTop,
      addRowBelow,
      build,
      deleteRow,
      error,
      hasChanges,
      initialLoading,
      loading,
      logout,
      rows,
      save,
      selectedFile,
      setSelectedFile,
      success,
      updateCell,
      building,
      isSaved,
      saving,
      headers,
      reload,
    ]
  );
}
