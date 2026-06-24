## Goal

In the **Vehicles** section, when you add a renewal for Alignment / Oil Change / Insurance / PUC, the new record becomes the **Active** one and older records for the same vehicle stay visible as **Renewed / Expired** history (not deleted). Also add two new tabs: **FC (Fitness Certificate)** and **All India Permit**, with the same renewal-history behaviour.

## What changes (high level)

### 1. Renewal history (Alignment, Oil Change, Insurance, PUC)

The DB tables already allow many rows per vehicle — today the UI only shows one row per vehicle and only one "Active" badge per card. I'll change each of these four tabs so they:

- Group all records by vehicle number.
- Determine the **latest** record per vehicle (by expiry date for Insurance/PUC, by last service date/KM for Oil Change/Alignment).
- Render the latest record as the main card with its normal status badge (Active / Expiring Soon / Expired / Overdue).
- Render older records for the same vehicle inside a collapsible **"Previous renewals"** section under the card with a muted **Renewed** badge and the historical dates/amounts, so nothing is lost.
- The summary status on the main **Vehicles** tab cards keeps using only the latest record per vehicle (so an expired old insurance no longer triggers a false "Expired" badge once a renewal is added).

No data migration needed — existing rows already represent your history.

### 2. New tab: FC (Fitness Certificate)

New table `vehicle_fc` with: `vehicle_number`, `fc_number`, `issue_date`, `expiry_date`, `amount`, `created_by`, timestamps. Same RLS pattern as the other vehicle tables. New tab in the sub-tab strip with Add / Edit / Delete form (vehicle number, FC number, issue date, expiry date, amount) and the same Active / Expiring Soon / Expired status + renewal history list.

### 3. New tab: All India Permit

New table `vehicle_permit` with: `vehicle_number`, `permit_number`, `issuing_state`, `issue_date`, `expiry_date`, `amount`, `created_by`, timestamps. Same pattern: tab, form, cards with status badges, and previous-renewals history.

### 4. Vehicles overview card

Add small status chips on each vehicle card for **FC Expired / FC Expiring** and **Permit Expired / Permit Expiring**, alongside the existing Oil / Align / Ins / PUC chips.

## Tabs after this change

`Vehicles` · `EMI` · `Alignment` · `Oil Change` · `Insurance` · `PUC` · **`FC`** · **`Permit`**

## Technical notes

- Migrations for `public.vehicle_fc` and `public.vehicle_permit` will include the required `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated;`, `GRANT ALL … TO service_role;`, `ENABLE ROW LEVEL SECURITY`, and per-user CRUD policies (`auth.uid() = created_by`), matching the existing vehicle_* tables.
- UI changes are confined to `src/components/vehicle-history/VehicleHistoryDashboard.tsx` plus the generated Supabase types (auto-regenerated from the migration).
- "Latest" selection per vehicle: Insurance/PUC/FC/Permit → max `expiry_date`; Oil Change → max `last_oil_change_date`; Alignment → max `last_alignment_date` (fallback to max `last_alignment_km`).
- Older records render in a compact list (date range + amount/policy no.) with a "Renewed" badge — no behaviour change to the Edit/Delete buttons, you can still fix or remove historical rows.

Confirm and I'll implement.
