## Diagnóstico: problemas actuales

### 1. Desajuste de idiomas (fallo crítico)

* `compromise` es una librería NLP para inglés — no detecta nombres, lugares u organizaciones en español
* `pii-filter` usa el modelo de lenguaje holandés `(pf.languages.nl)` — completamente incorrecto para texto en español
* La UI está en español, por lo que el texto de entrada será español

### 2. PII española no cubierta

Los siguientes identificadores no tienen ninguna cobertura actual:

| Tipo | Ejemplo | ¿Detectado ahora? |
| ------ | --------- | ------------------- |
| DNI/NIF | 12345678A | No |
| NIE |	X1234567A|	No|
| CIF (empresa) |	B12345678|	No|
| IBAN español |	ES91 2100 0418 4502 0005 1332|	No|
| Tarjeta de crédito |	4111 1111 1111 1111|	No|
| Matrícula |	1234 ABC|	No|
| NSS (Seguridad Social) |	28 12345678 20|	No|
| Pasaporte | AAA123456 | No|
| IP address | 192.168.1.1 | No |
| URL |	https://...	| No |

### 3. Pipeline frágil

`pii-filter` devuelve `{first_name}`, `{family_name}` etc. como formato interno — si la librería cambia esos tokens, la sustitución sillosamente deja de funcionar sin error aparente.

## Plan de mejora

### Fase 1 — Capa regex para PII estructurada (alta fiabilidad)

Reemplazar pii-filter por un módulo propio src/lib/pii-patterns.ts con expresiones regulares para PII española con formato definido:

```
DNI/NIF   → /\b\d{8}[A-HJ-NP-TV-Z]\b/i
NIE       → /\b[XYZ]\d{7}[A-Z]\b/i
CIF       → /\b[ABCDEFGHJKLMNPQRSUVW]\d{7}[\dA-J]\b/i
IBAN ES   → /\bES\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}\b/
Tarjeta   → /\b(?:\d{4}[\s-]?){3}\d{4}\b/
Teléfono  → /\b(?:\+34|0034)?[\s-]?[6-9]\d{8}\b/
NSS       → /\b\d{2}[\s/]?\d{8}[\s/]?\d{2}\b/
Matrícula → /\b\d{4}\s?[BCDFGHJKLMNPRSTUVWXYZ]{3}\b/
Pasaporte → /\b[A-Z]{3}\d{6}\b/
IP        → /\b(?:\d{1,3}\.){3}\d{1,3}\b/
URL       → /https?:\/\/[^\s]+/gi
Email     → /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i
```


Cada patrón se aplica en orden, produciendo [DNI], [IBAN], [TARJETA], etc.

### Fase 2 — Reemplazar el NLP por compromise + plugin español

Instalar compromise-es (plugin oficial para español) para detectar nombres, lugares y organizaciones en español en lugar del modelo inglés actual.

import es from 'compromise-es'
nlp.extend(es)

### Fase 3 — Redacción estructurada con resumen

Devolver en la respuesta no solo el texto censurado, sino también un resumen de qué categorías se encontraron:

{
"censored": "...",
"summary": { "DNI": 2, "NOMBRE": 3, "EMAIL": 1 }
}
Esto ya lo consume la UI (el contador de entidades en countPlaceholders), que puede enriquecerse con el desglose por categoría.

### Fase 4 — Limpieza

Eliminar la dependencia pii-filter (holandés, innecesaria)
Añadir tests unitarios para cada patrón regex con casos límite españoles
Archivos afectados
Archivo	Cambio
src/app/redact/route.ts	Reemplazar pipeline de detección
src/lib/pii-patterns.ts	Nuevo — módulo de patrones regex
src/app/page.tsx	Opcional: mostrar desglose por categoría
package.json	Añadir compromise-es, eliminar pii-filter
