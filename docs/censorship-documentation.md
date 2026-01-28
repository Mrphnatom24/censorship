# Documentación de la Aplicación Censorship

## 📋 Descripción General

**Censorship** es una aplicación web desarrollada en Next.js que implementa un motor de anonimización de texto mediante técnicas híbridas de Procesamiento de Lenguaje Natural (NLP) y filtrado de patrones. La aplicación está diseñada para proteger datos sensibles reemplazando información personal identificable (PII) con placeholders estandarizados.

## 🎯 Propósito y Objetivos

### Objetivo Principal
Proporcionar una herramienta eficiente para la anonimización de textos que combine la precisión del análisis gramatical con la robustez del filtrado por patrones.

### Casos de Uso
- Protección de datos personales en documentos
- Anonimización de textos para análisis de datos
- Preparación de datos para entrenamiento de modelos de IA
- Cumplimiento de regulaciones de privacidad (GDPR, etc.)

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Framework**: Next.js 16.1.5
- **Frontend**: React 19.2.3
- **Lenguaje**: TypeScript/JavaScript
- **Estilos**: Tailwind CSS 4
- **NLP**: Compromise 14.14.5
- **PII Filter**: pii-filter 1.0.24

### Estructura del Proyecto
```
censorship/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal de la aplicación
│   │   ├── page.js             # Interfaz de usuario principal
│   │   ├── globals.css         # Estilos globales
│   │   └── redact/
│   │       └── route.js        # API endpoint para censura
│   └── ...
├── public/                     # Recursos estáticos
├── package.json               # Dependencias y scripts
└── README.md                  # Documentación básica
```

## 🔧 Funcionalidades Principales

### 1. Interfaz de Usuario
- **Entrada de texto**: Área de texto para ingresar contenido a anonimizar
- **Botón de procesamiento**: Inicia el proceso de censura
- **Visualización de resultados**: Muestra el texto anonimizado
- **Diseño responsive**: Interfaz adaptada a diferentes dispositivos

### 2. Motor de Censura
El sistema implementa un enfoque de dos fases para maximizar la cobertura:

#### Fase 1: Procesamiento de Lenguaje Natural (Compromise)
- **Detección de entidades gramaticales**:
  - Personas → `[NOMBRE]`
  - Lugares → `[LUGAR]`
  - Organizaciones → `[ORGANIZACIÓN]`
  - Emails → `[EMAIL]`
  - Números de teléfono → `[TELÉFONO]`

#### Fase 2: Filtrado por Patrones (pii-filter)
- **Detección de PII mediante patrones**:
  - Nombres (first_name, family_name, pet_name)
  - Direcciones de email
  - Números de teléfono
  - Nombres de medicamentos
  - Fechas

### 3. Normalización de Placeholders
El sistema unifica los placeholders de ambas librerías en un formato consistente:
- `{first_name}` → `[NOMBRE]`
- `{email_address}` → `[EMAIL]`
- `{phone_number}` → `[TELÉFONO]`
- `{medicine_name}` → `[MEDICAMENTO]`
- `{date}` → `[FECHA]`

## 🚀 Implementación Técnica

### API Endpoint: `/redact`
```javascript
// src/app/redact/route.js
export async function POST(req) {
  try {
    const { text } = await req.json();
    
    // Configuración de pii-filter
    const langModel = pf.languages.nl.make_lm();
    const pii_filter = pf.make_pii_classifier(langModel);
    
    // Fase 1: NLP con Compromise
    const doc = nlp(text);
    doc.people().replaceWith('[NOMBRE]');
    doc.places().replaceWith('[LUGAR]');
    // ... más reemplazos
    
    const intermediateText = doc.text();
    
    // Fase 2: Filtrado por patrones
    const sanitized_str = pii_filter.sanitize_str(intermediateText, true);
    
    // Normalización de placeholders
    const cleanCensored = sanitized_str
      .replace(/{first_name}/g, '[NOMBRE]')
      // ... más reemplazos
      
    return NextResponse.json({ censored: cleanCensored });
  } catch (err) {
    // Manejo de errores
  }
}
```

### Interfaz de Usuario
```javascript
// src/app/page.js
export default function Page() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  const procesar = async () => {
    const res = await fetch('/redact', {
      method: 'POST',
      body: JSON.stringify({ text: input }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    setOutput(data.censored || data.error);
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Taurus Redactor Quick-Start</h2>
      <textarea 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Escribe aquí..."
      />
      <button onClick={procesar}>Censurar Ahora</button>
      {output && <p><strong>Resultado:</strong> {output}</p>}
    </div>
  );
}
```

## 📊 Características Técnicas Avanzadas

### 1. Arquitectura Híbrida
- **Ventaja de Compromise**: Alta personalización y soporte para múltiples idiomas
- **Ventaja de pii-filter**: Precisión quirúrgica en patrones universales
- **Sinergia**: Cobertura completa mediante complementariedad

### 2. Manejo de Errores
- Validación de entrada de texto
- Captura de excepciones en el procesamiento
- Respuestas de error estructuradas
- Logging de errores en consola

### 3. Rendimiento
- Procesamiento en el servidor (no en cliente)
- Respuestas asíncronas
- Optimización para textos de diferentes longitudes

## 🔍 Ejemplos de Uso

### Ejemplo 1: Texto con información personal
**Entrada:**
```
Juan Pérez vive en Madrid y trabaja en Google. 
Su email es juan.perez@gmail.com y su teléfono es +34 123 456 789.
```

**Salida:**
```
[NOMBRE] vive en [LUGAR] y trabaja en [ORGANIZACIÓN]. 
Su email es [EMAIL] y su teléfono es [TELÉFONO].
```

### Ejemplo 2: Texto médico
**Entrada:**
```
El paciente toma Ibuprofeno cada 8 horas. 
Cita programada para el 15/03/2024.
```

**Salida:**
```
El paciente toma [MEDICAMENTO] cada 8 horas. 
Cita programada para el [FECHA].
```

## 🛠️ Configuración y Despliegue

### Requisitos del Sistema
- Node.js 18+ 
- npm o yarn
- Navegador web moderno

### Instalación
```bash
# Clonar el repositorio
git clone <repositorio>

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

### Variables de Entorno
Actualmente la aplicación no requiere variables de entorno específicas.

## 📈 Posibles Mejoras y Extensiones

### 1. Mejoras de Funcionalidad
- **Soporte multilingüe mejorado**: Extender pii-filter a más idiomas
- **Personalización de placeholders**: Permitir que usuarios definan sus propios placeholders
- **API de batch processing**: Procesamiento de múltiples textos simultáneamente
- **Exportación de resultados**: Opciones para exportar en diferentes formatos

### 2. Mejoras Técnicas
- **Caché de resultados**: Para textos frecuentemente procesados
- **Rate limiting**: Protección contra abuso del servicio
- **Métricas y analytics**: Seguimiento del uso y efectividad
- **Tests automatizados**: Unit tests y integration tests

### 3. Características Avanzadas
- **Aprendizaje automático**: Modelos personalizados para dominios específicos
- **API REST completa**: Documentación Swagger/OpenAPI
- **Webhooks**: Notificaciones cuando el procesamiento está completo
- **Integración con servicios cloud**: AWS, Azure, Google Cloud

## 🔒 Consideraciones de Seguridad

### Protección de Datos
- **Procesamiento en servidor**: Los datos sensibles no se procesan en el cliente
- **Sin almacenamiento**: Los textos no se guardan después del procesamiento
- **Validación de entrada**: Prevención de inyecciones y ataques

### Privacidad
- **Transparencia**: Los usuarios saben exactamente qué información se detecta
- **Control**: Los usuarios pueden revisar y ajustar los resultados
- **Cumplimiento**: Diseñado para ayudar con regulaciones de privacidad

## 📚 Recursos y Referencias

### Documentación de Librerías
- [Compromise NLP](https://github.com/nlp-compromise/es-compromise)
- [pii-filter](https://github.com/HabaneroCake/pii-filter)
- [Next.js Documentation](https://nextjs.org/docs)

### Estándares Relacionados
- **PII (Personal Identifiable Information)**: Estándares de protección de datos
- **GDPR**: Reglamento General de Protección de Datos
- **HIPAA**: Ley de Portabilidad y Responsabilidad de Seguros Médicos

## 🤝 Contribución

### Desarrollo
1. Fork del repositorio
2. Crear rama de características (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Reporte de Issues
- Usar el sistema de issues de GitHub
- Incluir ejemplos reproducibles
- Especificar versión y entorno

## 📄 Licencia

[Incluir información sobre la licencia del proyecto]

---

*Documentación actualizada: Enero 2026*  
*Mantenedor: [Nombre del mantenedor]*  
*Versión: 0.1.0*