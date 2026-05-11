import { NextResponse } from 'next/server';
import nlp from 'compromise';
import { rateLimitMiddleware, RateLimitError } from '@/lib/rate-limit';
import { applyPiiPatterns } from '@/lib/pii-patterns';

export async function POST(req: Request) {
  try {
    const rateLimitHeaders = rateLimitMiddleware(req);

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Texto demasiado largo (máximo 10,000 caracteres)' },
        { status: 400 }
      );
    }

    const sanitizedText = text.trim().slice(0, 10000);

    // Phase 1: regex-based detection for structured Spanish PII (DNI, NIE, IBAN, etc.)
    const { text: afterRegex, summary } = applyPiiPatterns(sanitizedText);

    // Phase 2: NLP-based detection for unstructured entities (primarily English names/places).
    // compromise is English-focused; it provides a best-effort catch for international names
    // and organisations that may appear in mixed-language documents.
    const doc = nlp(afterRegex);
    doc.people().replaceWith('[NOMBRE]');
    doc.places().replaceWith('[LUGAR]');
    doc.organizations().replaceWith('[ORGANIZACIÓN]');
    const censored = doc.text();

    // Tally entities added by the NLP pass
    for (const label of ['NOMBRE', 'LUGAR', 'ORGANIZACIÓN'] as const) {
      const count = (censored.match(new RegExp(`\\[${label}\\]`, 'g')) ?? []).length;
      if (count > 0) summary[label] = count;
    }

    return NextResponse.json({ censored, summary }, { headers: rateLimitHeaders });
  } catch (err) {
    console.error('Error en Taurus Engine:', err);

    if (err instanceof Error && 'status' in err && (err as RateLimitError).status === 429) {
      const rateLimitErr = err as RateLimitError;
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes',
          message: rateLimitErr.message,
          retryAfter: rateLimitErr.headers?.['Retry-After'],
        },
        { status: 429, headers: rateLimitErr.headers }
      );
    }

    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error de ejecución', message }, { status: 500 });
  }
}
