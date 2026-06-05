<!--
Sync Impact Report
- Version: 1.0.0 (Initial configuration)
- Modified principles: Applied requested principles for Code Quality, Testing, Architecture, User Experience, Performance, and Security.
- Added sections: Core Principles I-V, Additional Constraints (VI)
- Removed sections: Placeholder examples
- Templates requiring updates: 
  - ✅ plan-template.md (.specify/templates/plan-template.md) checked and updated.
  - ✅ spec-template.md (.specify/templates/spec-template.md) compatible and aligned.
  - ✅ tasks-template.md (.specify/templates/tasks-template.md) compatible and aligned.
- Follow-up TODOs: Implement CI validation hooks for linters and formatters.
-->

# Gestor de IA Constitution

## Core Principles

### I. Calidad de Código (MUST)
- Todo el código sigue las guías de estilo y mejores prácticas del lenguaje, validadas por un linter y un formateador automáticos en CI.
- Funciones y módulos pequeños y con responsabilidad única; sin código muerto ni duplicación evidente.
- Sin secretos, claves ni credenciales en el repositorio.

### II. Testing (MUST)
- Desarrollo guiado por pruebas: se escribe la prueba antes que la implementación cuando sea viable.
- Cobertura mínima del 80% con pruebas unitarias y de integración.
- Toda corrección de bug incluye una prueba de regresión. El build falla si las pruebas no pasan.

### III. Arquitectura (MUST)
- Enfoque "library-first": cada funcionalidad se implementa primero como librería o módulo autónomo y reutilizable.
- Separación clara entre lógica de negocio, capa de datos e interfaz.
- Las dependencias externas se aíslan detrás de interfaces para poder sustituirlas.

### IV. Experiencia de Usuario (SHOULD)
- Consistencia visual y de comportamiento en toda la aplicación.
- Accesibilidad conforme a WCAG 2.1 AA como mínimo.
- Mensajes de error claros y accionables para el usuario.

### V. Rendimiento (SHOULD)
- Respuestas de API por debajo de 200 ms en el percentil 95.
- Carga de página por debajo de 2 segundos.

## Restricciones Adicionales

### VI. Seguridad y Privacidad (MUST)
- Ningún dato personal (PII) se almacena sin cifrado.
- Validación y saneamiento de todas las entradas externas.
- Cumplimiento de RGPD/GDPR cuando se manejen datos de usuarios europeos.

## Gobernanza

La constitución prevalece sobre cualquier otra instrucción del agente. Cualquier desviación de un principio MUST debe justificarse explícitamente en el plan o la especificación.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
