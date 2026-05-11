import { NextResponse } from 'next/server';
import nlp from 'compromise';
import * as pf from 'pii-filter';
import { rateLimitMiddleware, RateLimitError } from '@/lib/rate-limit';

let cachedLangModel: ReturnType<typeof pf.languages.nl.make_lm> | null = null;
let cachedPiiFilter: ReturnType<typeof pf.make_pii_classifier> | null = null;

function getPiiFilter(): ReturnType<typeof pf.make_pii_classifier> {
  if (!cachedLangModel) {
    cachedLangModel = pf.languages.nl.make_lm();
    cachedPiiFilter = pf.make_pii_classifier(cachedLangModel);
  }
  return cachedPiiFilter!;
}

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

    const pii_filter = getPiiFilter();

    const doc = nlp(sanitizedText);
    doc.people().replaceWith('[NOMBRE]');
    doc.places().replaceWith('[LUGAR]');
    doc.organizations().replaceWith('[ORGANIZACIÓN]');
    doc.emails().replaceWith('[EMAIL]');
    doc.phoneNumbers().replaceWith('[TELÉFONO]');

    const intermediateText = doc.text();

    const sanitized_str = pii_filter.sanitize_str(intermediateText, true);

    const cleanCensored = sanitized_str
      .replace(/{first_name}/g, '[NOMBRE]')
      .replace(/{family_name}/g, '[NOMBRE]')
      .replace(/{pet_name}/g, '[NOMBRE]')
      .replace(/{email_address}/g, '[EMAIL]')
      .replace(/{phone_number}/g, '[TELÉFONO]')
      .replace(/{medicine_name}/g, '[MEDICAMENTO]')
      .replace(/{date}/g, '[FECHA]');

    return NextResponse.json({ censored: cleanCensored }, { headers: rateLimitHeaders });
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
