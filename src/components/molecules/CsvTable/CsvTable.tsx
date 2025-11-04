import { Button, ExpandableTextInput } from "@/components/atoms";
import styles from "./CsvTable.module.scss";

type RowData = Record<string, string>;

type CsvTableProps = {
  headers: string[];
  rows: RowData[];
  onCellChange: (rowIndex: number, header: string, value: string) => void;
  onAddRowBelow: (rowIndex: number) => void;
  onDeleteRow: (rowIndex: number) => void;
};

export function CsvTable({
  headers,
  rows,
  onCellChange,
  onAddRowBelow,
  onDeleteRow,
}: CsvTableProps) {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className={styles.headerCell}>
                {header}
              </th>
            ))}
            <th className={styles.headerCell}>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className={styles.row}>
              {headers.map((header) => (
                <td key={`${rowIndex}-${header}`} className={styles.cell}>
                  <ExpandableTextInput
                    className={styles.input}
                    value={row[header] ?? ""}
                    onChange={(event) => onCellChange(rowIndex, header, event.target.value)}
                  />
                </td>
              ))}
              <td className={`${styles.cell} ${styles.actionsCell}`}>
                <div className={styles.actions}>
                  <Button
                    className={styles.smallButton}
                    variant="success"
                    onClick={() => onAddRowBelow(rowIndex)}
                  >
                    +行
                  </Button>
                  <Button
                    className={styles.smallButton}
                    variant="danger"
                    onClick={() => onDeleteRow(rowIndex)}
                  >
                    削除
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
