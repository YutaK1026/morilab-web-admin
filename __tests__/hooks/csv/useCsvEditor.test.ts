import { act, renderHook, waitFor } from "@testing-library/react";
import { useCsvEditor } from "@/lib/hooks/hooks";

type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
};

const createFetchResponse = (status: number, data: any): FetchResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
});

describe("useCsvEditor", () => {
  beforeEach(() => {
    (global.fetch as unknown as jest.Mock).mockReset();
  });

  const csvResponse = {
    description: "",
    header: "name,role",
    data: [
      { name: "Alice", role: "Engineer" },
      { name: "Bob", role: "Designer" },
    ],
  };

  it("loads csv data on mount", async () => {
    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce(
      createFetchResponse(200, csvResponse)
    );

    const { result } = renderHook(() => useCsvEditor());

    await waitFor(() => expect(result.current.initialLoading).toBe(false));

    expect(result.current.headers).toEqual(["name", "role"]);
    expect(result.current.rows).toEqual(csvResponse.data);
  });

  it("saves edited data and resets flags", async () => {
    (global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce(createFetchResponse(200, csvResponse))
      .mockResolvedValueOnce(createFetchResponse(200, { success: true }))
      .mockResolvedValueOnce(
        createFetchResponse(200, {
          ...csvResponse,
          data: [
            { name: "Alice", role: "Engineer" },
            { name: "Bob", role: "Lead" },
          ],
        })
      );

    const { result } = renderHook(() => useCsvEditor());

    await waitFor(() => expect(result.current.initialLoading).toBe(false));

    act(() => {
      result.current.updateCell(1, "role", "Lead");
    });

    expect(result.current.hasChanges).toBe(true);

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => expect(result.current.saving).toBe(false));

    const calls = (global.fetch as unknown as jest.Mock).mock.calls;
    expect(calls[1][0]).toBe("/api/admin/csv");
    expect(JSON.parse(calls[1][1].body)).toMatchObject({
      file: "members",
      header: "name,role",
      data: [
        { name: "Alice", role: "Engineer" },
        { name: "Bob", role: "Lead" },
      ],
    });

    expect(result.current.success).toBe("CSVファイルを保存しました");
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.isSaved).toBe(true);
  });

  it("reports errors when build fails", async () => {
    (global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce(createFetchResponse(200, csvResponse))
      .mockResolvedValueOnce(
        createFetchResponse(500, {
          error: "ビルドに失敗しました",
          details: "Command failed",
        })
      );

    const { result } = renderHook(() => useCsvEditor());

    await waitFor(() => expect(result.current.initialLoading).toBe(false));

    await act(async () => {
      await result.current.build();
    });

    expect(result.current.error).toContain("ビルドに失敗しました");
  });
});
