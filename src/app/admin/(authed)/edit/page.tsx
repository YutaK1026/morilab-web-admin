'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type CSVFile = 'members' | 'news' | 'publications';

interface CSVData {
  description: string;
  header: string;
  data: any[];
}

export default function EditPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<CSVFile>('members');
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedData, setEditedData] = useState<any[]>([]);

  useEffect(() => {
    // 認証チェック
    fetch('/api/admin/status')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/admin/login');
        }
      })
      .catch(() => {
        router.push('/admin/login');
      });
  }, [router]);

  useEffect(() => {
    loadCSV();
  }, [selectedFile]);

  const loadCSV = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/csv?file=${selectedFile}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'CSVファイルの読み込みに失敗しました');
        return;
      }

      setCsvData(data);
      setEditedData(data.data);
    } catch (err) {
      setError('CSVファイルの読み込みに失敗しました');
      console.error('Load CSV error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!csvData) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: selectedFile,
          description: csvData.description,
          header: csvData.header,
          data: editedData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'CSVファイルの保存に失敗しました');
        return;
      }

      setSuccess('CSVファイルを保存しました');
      // データを再読み込み
      await loadCSV();
    } catch (err) {
      setError('CSVファイルの保存に失敗しました');
      console.error('Save CSV error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBuild = async () => {
    setBuilding(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/build', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'ビルドに失敗しました');
        if (data.details) {
          setError(`${data.error}: ${data.details}`);
        }
        return;
      }

      setSuccess('ビルドが完了しました');
    } catch (err) {
      setError('ビルドに失敗しました');
      console.error('Build error:', err);
    } finally {
      setBuilding(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleAddRow = () => {
    if (!csvData) return;

    const headers = csvData.header.split(',');
    const newRow: any = {};
    headers.forEach((header) => {
      newRow[header.trim()] = '';
    });
    setEditedData([...editedData, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    setEditedData(editedData.filter((_, i) => i !== index));
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...editedData];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setEditedData(newData);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (!csvData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>データの読み込みに失敗しました</div>
      </div>
    );
  }

  const headers = csvData.header.split(',').map((h) => h.trim());

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>CSVデータ編集</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          ログアウト
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.fileSelector}>
          <label htmlFor="file-select">ファイル:</label>
          <select
            id="file-select"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value as CSVFile)}
            className={styles.select}
          >
            <option value="members">members.csv</option>
            <option value="news">news.csv</option>
            <option value="publications">publications.csv</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button
            onClick={loadCSV}
            className={styles.button}
            disabled={loading}
          >
            再読み込み
          </button>
          <button
            onClick={handleSave}
            className={`${styles.button} ${styles.saveButton}`}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleBuild}
            className={`${styles.button} ${styles.buildButton}`}
            disabled={building}
          >
            {building ? 'ビルド中...' : 'ビルド実行'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className={styles.th}>
                  {header}
                </th>
              ))}
              <th className={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {editedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.tr}>
                {headers.map((header) => (
                  <td key={header} className={styles.td}>
                    <input
                      type="text"
                      value={row[header] || ''}
                      onChange={(e) =>
                        handleCellChange(rowIndex, header, e.target.value)
                      }
                      className={styles.input}
                    />
                  </td>
                ))}
                <td className={styles.td}>
                  <button
                    onClick={() => handleDeleteRow(rowIndex)}
                    className={styles.deleteButton}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <button onClick={handleAddRow} className={styles.addButton}>
          行を追加
        </button>
      </div>
    </div>
  );
}

