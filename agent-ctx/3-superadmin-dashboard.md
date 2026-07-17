# Task 3: SuperAdmin Dashboard Transformation (QRBag → QRTags)

**Task ID**: 3
**Agent**: main
**Date**: 2024-01-03
**Status**: COMPLETED

## Summary
Transformed the entire SuperAdmin dashboard from QRBag (baggage tracking) to QRTags (lost & found objects SaaS platform). Updated 10 admin pages and created 7 new API routes.

## Pages Modified/Created

### 1. Admin Layout (`src/app/admin/layout.tsx`) — MODIFIED
- Changed sidebar color from blue (#2563EB) to emerald (#10B981)
- Added QRTags brand logo in sidebar header
- Updated all menu items to reflect QRTags functionality:
  - Tableau de bord, Tags/QR Codes, Générer des tags, Agences, Types d'agences, Utilisateurs, Abonnements, Paiements, Messages, Objets trouvés, CRM, Rapports, Marketing, Blog, Sécurité, Paramètres, Fonctionnalités
- Removed: Pèlerins Hajj, Voyageurs, Marketing & Relances, Marketing & Publicités, Configuration Email, Monitoring
- Added: Types d'agences (Layers), Générer des tags (PlusCircle), Abonnements (CreditCard), Paiements (Wallet), Fonctionnalités (ToggleRight)
- Updated permissions: VIEW_TAGS instead of VIEW_BAGGAGES, etc.
- Auto-hides empty categories in sidebar
- Updated loading spinner to emerald color

### 2. Admin Dashboard (`src/app/admin/tableau-de-bord/page.tsx`) — REWRITTEN
- New stats: Tags actifs, Objets retrouvés, Agences actives, Revenus mensuels, Scans ce mois, Taux de restitution
- New charts: Scans ce mois (emerald bars), Tags par type d'agence (horizontal bars)
- Quick actions: Générer des tags, Tags/QR Codes, Objets trouvés, Agences
- Recent activity list with QRTags scan/tag references
- All emerald (#10B981) color scheme

### 3. Admin Tags Page (`src/app/admin/etiquettes/page.tsx`) — REWRITTEN
- Title: "Gestion des Tags"
- Table with columns: N° Série, Type, Agence, Propriétaire, Objet, Statut, Dernier scan
- Filters: Par type d'agence, Par statut, Par agence
- Status badges using getTagStatusInfo colors from @/lib/qr
- Actions: Voir détail (Eye), Marquer trouvé (CheckCircle), Bloquer (Ban)
- Detail modal with tag info, owner info, object info

### 4. Admin Generate Tags Page (`src/app/admin/generer/page.tsx`) — REWRITTEN
- Title: "Générer des Tags QR"
- Two modes via Tabs: Individual / Lot
- Individual: Select agency type → dynamic fields from AGENCY_TYPES → fill owner/object info → generate 1 tag
- Batch: Select agency → agency type → number of tags (max 1000) → generate bulk
- Preview of generated tags (serial numbers as badges)
- Export ZIP button (exports as manifest file)

### 5. Admin Agency Types Page (`src/app/admin/types-agences/page.tsx`) — NEW
- Title: "Types d'Agences"
- Grid of 8 agency type cards from AGENCY_TYPES static data
- Each card: icon (dynamic from iconMap), name, field count, agency count from DB
- Color-coded top border using each type's color
- Edit button → dialog to modify custom fields (add/remove/edit)
- Toggle active/inactive
- Auto-seeds DB from static AGENCY_TYPES if empty

### 6. Admin Subscriptions Page (`src/app/admin/abonnements/page.tsx`) — NEW
- Title: "Gestion des Abonnements"
- Stats: Total, Actifs, En essai, En retard
- Table: Agence, Plan, Statut, Début, Fin, Montant, Actions
- Plan badges: Starter (gray), Pro (emerald), Enterprise (amber)
- Status badges: Essai (blue), Active (green), En retard (orange), Annulée (red)
- Actions: Renouveler, Upgrader, Annuler

### 7. Admin Payments Page (`src/app/admin/paiements/page.tsx`) — NEW
- Title: "Paiements & Revenus"
- Summary cards: Revenus ce mois, Paiements en attente, Mobile Money, Carte
- Table: Agence, Montant, Méthode, Statut, Date, Réf.
- Method badges: Wave (blue), Orange Money (orange), MTN Money (yellow), CinetPay (purple), Carte (gray)
- Filters by method, status

### 8. Admin Agencies Page (`src/app/admin/agences/page.tsx`) — UPDATED
- Added agency type column with colored badges
- Added subscription status column (plan + status badges)
- Added white-label preview (primary/secondary color squares + logo)
- Added "Voir onboarding" action (Eye icon for incomplete onboarding)
- Replaced baggages count with tags count
- Added agency type filter and search
- Added primary/secondary color pickers in edit dialog

### 9. Admin Users Page (`src/app/admin/utilisateurs/page.tsx`) — UPDATED
- Added "staff" role support with ROLE_BADGES config
- Added staffRole column: Réceptionniste, Housekeeping, Sécurité, Agent badges
- Added agency type filter
- Added staff role selector in create user dialog (shown when role=staff)
- Replaced card grid with table layout for better readability
- Search and filter bar

### 10. Admin Found Items Page (`src/app/admin/trouvailles/page.tsx`) — REWRITTEN
- Title: "Objets Trouvés"
- Stats: Total objets trouvés, Avec trouveur identifié, Avec localisation
- Card grid for found items with tag serial, object, finder, location, agency
- Filters by agency type and date range
- Detail modal with tag info, finder info, location (with Google Maps link)
- Export CSV button
- Emerald color scheme throughout

## API Routes Created/Updated

### `/api/admin/dashboard/route.ts` — UPDATED
- Returns QRTags stats: totalTags, activeTags, foundItems, activeAgencies, monthlyRevenue, scansThisMonth, tagsByType
- Daily scans chart data from ScanLog table
- Recent activities from scan logs + tags

### `/api/admin/tags/route.ts` — NEW
- GET: List tags with filters (type, status, agencyId, search, pagination)
- PATCH: Update tag (status, owner info, block/mark found)
- DELETE: Delete a tag

### `/api/admin/tags/generate/route.ts` — NEW
- POST: Generate tags (individual or batch mode)
- Individual: Creates 1 tag with owner info, custom data, expiration
- Batch: Creates N tags for an agency with bulk serial generation
- Uses generateSerialNumbersBulk from @/lib/qr

### `/api/admin/tags/export-zip/route.ts` — NEW
- POST: Export tags as manifest file (filter by references, agencyId, or setId)
- Generates QRTags-formatted manifest with tag details
- Max 5000 tags per export

### `/api/admin/agency-types/route.ts` — NEW
- GET: List all agency types (auto-seeds from AGENCY_TYPES if DB empty)
- PATCH: Update agency type (custom fields, active status, label, color)

### `/api/admin/subscriptions/route.ts` — NEW
- GET: List subscriptions with plan/status filters
- PATCH: Manage subscriptions (renew, upgrade, cancel)

### `/api/admin/payments/route.ts` — NEW
- GET: List payments with method/status filters + stats
- Stats: revenueThisMonth, pendingPayments, mobileMoneyTotal, cardTotal

## Design Decisions
- All pages use emerald (#10B981) as primary color, amber (#F59E0B) for highlights
- Consistent use of shadcn/ui components: Card, Table, Badge, Button, Select, Input, Dialog, Tabs
- All pages are 'use client' components
- Status badges use getTagStatusInfo from @/lib/qr for consistent colors
- Agency types use AGENCY_TYPES from @/lib/agency-types with dynamic icon rendering
- All API routes use requireAuthApi for authentication
- Auto-seeding of AgencyType table from static definitions

## Verification
- `bun run lint` passes with no errors
- Dev server compiles successfully (GET / 200)
