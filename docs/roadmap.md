# StockMiles — Roadmap (Phase 1)

> స్థితి: **నిర్ణయాలు అయ్యాయి**; module మొదలయ్యే ముందు ఆ వివరాలు చర్చిస్తాం. Design → [domain/tenant-model.md](domain/tenant-model.md), [domain/access.md](domain/access.md). Stack → [infra.md](infra.md).
> చివరి update: 2026-11-27

## Modules

ప్రతి module = backend + frontend కలిపి ఒక vertical slice; ప్రతి task card లో acceptance, out of scope, offline ప్రవర్తన.

| Module | ఏమి                                                                                                                                   | Demo                                 | స్థితి                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------- |
| F0–F1  | Monorepo, PWA, Render deploy, database connection, health                                                                            | Live site, phone install             | ✅                                             |
| F2     | Migrations (Drizzle) + `users` table (`pending` / `active` / `suspended`)                                                            | `\d users`                           | ✅ local, commit `39e77e2` (Supabase F4 ముందు) |
| F4     | Google login, `sessions`, `GET /api/me`, logout; web: login page, avatar                                                             | Phone లో Google login, పేరు, photo     |                                                |
| F5     | `tenants`, `memberships`: platform staff tenant + మొదటి store సృష్టించి owner ని invite; `users.status` pending → active; tenant isolation | ⭐ Demo 0: owner login అయి తన shop లోకి |                                                |
| F6     | Store layout: floors, sections, fixtures (rack, T-stand), shelves, hangers, "Unplaced", codes                                        | Showroom అమరిక app లో                  |                                                |
| F7     | Warehouses (tenant + store attach), bins (ఐచ్ఛికం)                                                                                     | Godown, store room                   |                                                |
| F8     | Team: invite, roles, `membership_scopes`, permissions map, route checks                                                              | Cashier కి reports కనిపించవు            |                                                |
| తర్వాత   | Products, purchase trips, stock movements, transfers, billing (offline)                                                              |                                      |                                                |

## Veera నిర్ణయాలు (2026-11-27)

| ప్రశ్న          | నిర్ణయం                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Login పద్ధతి    | **Google మాత్రమే, cashiers తో సహా.** PIN / password ఉండవు.                               |
| Roles         | 9 roles ([access.md §4](domain/access.md)) సరిపోతాయి                                    |
| Session గడువు | 30 రోజులు, sliding                                                                   |
| Invite        | App లో email తో మాత్రమే; WhatsApp link తర్వాత చూద్దాం                                        |
| Store layout  | floor → section → fixture (rack, T-stand, ...) → shelf / hanger, + display, counter |
