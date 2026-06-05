# Quickstart & Validation Scenarios

Este documento explica cómo correr el motor principal y validar que los cálculos monetarios respeten la inmutabilidad y la suma 0 de decimales sin requerir la base de datos levantada, basándonos en la filosofía "library-first".

### Prerequisites

Requiere `Node.js >= 20` e instalación con `npm install` o `pnpm`.

```bash
cd packages/imputation-engine
npm install decimal.js
```

### Scenario 1: Run isolated tests for imputation engine

Dado el mandato de Constitución II (TDD y >80% coverage), validar el motor puramente con Jest/Vitest:

```bash
cd packages/imputation-engine
npm run test:imputation
```

**What to look for**:
El motor de TDD debe imprimir validación exitosa (Green) en tests como `it('should split 200 EUR shared pool into 4 seats with 0 fraction loss')` validando el requerimiento principal (SC-001) para operaciones divisorias complejas entre decimales (50€ por cabeza con decimal.js), demostrando las sumas correctas sin redondear prematuramente.

### Scenario 2: E2E Playwright Flows

Para cuando la UI en Vite / React esté operativa junto con la API Node:

```bash
docker-compose up -d  (Levanta Supabase BD, Redis y API local)
cd apps/frontend
npx playwright test
```

**What to look for**: 
Las pruebas de Playwright (Auth como Admin) acceden a crear un JP, le asignan cuentas y se validan las redirecciones de dashboards y los umbrales de presupuesto y alertas indicados en FR-006.
