// Permissions system for QRTags
// Role hierarchy: superadmin > admin > staff > agent > agency

export type Role = 'superadmin' | 'admin' | 'staff' | 'agent' | 'agency';

export const ROLES: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrateur',
  staff: 'Personnel',
  agent: 'Agent',
  agency: 'Agence'
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superadmin: 'Accès complet à toutes les fonctionnalités QRTags',
  admin: 'Gestion des tags, agences, utilisateurs et paramètres',
  staff: 'Opérations courantes sur les tags et messages',
  agent: 'Consultation et opérations limitées sur les tags',
  agency: 'Gestion de ses propres tags et profil agence'
};

export const ROLE_COLORS: Record<Role, string> = {
  superadmin: 'bg-purple-500',
  admin: 'bg-blue-500',
  staff: 'bg-amber-500',
  agent: 'bg-green-500',
  agency: 'bg-emerald-500'
};

// Permission definitions
export const PERMISSIONS = {
  // Full access
  ALL: '*',

  // Dashboard & Navigation
  VIEW_DASHBOARD: 'view_dashboard',

  // Tag management
  VIEW_TAGS: 'view_tags',
  MANAGE_TAGS: 'manage_tags',
  DELETE_TAGS: 'delete_tags',
  MARK_TAG_FOUND: 'mark_tag_found',
  GENERATE_QR: 'generate_qr',

  // Agency management
  VIEW_AGENCIES: 'view_agencies',
  MANAGE_AGENCIES: 'manage_agencies',
  DELETE_AGENCIES: 'delete_agencies',
  MANAGE_AGENCY_TYPES: 'manage_agency_types',

  // User management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  DELETE_USERS: 'delete_users',
  MANAGE_STAFF: 'manage_staff',

  // Subscription & Payments
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
  MANAGE_PAYMENTS: 'manage_payments',
  VIEW_WALLET: 'view_wallet',

  // Reports & Analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',

  // Messages & Support
  VIEW_MESSAGES: 'view_messages',
  RESPOND_MESSAGES: 'respond_messages',
  SEND_MESSAGES: 'send_messages',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_PAYPAL: 'manage_paypal',
  MANAGE_FEATURES: 'manage_features',
  MANAGE_WHITE_LABEL: 'manage_white_label',

  // CRM (Leads)
  VIEW_CRM: 'view_crm',
  MANAGE_CRM: 'manage_crm',

  // Notifications
  VIEW_NOTIFICATIONS: 'view_notifications',

  // Trouvailles (Found tags)
  VIEW_TROUVAILLES: 'view_trouvailles',

  // Monitoring
  VIEW_MONITORING: 'view_monitoring',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permissions (Option A: Static)
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    PERMISSIONS.ALL // Full access
  ],

  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TAGS,
    PERMISSIONS.MANAGE_TAGS,
    PERMISSIONS.DELETE_TAGS,
    PERMISSIONS.MARK_TAG_FOUND,
    PERMISSIONS.GENERATE_QR,
    PERMISSIONS.VIEW_AGENCIES,
    PERMISSIONS.MANAGE_AGENCIES,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.RESPOND_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_FEATURES,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.MANAGE_CRM,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_TROUVAILLES,
  ],

  staff: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TAGS,
    PERMISSIONS.MANAGE_TAGS,
    PERMISSIONS.MARK_TAG_FOUND,
    PERMISSIONS.GENERATE_QR,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.RESPOND_MESSAGES,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_TROUVAILLES,
  ],

  agent: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TAGS,
    PERMISSIONS.MARK_TAG_FOUND,
    PERMISSIONS.GENERATE_QR,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.RESPOND_MESSAGES,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_TROUVAILLES,
  ],

  agency: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TAGS,
    PERMISSIONS.MANAGE_TAGS, // Only own tags
    PERMISSIONS.GENERATE_QR,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.SEND_MESSAGES, // To superadmin
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_WALLET,
    PERMISSIONS.MANAGE_WHITE_LABEL,
    PERMISSIONS.MANAGE_STAFF,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: string, permission: Permission): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as Role];
  if (!rolePerms) return false;

  // superadmin has all permissions
  if (rolePerms.includes(PERMISSIONS.ALL)) return true;

  return rolePerms.includes(permission);
}

// Check if a role has ANY of the specified permissions
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(perm => hasPermission(role, perm));
}

// Check if a role has ALL of the specified permissions
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(perm => hasPermission(role, perm));
}

// Get all permissions for a role
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] || [];
}

// Check if user can access a specific route
export function canAccessRoute(role: string, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/admin': [PERMISSIONS.VIEW_DASHBOARD],
    '/admin/etiquettes': [PERMISSIONS.VIEW_TAGS],
    '/admin/agences': [PERMISSIONS.VIEW_AGENCIES],
    '/admin/utilisateurs': [PERMISSIONS.VIEW_USERS],
    '/admin/rapports': [PERMISSIONS.VIEW_REPORTS],
    '/admin/messages': [PERMISSIONS.VIEW_MESSAGES],
    '/admin/trouvailles': [PERMISSIONS.VIEW_TROUVAILLES],
    '/admin/crm': [PERMISSIONS.VIEW_CRM],
    '/admin/monitoring': [PERMISSIONS.VIEW_MONITORING],
    '/admin/parametres': [PERMISSIONS.VIEW_SETTINGS],
    '/admin/parametres/fonctionnalites': [PERMISSIONS.MANAGE_FEATURES],
    '/admin/parametres/paypal': [PERMISSIONS.MANAGE_PAYPAL],
  };

  const requiredPerms = routePermissions[route];
  if (!requiredPerms) return true; // No restriction if not defined

  return hasAnyPermission(role, requiredPerms);
}

// Get navigation items based on role
export function getNavigationItems(role: string) {
  const items = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: 'LayoutDashboard',
      permission: PERMISSIONS.VIEW_DASHBOARD,
    },
    {
      label: 'Étiquettes QR',
      href: '/admin/etiquettes',
      icon: 'QrCode',
      permission: PERMISSIONS.VIEW_TAGS,
    },
    {
      label: 'Agences',
      href: '/admin/agences',
      icon: 'Building2',
      permission: PERMISSIONS.VIEW_AGENCIES,
    },
    {
      label: 'Utilisateurs',
      href: '/admin/utilisateurs',
      icon: 'Users',
      permission: PERMISSIONS.VIEW_USERS,
    },
    {
      label: 'Messages',
      href: '/admin/messages',
      icon: 'MessageSquare',
      permission: PERMISSIONS.VIEW_MESSAGES,
    },
    {
      label: 'Trouvailles',
      href: '/admin/trouvailles',
      icon: 'Search',
      permission: PERMISSIONS.VIEW_TROUVAILLES,
    },
    {
      label: 'CRM',
      href: '/admin/crm',
      icon: 'UserPlus',
      permission: PERMISSIONS.VIEW_CRM,
    },
    {
      label: 'Rapports',
      href: '/admin/rapports',
      icon: 'BarChart3',
      permission: PERMISSIONS.VIEW_REPORTS,
    },
    {
      label: 'Paramètres',
      href: '/admin/parametres',
      icon: 'Settings',
      permission: PERMISSIONS.VIEW_SETTINGS,
    },
  ];

  return items.filter(item => hasPermission(role, item.permission));
}
