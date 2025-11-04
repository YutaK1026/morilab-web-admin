import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "success" | "danger" | "warning" | "neutral";

type ButtonProps = PropsWithChildren<
  {
    variant?: ButtonVariant;
    className?: string;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>;

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const variantClass = styles[variant] ?? styles.primary;
  const composedClassName = `${styles.button} ${variantClass}${className ? ` ${className}` : ""}`;

  return (
    <button type={type} className={composedClassName} {...rest}>
      {children}
    </button>
  );
}

