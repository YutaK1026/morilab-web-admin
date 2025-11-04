import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CsvFile = "members" | "news" | "publications";

type CsvRow = Record<string, string>;

type CsvResponse = {
  description: string;
  header: string;
  data: CsvRow[];
};

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
  const onUnauthenticatedRef = useRef(onUnauthenticated);
  const [selectedFile, setSelectedFileState] = useState<CsvFile>("members");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const descriptionRef = useRef<string>("");

  const originalRowsRef = useRef<CsvRow[]>([]);

  useEffect(() => {
    onUnauthenticatedRef.current = onUnauthenticated;
  }, [onUnauthenticated]);

  const markDirty = useCallback(() => {
    setHasChanges(true);
    setIsSaved(false);
    setSuccess(null);
  }, []);

  const loadCsv = useCallback(async (file: CsvFile) => {
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
        setError(data.data ? null : "CSVファイルの読み込みに失敗しました");
        return;
      }

      descriptionRef.current = data.description;
      const headerList = data.header
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      setHeaders(headerList);
      setRows(data.data);
      originalRowsRef.current = JSON.parse(JSON.stringify(data.data));
      setHasChanges(false);
      setIsSaved(false);
    } catch (err) {
      console.error("Load CSV error:", err);
      setError("CSVファイルの読み込みに失敗しました");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCsv(selectedFile);
  }, [loadCsv, selectedFile]);

  const reload = useCallback(async () => {
    await loadCsv(selectedFile);
  }, [loadCsv, selectedFile]);

  const setSelectedFile = useCallback((file: CsvFile) => {
    setSelectedFileState(file);
    setSuccess(null);
    setError(null);
  }, []);

  const addRowAtTop = useCallback(() => {
    setRows((prev) => {
      const newRow: CsvRow = {};
      headers.forEach((header) => {
        newRow[header] = "";
      });
      return [newRow, ...prev];
    });
    markDirty();
  }, [headers, markDirty]);

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
    [headers, markDirty]
  );

  const deleteRow = useCallback(
    (index: number) => {
      setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
      markDirty();
    },
    [markDirty]
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
    [markDirty]
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

      originalRowsRef.current = JSON.parse(JSON.stringify(rows));
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
  }, [saving, hasChanges, selectedFile, headers, rows, loadCsv]);

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
  }, [building]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      onUnauthenticatedRef.current?.();
    }
  }, []);

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
    ]
  );
}
