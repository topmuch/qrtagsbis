# Task 4: Agency Dashboard Transformation (QRBag → QRTags)
**Agent**: Main Agent  
**Date**: 2024-01-03  
**Status**: COMPLETED

## Summary
Transformed the entire Agency dashboard from QRBag (baggage tracking) to QRTags (lost & found objects SaaS platform). Updated 8 existing pages and created 2 new pages plus 3 new API routes.

## Files Modified
- `src/app/agence/layout.tsx` — Sidebar emerald, new menu items, QRTags branding
- `src/app/agence/tableau-de-bord/page.tsx` — Complete rewrite with tag-centric dashboard
- `src/app/agence/baggages/page.tsx` — Rewritten as "Mes Tags" with tag status system
- `src/app/agence/perdus/page.tsx` — Rewritten as "Objets Perdus"
- `src/app/agence/trouvailles/page.tsx` — Rewritten as "Objets Trouvés"
- `src/app/agence/profil/page.tsx` — Added White-label, Agency type, Subscription sections
- `src/app/agence/assistance/page.tsx` — QRTags branding, emerald colors
- `src/app/agence/rapports/page.tsx` — Tag stats, scans by location, recovery rate

## New Files Created
- `src/app/agence/activations/page.tsx` — 3-step tag activation form with dynamic AGENCY_TYPES fields
- `src/app/agence/portefeuille/page.tsx` — Wallet + subscription management with Mobile Money
- `src/app/api/agency/tags/route.ts` — GET/POST/PATCH for tag management
- `src/app/api/agency/wallet/route.ts` — GET/POST for wallet + recharge
- `src/app/api/agency/activations/route.ts` — POST/GET for tag activation

## Key Design Decisions
- Used emerald (#10B981) as primary color throughout all pages
- Used amber (#F59E0B) for highlights, step markers, plan badges
- Import brand constants from @/lib/brand (BRAND, ACCENT, INK)
- AGENCY_TYPES from @/lib/agency-types powers dynamic form fields on Activations page
- getTagStatusInfo from @/lib/qr used for consistent status badges
- API routes have fallback to Baggage model for backward compatibility
- All pages are 'use client' components with responsive layouts

## Verification
- `bun run lint` passes with no errors
- Dev server compiles successfully
