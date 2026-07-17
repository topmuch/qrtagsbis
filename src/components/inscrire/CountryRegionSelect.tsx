'use client';

/**
 * CountryRegionSelect
 * Sélecteur de pays groupé par région/continent.
 * Composant contrôlé (value + onChange).
 *
 * Design : fond blanc, texte noir, bordure noire — pensé pour s'intégrer
 * sur un conteneur jaune moutarde (#c5a643) avec bordures pointillées noires.
 */

export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2 (FR, SN, JP...)
  name: string;
}

export const COUNTRY_REGIONS: { region: string; countries: CountryOption[] }[] = [
  {
    region: 'Afrique',
    countries: [
      { code: 'SN', name: 'Sénégal' },
      { code: 'MA', name: 'Maroc' },
      { code: 'DZ', name: 'Algérie' },
      { code: 'TN', name: 'Tunisie' },
      { code: 'CI', name: "Côte d'Ivoire" },
      { code: 'ML', name: 'Mali' },
      { code: 'BF', name: 'Burkina Faso' },
      { code: 'GN', name: 'Guinée' },
      { code: 'BJ', name: 'Bénin' },
      { code: 'TG', name: 'Togo' },
      { code: 'CM', name: 'Cameroun' },
      { code: 'CG', name: 'Congo' },
      { code: 'CD', name: 'Congo (RDC)' },
      { code: 'GA', name: 'Gabon' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'GH', name: 'Ghana' },
      { code: 'EG', name: 'Égypte' },
      { code: 'ET', name: 'Éthiopie' },
      { code: 'KE', name: 'Kenya' },
      { code: 'TZ', name: 'Tanzanie' },
      { code: 'UG', name: 'Ouganda' },
      { code: 'RW', name: 'Rwanda' },
      { code: 'ZA', name: 'Afrique du Sud' },
      { code: 'MG', name: 'Madagascar' },
      { code: 'MU', name: 'Maurice' },
      { code: 'Other-AF', name: 'Autre (Afrique)' },
    ],
  },
  {
    region: 'Europe',
    countries: [
      { code: 'FR', name: 'France' },
      { code: 'BE', name: 'Belgique' },
      { code: 'CH', name: 'Suisse' },
      { code: 'LU', name: 'Luxembourg' },
      { code: 'MC', name: 'Monaco' },
      { code: 'ES', name: 'Espagne' },
      { code: 'PT', name: 'Portugal' },
      { code: 'IT', name: 'Italie' },
      { code: 'DE', name: 'Allemagne' },
      { code: 'AT', name: 'Autriche' },
      { code: 'NL', name: 'Pays-Bas' },
      { code: 'GB', name: 'Royaume-Uni' },
      { code: 'IE', name: 'Irlande' },
      { code: 'SE', name: 'Suède' },
      { code: 'NO', name: 'Norvège' },
      { code: 'DK', name: 'Danemark' },
      { code: 'FI', name: 'Finlande' },
      { code: 'PL', name: 'Pologne' },
      { code: 'CZ', name: 'Tchéquie' },
      { code: 'GR', name: 'Grèce' },
      { code: 'TR', name: 'Turquie' },
      { code: 'RU', name: 'Russie' },
      { code: 'UA', name: 'Ukraine' },
      { code: 'Other-EU', name: 'Autre (Europe)' },
    ],
  },
  {
    region: 'Asie',
    countries: [
      { code: 'JP', name: 'Japon' },
      { code: 'CN', name: 'Chine' },
      { code: 'KR', name: 'Corée du Sud' },
      { code: 'IN', name: 'Inde' },
      { code: 'PK', name: 'Pakistan' },
      { code: 'BD', name: 'Bangladesh' },
      { code: 'TH', name: 'Thaïlande' },
      { code: 'VN', name: 'Vietnam' },
      { code: 'KH', name: 'Cambodge' },
      { code: 'LA', name: 'Laos' },
      { code: 'MY', name: 'Malaisie' },
      { code: 'SG', name: 'Singapour' },
      { code: 'ID', name: 'Indonésie' },
      { code: 'PH', name: 'Philippines' },
      { code: 'SA', name: 'Arabie Saoudite' },
      { code: 'AE', name: 'Émirats Arabes Unis' },
      { code: 'QA', name: 'Qatar' },
      { code: 'IR', name: 'Iran' },
      { code: 'IQ', name: 'Irak' },
      { code: 'IL', name: 'Israël' },
      { code: 'Other-AS', name: 'Autre (Asie)' },
    ],
  },
  {
    region: 'Amériques',
    countries: [
      { code: 'US', name: 'États-Unis' },
      { code: 'CA', name: 'Canada' },
      { code: 'MX', name: 'Mexique' },
      { code: 'BR', name: 'Brésil' },
      { code: 'AR', name: 'Argentine' },
      { code: 'CL', name: 'Chili' },
      { code: 'CO', name: 'Colombie' },
      { code: 'PE', name: 'Pérou' },
      { code: 'VE', name: 'Venezuela' },
      { code: 'EC', name: 'Équateur' },
      { code: 'BO', name: 'Bolivie' },
      { code: 'PY', name: 'Paraguay' },
      { code: 'UY', name: 'Uruguay' },
      { code: 'CU', name: 'Cuba' },
      { code: 'DO', name: 'République Dominicaine' },
      { code: 'HT', name: 'Haïti' },
      { code: 'JM', name: 'Jamaïque' },
      { code: 'PA', name: 'Panama' },
      { code: 'CR', name: 'Costa Rica' },
      { code: 'Other-AM', name: 'Autre (Amériques)' },
    ],
  },
  {
    region: 'Océanie',
    countries: [
      { code: 'AU', name: 'Australie' },
      { code: 'NZ', name: 'Nouvelle-Zélande' },
      { code: 'FJ', name: 'Fidji' },
      { code: 'PG', name: 'Papouasie-Nouvelle-Guinée' },
      { code: 'Other-OC', name: 'Autre (Océanie)' },
    ],
  },
];

interface CountryRegionSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
}

export default function CountryRegionSelect({
  value,
  onChange,
  placeholder = 'Sélectionnez votre destination',
  required = false,
  id,
  'aria-label': ariaLabel,
}: CountryRegionSelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel || 'Destination'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px] appearance-none cursor-pointer"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '36px',
      }}
    >
      <option value="" disabled={required}>
        {placeholder}
      </option>
      {COUNTRY_REGIONS.map((region) => (
        <optgroup key={region.region} label={region.region}>
          {region.countries.map((country) => (
            <option key={`${region.region}-${country.code}`} value={country.name}>
              {country.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
