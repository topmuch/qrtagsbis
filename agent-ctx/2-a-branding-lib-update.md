# Task 2-a: QRTags Branding & Library Files Update

**Agent**: Task 2-a Agent
**Date**: 2024-01-03
**Status**: COMPLETED

## Summary
Updated all branding and library files from QRBag → QRTags as specified in the task requirements. The project is a SaaS B2B platform for lost & found objects via QR codes, targeting African businesses.

## Files Updated

### 1. `/src/lib/brand.ts`
- Changed BRAND from `#0047d6` (blue) to `#10B981` (emerald green - African/money/trust feel)
- Changed ACCENT from `#fcd616` (yellow) to `#F59E0B` (amber - warm African feel)
- Kept INK as `#1a1a1a`
- Updated BRAND_COLORS: `BLUE→EMERALD`, `YELLOW→AMBER`
- Updated all QRBag references to QRTags in comments

### 2. `/src/lib/config.ts`
- Changed `baggage_scan_alert` → `tag_scan_alert` (WAKIT template)
- No direct qrbag references found in this file (already clean)

### 3. `/src/lib/session.ts`
- Changed `qrbag_session` → `qrtags_session` cookie name

### 4. `/src/lib/permissions.ts`
- Added `staff` role with limited permissions (view dashboard, tags, messages, reports, trouvailles)
- Added new permissions: `MANAGE_AGENCY_TYPES`, `MANAGE_SUBSCRIPTIONS`, `MANAGE_PAYMENTS`, `VIEW_WALLET`, `MANAGE_STAFF`, `MANAGE_WHITE_LABEL`
- Changed all `BAGGAGE` permission names to `TAG` equivalents (`VIEW_BAGGAGES→VIEW_TAGS`, etc.)
- Added `ROLE_DESCRIPTIONS` constant
- Updated `ROLE_COLORS` with new staff color (amber)
- Updated role hierarchy: superadmin > admin > staff > agent > agency

### 5. `/src/lib/qr.ts`
- Complete rewrite from baggage reference system to tag serial number system
- New serial number format: `TAG-{TYPE}-{6CHARS}` (e.g., TAG-HOTEL-MLQGY7, TAG-BUS-K9X2P4)
- 8 agency type prefixes: HOTEL, BUS, SCHOOL, CLINIC, CAR, LOCKER, CORP, EVENT
- `generateReference(type)` → `generateSerialNumber(agencyType)`
- `generateReferencesBulk(type, count)` → `generateSerialNumbersBulk(agencyType, count)`
- `generateSetId(type)` → `generateSetId(agencyType)`
- `generateBaggages(options)` → `generateTags(options)`
- `calculateExpirationDate(type, subtype)` → `calculateExpirationDate(agencyType, tagType)` with starter: 30d, pro: 365d, enterprise: no expiry
- `isValidReferenceFormat(reference)` → `isValidSerialNumberFormat(serial)`
- `getBaggageStatusInfo(status)` → `getTagStatusInfo(status)` with new statuses: created, activated, scanned, lost, found, blocked, expired
- Added `AgencyType` and `TagType` type exports

### 6. `/src/lib/status.ts`
- Changed `BaggageStatus` → `TagStatus` (with `BaggageStatus` as deprecated alias)
- Added `normalizeTagStatus()` as primary function (with `normalizeStatus` and `normalizeBaggageStatus` as deprecated aliases)
- Updated status values: `pending_activation→created`, `active→activated`, plus new `expired` status
- Added `isCreated()` function
- Added legacy QRBag status mapping (pending_activation→created, active→activated)
- Added French aliases for all new statuses

### 7. `/src/lib/i18n.ts`
- Changed `qrbag_locale` → `qrtags_locale` cookie name
- Updated cookie matching regex from `qrbag_locale` to `qrtags_locale`
- Updated JSDoc comment reference

### 8. `/src/lib/agency-types.ts` (NEW - replaces transport.ts)
- Complete new file with 8 agency type definitions
- Each type has: name (French), Lucide icon name, brand color, custom field schema
- Types: hotel, bus, school, clinic, car_rental, luggage_storage, enterprise, event
- Helper functions: `safeAgencyType()`, `getAgencyTypeName()`, `getAgencyTypeIcon()`, `getAgencyTypeColor()`, `getAgencyTypeFields()`, `getAgencyTypeFieldNames()`, `isValidAgencyType()`
- Full TypeScript types: `AgencyType`, `AgencyFieldDef`, `AgencyTypeDef`

### 9. `/src/lib/email.ts`
- Changed all `QRBag` → `QRTags` (all email templates, from names, signatures)
- Changed `noreply@qrbag.com` → `noreply@qrtags.com`
- Changed `qrbags.com` → `qrtags.com` in all URLs
- Changed email header color from `#2563EB` to `#10B981` (emerald)
- Changed footer tagline to "QRTags — Plateforme objets perdus & trouvés"
- Changed emoji from 🎒 to 🏷️ in inventory attestation

### 10. `/.env`
- Changed `qrbag.db` → `qrtags.db`
- Changed `NEXTAUTH_SECRET` from qrbag prefix to qrtags prefix
- Changed `ENCRYPTION_KEY` from qrbag prefix to qrtags prefix
- Changed `WAKIT_TEMPLATE_SCAN_ALERT` from `baggage_scan_alert` to `tag_scan_alert`

### 11. `/src/app/layout.tsx`
- Updated all metadata: title, description, keywords, authors, publisher, URLs
- Changed "Protection intelligente des bagages" → "Plateforme objets perdus & trouvés via QR"
- Updated keywords to include: hôtel, bus, école, clinique, Afrique, SaaS
- Changed all `qrbag.com` → `qrtags.com` references
- Updated PWA meta tags: apple-mobile-web-app-title, application-name
- Changed OpenGraph and Twitter card descriptions

### 12. `/public/manifest.json`
- Changed name, short_name, description to QRTags branding
- Updated theme_color from `#c5a643` to `#10B981` (emerald green)
- Changed categories from `["travel", "utilities"]` to `["business", "utilities"]`
- Updated shortcuts: replaced Hajj/Voyageur shortcuts with Tags/Trouvailles
- Updated screenshot labels

### 13. Additional files updated (bonus - found during grep)
- `/src/lib/groq.ts`: All QRBag→QRTags in prompts and messages
- `/src/lib/logger.ts`: QRBag→QRTags in comment
- `/src/lib/ai-services.ts`: QRBag→QRTags in comment
- `/src/lib/auth.ts`: `qrbag-secret-key` → `qrtags-secret-key`
- `/src/lib/checklist.ts`: All QRBag→QRTags, qrbags.com→qrtags.com
- `/src/lib/whatsapp-message.ts`: All QRBag→QRTags, qrbags.com→qrtags.com

### 14. Files checked with no changes needed
- `/src/middleware.ts` - No QRBag references
- `/src/lib/db.ts` - No QRBag references
- `/src/lib/prisma.ts` - No QRBag references

## Notes
- `transport.ts` was kept in place (not deleted) since other components still import from it; the new `agency-types.ts` file is a separate module
- Legacy status mappings in `status.ts` ensure backward compatibility with existing DB records
- Deprecated aliases (`BaggageStatus`, `normalizeBaggageStatus`, `normalizeStatus`) provide backward compatibility for existing code
- The `db` and `prisma` files will auto-update when the Prisma schema is pushed by Task 2-b
