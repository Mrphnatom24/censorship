// Ruta API para censurar texto usando NLP y PII-Filter (Taurus Engine)

import { NextResponse } from 'next/server';
import nlp from 'compromise';

// Importamos según el estándar que muestran los ejemplos de la documentación
import * as pf from 'pii-filter';
import { rateLimitMiddleware } from '@/lib/rate-limit';

// Cache para modelos de lenguaje (singleton)
let cachedLangModel = null;
let cachedPiiFilter = null;

function getPiiFilter() {
  if (!cachedLangModel) {
    cachedLangModel = pf.languages.nl.make_lm();
    cachedPiiFilter = pf.make_pii_classifier(cachedLangModel);
  }
  return cachedPiiFilter;
}

export async function POST(req) {
  try {
    // Apply rate limiting
    const rateLimitHeaders = rateLimitMiddleware(req);
    
    const { text } = await req.json();

    // Validaciones de entrada
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }
    
    if (text.length > 10000) {
      return NextResponse.json({ 
        error: "Texto demasiado largo (máximo 10,000 caracteres)" 
      }, { status: 400 });
    }
    
    // Sanitización básica
    const sanitizedText = text.trim().slice(0, 10000);

    // --- Configuración según la Documentación ---
    // 1. Obtenemos el clasificador PII (con cache)
    const pii_filter = getPiiFilter();

    // --- Proceso de Censura ---
    
    // Paso 1: NLP (Compromise) para nombres en español/inglés
    // - Es mas personalizable que el PII-Filter y captura nombres completos
    const doc = nlp(sanitizedText);
    doc.people().replaceWith('[NOMBRE]');
    doc.places().replaceWith('[LUGAR]');
    doc.organizations().replaceWith('[ORGANIZACIÓN]');
    doc.emails().replaceWith('[EMAIL]');
    doc.phoneNumbers().replaceWith('[TELÉFONO]');
  

    const intermediateText = doc.text();

    // Paso 2: PII-Filter (Pattern matching) -> PII-Filter busca de todo asi
    // Usamos sanitize_str como indica el ejemplo
    const sanitized_str = pii_filter.sanitize_str(intermediateText, true);

    // Limpiamos los placeholders técnicos de HabaneroCake por etiquetas limpias
    const cleanCensored = sanitized_str
      .replace(/{first_name}/g, '[NOMBRE]')
      .replace(/{family_name}/g, '[NOMBRE]')
      .replace(/{pet_name}/g, '[NOMBRE]')
      .replace(/{email_address}/g, '[EMAIL]')
      .replace(/{phone_number}/g, '[TELÉFONO]')
      .replace(/{medicine_name}/g, '[MEDICAMENTO]')
      .replace(/{date}/g, '[FECHA]');

    // Return response with rate limit headers
    return NextResponse.json({ censored: cleanCensored }, {
      headers: rateLimitHeaders
    });
    
  } catch (err) {
    console.error("Error en Taurus Engine:", err);
    
    // Handle rate limit error specifically
    if (err.status === 429) {
      return NextResponse.json({ 
        error: "Demasiadas solicitudes",
        message: err.message,
        retryAfter: err.headers?.['Retry-After']
      }, { 
        status: 429,
        headers: err.headers
      });
    }
    
    return NextResponse.json({ 
      error: "Error de ejecución", 
      message: err.message 
    }, { status: 500 });
  }
}
