# Implementation Plan: AI Cost Manager

**Branch**: `001-ai-cost-manager` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ai-cost-manager/spec.md`

## Summary

Construir una aplicación web para la gestión, control y reparto de costes de cuentas de IA en Alten. Permite asignar cuentas y costes a los proyectos y consultores que las usan, con reglas temporales, presupuestos y control de desviaciones. Se estructura como una SPA con backend API REST, empleando un motor de imputación puro y testable de forma independiente.

## Technical Context

**Language/Version**: TypeScript / Node.js (Backend) y TypeScript / React (Frontend)

**Primary Dependencies**: 
- Backend: Supabase (PostgreSQL), Node.js, `decimal.js` (para precisión fija monetaria)
- Frontend: Next.js / Vite, React, TanStack Query, Recharts, componentes accesibles
- Tareas asíncronas: background jobs / colas (BullMQ o similar)

**Storage**: PostgreSQL (vía Supabase). Tipo DECIMAL para valores monetarios.

**Testing**: Jest/Vitest (unit/integration, >80% coverage), Playwright (E2E)

**Target Platform**: Contenedores Docker (Linux)

**Project Type**: SPA (Frontend) + REST API (Backend) + Motor de Imputación (Librería pura)

**Performance Goals**: API <200ms p95, Page Load <2s

**Constraints**:
- Single Sign-On (SSO) vía OpenID Connect (Entra ID)
- Montos financieros estrictamente en DECIMAL (sin coma flotante)
- Las asignaciones y planes tienen fecha efectiva (historificación)
- Cumplimiento estricto con la constitución del proyecto

**Scale/Scope**: Múltiples proyectos, empleados y cuentas a nivel corporativo, cálculo mensual/periodo automático.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Code Quality: Linter/formatter passed? No credentials?
- [x] Testing: 80% coverage minimum? TDD approach planned?
- [x] Architecture: Library-first module structure? (Motor de imputación aislado como dominio puro)
- [x] UX/Performance/Security: TLS, PCI/GDPR requirements considered?

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-cost-manager/
├── spec.md
├── plan.md
├── tasks.md
├── checklists/
├── research.md
├── data-model.md
├── contracts/
└── quickstart.md
```

### Implementation

```text
packages/
└── imputation-engine/ (Motor de dominio puro sin db ni frameworks)
    ├── src/
    └── tests/
apps/
├── backend/ (Node.js REST API + Tareas de background)
└── frontend/ (Vite/Next.js SPA React)
```

