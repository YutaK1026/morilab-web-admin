import { act, renderHook, waitFor } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { useAdminStatusFetcher } from "../useAdminStatusFetcher";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<any>;
};

const getFetchMock = () =>
  global.fetch as unknown as jest.Mock<Promise<FetchResponse>>;

const createRef = (
  handler?: () => void
): MutableRefObject<(() => void) | undefined> =>
  ({
    current: handler,
  } as MutableRefObject<(() => void) | undefined>);

describe("useAdminStatusFetcher", () => {
  beforeEach(() => {
    if (!global.fetch) {
      global.fetch = jest.fn() as unknown as typeof fetch;
    }
    getFetchMock().mockReset();
  });

  it("loads the admin status on mount and invokes the authenticated handler", async () => {
    const handler = jest.fn();
    const onAuthenticatedRef = createRef(handler);

    getFetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        ip: "127.0.0.1",
        ipAllowed: true,
      }),
    });

    const { result } = renderHook(() =>
      useAdminStatusFetcher(onAuthenticatedRef)
    );

    await waitFor(() => expect(result.current.statusLoading).toBe(false));

    expect(getFetchMock()).toHaveBeenCalledWith("/api/admin/status");
    expect(result.current.status).toEqual({
      authenticated: true,
      ip: "127.0.0.1",
      ipAllowed: true,
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("handles non-ok responses by clearing the status", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const onAuthenticatedRef = createRef();

    getFetchMock().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "bad" }),
    });

    const { result } = renderHook(() =>
      useAdminStatusFetcher(onAuthenticatedRef)
    );

    await waitFor(() => expect(result.current.statusLoading).toBe(false));

    expect(result.current.status).toBeNull();
    expect(onAuthenticatedRef.current).toBeUndefined();
    errorSpy.mockRestore();
  });

  it("resets the status when the request rejects", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const onAuthenticatedRef = createRef();

    getFetchMock().mockRejectedValue(new Error("network"));

    const { result } = renderHook(() =>
      useAdminStatusFetcher(onAuthenticatedRef)
    );

    await waitFor(() => expect(result.current.statusLoading).toBe(false));

    expect(result.current.status).toBeNull();
    errorSpy.mockRestore();
  });

  it("exposes a fetchStatus helper that refreshes the state", async () => {
    const handler = jest.fn();
    const onAuthenticatedRef = createRef(handler);
    const fetchMock = getFetchMock();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: false,
        ip: "127.0.0.1",
        ipAllowed: false,
      }),
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        ip: "127.0.0.1",
        ipAllowed: true,
      }),
    });

    const { result } = renderHook(() =>
      useAdminStatusFetcher(onAuthenticatedRef)
    );

    await waitFor(() => expect(result.current.statusLoading).toBe(false));
    expect(result.current.status?.authenticated).toBe(false);

    await act(async () => {
      await result.current.fetchStatus();
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.current.status?.authenticated).toBe(true);
  });
});
