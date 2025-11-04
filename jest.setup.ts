import "@testing-library/jest-dom";

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

afterEach(() => {
  const mock = global.fetch as unknown as jest.Mock | undefined;
  mock?.mockReset();
});
