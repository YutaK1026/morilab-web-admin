"use client";

import { Button, Message } from "@/components/atoms";
import { CsvTable, CsvToolbar } from "@/components/molecules";
import { useCsvEditor } from "@/lib/hooks/hooks";
import { useRouter } from "next/navigation";
import styles from "./CsvEditorPanel.module.scss";

export function CsvEditorPanel() {
  const router = useRouter();
  const {
    selectedFile,
    setSelectedFile,
    headers,
    rows,
    loading,
    initialLoading,
    error,
    success,
    saving,
    building,
    hasChanges,
    isSaved,
    reload,
    save,
    build,
    addRowAtTop,
    addRowBelow,
    deleteRow,
    updateCell,
    logout,
  } = useCsvEditor({
    onUnauthenticated: () => router.push("/admin/login"),
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>CSVデータ編集</h1>
        <Button variant="danger" onClick={logout}>
          ログアウト
        </Button>
      </div>

      <CsvToolbar
        selectedFile={selectedFile}
        onChangeFile={setSelectedFile}
        onReload={reload}
        onSave={save}
        onBuild={build}
        isReloadDisabled={loading}
        isSaveDisabled={!hasChanges || saving}
        isBuildDisabled={hasChanges || !isSaved || building}
        saving={saving}
        building={building}
      />

      <div className={styles.actionsRow}>
        <Button onClick={addRowAtTop}>先頭に行を追加</Button>
      </div>

      {error && <Message tone="error">{error}</Message>}
      {success && <Message tone="success">{success}</Message>}

      <div className={styles.tableSection}>
        {initialLoading ? (
          <Message tone="warning">読み込み中...</Message>
        ) : headers.length === 0 ? (
          <Message tone="warning">ヘッダー情報が見つかりませんでした。</Message>
        ) : (
          <CsvTable
            headers={headers}
            rows={rows}
            onCellChange={updateCell}
            onAddRowBelow={addRowBelow}
            onDeleteRow={deleteRow}
          />
        )}
      </div>
    </div>
  );
}

