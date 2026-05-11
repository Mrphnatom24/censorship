declare module 'pii-filter' {
  type LanguageModel = Record<string, unknown>;

  interface PiiClassifier {
    sanitize_str(text: string, strict: boolean): string;
  }

  interface Language {
    make_lm(): LanguageModel;
  }

  export const languages: {
    nl: Language;
    [key: string]: Language;
  };

  export function make_pii_classifier(lm: LanguageModel): PiiClassifier;
}
