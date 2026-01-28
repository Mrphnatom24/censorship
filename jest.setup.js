// jest.setup.js
// Configuración global para tests de Jest

// Importar jest-dom para tener matchers de DOM adicionales
import '@testing-library/jest-dom';

// Mock para fetch global
global.fetch = jest.fn();

// Mock para Next.js router
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

// Mock para Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      ...data,
      status: options?.status || 200,
      headers: options?.headers || {},
    })),
  },
}));

// Configurar console para tests
const originalConsole = { ...console };
const mockedConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

beforeAll(() => {
  // Opcional: mock console en tests
  if (process.env.NODE_ENV === 'test') {
    Object.assign(console, mockedConsole);
  }
});

afterAll(() => {
  // Restaurar console original
  Object.assign(console, originalConsole);
});

beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  jest.clearAllMocks();
  
  // Configurar fetch mock por defecto
  global.fetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
      headers: new Map(),
    })
  );
});

afterEach(() => {
  // Limpiar después de cada test
  jest.resetAllMocks();
});

// Helper functions para tests
global.createMockRequest = (body = {}, headers = {}) => ({
  json: jest.fn().mockResolvedValue(body),
  headers: {
    get: jest.fn((key) => headers[key] || null),
  },
});

global.createMockResponse = (data = {}, options = {}) => ({
  ...data,
  status: options.status || 200,
  headers: options.headers || {},
});

// Configurar timeout para tests
jest.setTimeout(10000);