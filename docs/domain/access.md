# StockMiles — Access: Login, Users, Roles

> స్థితి: **Veera నిర్ణయాలు అయ్యాయి (2026-11-27)**. Stores / warehouses అంటే ఏమిటో → [tenant-model.md](tenant-model.md).
> చివరి update: 2026-11-27

## 1. పదాలు

| పదం                   | అర్థం                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------- |
| **User**              | ఒక మనిషి (ఒక Google account). StockMiles మొత్తంలో ఒక్కసారే.                                      |
| **Tenant**            | StockMiles కొన్న వ్యాపారం. ఒక user చాలా tenants లో పని చేయవచ్చు.                                    |
| **Membership**        | "ఈ user ఈ tenant లో ఈ role తో" అనే link.                                                    |
| **Scope**             | Store / warehouse roles కి: ఏ stores లేదా warehouses లో పని చేయవచ్చు.                           |
| **Platform staff**    | StockMiles team. Customers data లోకి support కోసం మాత్రమే.                                     |
| **Role / Permission** | Role = పాత్ర (cashier). Permission = ఒక పని (`billing.create`). Role అంటే permissions గుంపు. |

## 2. Login (Google; Supabase Auth లేదు)

**నిర్ణయం:** Google Identity Services button → browser కి Google **ID token** → `POST /api/auth/google` → server Google keys తో verify → మన సొంత **session**.

- Supabase Auth, Supabase libraries వాడము; Supabase = plain Postgres మాత్రమే.
- Google నుంచి: `sub`, `email`, `email_verified`, `given_name`, `family_name`, `name`, `picture`. `email_verified` false అయితే నిరాకరణ.
- User ని **`google_sub`** తో గుర్తిస్తాం (email మారొచ్చు, `sub` మారదు).
- ప్రతి login లో పేరు, photo, `last_login_at` update.

**Session (JWT కాదు):**

- Cookie `sm_session`: `HttpOnly`, `Secure`, `SameSite=Lax`. JavaScript చదవలేదు.
- Cookie లో random token (32 bytes); database లో దాని **SHA-256 hash** మాత్రమే.
- గడువు 30 రోజులు (✅ Veera, 2026-11-27), వాడుతున్న కొద్దీ పొడిగింపు. Logout = `revoked_at`.
- **Google login మాత్రమే, అందరికీ** (cashiers తో సహా; ✅ Veera, 2026-11-27). PIN, password లాంటి వేరే login పద్ధతులు ఉండవు. ఒకే counter device ని చాలా మంది వాడితే: ఒకరు logout, మరొకరు Google login.
- ఎందుకు JWT కాదు: owner ఒకరిని తీసేస్తే access **వెంటనే** పోవాలి.

## 3. Tables

### `users`

| Column          | Type        | నియమం                                                               |
| --------------- | ----------- | ------------------------------------------------------------------ |
| `id`            | uuid        | PK, UUIDv7 (app తయారు చేస్తుంది)                                       |
| `google_sub`    | text        | not null, unique                                                   |
| `email`         | text        | not null, unique, lowercase                                        |
| `first_name`    | text        | Google `given_name` (ఉండకపోవచ్చు)                                    |
| `last_name`     | text        | Google `family_name` (ఉండకపోవచ్చు)                                   |
| `full_name`     | text        | not null, Google `name`                                            |
| `avatar_url`    | text        | Google `picture`                                                   |
| `status`        | enum        | `pending` / `active` / `suspended`, default `pending` (క్రింద నియమాలు) |
| `last_login_at` | timestamptz |                                                                    |
| `created_at`    | timestamptz | not null, default now                                              |
| `updated_at`    | timestamptz | not null, default now                                              |

**`users.status` నియమాలు (Veera నిర్ణయం, 2026-11-27):** User active అవ్వాలంటే రెండూ జరగాలి: (1) Google login విజయవంతం, (2) platform staff లేదా tenant user (`team.manage` ఉన్నవారు) ఆ user కి tenant / store / warehouse access ఇవ్వటం.

| నుంచి → కి             | ఎప్పుడు                                                                                  | ఎవరు                         |
| -------------------- | --------------------------------------------------------------------------------------- | ---------------------------- |
| (లేదు) → `pending`    | మొదటి Google login (row సృష్టి)                                                             | System                       |
| `pending` → `active` | మొదటి active membership (invite అంగీకారం, లేదా నేరుగా access ఇవ్వటం) లేదా `platform_staff` లో చేర్చటం | Platform staff / tenant user |
| `active` → `pending` | చివరి active membership తీసివేత / disable (platform staff కాకపోతే)                              | Platform staff / tenant user |
| ఏదైనా → `suspended`    | StockMiles మొత్తం నుంచి నిలిపివేత                                                              | Platform staff మాత్రమే          |
| `suspended` → పై నియమం | నిలిపివేత తీసివేత; memberships ఉంటే `active`, లేకపోతే `pending`                                    | Platform staff మాత్రమే          |

- `status` ఎప్పుడూ memberships మార్చే **అదే database transaction** లో, ఒకే function (`syncUserStatus`) ద్వారా మారుతుంది. అలా memberships, status ఎప్పుడూ ఒకదానికొకటి సరిపోతాయి.
- Null వాడము: "విలువ తెలియదు" అని అర్థం వస్తుంది, queries లో తప్పిపోతుంది. `pending` స్పష్టంగా చెప్తుంది.
- Tenant-స్థాయి `disabled` membership వేరు: ఆ ఒక్క tenant లో మాత్రమే access పోతుంది; ఇతర tenants లో active గా ఉంటాడు.

### `sessions`

| Column         | Type        | నియమం                       |
| -------------- | ----------- | -------------------------- |
| `id`           | uuid        | PK                         |
| `user_id`      | uuid        | → `users.id`               |
| `token_hash`   | text        | unique                     |
| `user_agent`   | text        | "Chrome on Android" చూపటానికి |
| `ip_address`   | text        | login సమయంలో                |
| `created_at`   | timestamptz | login సమయం                 |
| `last_seen_at` | timestamptz | 5 నిమిషాలకి ఒకసారి update        |
| `expires_at`   | timestamptz |                            |
| `revoked_at`   | timestamptz | null = చెల్లుతుంది            |

### `platform_staff`

`user_id` (PK → `users.id`), `role` (`platform_admin` / `platform_support`), `created_at`. మొదటి `platform_admin` (Veera) ని script తో మాత్రమే; app లో ఆ button ఉండదు.

### `memberships`

| Column       | Type | నియమం                                   |
| ------------ | ---- | -------------------------------------- |
| `id`         | uuid | PK                                     |
| `tenant_id`  | uuid | → `tenants.id`                         |
| `user_id`    | uuid | → `users.id`; invite అంగీకరించే వరకు null |
| `email`      | text | invite email (lowercase)               |
| `role`       | enum | §4 లోని 9 roles లో ఒకటి                    |
| `status`     | enum | `invited` / `active` / `disabled`      |
| `invited_by` | uuid | → `users.id`                           |
| timestamps   |      |                                        |

Unique: (`tenant_id`, `email`). ఒక tenant లో ఒక మనిషికి ఒకే role.

### `membership_scopes`

| Column          | Type | నియమం                        |
| --------------- | ---- | --------------------------- |
| `membership_id` | uuid | → `memberships.id`          |
| `store_id`      | uuid | → `stores.id` (లేదా null)     |
| `warehouse_id`  | uuid | → `warehouses.id` (లేదా null) |

CHECK: `store_id`, `warehouse_id` లో సరిగ్గా ఒకటి. Store roles కి ≥ 1 store row, warehouse roles కి ≥ 1 warehouse row తప్పనిసరి; tenant roles కి rows ఉండవు (అన్నీ). Store scope లో ఆ store కి attach అయిన warehouses (store room, backyard) కూడా వస్తాయి.

## 4. Roles

**నిర్ణయం:** Roles స్థిరం, **code లో** (`packages/shared/src/auth/permissions.ts`). Server ప్రతి route ని అదే map తో check చేస్తుంది; web అదే map తో buttons దాచుతుంది. Custom roles తర్వాత.

| స్థాయి               | Role                | పని                                                        |
| ----------------- | ------------------- | --------------------------------------------------------- |
| Tenant (అన్నీ)      | `owner`             | అన్నీ; tenant settings, plan, delete                        |
|                   | `admin`             | Owner లాగే, plan / delete తప్ప                               |
|                   | `purchaser`         | Purchase trips, suppliers, products                       |
|                   | `inventory_manager` | ఏ stock ఏ store కి: allocation, transfers, warehouses      |
|                   | `accountant`        | అన్ని reports, చదవటం మాత్రమే                                   |
| Warehouse (scope) | `warehouse_manager` | తన warehouses: receive, dispatch, bins, count, adjust     |
| Store (scope)     | `store_owner`       | Franchise యజమాని: తన store లో అన్నీ, తన team                   |
|                   | `store_manager`     | Store layout, shelves, receive, billing cancel / discount |
|                   | `cashier`           | Billing, shelf తరలింపు                                     |

## 5. Permissions

✅ = అన్నీ, **S** = తన stores (+ attach అయిన warehouses), **W** = తన warehouses.

| Permission                                                    | owner | admin | purchaser | inventory_manager | accountant | warehouse_manager |     store_owner      | store_manager | cashier |
| ------------------------------------------------------------- | :---: | :---: | :-------: | :---------------: | :--------: | :---------------: | :------------------: | :-----------: | :-----: |
| `tenant.manage`                                               |  ✅   |       |           |                   |            |                   |                      |               |         |
| `team.manage` (invite, role)                                  |  ✅   |  ✅   |           |                   |            |                   | S (manager, cashier) |  S (cashier)  |         |
| `store.create`                                                |  ✅   |  ✅   |           |                   |            |                   |                      |               |         |
| `store.layout` (floors, sections, fixtures, shelves, hangers) |  ✅   |  ✅   |           |                   |            |                   |          S           |       S       |         |
| `warehouse.manage` (సృష్టి, bins)                               |  ✅   |  ✅   |           |        ✅         |            |     W (bins)      |                      |               |         |
| `product.manage`                                              |  ✅   |  ✅   |    ✅     |        ✅         |            |                   |                      |               |         |
| `purchase.manage` (trips, bills)                              |  ✅   |  ✅   |    ✅     |                   |            |                   |                      |               |         |
| `purchase.receive`                                            |  ✅   |  ✅   |    ✅     |        ✅         |            |         W         |          S           |       S       |         |
| `transfer.dispatch`                                           |  ✅   |  ✅   |           |        ✅         |            |         W         |          S           |       S       |         |
| `transfer.receive`                                            |  ✅   |  ✅   |           |        ✅         |            |         W         |          S           |       S       |         |
| `stock.move_internal` (shelf / bin మార్పు)                      |  ✅   |  ✅   |           |        ✅         |            |         W         |          S           |       S       |    S    |
| `stock.adjust` (కారణం తప్పనిసరి)                                  |  ✅   |  ✅   |           |        ✅         |            |         W         |          S           |       S       |         |
| `billing.create`                                              |  ✅   |  ✅   |           |                   |            |                   |          S           |       S       |    S    |
| `billing.cancel`, `discount.override`                         |  ✅   |  ✅   |           |                   |            |                   |          S           |       S       |         |
| `reports.view`                                                |  ✅   |  ✅   |    ✅     |        ✅         |     ✅     |         W         |          S           |       S       |         |

**నియమాలు:**

- ప్రతి tenant కి ≥ 1 active `owner`; చివరి owner ని తీసేయటం / తగ్గించటం నిషేధం.
- ఎవరూ తనకంటే పెద్ద role ఇవ్వలేరు.
- Server **ఎప్పుడూ** check చేస్తుంది; web లో button దాచటం సౌలభ్యం మాత్రమే.
- ప్రతి query కి `tenant_id` filter; scope roles కి `store_id` / `warehouse_id` filter కూడా. ఎలా బలవంతం చేయాలో (helper / Postgres RLS) F5 లో నిర్ణయం.
- Platform support customer data చదివితే → audit log (తర్వాత).

## 6. Login తర్వాత

```text
Google login ✓
 ├─ users లో లేడు → కొత్త user
 ├─ ఈ email కి invites ఉన్నాయి → link చేసి membership active, user `active` (invite = app లో email నమోదు; WhatsApp link తర్వాత చూద్దాం)
 └─ users.status చూసి:
     ├─ suspended              → "Account నిలిపివేయబడింది"
     ├─ pending                → "Access కోసం వేచి ఉండండి" (మీ email, మీ owner / StockMiles కి చెప్పండి)
     ├─ ఒక tenant              → నేరుగా లోపలికి (store role అయితే తన store screen)
     └─ చాలా tenants           → ఎంచుకోండి
```

**కొత్త tenant ఎవరు సృష్టిస్తారు:** ఇప్పటికి platform staff మాత్రమే (owner ని invite చేస్తారు). Self sign-up ("మీ వ్యాపారం సృష్టించండి") తర్వాత నిర్ణయం.

## 7. Offline

- Login అయ్యాక `GET /api/me` (user, tenants, role, scopes, permissions) device లో (IndexedDB) cache. Offline లో app దాన్నే వాడుతుంది.
- Offline లో **కొత్త login సాధ్యం కాదు** (Google కి internet కావాలి); login అయి ఉన్నవారు పని చేస్తూనే ఉంటారు.
- Online కి వచ్చాక sync ముందు `/api/me` refresh. Session revoke అయితే (401): queue లోని పని device లోనే ఉంచి login అడుగుతాం.
- Offline లో చేసిన పనిని sync సమయంలో server **మళ్ళీ** permission check చేస్తుంది.
