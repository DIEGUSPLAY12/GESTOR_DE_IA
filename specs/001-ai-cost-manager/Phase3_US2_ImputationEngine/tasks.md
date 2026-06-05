# Tasks: Phase 3 Imputation Engine

**-> Capa de Motor de Imputación (TDD)**
- [ ] T011 [US2] Crear test unitario TDD que valide el prorrateo de días en cuenta activa en `packages/imputation-engine/tests/proration.test.ts`
- [ ] T012 [US2] Implementar la función de prorrateo temporal usando y validando las fechas efectivas en `packages/imputation-engine/src/proration.ts`
- [ ] T013 [US2] Crear test unitario TDD para el reparto entre usuarios (ej: cuenta de 200€ entre 4 al 25%) verificando céntimos perdidos en `packages/imputation-engine/tests/split.test.ts`
- [ ] T014 [US2] Implementar la lógica del split compartido vía `decimal.js` en `packages/imputation-engine/src/split.ts`
- [ ] T015 [US2] Crear test unitario TDD para la regla de bolsa no-imputado vs dedicación >100% en `packages/imputation-engine/tests/assignment.test.ts`
- [ ] T016 [US2] Implementar la asignación de coste del consultor al proyecto o bolsa en `packages/imputation-engine/src/assignment.ts`
- [ ] T017 [US2] Ensamblar tests de TDD End-to-End del motor abstracto validando el SC-001 (Suma cero) en `packages/imputation-engine/tests/engine.test.ts`
- [ ] T018 [US2] Ensamblar el calculador global `calculatePeriod()` exportado como lib pura en `packages/imputation-engine/src/index.ts`

**-> Capa de Endpoints API**
- [ ] T019 [US2] Crear el servicio de consumo de DB que inyecta datos al motor en `apps/backend/src/modules/imputation/service.ts`
- [ ] T020 [US2] Crear el REST Endpoint `POST /api/v1/imputations/calculate` y encolar el job background en `apps/backend/src/modules/imputation/api.ts`
- [ ] T021 [US2] Crear Endpoint para validación manual de importaciones de consumos extra (`POST /api/v1/consumptions/import`) en `apps/backend/src/modules/imputation/api_consumptions.ts`
