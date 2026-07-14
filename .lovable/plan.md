# Driver Management Module — Implementation Plan

A full end-to-end module integrated into the existing BSH Taxi app, following current design system (green gradient, shadcn UI, responsive, collapsible monthly sections).

## 1. Database (new migration)

New tables in `public`:

- **drivers** — `id, name, mobile, license_number, address, aadhaar, joining_date, status ('active'|'inactive'), notes, created_by, created_at, updated_at`
- **driver_trip_amounts** — `id, driver_id (FK drivers), trip_id (FK trips, unique), amount, created_by, created_at`
- **driver_expenses** — `id, driver_id, expense_type ('fuel'|'food'|'toll'|'advance'|'repair'|'other'), amount, description, expense_date, created_by, created_at`
- **driver_payments** — `id, driver_id, payment_amount, payment_mode ('cash'|'bank'|'upi'), reference_number, payment_date, notes, created_by, created_at`

For every table:
1. CREATE TABLE
2. GRANT SELECT/INSERT/UPDATE/DELETE to `authenticated`; GRANT ALL to `service_role` (no anon)
3. ENABLE RLS
4. Policies: authenticated users can read all; only creator or admin can update/delete; insert requires `created_by = auth.uid()`

Trigger: on `trips` INSERT/UPDATE, if `driver_amount > 0` and a `driver_id` column exists, upsert into `driver_trip_amounts`. Since existing trips table doesn't have `driver_id`, add optional column `driver_id uuid REFERENCES drivers(id)` to `trips`. Existing driver text field remains for backward compat.

Ledger will be computed in a SQL view `driver_ledger` (SECURITY INVOKER) that unions trip_amounts (credit), expenses (debit), payments (debit) with running balance per driver — or computed client-side. **Compute client-side** for simplicity and to avoid view maintenance.

`updated_at` trigger reused from existing `update_updated_at_column()`.

## 2. Frontend structure

New folder `src/components/drivers/`:
- `DriversDashboard.tsx` — summary cards + charts (recharts)
- `DriversList.tsx` — searchable table with edit/delete
- `DriverForm.tsx` — add/edit modal
- `DriverExpensesPage.tsx` — list + add expense form
- `DriverPaymentsPage.tsx` — list + add payment form
- `DriverLedger.tsx` — select driver → totals + transactions table
- `DriverReports.tsx` — filters + Excel/PDF/Print export

New page `src/pages/Drivers.tsx` with sub-tabs (Dashboard, Drivers, Ledger, Expenses, Payments, Reports).

## 3. Integration

- **Sidebar**: add "Drivers" (Truck icon) between "Outside Vehicles" and "Maintenance" in `MobileBottomNav` and desktop navigation in `Dashboard.tsx`. Bottom nav on mobile has limited slots — replace less-used entry or add overflow.
- **TripForm**: add `driver_id` select (from drivers table) + `driver_amount` number field. On save, insert into `driver_trip_amounts` (or rely on trigger).
- **Existing "driver_amount"** on trips already exists in schema — reuse it; only add `driver_id` FK.

## 4. Ledger logic (client-side)

For a selected driver, fetch:
- trip_amounts (credit)
- expenses (debit; advance is separate type)
- payments (debit)

Merge, sort by date asc, compute running balance = Σcredits − Σdebits.
Show totals: Total Trips, Total Trip Amount, Total Expenses, Total Payments, Pending Balance.

## 5. Reports & Export

Reuse existing jsPDF+autotable and xlsx patterns from `src/components/reports/`. Filters: driver, date range, month, year. Export current filtered view.

## 6. Validation

Zod schemas for driver, expense, payment forms (name required, mobile 10 digits, amounts > 0).

## Deliverables

- 1 migration (4 tables + `trips.driver_id` + policies + grants)
- 1 new page + 7 components
- Sidebar updates (desktop + mobile bottom nav)
- TripForm additions

Approve to proceed.
