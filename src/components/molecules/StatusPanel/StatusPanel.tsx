import { Message, StatusBadge } from "@/components/atoms";
import styles from "./StatusPanel.module.scss";

export type AdminStatus = {
  ip: string;
  ipAllowed: boolean;
  authenticated: boolean;
};

type StatusPanelProps = {
  status: AdminStatus | null;
  isLoading: boolean;
};

export function StatusPanel({ status, isLoading }: StatusPanelProps) {
  if (isLoading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>ステータスを取得中...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={styles.panel}>
        <Message tone="warning">現在の接続状況を取得できませんでした。</Message>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.statusList}>
        <div className={styles.statusItem}>
          <span className={styles.label}>IP許可状態</span>
          <StatusBadge
            allowed={status.ipAllowed}
            value={status.ipAllowed ? "許可済み" : "拒否"}
          />
        </div>
      </div>
      {!status.ipAllowed && (
        <Message tone="warning">現在のIPアドレスは許可されていません。</Message>
      )}
    </div>
  );
}
