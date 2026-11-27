# StockMiles — Tenant model: Stores, Warehouses, Stock

> స్థితి: **Veera నిర్ణయాలు అయ్యాయి (2026-11-27)**; ప్రతి module మొదలయ్యే ముందు వివరాలు చర్చిస్తాం. ఎవరు ఏమి చేయగలరు → [access.md](access.md). Modules క్రమం → [../roadmap.md](../roadmap.md).
> చివరి update: 2026-11-27

## 1. ఆకారం

**Tenant** = StockMiles కొన్న వ్యాపారం. దాని కింద రెండు **వేర్వేరు** రకాల స్థలాలు:

|               | **Store (shop)**                                              | **Warehouse**                                                  |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| పని            | Display, అమ్మకం (POS), store నిర్వహణ                             | నిల్వ (inventory), purchase receive, stores కి పంపటం              |
| లోపలి అమరిక      | **తప్పనిసరి, వివరంగా:** floor → section → fixture → shelf / hanger | **ఐచ్ఛికం:** bins (rack / shelf / bay) ఉండొచ్చు, లేకపోవచ్చు           |
| Stock ఎక్కడ    | ఎప్పుడూ ఒక **shelf** మీద                                        | Bins ఉంటే bin మీద; లేకపోతే warehouse లో (స్థానం లేకుండా)                 |
| ఎవరికి చెందుతుంది | Tenant                                                        | Tenant కి నేరుగా, **లేదా** ఒక store కి attach (store room, backyard) |
| కనీసం          | ప్రతి tenant కి ≥ 1 store                                        | 0 లేదా ఎన్నైనా                                                      |

```text
Tenant "Sri Lakshmi Silks"
 ├─ Warehouse "Central Godown"        (kind: building, store లేదు, bins: లేవు)
 ├─ Store "Hyderabad"  HYD
 │    ├─ Layout
 │    │    ├─ Ground floor
 │    │    │    ├─ Section "Silk Sarees"
 │    │    │    │    ├─ Fixture R1 (rack)    → Shelf S1, S2, S3
 │    │    │    │    ├─ Fixture T1 (t_stand) → Shelf S1, S2 + Hanger H1, H2
 │    │    │    │    └─ Display table D1
 │    │    │    └─ Section "Kids"
 │    │    └─ First floor ...
 │    └─ Warehouse "HYD Store room"    (kind: store_room, store: HYD, bins: ఉన్నాయి)
 └─ Store "Vijayawada" VJA (franchise)
      ├─ Layout ...
      └─ Warehouse "VJA Backyard"      (kind: backyard, store: VJA, bins: లేవు)
```

## 2. Store layout (POS కోసం)

**నిర్ణయం:** Store లోపలి అమరిక ఒక **tree** (`store_places` table, `parent_id` తో). ప్రతి స్థాయికి `kind`:

| `kind`    | ఉదాహరణ                                                | Stock ఉంచవచ్చా?   |
| --------- | ---------------------------------------------------- | --------------- |
| `floor`   | Ground floor, First floor                            | ❌ (గుంపు మాత్రమే) |
| `section` | Silk Sarees, Men, Kids                               | ❌ (గుంపు మాత్రమే) |
| `fixture` | Rack, T-stand, wall bay, gondola (`fixture_type`)    | ❌ (గుంపు మాత్రమే) |
| `shelf`   | R1-S2 (మడతపెట్టి పెట్టే అర)                                | ✅              |
| `hanger`  | T1-H1 (hangers మీద వేలాడే items, customer చూసి try చేయటానికి) | ✅              |
| `display` | Mannequin, display table                             | ✅              |
| `counter` | Billing counter దగ్గర                                 | ✅              |

**Fixture:** Section లోపల ఉండే ఏ furniture అయినా. `fixture_type`: `rack` / `t_stand` / `wall_bay` / `gondola` / `table` / `other`. ఒక fixture లో shelves, hangers **కలిపి** ఉండొచ్చు. ఉదా. **T-stand**: అడ్డ భాగం rack లాగా shelves, నిలువు భాగం hangers మీద కొన్ని items display. కొత్త రకం furniture వస్తే `fixture_type` కి ఒక విలువ add చేస్తే చాలు; tree మారదు.

- Stock **leaf** స్థానాల్లో (`shelf` / `hanger` / `display` / `counter`) మాత్రమే. Floor / section / fixture గుంపులు; వాటి stock = లోపలి leaves మొత్తం.
- Hanger / display మీద ఉన్న items కూడా సాధారణ stock, అమ్మవచ్చు. "ఇది display piece, అమ్మకూడదు" అనే గుర్తు కావాలంటే billing module లో చూద్దాం.
- అన్ని స్థాయిలు తప్పనిసరి కావు: చిన్న shop లో "Section → Shelf" చాలు.
- ప్రతి స్థానానికి చిన్న **code** (`G-SIL-R1-S2`): shelf label print, scan కోసం.
- ప్రతి store సృష్టించినప్పుడు ఆటోమేటిక్ గా **"Unplaced"** shelf ఒకటి వస్తుంది. Layout ఇంకా సెట్ చేయని stock అక్కడ ఉంటుంది. Day 1 నుంచే పని చేయవచ్చు; ఆ తర్వాత అమర్చుకోవచ్చు. Reports లో "Unplaced stock" చూపిస్తాం, తగ్గించమని గుర్తు చేయటానికి.
- **Product కి default shelf** (store వారీగా): "Kanchi silk red ఎక్కడ ఉంటుంది?" కి సమాధానం. Receive చేసినప్పుడు అక్కడికే suggest.

**POS లో భవిష్యత్ ఉపయోగాలు:** "ఈ item ఏ shelf లో?" search, customer కి "First floor, Silk section, R1" చూపటం, section వారీగా sales, shelf వారీగా stock count (cycle count), ఖాళీ shelf alert.

## 3. Warehouse

| Field       | విలువ                                                         |
| ----------- | ------------------------------------------------------------ |
| `store_id`  | null = tenant warehouse; విలువ ఉంటే ఆ store కి attach           |
| `kind`      | `building` / `store_room` / `backyard` / `other` (వివరణ మాత్రమే) |
| `uses_bins` | false = స్థానం లేకుండా stock; true = ప్రతి stock ఒక bin లో          |

- Bins (`warehouse_bins`) కూడా tree: `zone` → `rack` → `bin` (store లాంటిదే, కానీ ఐచ్ఛికం). Stock leaf `bin` లో మాత్రమే. (Hangers, display warehouse లో అవసరం లేదు.)
- `uses_bins` ని false → true మార్చితే అప్పటి stock "Unbinned" bin లోకి వెళ్తుంది (store "Unplaced" లాగే).

## 4. Stock ఎక్కడ ఉంది: stock position

ప్రతి stock row ఈ మూడింటిలో ఒకటి:

| ఎక్కడ                 | `store_place_id` | `warehouse_id` | `warehouse_bin_id` |
| -------------------- | ---------------- | -------------- | ------------------ |
| Store shelf          | ✅               |                |                    |
| Warehouse (bins లేవు) |                  | ✅             |                    |
| Warehouse bin        |                  | ✅             | ✅                 |

Database **CHECK constraint** తో: store లేదా warehouse లో ఏదో ఒకటే; ఇద్దరూ / ఏదీ లేకపోవటం అసాధ్యం.

## 5. Stock కదలికలు

Stock ని నేరుగా మార్చము. ప్రతి మార్పు ఒక **movement** row (ఎవరు, ఎప్పుడు, ఎక్కడ నుంచి, ఎక్కడికి, ఎందుకు). ప్రస్తుత stock = movements మొత్తం (వేగం కోసం balance table కూడా, అదే transaction లో update).

| పని                   | నుంచి → కి                                                                   | ఎలా                                  |
| -------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| Purchase receive     | supplier → warehouse (లేదా నేరుగా store shelf)                                 | Purchase trip / bill                |
| **Transfer**         | warehouse → store, store → store, store → warehouse, warehouse → warehouse | **dispatch → in transit → receive** |
| Store లోపల తరలింపు     | shelf → shelf; attached store room ↔ shelf                                 | వెంటనే, ఒకే step                       |
| Warehouse లోపల తరలింపు | bin → bin                                                                  | వెంటనే, ఒకే step                       |
| Sale / return        | store shelf ↔ customer                                                     | Bill / return bill                  |
| Adjustment           | damage, lost, count తేడా                                                     | కారణం తప్పనిసరి, permission అవసరం       |

**Transfer నియమాలు:** Dispatch అయిన stock "in transit", ఎవరూ అమ్మలేరు. అందుకునే వైపు లెక్కపెట్టి receive చేస్తుంది (store అయితే shelf ఎంచుకుని, default shelf suggest); తక్కువ వస్తే shortage record. Store కి attach అయిన store room నుంచి అదే store కి తేవటం transfer కాదు, లోపలి తరలింపు.

**Sale నుంచి ఏ shelf తగ్గుతుంది:** Billing module లో నిర్ణయం. ప్రతిపాదన: scan చేసిన label లో shelf ఉంటే అది; లేకపోతే product default shelf; అక్కడ లేకపోతే stock ఉన్న మొదటి shelf. Shelf count తేడాలు cycle count లో సరిచేస్తాం.

## 6. Store billing గుర్తింపు

ప్రతి store కి సొంత: పేరు, `code` (HYD), address, phone, **GSTIN**, state (GST కోసం), **invoice prefix**. Warehouse కి bills ఉండవు (store → store transfer కి delivery challan, తర్వాత).

## 7. మూడు వ్యాపార రకాలు

| రకం              | ఎలా                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Single store** | 1 store, warehouse లేకుండా (లేదా ఒక store room). Purchase నేరుగా store shelves కి. Transfers కనిపించవు.                     |
| **Multi store**  | చాలా stores + central godown. Purchase godown కి → stores కి transfer.                                                 |
| **Franchise**    | Store `ownership: franchise`, franchisee `store_owner` (తన store, attach అయిన warehouses మాత్రమే). GSTIN franchisee ది. |

**తర్వాత (out of scope):** franchisee కి వేరే tenant, tenants మధ్య అమ్మకం (franchisor → franchisee invoice), royalty.

## 8. Tables (సంక్షిప్తం; పూర్తి columns ఆ module లో)

| Table             | ముఖ్య columns                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `tenants`         | `id`, `name`, `legal_name`, `status`                                                                                 |
| `stores`          | `id`, `tenant_id`, `code`, `name`, `ownership`, `gstin`, `state_code`, `address`, `invoice_prefix`, `status`         |
| `store_places`    | `id`, `tenant_id`, `store_id`, `parent_id`, `kind`, `code`, `name`, `sort_order`, `status`                           |
| `warehouses`      | `id`, `tenant_id`, `store_id` (nullable), `kind`, `code`, `name`, `uses_bins`, `status`                              |
| `warehouse_bins`  | `id`, `tenant_id`, `warehouse_id`, `parent_id`, `kind`, `code`, `name`, `status`                                     |
| `stock_balances`  | `tenant_id`, `product_id`, position (§4), `quantity`                                                                 |
| `stock_movements` | `id`, `tenant_id`, `product_id`, from position, to position, `quantity`, `reason`, `ref`, `created_by`, `created_at` |
| `transfers`       | `id`, `tenant_id`, from (store / warehouse), to, `status` (`draft`/`dispatched`/`received`/`cancelled`), lines       |

అన్ని tables లో `tenant_id`. ఏదీ hard delete కాదు: `status: archived` (పాత bills ఆ shelf / store ని చూపాలి).

## 9. Offline

- **Store** offline లో billing చేయగలగాలి: store layout, shelf stock device లో cache; bill local గా; online కి వచ్చాక sync.
- Offline లో stock తప్పవచ్చు (రెండు devices ఒకే చివరి చీర అమ్మితే). నియమం: **bill ని ఎప్పుడూ తిరస్కరించము**; sync తర్వాత negative stock అయితే store manager కి alert.
- Store లో transfer **receive**, shelf తరలింపు offline లో చేయగలగాలి.
- Warehouse, back office పని (purchase, dispatch, layout మార్పులు) online లో; offline అయితే "online కావాలి" సందేశం.
