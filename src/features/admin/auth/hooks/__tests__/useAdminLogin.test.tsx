import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdminLogin } from "../useAdminLogin";
import { useAdminStatusFetcher } from "../useAdminStatusFetcher";

jest.mock("../useAdminStatusFetcher");

const getFetchMock = () => global.fetch as unknown as jest.Mock;
const mockUseAdminStatusFetcher = useAdminStatusFetcher as jest.MockedFunction<
  typeof useAdminStatusFetcher
>;

describe("useAdminLogin", () => {
  beforeEach(() => {
    if (!global.fetch) {
      global.fetch = jest.fn() as unknown as typeof fetch;
    }
    getFetchMock().mockReset();
    mockUseAdminStatusFetcher.mockReset();
  });

  function setupHook() {
    const fetchStatus = jest.fn().mockResolvedValue(undefined);
    mockUseAdminStatusFetcher.mockReturnValue({
      status: { authenticated: false },
      statusLoading: false,
      fetchStatus,
    });

    const utils = renderHook(() => useAdminLogin());
    return { ...utils, fetchStatus };
  }

  it("updates the password state through the setter", () => {
    const { result } = setupHook();

    act(() => {
      result.current.setPassword("secret");
    });

    expect(result.current.password).toBe("secret");
  });

  it("prevents duplicate submissions while loading", async () => {
    const { result } = setupHook();
    let resolveFetch: (() => void) | undefined;

    const fetchMock = getFetchMock();
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({
              ok: true,
              json: async () => ({}),
            });
        })
    );

    act(() => {
      result.current.setPassword("secret");
    });

    act(() => {
      void result.current.login();
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await result.current.login();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch?.();
    });
  });

  it("submits credentials and triggers a status refresh", async () => {
    const { result, fetchStatus } = setupHook();
    const payload = { token: "value" };
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    act(() => {
      result.current.setPassword("secret");
    });

    await act(async () => {
      await result.current.login();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "secret" }),
    });
    expect(result.current.password).toBe("");
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("captures server-side errors", async () => {
    const { result } = setupHook();
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "bad" }),
    });

    act(() => {
      result.current.setPassword("secret");
    });

    await act(async () => {
      await result.current.login();
    });

    expect(result.current.error).toBe("bad");
    expect(result.current.loading).toBe(false);
  });

  it("falls back to a generic error when the server payload is empty", async () => {
    const { result } = setupHook();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = getFetchMock();
    fetchMock.mockRejectedValue(new Error("network"));

    act(() => {
      result.current.setPassword("secret");
    });

    await act(async () => {
      await result.current.login();
    });

    expect(result.current.error).toBe("ログインに失敗しました");
    expect(result.current.loading).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
