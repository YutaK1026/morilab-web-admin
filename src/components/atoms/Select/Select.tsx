import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.scss";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

export function Select({ className = "", ...rest }: SelectProps) {
  const composedClassName = `${styles.select}${className ? ` ${className}` : ""}`;
  return <select className={composedClassName} {...rest} />;
}

