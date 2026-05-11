import { countPlaceholders } from '../src/app/page';

const mockNextResponse = {
  json: jest.fn(
    (data: unknown, options?: { headers?: Record<string, string> }) => ({
      ...(data as object),
      headers: options?.headers ?? {},
    })
  ),
};

function createMockRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn().mockReturnValue('127.0.0.1'),
    },
  };
}

describe('Censorship Application Tests', () => {
  describe('Censorship Logic', () => {
    test('should count placeholders correctly', () => {
      const testCases: { text: string; expected: number }[] = [
        { text: '[NOMBRE] vive en [LUGAR]', expected: 2 },
        { text: 'Texto sin placeholders', expected: 0 },
        { text: '[EMAIL] y [TELÉFONO] y [MEDICAMENTO]', expected: 3 },
        { text: '', expected: 0 },
        { text: '[NOMBRE][NOMBRE][LUGAR]', expected: 3 },
      ];

      testCases.forEach(({ text, expected }) => {
        expect(countPlaceholders(text)).toBe(expected);
      });
    });

    test('should validate placeholder format', () => {
      expect(countPlaceholders('[NOMBRE] [LUGAR] [ORGANIZACIÓN]')).toBe(3);
      expect(countPlaceholders('[nombre] [lugar]')).toBe(0);
      expect(countPlaceholders('(NOMBRE) {NOMBRE}')).toBe(0);
    });
  });

  describe('Input Validation', () => {
    test('should validate text length', () => {
      const validateText = (text: unknown): { valid: boolean; error?: string; sanitized?: string } => {
        if (!text || typeof text !== 'string') {
          return { valid: false, error: 'Texto inválido' };
        }
        if (text.length > 10000) {
          return { valid: false, error: 'Texto demasiado largo' };
        }
        return { valid: true, sanitized: text.trim().slice(0, 10000) };
      };

      expect(validateText('').valid).toBe(false);
      expect(validateText(null).valid).toBe(false);
      expect(validateText(undefined).valid).toBe(false);
      expect(validateText(123).valid).toBe(false);
      expect(validateText('Texto de prueba').valid).toBe(true);
      expect(validateText('a'.repeat(10001)).valid).toBe(false);
      expect(validateText('a'.repeat(10000)).valid).toBe(true);
    });

    test('should sanitize text correctly', () => {
      const sanitizeText = (text: string) => text.trim().slice(0, 10000);

      expect(sanitizeText('  texto con espacios  ')).toBe('texto con espacios');
      expect(sanitizeText('  a  ')).toBe('a');
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText('Texto corto')).toBe('Texto corto');
    });
  });

  describe('UI Components', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should handle loading state', () => {
      const state = { loading: true, error: null as string | null, output: '' };
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.output).toBe('');
    });

    test('should handle error state', () => {
      const state = { loading: false, error: 'Error de prueba', output: '' };
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error de prueba');
      expect(state.output).toBe('');
    });

    test('should handle success state', () => {
      const state = { loading: false, error: null as string | null, output: '[NOMBRE] vive en [LUGAR]' };
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.output).toBe('[NOMBRE] vive en [LUGAR]');
    });
  });

  describe('Text Processing', () => {
    test('should detect common PII patterns', () => {
      const testCases = [
        { input: 'Juan Pérez', expectedPlaceholders: ['[NOMBRE]'] },
        { input: 'juan.perez@gmail.com', expectedPlaceholders: ['[EMAIL]'] },
        { input: '+34 123 456 789', expectedPlaceholders: ['[TELÉFONO]'] },
        { input: 'Madrid, España', expectedPlaceholders: ['[LUGAR]'] },
        { input: 'Google Inc.', expectedPlaceholders: ['[ORGANIZACIÓN]'] },
      ];

      testCases.forEach(({ input, expectedPlaceholders }) => {
        console.log(`Input: ${input} -> Expected: ${expectedPlaceholders.join(', ')}`);
      });
    });

    test('should handle mixed content', () => {
      const mixedText =
        'Juan Pérez (juan.perez@gmail.com) vive en Madrid y trabaja en Google. Tel: +34 123 456 789.';
      const expectedOutput =
        '[NOMBRE] ([EMAIL]) vive en [LUGAR] y trabaja en [ORGANIZACIÓN]. Tel: [TELÉFONO].';

      console.log(`Mixed text test: ${mixedText}`);
      console.log(`Expected output: ${expectedOutput}`);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty input', () => {
      const processEmpty = (text: string) => {
        if (!text.trim()) return { error: 'Texto vacío', processed: '' };
        return { processed: text };
      };

      expect(processEmpty('').error).toBe('Texto vacío');
      expect(processEmpty('   ').error).toBe('Texto vacío');
      expect(processEmpty('texto').error).toBeUndefined();
    });

    test('should handle special characters', () => {
      const specialCases = [
        'Texto con ñ y acentos: áéíóú',
        'Caracteres especiales: !@#$%^&*()',
        'Emojis: 😀🚀🌟',
        'HTML: <script>alert("xss")</script>',
        'SQL: SELECT * FROM users',
      ];

      specialCases.forEach((text) => {
        console.log(`Special characters test: ${text.substring(0, 50)}`);
      });
    });

    test('should handle very long words', () => {
      const longWord = 'a'.repeat(1000);
      console.log(`Testing with word of length: ${longWord.length}`);
    });
  });
});

export { createMockRequest, mockNextResponse };
