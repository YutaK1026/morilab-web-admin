"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<{
    ip: string;
    ipAllowed: boolean;
    authenticated: boolean;
  } | null>(null);

  useEffect(() => {
    // ステータスを取得
    fetch("/api/admin/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        if (data.authenticated) {
          router.push("/admin/edit");
        }
      })
      .catch((err) => {
        console.error("Status fetch error:", err);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }

      // ログイン成功
      router.push("/admin/edit");
    } catch (err) {
      setError("ログインに失敗しました");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>管理画面ログイン</h1>

        {status && (
          <div className={styles.status}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>IPアドレス:</span>
              <span
                className={`${styles.statusValue} ${
                  status.ipAllowed ? styles.allowed : styles.denied
                }`}
              >
                {status.ip}
              </span>
              {status.ipAllowed ? (
                <span className={styles.checkmark}>✓</span>
              ) : (
                <span className={styles.cross}>✗</span>
              )}
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>IP許可状態:</span>
              <span
                className={`${styles.statusValue} ${
                  status.ipAllowed ? styles.allowed : styles.denied
                }`}
              >
                {status.ipAllowed ? "許可済み" : "拒否"}
              </span>
            </div>
          </div>
        )}

        {status && !status.ipAllowed && (
          <div className={styles.warning}>
            現在のIPアドレスは許可されていません。
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              disabled={loading || !status?.ipAllowed}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !status?.ipAllowed}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
