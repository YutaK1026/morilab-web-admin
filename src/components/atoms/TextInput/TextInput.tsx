import type { InputHTMLAttributes } from "react";
import styles from "./TextInput.module.scss";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function TextInput({ className = "", ...rest }: TextInputProps) {
  const composedClassName = `${styles.input}${className ? ` ${className}` : ""}`;
  return <input className={composedClassName} {...rest} />;
}

