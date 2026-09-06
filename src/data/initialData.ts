export interface TableField {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  isNullable?: boolean;
  defaultVal?: string;
  description: string;
}

export interface TableSchema {
  name: string;
  category: 'core' | 'catalog' | 'orders' | 'fulfillment' | 'finance';
  rlsActive: boolean;
  ruleTag?: string;
  description: string;
  fields: TableField[];
  policies: {
    role: string;
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    rule: string;
  }[];
}

export interface VendorSeed {
  id: string;
  name: string;
  slug: string;
  townshipSection: string;
  category: string;
  estimatedPrepMinutes: number;
  isActive: boolean;
  isAcceptingOrders: boolean;
  itemCount: number;
  popularItem: string;
  avgPriceZAR: number;
}

export interface DriverSeed {
  id: string;
  name: string;
  callsign: string;
  vehicleType: 'bicycle' | 'motorbike';
  registration: string;
  status: 'online' | 'busy' | 'offline';
  assignedOrders: number;
  completedToday: number;
  phone: string;
}

export const TABLES_SCHEMA: TableSchema[] = [
  {
    name: 'public.profiles',
    category: 'core',
    rlsActive: true,
    ruleTag: 'ROLE_BASED_RLS',
    description: 'User accounts linked to auth.users with typed user_role and contact number.',
    fields: [
      { name: 'id', type: 'UUID', isPrimary: true, references: 'auth.users.id', description: 'Primary key tied to Supabase Auth UID' },
      { name: 'role', type: 'user_role', isNullable: false, defaultVal: "'customer'", description: 'Enum: customer, vendor, driver, admin' },
      { name: 'full_name', type: 'TEXT', isNullable: false, description: 'Display name' },
      { name: 'phone_number', type: 'TEXT', isNullable: false, description: 'South African mobile (e.g., +27 82 123 4567)' },
      { name: 'is_active', type: 'BOOLEAN', isNullable: false, defaultVal: 'true', description: 'Operational account flag' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, defaultVal: 'now()', description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, defaultVal: 'now()', description: 'Last mutation timestamp' }
    ],
    policies: [
      { role: 'customer', action: 'SELECT', rule: 'auth.uid() = id' },
      { role: 'customer', action: 'UPDATE', rule: 'auth.uid() = id' },
      { role: 'admin', action: 'ALL', rule: 'EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = "admin")' }
    ]
  },
  {
    name: 'public.addresses',
    category: 'core',
    rlsActive: true,
    ruleTag: 'LANDMARK_MANDATORY',
    description: 'Delivery addresses with Soshanguve township block and mandatory landmark description.',
    fields: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultVal: 'gen_random_uuid()', description: 'Unique address ID' },
      { name: 'user_id', type: 'UUID', isForeign: true, references: 'public.profiles.id', description: 'Address owner' },
      { name: 'label', type: 'TEXT', isNullable: false, description: 'Address nickname (Home, Work, Relative)' },
      { name: 'township_section', type: 'TEXT', isNullable: false, description: 'Township block (e.g., Block L, Block TT)' },
      { name: 'street_address', type: 'TEXT', isNullable: false, description: 'Street name or stand number' },
      { name: 'landmark_description', type: 'TEXT', isNullable: false, description: 'Critical township navigation reference point' },
      { name: 'contact_phone', type: 'TEXT', isNullable: false, description: 'Active phone on-site for delivery rider' },
      { name: 'is_default', type: 'BOOLEAN', isNullable: false, defaultVal: 'false', description: 'Default address indicator' }
    ],
    policies: [
      { role: 'customer', action: 'ALL', rule: 'auth.uid() = user_id' },
      { role: 'driver', action: 'SELECT', rule: 'EXISTS (SELECT 1 FROM orders WHERE delivery_address_id = addresses.id AND assigned_driver = auth.uid())' }
    ]
  },
  {
    name: 'public.vendors',
    category: 'catalog',
    rlsActive: true,
    ruleTag: 'PUBLIC_READ',
    description: 'Storefront business entities operating in Soshanguve with prep metrics.',
    fields: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultVal: 'gen_random_uuid()', description: 'Unique vendor ID' },
      { name: 'name', type: 'TEXT', isNullable: false, description: 'Business trading name' },
      { name: 'slug', type: 'TEXT', isNullable: false, description: 'URL-safe unique identifier' },
      { name: 'township_section', type: 'TEXT', isNullable: false, description: 'Operating sector (e.g., Falala Plaza, Block BB)' },
      { name: 'phone_number', type: 'TEXT', isNullable: false, description: 'Direct contact phone' },
      { name: 'is_active', type: 'BOOLEAN', defaultVal: 'true', description: 'TMD platform listing approval' },
      { name: 'is_accepting_orders', type: 'BOOLEAN', defaultVal: 'true', description: 'Live availability toggle' },
      { name: 'estimated_prep_minutes', type: 'INTEGER', defaultVal: '25', description: 'Average order preparation turnaround' }
    ],
    policies: [
      { role: 'public', action: 'SELECT', rule: 'is_active = true' },
      { role: 'vendor', action: 'UPDATE', rule: 'EXISTS (SELECT 1 FROM vendor_members WHERE vendor_id = vendors.id AND user_id = auth.uid())' }
    ]
  },
  {
    name: 'public.menu_items',
    category: 'catalog',
    rlsActive: true,
    ruleTag: 'INTEGER_CENTS',
    description: 'Product items priced strictly in integer ZAR cents with instantaneous in-stock toggles.',
    fields: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultVal: 'gen_random_uuid()', description: 'Menu item ID' },
      { name: 'vendor_id', type: 'UUID', isForeign: true, references: 'public.vendors.id', description: 'Owning vendor' },
      { name: 'category_id', type: 'UUID', isForeign: true, references: 'public.menu_categories.id', description: 'Menu section' },
      { name: 'name', type: 'TEXT', isNullable: false, description: 'Item name (e.g., Kota Special, 2-Piece Chicken)' },
      { name: 'price_cents', type: 'INTEGER', isNullable: false, description: 'Price in South African cents (R45.00 = 4500)' },
      { name: 'is_available', type: 'BOOLEAN', defaultVal: 'true', description: 'Immediate 86/stockout toggle' }
    ],
    policies: [
      { role: 'public', action: 'SELECT', rule: 'is_available = true' },
      { role: 'vendor', action: 'ALL', rule: 'EXISTS (SELECT 1 FROM vendor_members WHERE vendor_id = menu_items.vendor_id AND user_id = auth.uid())' }
    ]
  },
  {
    name: 'public.orders',
    category: 'orders',
    rlsActive: true,
    ruleTag: 'ONE_VENDOR_RULE',
    description: 'Transactional orders strictly enforcing single-vendor fulfillment and state machine.',
    fields: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultVal: 'gen_random_uuid()', description: 'Internal order UUID' },
      { name: 'order_number', type: 'TEXT', isNullable: false, description: 'Human-readable ticket (e.g. TMD-260905-001)' },
      { name: 'customer_id', type: 'UUID', isForeign: true, references: 'public.profiles.id', description: 'Ordering customer' },
      { name: 'vendor_id', type: 'UUID', isForeign: true, references: 'public.vendors.id', description: 'Fulfilling vendor' },
      { name: 'status', type: 'order_status', defaultVal: "'pending'", description: 'pending, accepted, preparing, ready_for_pickup, out_for_delivery, delivered, rejected, cancelled' },
      { name: 'subtotal_cents', type: 'INTEGER', isNullable: false, description: 'Items total in ZAR cents' },
      { name: 'delivery_fee_cents', type: 'INTEGER', isNullable: false, description: 'Delivery fee in ZAR cents' },
      { name: 'total_cents', type: 'INTEGER', isNullable: false, description: 'Total payable in ZAR cents' },
      { name: 'payment_method', type: 'payment_method', isNullable: false, description: 'cash, eft_pfts, online' },
      { name: 'payment_status', type: 'payment_status', defaultVal: "'pending'", description: 'pending, paid, failed, refunded' }
    ],
    policies: [
      { role: 'customer', action: 'SELECT', rule: 'auth.uid() = customer_id' },
      { role: 'vendor', action: 'SELECT', rule: 'EXISTS (SELECT 1 FROM vendor_members WHERE vendor_id = orders.vendor_id AND user_id = auth.uid())' },
      { role: 'driver', action: 'SELECT', rule: 'EXISTS (SELECT 1 FROM deliveries WHERE order_id = orders.id AND driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))' },
      { role: 'admin', action: 'ALL', rule: 'true' }
    ]
  },
  {
    name: 'public.deliveries',
    category: 'fulfillment',
    rlsActive: true,
    ruleTag: 'DRIVER_ASSIGNMENT',
    description: 'Fulfillment and delivery dispatch records tracking driver handoff and cash collection.',
    fields: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultVal: 'gen_random_uuid()', description: 'Delivery record ID' },
      { name: 'order_id', type: 'UUID', isForeign: true, references: 'public.orders.id', description: 'Order reference' },
      { name: 'driver_id', type: 'UUID', isForeign: true, references: 'public.drivers.id', description: 'Assigned 2-bike driver' },
      { name: 'status', type: 'delivery_status', defaultVal: "'assigned'", description: 'assigned, picked_up, delivered, failed' },
      { name: 'cash_collected_cents', type: 'INTEGER', defaultVal: '0', description: 'Physical cash received on drop-off' },
      { name: 'assigned_at', type: 'TIMESTAMPTZ', defaultVal: 'now()', description: 'Dispatch timestamp' }
    ],
    policies: [
      { role: 'driver', action: 'ALL', rule: 'driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())' },
      { role: 'admin', action: 'ALL', rule: 'true' }
    ]
  }
];

export const INITIAL_VENDORS: VendorSeed[] = [
  {
    id: 'v-01',
    name: "Soshanguve Crossing Kota King",
    slug: 'crossing-kota-king',
    townshipSection: 'Block L / Crossing',
    category: 'Township Fast Food',
    estimatedPrepMinutes: 20,
    isActive: true,
    isAcceptingOrders: true,
    itemCount: 18,
    popularItem: 'Quarter Russian & Cheese Kota',
    avgPriceZAR: 45
  },
  {
    id: 'v-02',
    name: "Mmamane's Braai & Shisanyama",
    slug: 'mmamanes-braai',
    townshipSection: 'Block F',
    category: 'Shisanyama / Grill',
    estimatedPrepMinutes: 30,
    isActive: true,
    isAcceptingOrders: true,
    itemCount: 12,
    popularItem: 'Full Braai Platter with Chakalaka',
    avgPriceZAR: 120
  },
  {
    id: 'v-03',
    name: "Falala Plaza Bakery & Cafe",
    slug: 'falala-bakery',
    townshipSection: 'Block K / Falala',
    category: 'Bakery & Breakfast',
    estimatedPrepMinutes: 15,
    isActive: true,
    isAcceptingOrders: true,
    itemCount: 24,
    popularItem: 'Fresh Fatcakes & Polony',
    avgPriceZAR: 25
  },
  {
    id: 'v-04',
    name: "Corner Spaza Daily Mart",
    slug: 'corner-spaza',
    townshipSection: 'Block TT',
    category: 'Spaza Essentials',
    estimatedPrepMinutes: 10,
    isActive: true,
    isAcceptingOrders: true,
    itemCount: 45,
    popularItem: 'Cold 2L Milk, Bread & Snacks',
    avgPriceZAR: 38
  },
  {
    id: 'v-05',
    name: "TUT South Campus Takeaway",
    slug: 'tut-south-takeaway',
    townshipSection: 'TUT Campus Gate 2',
    category: 'Student Meals',
    estimatedPrepMinutes: 15,
    isActive: true,
    isAcceptingOrders: false,
    itemCount: 14,
    popularItem: 'Chip Roll with Vinaigrette',
    avgPriceZAR: 30
  }
];

export const INITIAL_DRIVERS: DriverSeed[] = [
  {
    id: 'drv-01',
    name: 'Kabelo (Founder / Driver 1)',
    callsign: 'TMD-BIKE-ALPHA',
    vehicleType: 'motorbike',
    registration: 'GP 448 NM',
    status: 'online',
    assignedOrders: 1,
    completedToday: 8,
    phone: '+27 82 555 0192'
  },
  {
    id: 'drv-02',
    name: 'Sipho (Driver 2)',
    callsign: 'TMD-BIKE-BRAVO',
    vehicleType: 'motorbike',
    registration: 'GP 781 XT',
    status: 'online',
    assignedOrders: 0,
    completedToday: 6,
    phone: '+27 71 555 0834'
  }
];

export const ROADMAP_STEPS = [
  {
    step: '01',
    title: 'Supabase Schema Config',
    desc: 'Establish profiles, vendors, and RLS policies in PostgreSQL.',
    status: 'Ready',
    active: true
  },
  {
    step: '02',
    title: 'Core Auth Service',
    desc: 'Multi-role authentication flow (Customer, Vendor, Driver, Admin).',
    status: 'Upcoming',
    active: false
  },
  {
    step: '03',
    title: 'Vendor Portal MVP',
    desc: 'Menu management and order acceptance logic for township shops.',
    status: 'Planned',
    active: false
  },
  {
    step: '04',
    title: 'Customer Marketplace',
    desc: 'Discovery, landmark address entry, and single-vendor checkout.',
    status: 'Planned',
    active: false
  },
  {
    step: '05',
    title: 'Driver & Delivery Dispatch',
    desc: '2-bike fleet live tickets, WhatsApp deep-link, and cash collection.',
    status: 'Planned',
    active: false
  },
  {
    step: '06',
    title: 'Admin Operations Dashboard',
    desc: 'Dispatcher command center, manual EFT payment verification tool.',
    status: 'Planned',
    active: false
  }
];
