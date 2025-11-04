import type { HTMLAttributes, PropsWithChildren } from "react";
import styles from "./Card.module.scss";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    className?: string;
  }
>;

export function Card({ children, className = "", ...rest }: CardProps) {
  const composedClassName = `${styles.card}${className ? ` ${className}` : ""}`;
  return (
    <div className={composedClassName} {...rest}>
      {children}
    </div>
  );
}

