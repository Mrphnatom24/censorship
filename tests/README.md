# Tests para la Aplicación Censorship

Este directorio contiene los tests para la aplicación Censorship.

## Estructura de Tests

```
tests/
├── censorship.test.js     # Tests principales de la aplicación
├── README.md             # Este archivo
└── (futuros tests)
```

## Tipos de Tests

### 1. Tests de Lógica de Censura
- Conteo de placeholders
- Validación de formatos
- Detección de entidades

### 2. Tests de Validación de Entrada
- Validación de longitud de texto
- Sanitización de entrada
- Manejo de edge cases

### 3. Tests de Interfaz de Usuario
- Estados de carga
- Manejo de errores
- Estados de éxito

### 4. Tests de Procesamiento de Texto
- Detección de PII (Información Personal Identificable)
- Procesamiento de contenido mixto
- Manejo de caracteres especiales

## Cómo Ejecutar los Tests

### Instalación de Dependencias
```bash
npm install
```

### Ejecutar Tests
```bash
# Todos los tests
npm test

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests con cobertura
npm run test:coverage
```

### Configuración de Jest
Los tests están configurados con:
- **Entorno**: jsdom (para tests de React)
- **Setup**: `jest.setup.js` (configuración global)
- **Mapeo de módulos**: Soporte para alias `@/`
- **Cobertura**: Configurada para archivos fuente

## Ejemplos de Tests

### Test de Conteo de Placeholders
```javascript
test('should count placeholders correctly', () => {
  expect(countPlaceholders('[NOMBRE] vive en [LUGAR]')).toBe(2);
  expect(countPlaceholders('Texto sin placeholders')).toBe(0);
});
```

### Test de Validación de Entrada
```javascript
test('should validate text length', () => {
  expect(validateText('')).toBe(false);
  expect(validateText('a'.repeat(10001))).toBe(false);
  expect(validateText('Texto válido')).toBe(true);
});
```

## Pruebas de Integración

Para pruebas de integración reales, se recomienda:

1. **Tests de API**: Probar el endpoint `/redact` directamente
2. **Tests E2E**: Usar herramientas como Cypress o Playwright
3. **Tests de Rendimiento**: Verificar tiempos de procesamiento

## Coverage

La configuración de cobertura incluye:
- Archivos fuente en `src/`
- Excluye archivos de definición TypeScript (`.d.ts`)
- Excluye archivos index y stories

## Mejoras Futuras

### Tests a Implementar
1. **Tests de API reales**: Integración con el endpoint real
2. **Tests de componentes React**: Usando Testing Library
3. **Tests de rate limiting**: Verificar límites de solicitudes
4. **Tests de seguridad**: Validación de entrada maliciosa
5. **Tests de rendimiento**: Tiempos de procesamiento

### Herramientas Recomendadas
- **Cypress**: Para tests E2E
- **MSW**: Para mock de API
- **React Testing Library**: Para tests de componentes
- **Jest Axios**: Para tests de API HTTP

## Troubleshooting

### Problemas Comunes

1. **Module not found**: Verificar alias `@/` en `jest.config.js`
2. **Fetch is not defined**: Asegurarse de que `jest.setup.js` está configurado
3. **Timeout en tests**: Aumentar `jest.setTimeout()` en `jest.setup.js`

### Soluciones
```bash
# Limpiar cache de Jest
npm test -- --clearCache

# Ejecutar tests con verbose
npm test -- --verbose

# Ejecutar tests específicos
npm test -- censorship.test.js
```

## Contribución

Al añadir nuevos tests:
1. Sigue la estructura existente
2. Añade descripciones claras
3. Incluye casos edge
4. Mantén los tests independientes
5. Usa mocks apropiados para dependencias externas