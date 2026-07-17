/**
 * QRTags — Agency Type Definitions
 *
 * Central definitions for the 8 agency types supported by QRTags.
 * Each type has its own icon, color, and custom field schema for
 * collecting type-specific data when creating tags.
 *
 * Used by:
 *   - Agency registration / profile
 *   - Tag generation forms
 *   - Admin agency management
 *   - API validation
 */

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

/** Supported agency types */
export type AgencyType = 'hotel' | 'bus' | 'school' | 'clinic' | 'car_rental' | 'luggage_storage' | 'enterprise' | 'event';

/** All valid agency types */
export const AGENCY_TYPE_LIST: AgencyType[] = [
  'hotel', 'bus', 'school', 'clinic', 'car_rental', 'luggage_storage', 'enterprise', 'event'
];

/** Field definition for agency-type-specific forms */
export interface AgencyFieldDef {
  /** Field key in formData / DB column */
  name: string;
  /** Display label (French) */
  label: string;
  /** Input type */
  type: 'text' | 'tel' | 'email' | 'date' | 'time' | 'textarea';
  /** Whether the field is required */
  required: boolean;
}

/** Complete agency type definition */
export interface AgencyTypeDef {
  /** Display name (French) */
  name: string;
  /** Lucide icon name */
  icon: string;
  /** Brand color for the agency type */
  color: string;
  /** Custom fields for this agency type */
  fields: AgencyFieldDef[];
}

// ═══════════════════════════════════════════════════════
//  AGENCY TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════

export const AGENCY_TYPES: Record<AgencyType, AgencyTypeDef> = {
  hotel: {
    name: 'Hôtel',
    icon: 'Hotel',
    color: '#2563EB',
    fields: [
      { name: 'guest_name', label: 'Nom du client', type: 'text', required: true },
      { name: 'room_number', label: 'Numéro de chambre', type: 'text', required: true },
      { name: 'check_in_date', label: "Date d'arrivée", type: 'date', required: true },
      { name: 'check_out_date', label: 'Date de départ', type: 'date', required: true },
      { name: 'phone', label: 'Téléphone', type: 'tel', required: false },
      { name: 'email', label: 'Email', type: 'email', required: false },
      { name: 'reservation_id', label: 'N° réservation', type: 'text', required: false },
    ]
  },
  bus: {
    name: 'Compagnie de Bus',
    icon: 'Bus',
    color: '#7C3AED',
    fields: [
      { name: 'passenger_name', label: 'Nom passager', type: 'text', required: true },
      { name: 'ticket_id', label: 'N° ticket', type: 'text', required: true },
      { name: 'seat_number', label: 'N° siège', type: 'text', required: false },
      { name: 'departure_city', label: 'Ville départ', type: 'text', required: true },
      { name: 'arrival_city', label: 'Ville arrivée', type: 'text', required: true },
      { name: 'travel_date', label: 'Date voyage', type: 'date', required: true },
      { name: 'bus_number', label: 'N° bus', type: 'text', required: false },
      { name: 'phone', label: 'Téléphone', type: 'tel', required: false },
    ]
  },
  school: {
    name: 'École / Université',
    icon: 'GraduationCap',
    color: '#059669',
    fields: [
      { name: 'student_name', label: 'Nom élève', type: 'text', required: true },
      { name: 'student_id', label: 'Matricule', type: 'text', required: true },
      { name: 'class', label: 'Classe', type: 'text', required: true },
      { name: 'parent_name', label: 'Nom parent', type: 'text', required: false },
      { name: 'parent_phone', label: 'Tél parent', type: 'tel', required: false },
      { name: 'emergency_contact', label: 'Contact urgence', type: 'tel', required: false },
    ]
  },
  clinic: {
    name: 'Clinique / Hôpital',
    icon: 'Stethoscope',
    color: '#DC2626',
    fields: [
      { name: 'patient_name', label: 'Nom patient', type: 'text', required: true },
      { name: 'patient_id', label: 'N° patient', type: 'text', required: true },
      { name: 'room_number', label: 'N° chambre', type: 'text', required: false },
      { name: 'admission_date', label: 'Date admission', type: 'date', required: true },
      { name: 'doctor_name', label: 'Médecin', type: 'text', required: false },
      { name: 'emergency_contact', label: 'Contact urgence', type: 'tel', required: false },
    ]
  },
  car_rental: {
    name: 'Loueur de Voitures',
    icon: 'Car',
    color: '#D97706',
    fields: [
      { name: 'renter_name', label: 'Nom locataire', type: 'text', required: true },
      { name: 'renter_phone', label: 'Tél locataire', type: 'tel', required: true },
      { name: 'contract_number', label: 'N° contrat', type: 'text', required: true },
      { name: 'car_model', label: 'Modèle véhicule', type: 'text', required: true },
      { name: 'license_plate', label: 'Immatriculation', type: 'text', required: true },
      { name: 'rental_start', label: 'Début location', type: 'date', required: true },
      { name: 'rental_end', label: 'Fin location', type: 'date', required: true },
    ]
  },
  luggage_storage: {
    name: 'Consigne de Bagages',
    icon: 'Luggage',
    color: '#0891B2',
    fields: [
      { name: 'traveler_name', label: 'Nom voyageur', type: 'text', required: true },
      { name: 'traveler_phone', label: 'Téléphone', type: 'tel', required: true },
      { name: 'locker_number', label: 'N° casier', type: 'text', required: true },
      { name: 'bag_description', label: 'Description bagage', type: 'textarea', required: false },
      { name: 'deposit_time', label: 'Heure dépôt', type: 'time', required: true },
      { name: 'expected_pickup', label: 'Heure retrait', type: 'time', required: true },
    ]
  },
  enterprise: {
    name: 'Entreprise',
    icon: 'Building2',
    color: '#4F46E5',
    fields: [
      { name: 'employee_name', label: 'Nom employé', type: 'text', required: true },
      { name: 'employee_id', label: 'Matricule', type: 'text', required: true },
      { name: 'department', label: 'Département', type: 'text', required: true },
      { name: 'position', label: 'Poste', type: 'text', required: false },
      { name: 'manager_name', label: 'Responsable', type: 'text', required: false },
    ]
  },
  event: {
    name: 'Événementiel',
    icon: 'PartyPopper',
    color: '#E11D48',
    fields: [
      { name: 'participant_name', label: 'Nom participant', type: 'text', required: true },
      { name: 'ticket_id', label: 'N° ticket', type: 'text', required: true },
      { name: 'event_name', label: 'Nom événement', type: 'text', required: true },
      { name: 'event_date', label: 'Date événement', type: 'date', required: true },
      { name: 'badge_type', label: 'Type badge', type: 'text', required: false },
      { name: 'company', label: 'Entreprise', type: 'text', required: false },
      { name: 'phone', label: 'Téléphone', type: 'tel', required: false },
    ]
  }
};

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Returns a safe AgencyType, with fallback to 'hotel'.
 */
export function safeAgencyType(type: string | null | undefined): AgencyType {
  if (type && AGENCY_TYPE_LIST.includes(type as AgencyType)) {
    return type as AgencyType;
  }
  return 'hotel';
}

/**
 * Get the display name for an agency type.
 */
export function getAgencyTypeName(type: AgencyType): string {
  return AGENCY_TYPES[type]?.name ?? 'Inconnu';
}

/**
 * Get the icon name for an agency type.
 */
export function getAgencyTypeIcon(type: AgencyType): string {
  return AGENCY_TYPES[type]?.icon ?? 'Building2';
}

/**
 * Get the brand color for an agency type.
 */
export function getAgencyTypeColor(type: AgencyType): string {
  return AGENCY_TYPES[type]?.color ?? '#6B7280';
}

/**
 * Get the custom field definitions for an agency type.
 */
export function getAgencyTypeFields(type: AgencyType): AgencyFieldDef[] {
  return AGENCY_TYPES[type]?.fields ?? [];
}

/**
 * Get the field names (keys) for a given agency type.
 * Useful for Prisma SELECT optimizations.
 */
export function getAgencyTypeFieldNames(type: AgencyType): string[] {
  return AGENCY_TYPES[type]?.fields.map(f => f.name) ?? [];
}

/**
 * Validate a value as a valid AgencyType.
 */
export function isValidAgencyType(value: string): value is AgencyType {
  return AGENCY_TYPE_LIST.includes(value as AgencyType);
}
