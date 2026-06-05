# API Contract: Imputation Engine (Library-First)

El motor de imputación de negocio vive aisladamente e instanciará su lógica matemáticamente pura exponiendo el siguiente contrato funcional en TypeScript.

## Input (ImputationPeriodRequest)

```typescript
type ImputationPeriodRequest = {
  periodInfo: {
    startDate: Date;
    endDate: Date;
    targetCurrency: string; // ej. 'EUR'
    exchangeRates: Record<string, number>; // ej. { 'USD': 0.92 }
  };
  accounts: BaseAccountData[]; 
  // BaseAccountData => { id, planType, unitPrice, valid_from, valid_to, etc. }
  consumptions: ConsumptionData[];
  // ConsumptionData => { id, accountId, totalCost } -> only for PAY_PER_TOKEN
  ownerships: AccountOwnershipData[];
  assignments: ProjectAssignmentData[];
};
```

## Output (ImputationResult[])

```typescript
type ImputationRecord = {
  internalLogId: string;
  projectId: string | null; // null si va a "Bolsa No Imputado"
  personId: string;
  accountId: string;
  originalCost: Decimal; // usando decimal.js
  allocatedCost: Decimal;
  currency: string;
  calculationTrace: string; // "Prorrateado a 15 días x 50% de asignación x 25% de titularidad"
};
```

## Frontend REST APIs (Node.js API)

- `POST /api/v1/imputations/calculate`
  - Auth: Admin only
  - Body: `{ "period_month": "YYYY-MM" }`
  - Res: Encola background job y devuelve 202 Accepted.

- `POST /api/v1/consumptions/import`
  - Input: `multipart/form-data` file.csv
  - Res: `200 OK`, resumen de líneas parseadas.

- `GET /api/v1/dashboard/cost-by-project`
  - Auth: Jefe de Proyecto (o Admin)
  - Res: Suma agrupada por proyecto en el periodo actual vs budget.
