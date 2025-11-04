import styles from "./StatusBadge.module.scss";

type StatusBadgeProps = {
  allowed: boolean;
  value: string;
};

export function StatusBadge({ allowed, value }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${allowed ? styles.allowed : styles.denied}`}>
      <span className={styles.icon}>{allowed ? "✓" : "✗"}</span>
      <span>{value}</span>
    </span>
  );
}

