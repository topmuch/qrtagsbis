import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface BaggageWithAgency {
  id: string;
  reference: string;
  type: string;
  setId: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  flightNumber: string | null;
  destination: string | null;
  departureDate: Date | null;
  departureTime: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  lastScanDate: Date | null;
  lastLocation: string | null;
  declaredLostAt: Date | null;
  foundAt: Date | null;
  founderName: string | null;
  founderPhone: string | null;
  founderAt: Date | null;
  agencyId: string | null;
  agency: { name: string; email: string | null } | null;
}

interface TravelerBaggage {
  reference: string;
  type: string;
  baggageType: string;
  status: string;
  expiresAt: Date | null;
  flightNumber: string | null;
  destination: string | null;
  agencyName: string | null;
}

interface Traveler {
  name: string;
  whatsapp: string | null;
  email: string | null;
  registeredAt: Date;
  expirationDate: string | null;
  status: 'active' | 'expired' | 'pending';
  baggages: TravelerBaggage[];
  totalBaggages: number;
}

// Statuts considérés comme inactifs pour le module Marketing/CRM
const INACTIVE_STATUSES = ['lost', 'found', 'blocked'];

function isBaggageActive(baggage: BaggageWithAgency): boolean {
  // Les baggages perdus, trouvés ou bloqués ne sont pas actifs
  if (INACTIVE_STATUSES.includes(baggage.status)) return false;
  if (!baggage.expiresAt) return false;
  return new Date(baggage.expiresAt) > new Date();
}

function getTravelerKey(baggage: BaggageWithAgency): string {
  const first = (baggage.travelerFirstName || '').trim().toLowerCase();
  const last = (baggage.travelerLastName || '').trim().toLowerCase();
  const phone = (baggage.whatsappOwner || '').trim();
  return `${first}||${last}||${phone}`;
}

function travelerMatchesSearch(
  firstName: string | null,
  lastName: string | null,
  whatsapp: string | null,
  search: string
): boolean {
  const q = search.toLowerCase();
  const combined = `${firstName || ''} ${lastName || ''}`.toLowerCase();
  return (
    (firstName || '').toLowerCase().includes(q) ||
    (lastName || '').toLowerCase().includes(q) ||
    combined.includes(q) ||
    (whatsapp || '').includes(q)
  );
}

function groupBaggagesByTraveler(baggages: BaggageWithAgency[]): Traveler[] {
  const groups = new Map<string, BaggageWithAgency[]>();

  for (const baggage of baggages) {
    // Skip baggages with no traveler info
    if (!baggage.travelerFirstName && !baggage.travelerLastName && !baggage.whatsappOwner) {
      continue;
    }

    const key = getTravelerKey(baggage);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(baggage);
  }

  const travelers: Traveler[] = [];

  for (const [, groupBaggages] of groups) {
    const firstName = groupBaggages[0].travelerFirstName || '';
    const lastName = groupBaggages[0].travelerLastName || '';
    const whatsapp = groupBaggages[0].whatsappOwner || null;

    const name = `${firstName} ${lastName}`.trim();

    // Earliest createdAt
    const earliestCreated = new Date(
      Math.min(...groupBaggages.map((b) => new Date(b.createdAt).getTime()))
    );

    const baggagesWithExpiry = groupBaggages.filter((b) => b.expiresAt);

    // Status logic:
    // - 'active': at least one baggage is active (not lost/found/blocked AND expiresAt > now)
    // - 'expired': all baggages with expiresAt have expiresAt <= now (no active ones)
    // - 'pending': NO baggage has expiresAt at all (never activated)
    const activeBaggageList = groupBaggages.filter((b) => isBaggageActive(b));
    const anyActive = activeBaggageList.length > 0;
    const hasAnyExpiry = baggagesWithExpiry.length > 0;

    let travelerStatus: 'active' | 'expired' | 'pending';
    if (anyActive) {
      travelerStatus = 'active';
    } else if (hasAnyExpiry) {
      travelerStatus = 'expired';
    } else {
      travelerStatus = 'pending';
    }

    // Expiration date display: coherent with status
    let latestExpiry: Date | null = null;
    if (anyActive) {
      // If active: show the SOONEST expiry among active baggages (most relevant for renewal)
      latestExpiry = new Date(Math.min(...activeBaggageList.map((b) => new Date(b.expiresAt!).getTime())));
    } else if (hasAnyExpiry) {
      // If expired: show the LATEST expiry among all baggages (most recent expiration)
      latestExpiry = new Date(Math.max(...baggagesWithExpiry.map((b) => new Date(b.expiresAt!).getTime())));
    }

    // Build baggage summaries
    const baggageSummaries: TravelerBaggage[] = groupBaggages.map((b) => ({
      reference: b.reference,
      type: b.type,
      baggageType: b.baggageType,
      status: b.status,
      expiresAt: b.expiresAt,
      flightNumber: b.flightNumber,
      destination: b.destination,
      agencyName: b.agency?.name || null,
    }));

    travelers.push({
      name,
      whatsapp,
      email: null, // Pas de champ email sur le modèle Baggage
      registeredAt: earliestCreated,
      expirationDate: latestExpiry ? latestExpiry.toISOString() : null,
      status: travelerStatus,
      baggages: baggageSummaries,
      totalBaggages: baggageSummaries.length,
    });
  }

  return travelers;
}

// GET - Marketing/CRM data with traveler grouping and stats
// Access: SuperAdmin only
export async function GET(request: Request) {
  try {
    // ─── Auth check: SuperAdmin only ───
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé — Connexion requise' },
        { status: 401 }
      );
    }
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Accès interdit — Réservé au SuperAdmin' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const filter = searchParams.get('filter') || 'all'; // all | active | expired
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10) || 20));

    // Fetch all baggages with agency info
    const baggages = await db.baggage.findMany({
      include: {
        agency: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Step 1: Group by unique traveler
    const allTravelers = groupBaggagesByTraveler(baggages);

    // Step 2: Calculate stats across ALL travelers (before filtering)
    const totalUsers = allTravelers.length;
    const activeBaggages = baggages.filter((b) => isBaggageActive(b)).length;
    const expiredBaggages = baggages.length - activeBaggages;
    const activeTravelers = allTravelers.filter((t) => t.status === 'active').length;
    const renewalRate = totalUsers > 0
      ? Math.round((activeTravelers / totalUsers) * 100)
      : 0;

    const stats = {
      totalUsers,
      activeBaggages,
      expiredBaggages,
      renewalRate,
    };

    // Step 3: Apply filter
    let filteredTravelers = allTravelers;
    if (filter === 'active') {
      filteredTravelers = allTravelers.filter((t) => t.status === 'active');
    } else if (filter === 'expired') {
      filteredTravelers = allTravelers.filter((t) => t.status === 'expired');
    } else if (filter === 'pending') {
      filteredTravelers = allTravelers.filter((t) => t.status === 'pending');
    }

    // Step 4: Apply search
    if (search.trim()) {
      filteredTravelers = filteredTravelers.filter((t) => {
        // Check if any of the traveler's baggages match the search by reference
        const referenceMatch = t.baggages.some((b) =>
          b.reference.toLowerCase().includes(search.toLowerCase())
        );
        if (referenceMatch) return true;

        // Check traveler name and whatsapp
        return travelerMatchesSearch(
          t.name.split(' ')[0] || null,
          t.name.split(' ').slice(1).join(' ') || null,
          t.whatsapp,
          search.trim()
        );
      });
    }

    // Step 5: Pagination
    const total = filteredTravelers.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paginatedTravelers = filteredTravelers.slice(offset, offset + limit);

    return NextResponse.json({
      stats,
      travelers: paginatedTravelers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données marketing' },
      { status: 500 }
    );
  }
}
