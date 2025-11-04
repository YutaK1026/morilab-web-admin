import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdminLogin } from "@/lib/hooks/hooks";

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

describe("useAdminLogin", () => {
  beforeEach(() => {
    (global.fetch as unknown as jest.Mock).mockReset();
  });

  it("fetches status on mount and stores response", async () => {
    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce(
      createFetchResponse(200, {
        ip: "127.0.0.1",
        ipAllowed: true,
        authenticated: false,
      })
    );

    const { result } = renderHook(() => useAdminLogin());

    await waitFor(() => expect(result.current.statusLoading).toBe(false));

    expect(result.current.status).toEqual({
      ip: "127.0.0.1",
      ipAllowed: true,
      authenticated: false,
    });
  });

  it("posts login data and triggers authenticated callback", async () => {
    (global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce(
        createFetchResponse(200, {
          ip: "127.0.0.1",
          ipAllowed: true,
          authenticated: false,
        })
      )
      .mockResolvedValueOnce(createFetchResponse(200, { success: true }))
      .mockResolvedValueOnce(
        createFetchResponse(200, {
          ip: "127.0.0.1",
          ipAllowed: true,
          authenticated: true,
        })
      );

    const onAuthenticated = jest.fn();
    const { result } = renderHook(() => useAdminLogin({ onAuthenticated }));

    await waitFor(() => expect(result.current.statusLoading).toBe(false));

    act(() => {
      result.current.setPassword("secret");
    });

    await act(async () => {
      await result.current.login();
    });

    const calls = (global.fetch as unknown as jest.Mock).mock.calls;
    expect(calls[1][0]).toBe("/api/admin/login");
    expect(JSON.parse(calls[1][1].body)).toEqual({ password: "secret" });
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
  });

  it("sets an error when login fails", async () => {
    (global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce(
        createFetchResponse(200, {
          ip: "127.0.0.1",
          ipAllowed: true,
          authenticated: false,
        })
      )
      .mockResolvedValueOnce(
        createFetchResponse(401, {
          error: "ログインに失敗しました",
        })
      );

    const { result } = renderHook(() => useAdminLogin());

    await waitFor(() => expect(result.current.statusLoading).toBe(false));

    act(() => {
      result.current.setPassword("bad");
    });

    await act(async () => {
      await result.current.login();
    });

    expect(result.current.error).toBe("ログインに失敗しました");
  });
});
