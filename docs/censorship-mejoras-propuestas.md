# Propuestas de Mejora para la Aplicación Censorship

## 📋 Análisis del Estado Actual

### Problemas Identificados

#### 1. **Bug en el Endpoint `/redact`**
```javascript
// En route.js, línea 44:
return NextResponse.json({ censored: intermediateText });
```
**Problema**: Se está devolviendo `intermediateText` en lugar de `cleanCensored`, lo que significa que:
- Los placeholders de pii-filter no se están aplicando
- Solo se aplica la primera fase (Compromise)
- Los usuarios no ven el resultado completo del procesamiento

#### 2. **Configuración Incorrecta de Idioma**
```javascript
const langModel = pf.languages.nl.make_lm();
```
**Problema**: Se está usando el modelo de lenguaje holandés (`nl`) cuando:
- La aplicación procesa principalmente texto en español
- Compromise está configurado para español/inglés
- Esto puede reducir la efectividad de pii-filter

#### 3. **Interfaz de Usuario Básica**
- Estilos inline en lugar de usar Tailwind CSS (que ya está instalado)
- Falta de feedback visual durante el procesamiento
- No hay manejo de errores en el frontend
- Diseño no responsive completo

#### 4. **Falta de Validaciones**
- No hay límite de longitud de texto
- No hay sanitización de entrada
- No hay rate limiting
- No hay validación de tipo de contenido

#### 5. **Problemas de Rendimiento**
- Cada request crea un nuevo modelo de lenguaje
- No hay caché de resultados
- Procesamiento sincrónico que puede bloquear con textos largos

## 🚀 Mejoras Propuestas

### 1. **Corrección de Bugs Críticos**

#### 1.1. Corregir el retorno del endpoint
```javascript
// route.js - Línea 44 (corregir)
return NextResponse.json({ censored: cleanCensored });
```

#### 1.2. Mejorar configuración de idioma
```javascript
// Investigar si pii-filter soporta español
// Si no, considerar alternativas o entrenar modelo personalizado
```

### 2. **Mejoras de la Interfaz de Usuario**

#### 2.1. Migrar a Tailwind CSS
```jsx
// page.js - Usar clases de Tailwind
return (
  <div className="p-5 max-w-2xl mx-auto">
    <h2 className="text-2xl font-bold mb-4">Taurus Redactor</h2>
    <textarea 
      className="w-full h-32 p-3 border rounded-lg bg-gray-900 text-white"
      onChange={(e) => setInput(e.target.value)} 
      placeholder="Escribe aquí el texto a anonimizar..."
    />
    <button 
      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      onClick={procesar}
    >
      Censurar Ahora
    </button>
    {output && (
      <div className="mt-4 p-4 bg-gray-800 rounded">
        <strong className="text-green-400">Resultado:</strong>
        <p className="mt-2 whitespace-pre-wrap">{output}</p>
      </div>
    )}
  </div>
);
```

#### 2.2. Añadir estados de carga y error
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const procesar = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch('/redact', {
      method: 'POST',
      body: JSON.stringify({ text: input }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) throw new Error(`Error ${res.status}`);
    
    const data = await res.json();
    setOutput(data.censored);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. **Mejoras de Seguridad**

#### 3.1. Validación de entrada
```javascript
// route.js - Añadir validaciones
export async function POST(req) {
  try {
    const { text } = await req.json();
    
    // Validaciones
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }
    
    if (text.length > 10000) {
      return NextResponse.json({ error: "Texto demasiado largo (máx. 10,000 caracteres)" }, { status: 400 });
    }
    
    // Sanitización básica
    const sanitizedText = text.trim().slice(0, 10000);
    
    // Resto del procesamiento...
  }
}
```

#### 3.2. Implementar rate limiting
```javascript
// Crear middleware de rate limiting
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
});

export async function POST(req) {
  try {
    await limiter.check(req, 10); // 10 requests por minuto
    // Resto del código...
  } catch (error) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }
}
```

### 4. **Mejoras de Rendimiento**

#### 4.1. Cachear modelos de lenguaje
```javascript
// route.js - Singleton para modelos
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
    const { text } = await req.json();
    const pii_filter = getPiiFilter(); // Reutilizar instancia
    // Resto del código...
  }
}
```

#### 4.2. Procesamiento asíncrono para textos largos
```javascript
// Dividir procesamiento en chunks para textos muy largos
async function processLargeText(text, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  
  const results = await Promise.all(
    chunks.map(chunk => processChunk(chunk))
  );
  
  return results.join('');
}
```

### 5. **Nuevas Funcionalidades**

#### 5.1. Personalización de placeholders
```javascript
// Añadir opciones de configuración
const defaultPlaceholders = {
  person: '[NOMBRE]',
  place: '[LUGAR]',
  organization: '[ORGANIZACIÓN]',
  email: '[EMAIL]',
  phone: '[TELÉFONO]',
  medicine: '[MEDICAMENTO]',
  date: '[FECHA]'
};

// Permitir override desde frontend
export async function POST(req) {
  const { text, placeholders = defaultPlaceholders } = await req.json();
  // Usar placeholders personalizados...
}
```

#### 5.2. Soporte para múltiples formatos de salida
```javascript
// Añadir parámetro de formato
export async function POST(req) {
  const { text, format = 'text' } = await req.json();
  
  // Procesar texto...
  
  if (format === 'html') {
    return NextResponse.json({ 
      censored: cleanCensored,
      html: convertToHtml(cleanCensored),
      annotations: getAnnotations(text, cleanCensored)
    });
  }
  
  if (format === 'json') {
    return NextResponse.json({
      original: text,
      censored: cleanCensored,
      entities: extractEntities(text)
    });
  }
  
  return NextResponse.json({ censored: cleanCensored });
}
```

#### 5.3. Historial de procesamientos
```javascript
// Añadir almacenamiento temporal (opcional)
const processingHistory = new Map();

export async function POST(req) {
  const { text, saveHistory = false } = await req.json();
  
  // Procesar...
  
  if (saveHistory) {
    const id = generateId();
    processingHistory.set(id, {
      original: text,
      censored: cleanCensored,
      timestamp: Date.now()
    });
    
    // Limpiar historial antiguo
    cleanupOldHistory();
    
    return NextResponse.json({ 
      censored: cleanCensored,
      id,
      timestamp: Date.now()
    });
  }
  
  return NextResponse.json({ censored: cleanCensored });
}
```

### 6. **Mejoras de Mantenibilidad**

#### 6.1. Refactorizar en módulos
```
src/
├── app/
│   ├── redact/
│   │   ├── route.js
│   │   └── utils/
│   │       ├── nlp-processor.js
│   │       ├── pii-filter.js
│   │       ├── placeholder-normalizer.js
│   │       └── validators.js
│   └── page.js
└── lib/
    ├── censorship-engine.js
    └── cache-manager.js
```

#### 6.2. Añadir tests
```javascript
// tests/censorship.test.js
import { censorshipEngine } from '@/lib/censorship-engine';

describe('Censorship Engine', () => {
  test('should detect and replace names', () => {
    const input = 'Juan Pérez vive en Madrid';
    const expected = '[NOMBRE] vive en [LUGAR]';
    const result = censorshipEngine.process(input);
    expect(result).toBe(expected);
  });
  
  test('should handle empty input', () => {
    expect(() => censorshipEngine.process('')).toThrow();
  });
});
```

#### 6.3. Documentación de API
```javascript
// Añadir comentarios JSDoc
/**
 * @typedef {Object} CensorshipRequest
 * @property {string} text - Texto a censurar
 * @property {Object} [placeholders] - Placeholders personalizados
 * @property {string} [format] - Formato de salida (text|html|json)
 */

/**
 * @typedef {Object} CensorshipResponse
 * @property {string} censored - Texto censurado
 * @property {string} [html] - Versión HTML (si format='html')
 * @property {Array} [entities] - Entidades detectadas (si format='json')
 */

/**
 * Procesa texto para anonimizar información personal
 * @param {CensorshipRequest} request
 * @returns {Promise<CensorshipResponse>}
 */
export async function POST(req) {
  // Implementación...
}
```

### 7. **Mejoras de Despliegue**

#### 7.1. Variables de entorno
```env
# .env.local
MAX_TEXT_LENGTH=10000
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
CACHE_ENABLED=true
DEFAULT_LANGUAGE=es
```

#### 7.2. Health checks
```javascript
// app/api/health/route.js
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

#### 7.3. Métricas y monitoreo
```javascript
// Añadir logging estructurado
import { logger } from '@/lib/logger';

export async function POST(req) {
  const startTime = Date.now();
  
  try {
    // Procesamiento...
    
    logger.info('Censorship processed', {
      textLength: text.length,
      processingTime: Date.now() - startTime,
      entitiesDetected: countEntities(cleanCensored)
    });
    
    return NextResponse.json({ censored: cleanCensored });
  } catch (error) {
    logger.error('Censorship error', {
      error: error.message,
      processingTime: Date.now() - startTime
    });
    throw error;
  }
}
```

## 📊 Priorización de Mejoras

### Prioridad Alta (Crítico)
1. **Corregir bug del endpoint** - Devuelve texto incorrecto
2. **Añadir validaciones de entrada** - Prevenir ataques
3. **Mejorar manejo de errores en frontend** - Mejor UX

### Prioridad Media (Importante)
4. **Migrar a Tailwind CSS** - Mejor mantenibilidad
5. **Implementar rate limiting** - Seguridad
6. **Cachear modelos** - Mejor rendimiento
7. **Añadir tests** - Calidad del código

### Prioridad Baja (Deseable)
8. **Nuevas funcionalidades** - Personalización, formatos, historial
9. **Refactorizar en módulos** - Escalabilidad
10. **Métricas y monitoreo** - Operaciones

## 🛠️ Plan de Implementación

### Fase 1: Correcciones Críticas (1-2 días)
1. Corregir bug en route.js
2. Implementar validaciones básicas
3. Añadir manejo de errores en frontend

### Fase 2: Mejoras de UX y Seguridad (3-5 días)
4. Migrar a Tailwind CSS
5. Implementar rate limiting
6. Añadir estados de carga

### Fase 3: Optimización (2-3 días)
7. Cachear modelos de lenguaje
8. Añadir tests básicos
9. Configurar variables de entorno

### Fase 4: Nuevas Funcionalidades (5-7 días)
10. Personalización de placeholders
11. Soporte para múltiples formatos
12. Refactorizar en módulos

## 📈 Métricas de Éxito

### Técnicas
- **Rendimiento**: Tiempo de procesamiento < 500ms para textos de 1000 caracteres
- **Disponibilidad**: 99.9% uptime
- **Seguridad**: 0 vulnerabilidades críticas

### Usuario
- **Satisfacción**: Feedback positivo en interfaz
- **Usabilidad**: Tiempo para completar tarea < 30 segundos
- **Precisión**: >95% de entidades detectadas correctamente

### Negocio
- **Mantenibilidad**: Cobertura de tests >80%
- **Escalabilidad**: Soporte para 1000 requests/minuto
- **Extensibilidad**: Facilidad para añadir nuevos detectores

---

*Documento de mejoras generado: Enero 2026*  
*Basado en análisis del código en `../censorship/*`*