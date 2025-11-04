"use client";

import { Card } from "@/components/atoms";
import { LoginForm, StatusPanel } from "@/components/molecules";
import { useAdminLogin } from "@/features/admin/auth";
import { useRouter } from "next/navigation";
import styles from "./LoginPanel.module.scss";

export function LoginPanel() {
  const router = useRouter();
  const {
    password,
    setPassword,
    status,
    statusLoading,
    login,
    loading,
    error,
  } = useAdminLogin({
    onAuthenticated: () => router.push("/admin/edit"),
  });

  const isIpAllowed = status?.ipAllowed ?? false;
  const isFormDisabled = statusLoading || !isIpAllowed;

  return (
    <div className={styles.page}>
      <Card>
        <div className={styles.content}>
          <h1 className={styles.title}>管理画面ログイン</h1>
          <StatusPanel status={status} isLoading={statusLoading} />
          <LoginForm
            password={password}
            onPasswordChange={setPassword}
            onSubmit={login}
            disabled={isFormDisabled}
            loading={loading}
            error={error}
          />
        </div>
      </Card>
    </div>
  );
}
