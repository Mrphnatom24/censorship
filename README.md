# Censorship

**Censorship** es una aplicación desarrollada en Next.js (JavaScript) que demuestra el potencial de combinar procesamiento de lenguaje natural (NLP) y filtrado de patrones para la protección de datos sensibles.

## 🚀 Propósito
La aplicación permite anonimizar textos mediante el uso de **placeholders**, utilizando una arquitectura híbrida para maximizar la cobertura lingüística y técnica.

## 🛠️ Stack Tecnológico
La censura se apoya en las siguientes librerias:

1.  **[Compromise](https://github.com/nlp-compromise/es-compromise):** Utilizado por su alta capacidad de personalización. Se encarga principalmente de la detección de entidades gramaticales (nombres, lugares, organizaciones).
2.  **[pii-filter (HabaneroCake)](https://github.com/HabaneroCake/pii-filter):** Una librería robusta para la detección de información de identificación personal (PII). Aunque su variedad lingüística es más acotada (enfocada inicialmente en holandés), aporta precisión quirúrgica en patrones universales como emails, teléfonos y fechas.

## 📂 Estructura del Proyecto

* `src/app/page.js`: Interfaz de usuario (Frontend) para la entrada de texto y visualización de resultados.
* `src/app/redact/route.js`: Este endpoint recibe el texto y aplica las capas de censura de ambas librerías antes de devolver el resultado protegido.

## 🔍 Funcionamiento de la Censura
El motor aplica una limpieza en dos fases:

* **Fase 1 (NLP):** Sustituye nombres propios detectados por etiquetas limpias como `[NOMBRE]`.
* **Fase 2 (Pattern Matching):** Identifica emails, números de teléfono y medicamentos, unificando los placeholders técnicos de `pii-filter` con el formato legible de Taurus.