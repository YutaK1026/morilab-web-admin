import type { HTMLAttributes, PropsWithChildren } from "react";
import styles from "./Message.module.scss";

type MessageTone = "error" | "success" | "warning";

type MessageProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    tone?: MessageTone;
    className?: string;
  }
>;

export function Message({
  children,
  tone = "warning",
  className = "",
  ...rest
}: MessageProps) {
  const toneClass = styles[tone] ?? styles.warning;
  const composedClassName = `${styles.message} ${toneClass}${className ? ` ${className}` : ""}`;

  return (
    <div className={composedClassName} {...rest}>
      {children}
    </div>
  );
}

