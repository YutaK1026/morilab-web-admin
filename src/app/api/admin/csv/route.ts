import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { readFileSync, writeFileSync } from "fs";
import { CSV_FILES } from "@/lib/config";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

/**
 * CSVファイルを読み込む
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const { authenticated } = await checkAuth();
    if (!authenticated) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file || !["members", "news", "publications"].includes(file)) {
      return NextResponse.json(
        { error: "無効なファイル名です" },
        { status: 400 }
      );
    }

    const filePath = CSV_FILES[file as keyof typeof CSV_FILES];
    const content = readFileSync(filePath, "utf-8");

    // ファイル全体をパース（引用符内の改行に対応）
    const allRecords = parse(content, {
      columns: false,
      skip_empty_lines: false,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    if (allRecords.length === 0) {
      return NextResponse.json({
        description: "",
        header: "",
        data: [],
      });
    }

    // 1行目（インデックス0）は説明フィールド + ヘッダー行
    const firstRow = allRecords[0];
    const descriptionLine = firstRow[0] || "";
    const headerFields = firstRow.slice(1);
    const headerLine = headerFields.join(",");
    const headerColumns = headerFields
      .map((h: string) => String(h).trim())
      .filter((h: string) => h);

    // 2行目以降がデータ
    const dataRows = allRecords.slice(1);

    // データ行をオブジェクトに変換
    // データ行の最初のフィールドは説明フィールド用の空値なので、インデックス1から開始
    const records = dataRows.map((row: any[]) => {
      const record: Record<string, string> = {};
      headerColumns.forEach((col: string, index: number) => {
        // データ行のインデックス0は説明フィールド用なので、インデックス1から開始
        record[col] = (row[index + 1] || "").toString();
      });
      return record;
    });

    return NextResponse.json({
      description: descriptionLine,
      header: headerLine,
      data: records,
    });
  } catch (error) {
    console.error("CSV read error:", error);
    return NextResponse.json(
      { error: "CSVファイルの読み込みに失敗しました" },
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
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { file, description, header, data } = await request.json();

    if (!file || !["members", "news", "publications"].includes(file)) {
      return NextResponse.json(
        { error: "無効なファイル名です" },
        { status: 400 }
      );
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "データが無効です" }, { status: 400 });
    }

    const filePath = CSV_FILES[file as keyof typeof CSV_FILES];

    // ヘッダーカラムを取得
    const headerColumns = header
      .split(",")
      .map((h: string) => h.trim())
      .filter((h: string) => h);

    // データ行を配列形式に変換
    // 最初のフィールドは説明フィールド用の空値なので、それを追加する
    const dataRows = data.map((row: Record<string, string>) => {
      // 最初に説明フィールド用の空値を追加
      const rowArray = [""];
      // その後、ヘッダーカラムに対応する値を追加
      headerColumns.forEach((col: string) => {
        rowArray.push(row[col] || "");
      });
      return rowArray;
    });

    // CSVを文字列化（ヘッダー行は含めない）
    const csvData = stringify(dataRows, {
      header: false,
      quoted: true,
      quoted_empty: true,
    });

    // 説明行とヘッダー行を結合して1行目を作成
    // 形式: "説明",ヘッダー1,ヘッダー2,...
    // 改行を含む説明フィールドがある場合、stringifyで正しくエスケープする
    const firstLineArray = description
      ? [[description, ...headerColumns]]
      : [[...headerColumns]];

    const firstLineCsv = stringify(firstLineArray, {
      header: false,
      quoted: true,
      quoted_empty: true,
    }).trim();

    // 最終的なCSVコンテンツを構築
    const content = `${firstLineCsv}\n${csvData}`;

    // ファイルに書き込み
    writeFileSync(filePath, content, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CSV write error:", error);
    return NextResponse.json(
      { error: "CSVファイルの保存に失敗しました" },
      { status: 500 }
    );
  }
}
