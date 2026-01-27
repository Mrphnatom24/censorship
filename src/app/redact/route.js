import { NextResponse } from 'next/server';
import nlp from 'compromise';
// Importamos según el estándar que muestran los ejemplos de la documentación
import * as pf from 'pii-filter';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    // --- Configuración según la Documentación ---
    // 1. Creamos el modelo de lenguaje (Language Model)
    const langModel = pf.languages.nl.make_lm();
    
    // 2. Creamos el clasificador PII para Taurus
    const pii_filter = pf.make_pii_classifier(langModel);

    // --- Proceso de Censura ---
    
    // Paso 1: NLP (Compromise) para nombres en español/inglés
    // - Es mas personalizable que el PII-Filter y captura nombres completos
    const doc = nlp(text);
    doc.people().replaceWith('[NOMBRE]');
    doc.places().replaceWith('[LUGAR]');
    doc.organizations().replaceWith('[ORGANIZACIÓN]');
    doc.emails().replaceWith('[EMAIL]');

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

    return NextResponse.json({ censored: intermediateText });
    
  } catch (err) {
    console.error("Error en Taurus Engine:", err);
    return NextResponse.json({ 
        error: "Error de ejecución", 
        message: err.message 
    }, { status: 500 });
  }
}