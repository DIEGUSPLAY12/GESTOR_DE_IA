# Phase 0: Research & Architecture Decisions

## Decision: Manejo de precisión monetaria en JavaScript/TypeScript
- **Decision**: Utilizar `decimal.js` en Node.js y la aplicación, mapeado a columnas tipo `DECIMAL(19,4)` en PostgreSQL.
- **Rationale**: JavaScript nativo utiliza coma flotante de doble precisión (IEEE 754) que introduce errores de redondeo en operaciones financieras ("0.1 + 0.2 = 0.30000000000000004"). La especificación exige que "centimos no se pierdan" y que la suma imponible sea 100% igual. `decimal.js` maneja precisión arbitraria libre de estos fallos, ideal para la lógica de prorrateos y bolsas de no imputado.
- **Alternatives considered**: 
  - Usar enteros representando a la unidad menor (céntimos). Descartado por complejidad al manejar divisiones con fracciones durante los prorrateos y multi-divisa. 
  - `BigInt` nativo manejando céntimos. Igualmente complejo para operaciones de división de porcentajes.

## Decision: Arquitectura del Motor de Imputación "Library First"
- **Decision**: Implementar el motor de cálculo matemático como un módulo npm independiente en TypeScript funcional (`packages/imputation-engine`), que exponga funciones puras: `(period, accounts, allocations, ... ) => results`. Sin acoplar a Supabase ni Node HTTP.
- **Rationale**: Cumple el *Core Principle III - Arquitectura*. Podrá someterse a TDD exhaustivo mandando JSON de entrada estructurados de casos límites, devolviendo objetos de salida verificables numéricamente a nivel unitario antes incluso de crear las rutas API de base de datos.
- **Alternatives considered**: Integrar el cálculo como stored procedures (PL/pgSQL). Descartado porque rompe la portabilidad del motor de reglas, es más difícil de testear con unit tests ágiles e interfiere con la pureza del código.

## Decision: Tareas en segundo plano y consumos
- **Decision**: Usar BullMQ respaldado por redis o la extensión `pgmq` en Supabase/Postgres. Alternativamente, tareas CRON de Node.js programadas. 
- **Rationale**: Se espera importar ficheros CSV grandes para consumos 'pay-per-token' y computar grandes volúmenes de cuentas mensualmente sin bloquear el Main Thread del API de Node.

## Decision: React con Vite vs Next.js
- **Decision**: Se utilizará React con Vite como un Frontend SPA estático interactuando vía REST a la API. Next.js, mencionado concurrentemente, se reserva sólo como framework backend SSR alternativo, pero al tener backend y BD separadas, Vite SPA es el modelo nativo que se acopla más directo a un API REST / Supabase desacoplado.
- **Rationale**: Fomenta el Single Page Application (SPA), es ligero para desplegar tras Nginx/Docker, encaja muy bien con TanStack query.
