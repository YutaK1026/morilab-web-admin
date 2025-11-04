import { Button, Select } from "@/components/atoms";
import type { CsvFile } from "@/lib/hooks/hooks";
import styles from "./CsvToolbar.module.scss";

const FILE_OPTIONS: Array<{ value: CsvFile; label: string }> = [
  { value: "members", label: "members.csv" },
  { value: "news", label: "news.csv" },
  { value: "publications", label: "publications.csv" },
];

type CsvToolbarProps = {
  selectedFile: CsvFile;
  onChangeFile: (file: CsvFile) => void;
  onReload: () => void;
  onSave: () => void;
  onBuild: () => void;
  isReloadDisabled: boolean;
  isSaveDisabled: boolean;
  isBuildDisabled: boolean;
  saving: boolean;
  building: boolean;
};

export function CsvToolbar({
  selectedFile,
  onChangeFile,
  onReload,
  onSave,
  onBuild,
  isReloadDisabled,
  isSaveDisabled,
  isBuildDisabled,
  saving,
  building,
}: CsvToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.fileSelector}>
        <span className={styles.label}>ファイル:</span>
        <Select
          value={selectedFile}
          onChange={(event) => onChangeFile(event.target.value as CsvFile)}
          disabled={saving || building}
        >
          {FILE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className={styles.actions}>
        <Button onClick={onReload} disabled={isReloadDisabled}>
          再読み込み
        </Button>
        <Button variant="success" onClick={onSave} disabled={isSaveDisabled}>
          {saving ? "保存中..." : "保存"}
        </Button>
        <Button variant="warning" onClick={onBuild} disabled={isBuildDisabled}>
          {building ? "ビルド中..." : "ビルド実行"}
        </Button>
      </div>
    </div>
  );
}
