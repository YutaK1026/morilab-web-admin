export type CsvFile = "members" | "news" | "publications";

export type CsvRow = Record<string, string>;

export type CsvResponse = {
  description: string;
  header: string;
  data: CsvRow[];
};

