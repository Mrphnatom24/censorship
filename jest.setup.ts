import '@testing-library/jest-dom';

global.fetch = jest.fn() as typeof fetch;

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(
      (data: unknown, options?: { status?: number; headers?: Record<string, string> }) => ({
        ...(data as object),
        status: options?.status ?? 200,
        headers: options?.headers ?? {},
      })
    ),
  },
}));

const originalConsole = { ...console };

beforeAll(() => {
  if (process.env.NODE_ENV === 'test') {
    Object.assign(console, {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    });
  }
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
      headers: new Map(),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

(global as typeof globalThis & { createMockRequest: unknown }).createMockRequest = (
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) => ({
  json: jest.fn().mockResolvedValue(body),
  headers: { get: jest.fn((key: string) => headers[key] ?? null) },
});

(global as typeof globalThis & { createMockResponse: unknown }).createMockResponse = (
  data: Record<string, unknown> = {},
  options: { status?: number; headers?: Record<string, string> } = {}
) => ({
  ...data,
  status: options.status ?? 200,
  headers: options.headers ?? {},
});

jest.setTimeout(10000);
