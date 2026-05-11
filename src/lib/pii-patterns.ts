export interface RedactionResult {
  text: string;
  summary: Record<string, number>;
}

interface PiiPattern {
  regex: RegExp;
  label: string;
  placeholder: string;
}

// Ordered by specificity — more specific patterns run first to prevent partial overlaps.
const PATTERNS: PiiPattern[] = [
  // URLs before emails (URLs can contain @ in query params)
  { regex: /https?:\/\/\S+/gi, label: 'URL', placeholder: '[URL]' },

  // Email
  { regex: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g, label: 'EMAIL', placeholder: '[EMAIL]' },

  // Spanish IBAN (ES + 2 check digits + 20 digits, optionally spaced in groups of 4)
  { regex: /\bES\s?\d{2}\s?\d{4}\s?\d{4}\s?\d{2}\s?\d{2}\s?\d{4}\s?\d{4}\b/gi, label: 'IBAN', placeholder: '[IBAN]' },

  // Credit/debit card (16 digits in 4 groups; runs after IBAN to avoid partial overlap)
  { regex: /(?<!\d)(?:\d{4}[\s\-]?){3}\d{4}(?!\d)/g, label: 'TARJETA', placeholder: '[TARJETA]' },

  // DNI/NIF: 8 digits + valid check letter (letter set: TRWAGMYFPDXBNJZSQVHLCKE)
  { regex: /\b\d{8}[TRWAGMYFPDXBNJZSQVHLCKE]\b/gi, label: 'DNI', placeholder: '[DNI]' },

  // NIE: X/Y/Z + 7 digits + valid check letter
  { regex: /\b[XYZ]\d{7}[TRWAGMYFPDXBNJZSQVHLCKE]\b/gi, label: 'NIE', placeholder: '[NIE]' },

  // CIF (empresa): initial letter + 7 digits + check digit/letter
  { regex: /\b[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]\b/gi, label: 'CIF', placeholder: '[CIF]' },

  // IP address (validated octet ranges)
  { regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, label: 'IP', placeholder: '[IP]' },

  // Spanish phone: optional +34/0034 prefix, starts with 6–9, 9 digits total
  { regex: /(?<!\d)(?:\+34|0034)?[\s\-]?(([6-9]\d{2}[\s.\-]?\d{3}[\s.\-]?\d{3})|([6-9]\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}))(?!\d)/g, label: 'TELÉFONO', placeholder: '[TELÉFONO]' },

  // Spanish license plate (post-2000 format: 4 digits + 3 consonants)
  { regex: /\b\d{4}\s?[BCDFGHJKLMNPRSTUVWXYZ]{3}\b/g, label: 'MATRÍCULA', placeholder: '[MATRÍCULA]' },

  // Spanish passport (3 uppercase letters + 6 digits, format since 2015)
  { regex: /\b[A-Z]{3}\d{6}\b/g, label: 'PASAPORTE', placeholder: '[PASAPORTE]' },

  // NSS — Número de Seguridad Social (2 digits + sep + 8 digits + sep + 2 digits)
  { regex: /\b\d{2}[\/\s]\d{8}[\/\s]\d{2}\b/g, label: 'NSS', placeholder: '[NSS]' },

  // Dates (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
  { regex: /\b\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}\b/g, label: 'FECHA', placeholder: '[FECHA]' },
];

export function applyPiiPatterns(text: string): RedactionResult {
  const summary: Record<string, number> = {};
  let result = text;

  for (const { regex, label, placeholder } of PATTERNS) {
    // Fresh RegExp instances avoid stateful lastIndex issues across calls
    const matcher = new RegExp(regex.source, regex.flags);
    const replacer = new RegExp(regex.source, regex.flags);
    const matches = result.match(matcher);
    if (matches) {
      summary[label] = matches.length;
      result = result.replace(replacer, placeholder);
    }
  }

  return { text: result, summary };
}
