import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { readFileSync, writeFileSync } from 'fs';
import { CSV_FILES } from '@/lib/config';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

/**
 * CSVファイルを読み込む
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const { authenticated } = await checkAuth();
    if (!authenticated) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file || !['members', 'news', 'publications'].includes(file)) {
      return NextResponse.json(
        { error: '無効なファイル名です' },
        { status: 400 }
      );
    }

    const filePath = CSV_FILES[file as keyof typeof CSV_FILES];
    const content = readFileSync(filePath, 'utf-8');

    // CSVをパース（最初の行は説明行、2行目がヘッダー）
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      from_line: 2, // 2行目から開始（1行目は説明行）
    });

    // 元のファイルの最初の2行を保持（説明行とヘッダー行）
    const lines = content.split('\n');
    const descriptionLine = lines[0] || '';
    const headerLine = lines[1] || '';

    return NextResponse.json({
      description: descriptionLine,
      header: headerLine,
      data: records,
    });
  } catch (error) {
    console.error('CSV read error:', error);
    return NextResponse.json(
      { error: 'CSVファイルの読み込みに失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * CSVファイルを保存
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const { authenticated } = await checkAuth();
    if (!authenticated) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { file, description, header, data } = await request.json();

    if (!file || !['members', 'news', 'publications'].includes(file)) {
      return NextResponse.json(
        { error: '無効なファイル名です' },
        { status: 400 }
      );
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'データが無効です' },
        { status: 400 }
      );
    }

    const filePath = CSV_FILES[file as keyof typeof CSV_FILES];

    // CSVを文字列化（ヘッダー行を含める）
    const csvData = stringify(data, {
      header: true,
      quoted: true,
      quoted_empty: true,
      columns: header.split(',').map((h) => h.trim()),
    });

    // 説明行を追加（ヘッダー行はstringifyで既に含まれるため、説明行のみ追加）
    const content = description
      ? `${description}\n${csvData}`
      : csvData;

    // ファイルに書き込み
    writeFileSync(filePath, content, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CSV write error:', error);
    return NextResponse.json(
      { error: 'CSVファイルの保存に失敗しました' },
      { status: 500 }
    );
  }
}

