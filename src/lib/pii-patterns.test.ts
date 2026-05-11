import { applyPiiPatterns } from './pii-patterns';

describe('applyPiiPatterns', () => {
  describe('DNI/NIF', () => {
    it('redacts a DNI', () => {
      const { text, summary } = applyPiiPatterns('Mi DNI es 12345678Z.');
      expect(text).toBe('Mi DNI es [DNI].');
      expect(summary.DNI).toBe(1);
    });

    it('redacts multiple DNIs', () => {
      const { summary } = applyPiiPatterns('Juan tiene 11111111H y Ana tiene 22222222J.');
      expect(summary.DNI).toBe(2);
    });

    it('does not match a 7-digit number with letter', () => {
      const { summary } = applyPiiPatterns('código 1234567Z no es DNI');
      expect(summary.DNI).toBeUndefined();
    });
  });

  describe('NIE', () => {
    it('redacts a NIE starting with X', () => {
      const { text, summary } = applyPiiPatterns('Su NIE es X1234567L.');
      expect(text).toContain('[NIE]');
      expect(summary.NIE).toBe(1);
    });

    it('redacts NIEs starting with Y and Z', () => {
      const { summary } = applyPiiPatterns('Y1234567L y Z1234567L');
      expect(summary.NIE).toBe(2);
    });
  });

  describe('CIF', () => {
    it('redacts a CIF', () => {
      const { text, summary } = applyPiiPatterns('La empresa CIF B12345678 opera en Madrid.');
      expect(text).toContain('[CIF]');
      expect(summary.CIF).toBe(1);
    });
  });

  describe('Email', () => {
    it('redacts a standard email', () => {
      const { text, summary } = applyPiiPatterns('Escríbeme a juan.perez@example.com mañana.');
      expect(text).toContain('[EMAIL]');
      expect(text).not.toContain('@');
      expect(summary.EMAIL).toBe(1);
    });

    it('redacts multiple emails', () => {
      const { summary } = applyPiiPatterns('a@a.com y b@b.org');
      expect(summary.EMAIL).toBe(2);
    });
  });

  describe('IBAN', () => {
    it('redacts a Spanish IBAN with spaces', () => {
      const { text, summary } = applyPiiPatterns('IBAN: ES91 2100 0418 4502 0005 1332.');
      expect(text).toContain('[IBAN]');
      expect(summary.IBAN).toBe(1);
    });

    it('redacts a Spanish IBAN without spaces', () => {
      const { text, summary } = applyPiiPatterns('Cuenta ES9121000418450200051332.');
      expect(text).toContain('[IBAN]');
      expect(summary.IBAN).toBe(1);
    });
  });

  describe('Tarjeta de crédito', () => {
    it('redacts a credit card with spaces', () => {
      const { text, summary } = applyPiiPatterns('Paga con 4111 1111 1111 1111 online.');
      expect(text).toContain('[TARJETA]');
      expect(summary.TARJETA).toBe(1);
    });

    it('redacts a credit card with dashes', () => {
      const { text, summary } = applyPiiPatterns('Tarjeta 4111-1111-1111-1111.');
      expect(text).toContain('[TARJETA]');
      expect(summary.TARJETA).toBe(1);
    });
  });

  describe('Teléfono', () => {
    it('redacts a Spanish mobile number', () => {
      const { text, summary } = applyPiiPatterns('Llámame al 612 345 678.');
      expect(text).toContain('[TELÉFONO]');
      expect(summary.TELÉFONO).toBe(1);
    });

    it('redacts a landline', () => {
      const { text, summary } = applyPiiPatterns('Teléfono de oficina: 912345678.');
      expect(text).toContain('[TELÉFONO]');
      expect(summary.TELÉFONO).toBe(1);
    });

    it('redacts a number with +34 prefix', () => {
      const { text, summary } = applyPiiPatterns('Contacto: +34 912 345 678');
      expect(text).toContain('[TELÉFONO]');
      expect(summary.TELÉFONO).toBe(1);
    });
  });

  describe('IP address', () => {
    it('redacts a private IP', () => {
      const { text, summary } = applyPiiPatterns('Servidor en 192.168.1.100.');
      expect(text).toContain('[IP]');
      expect(summary.IP).toBe(1);
    });

    it('does not redact invalid octets', () => {
      const { summary } = applyPiiPatterns('Código 999.999.999.999 no es IP');
      expect(summary.IP).toBeUndefined();
    });
  });

  describe('URL', () => {
    it('redacts an https URL', () => {
      const { text, summary } = applyPiiPatterns('Visita https://example.com/path?q=1 para más info.');
      expect(text).toContain('[URL]');
      expect(summary.URL).toBe(1);
    });

    it('redacts an http URL', () => {
      const { text, summary } = applyPiiPatterns('Ver http://inseguro.com');
      expect(text).toContain('[URL]');
      expect(summary.URL).toBe(1);
    });

    it('redacts the URL before the email inside it', () => {
      const { text } = applyPiiPatterns('Enlace https://site.com/user@domain.com/info');
      expect(text).toContain('[URL]');
      expect(text).not.toContain('[EMAIL]');
    });
  });

  describe('Matrícula', () => {
    it('redacts a new-format license plate', () => {
      const { text, summary } = applyPiiPatterns('El coche matrícula 1234 BCR estaba aparcado.');
      expect(text).toContain('[MATRÍCULA]');
      expect(summary.MATRÍCULA).toBe(1);
    });
  });

  describe('Pasaporte', () => {
    it('redacts a Spanish passport number', () => {
      const { text, summary } = applyPiiPatterns('Pasaporte AAA123456 presentado.');
      expect(text).toContain('[PASAPORTE]');
      expect(summary.PASAPORTE).toBe(1);
    });
  });

  describe('NSS', () => {
    it('redacts a Número de Seguridad Social', () => {
      const { text, summary } = applyPiiPatterns('NSS del trabajador: 28 12345678 20.');
      expect(text).toContain('[NSS]');
      expect(summary.NSS).toBe(1);
    });

    it('redacts NSS with slash separators', () => {
      const { text, summary } = applyPiiPatterns('NSS: 28/12345678/20');
      expect(text).toContain('[NSS]');
      expect(summary.NSS).toBe(1);
    });
  });

  describe('Fecha', () => {
    it('redacts a date in DD/MM/YYYY format', () => {
      const { text, summary } = applyPiiPatterns('Nacido el 15/03/1985.');
      expect(text).toContain('[FECHA]');
      expect(summary.FECHA).toBe(1);
    });

    it('redacts a date with dashes', () => {
      const { text, summary } = applyPiiPatterns('Expedido el 01-01-2020.');
      expect(text).toContain('[FECHA]');
      expect(summary.FECHA).toBe(1);
    });
  });

  describe('Summary', () => {
    it('returns a summary with all detected categories', () => {
      const input = 'DNI 12345678Z, email test@test.com, IP 10.0.0.1, teléfono 612345678';
      const { summary } = applyPiiPatterns(input);
      expect(summary.DNI).toBe(1);
      expect(summary.EMAIL).toBe(1);
      expect(summary.IP).toBe(1);
      expect(summary.TELÉFONO).toBe(1);
    });

    it('returns an empty summary for clean text', () => {
      const { summary } = applyPiiPatterns('El cielo es azul y el mar es profundo.');
      expect(Object.keys(summary)).toHaveLength(0);
    });
  });
});
