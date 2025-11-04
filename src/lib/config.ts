import path from 'path';

/**
 * メインプロジェクトのパス設定
 */
export const MAIN_PROJECT_PATH = path.join(process.cwd(), '..', 'morilab');
export const DATA_DIR = path.join(MAIN_PROJECT_PATH, 'data');

/**
 * CSVファイルのパス
 */
export const CSV_FILES = {
  members: path.join(DATA_DIR, 'members.csv'),
  news: path.join(DATA_DIR, 'news.csv'),
  publications: path.join(DATA_DIR, 'publications.csv'),
} as const;

