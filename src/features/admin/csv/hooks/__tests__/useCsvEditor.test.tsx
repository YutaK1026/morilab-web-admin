import { act, renderHook, waitFor } from "@testing-library/react";
import { useCsvEditor } from "../useCsvEditor";

const getFetchMock = () => global.fetch as unknown as jest.Mock;

const defaultCsvResponse = {
  description: "base description",
  header: "name,email",
  data: [
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
  ],
};

async function renderCsvEditor(options: Parameters<typeof useCsvEditor>[0] = {}) {
  const fetchMock = getFetchMock();
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => defaultCsvResponse,
  });

  const utils = renderHook(() => useCsvEditor(options));

  await waitFor(() => expect(utils.result.current.initialLoading).toBe(false));

  return utils;
}

describe("useCsvEditor", () => {
  beforeEach(() => {
    if (!global.fetch) {
      global.fetch = jest.fn() as unknown as typeof fetch;
    }
    getFetchMock().mockReset();
  });

  it("adds a new empty row at the top", async () => {
    const utils = await renderCsvEditor();

    act(() => {
      utils.result.current.addRowAtTop();
    });

    expect(utils.result.current.rows[0]).toEqual({
      name: "",
      email: "",
    });
    expect(utils.result.current.hasChanges).toBe(true);
    expect(utils.result.current.isSaved).toBe(false);
    expect(utils.result.current.success).toBeNull();
  });

  it("inserts a row below the specified index", async () => {
    const utils = await renderCsvEditor();

    act(() => {
      utils.result.current.addRowBelow(0);
    });

    expect(utils.result.current.rows[1]).toEqual({
      name: "",
      email: "",
    });
  });

  it("deletes a row by index", async () => {
    const utils = await renderCsvEditor();

    act(() => {
      utils.result.current.deleteRow(0);
    });

    expect(utils.result.current.rows).toHaveLength(1);
    expect(utils.result.current.rows[0]).toEqual({
      name: "Bob",
      email: "bob@example.com",
    });
  });

  it("updates a cell value and marks the editor as dirty", async () => {
    const utils = await renderCsvEditor();

    act(() => {
      utils.result.current.updateCell(1, "email", "updated@example.com");
    });

    expect(utils.result.current.rows[1]).toEqual({
      name: "Bob",
      email: "updated@example.com",
    });
    expect(utils.result.current.hasChanges).toBe(true);
    expect(utils.result.current.isSaved).toBe(false);
    expect(utils.result.current.success).toBeNull();
  });

  it("skips saving when there are no changes", async () => {
    const utils = await renderCsvEditor();

    await act(async () => {
      await utils.result.current.save();
    });

    const fetchMock = getFetchMock();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("saves changes and reloads the CSV data", async () => {
    const utils = await renderCsvEditor();
    const saveResponse = { ok: true, status: 200, json: async () => ({}) };
    const reloadResponse = {
      ok: true,
      status: 200,
      json: async () => defaultCsvResponse,
    };

    act(() => {
      utils.result.current.updateCell(0, "name", "Alice Updated");
    });

    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce(saveResponse);
    fetchMock.mockResolvedValueOnce(reloadResponse);

    await act(async () => {
      await utils.result.current.save();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/csv",
      expect.objectContaining({
        method: "POST",
      })
    );
    const [, postInit] = fetchMock.mock.calls[1];
    const payload = JSON.parse(postInit.body as string);
    expect(payload).toMatchObject({
      file: "members",
      header: "name,email",
    });
    expect(payload.data[0].name).toBe("Alice Updated");
    expect(utils.result.current.hasChanges).toBe(false);
    expect(utils.result.current.isSaved).toBe(true);
    expect(utils.result.current.success).toBe("CSVファイルを保存しました");
  });

  it("abandons saving when the request is unauthorized", async () => {
    const onUnauthenticated = jest.fn();
    const utils = await renderCsvEditor({ onUnauthenticated });

    act(() => {
      utils.result.current.updateCell(0, "name", "Alice Updated");
    });

    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    await act(async () => {
      await utils.result.current.save();
    });

    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    expect(utils.result.current.saving).toBe(false);
  });

  it("surfaces server-side save errors", async () => {
    const utils = await renderCsvEditor();
    act(() => {
      utils.result.current.updateCell(0, "name", "Alice Updated");
    });

    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: "bad" }),
    });

    await act(async () => {
      await utils.result.current.save();
    });

    expect(utils.result.current.error).toBe("bad");
    expect(utils.result.current.saving).toBe(false);
  });

  it("reports generic save failures when the request rejects", async () => {
    const utils = await renderCsvEditor();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    act(() => {
      utils.result.current.updateCell(0, "name", "Alice Updated");
    });

    const fetchMock = getFetchMock();
    fetchMock.mockRejectedValueOnce(new Error("network"));

    await act(async () => {
      await utils.result.current.save();
    });

    expect(utils.result.current.error).toBe("CSVファイルの保存に失敗しました");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("runs a build and reports success", async () => {
    const utils = await renderCsvEditor();
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await act(async () => {
      await utils.result.current.build();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/build", {
      method: "POST",
    });
    expect(utils.result.current.success).toBe("ビルドが完了しました");
    expect(utils.result.current.isSaved).toBe(false);
  });

  it("handles unauthorized build attempts", async () => {
    const onUnauthenticated = jest.fn();
    const utils = await renderCsvEditor({ onUnauthenticated });

    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    await act(async () => {
      await utils.result.current.build();
    });

    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it("renders build error details when provided", async () => {
    const utils = await renderCsvEditor();
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "bad", details: "something" }),
    });

    await act(async () => {
      await utils.result.current.build();
    });

    expect(utils.result.current.error).toBe("bad\nsomething");
  });

  it("reports generic build failures when the request rejects", async () => {
    const utils = await renderCsvEditor();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = getFetchMock();
    fetchMock.mockRejectedValueOnce(new Error("network"));

    await act(async () => {
      await utils.result.current.build();
    });

    expect(utils.result.current.error).toBe("ビルドに失敗しました");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("logs the user out and triggers the unauthenticated handler", async () => {
    const onUnauthenticated = jest.fn();
    const utils = await renderCsvEditor({ onUnauthenticated });

    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await act(async () => {
      await utils.result.current.logout();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/logout", {
      method: "POST",
    });
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });
});
