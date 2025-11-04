import { Button, Message, TextInput } from "@/components/atoms";
import styles from "./LoginForm.module.scss";

type LoginFormProps = {
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  loading: boolean;
  error: string | null;
};

export function LoginForm({
  password,
  onPasswordChange,
  onSubmit,
  disabled,
  loading,
  error,
}: LoginFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disabled) {
      onSubmit();
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="admin-password">
          パスワード
        </label>
        <TextInput
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={disabled}
          required
        />
      </div>
      {error && <Message tone="error">{error}</Message>}
      <Button type="submit" disabled={disabled || loading}>
        {loading ? "ログイン中..." : "ログイン"}
      </Button>
    </form>
  );
}

