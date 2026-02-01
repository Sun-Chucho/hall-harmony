export interface RateTier {
  label: string;
  price: number;
}

export interface HallCatalogEntry {
  id: string;
  name: string;
  alias: string;
  description: string;
  capacity: string;
  rates: RateTier[];
}

export interface PackageFeature {
  title: string;
  highlights: string[];
  price: number;
}

export interface ConferencePackage {
  attendees: string;
  pricePoint: string;
  amenities: string[];
}

export const hallCatalog: HallCatalogEntry[] = [
  {
    id: 'witness',
    name: 'Witness Hall',
    alias: 'Hall A',
    description: 'Grand ballroom for 500–700 guests with a lush foyer, chandeliers, and a premium sound system.',
    capacity: '500 - 700 guests',
    rates: [
      { label: 'Jumamosi', price: 3835000 },
      { label: 'Jumatatu & Jumanne', price: 1534000 },
      { label: 'Jumatano, Alhamisi, Ijumaa & Jumapili', price: 2301000 },
    ],
  },
  {
    id: 'kilimanjaro',
    name: 'Kilimanjaro Hall & Gardens',
    alias: 'Hall B + Garden',
    description: 'Hall for 200–300 guests plus an adjacent garden that hosts 300–400 people for ceremonies and cocktails.',
    capacity: 'Hall 200 - 300 • Garden 300 - 400',
    rates: [
      { label: 'Jumamosi', price: 2301000 },
      { label: 'Jumatatu & Jumanne', price: 1227000 },
      { label: 'Jumatano, Alhamisi, Ijumaa & Jumapili', price: 1534000 },
    ],
  },
  {
    id: 'hall-d',
    name: 'Hall D',
    alias: 'Intimate Events',
    description: 'Boutique space suited for 30–60 guests with flexible layouts for board meetings or private dinners.',
    capacity: '30 - 60 guests',
    rates: [
      { label: 'Jumatatu & Jumanne', price: 177000 },
      { label: 'Jumatano, Alhamisi, Ijumaa, Jumamosi & Jumapili', price: 236000 },
    ],
  },
];

export const taratibuChecklist: string[] = [
  'Meza na viti vitolewa kulingana na idadi ya watu waliolipwa chakula.',
  'Ukumbi unaparking ya kutosha na ulinzi wa uhakika.',
  'Booking inakamilika pale tu malipo ya awali yanapofanyika (nusu au malipo yote).',
  'Standby generator ipo endapo umeme utakatika.',
  'Sherehe mwisho saa sita (00:00) kwa mujibu wa sheria; MC azingatie muda.',
  'Malipo ya mwisho yafanyike wiki moja kabla ya tarehe ya sherehe (wasiliana na ofisi kwa mwongozo).',
  'Kuna chumba maalum cha maharusi (waiting room) cha kusubiri muda wa kuingia ukumbini.',
];

export const muhimuNotes: string[] = [
  'Sherehe isipofanyika ada ya ukumbi haitarudishwa hadi pale atakapopatikana mteja mwingine kwa tarehe hiyo, ndipo utarejeshewa 70% ya kiasi kilicholipwa. Endapo mteja mwingine hatapatikana kwa tarehe hiyo basi hakuna urejeshaji wowote.',
  'Vinywaji vyako vikibaki utavichukua kwa kuleta chupa tupu kulingana na vinywaji ulivyobakisha (vifanywe ndani ya siku tatu toka ulivyoandika).',
  'Haturuhusu sherehe mbili kwa wakati mmoja (two in one).',
  'Out catering ni makubaliano na ofisi juu ya gharama za uendeshaji huduma.',
  'Gharama zote zilipwe VAT 18%.',
  'Mteja anataakiwa kwenda kulipia kibali cha sherehe Manispaa (Ofisi ya Utamaduni).',
  'AC zinawashwa ukumbini saa 17:30.',
];

export const decorationPackages: PackageFeature[] = [
  {
    title: 'Standard • 2,000,000 TZS',
    price: 2000000,
    highlights: [
      'Stage decoration',
      'Photobooth banner (3m)',
      'Welcome note board',
      'Fire walks (2)',
      'Entrance décor + flowers',
      'Dancing floor sticker + printed names',
      'Table décor with charger plates, napkins, champion glass',
    ],
  },
  {
    title: 'VIP • 5,000,000 TZS',
    price: 5000000,
    highlights: [
      'Stage decoration with chrome chair setup (400)',
      'Walking way sticker + entrance décor',
      'Artificial & natural flowers',
      'Fog machine + moving head lights',
      'Chandeliers, table decor, charger plates, glassware',
    ],
  },
  {
    title: 'Executive • 8,000,000 TZS',
    price: 8000000,
    highlights: [
      'LED on stage + laser on first dance',
      'Truss (8m x 10m) with decoration and printed banner',
      'Moving head lights (4) + dance floor sticker',
      'Crystal tableware + table numbers',
      '8 chandeliers and candle vase accents',
    ],
  },
  {
    title: 'VVIP • 15,000,000 TZS',
    price: 15000000,
    highlights: [
      'Full hall theme setup with LED, truss, and 10 chandeliers',
      'Fog machines, laser machines, table lamps, candle sets',
      'Fire walks (6 sets) and premium flowers',
    ],
  },
  {
    title: 'Royal • 20,000,000 TZS',
    price: 20000000,
    highlights: [
      '12m x 12m truss with LED screen, decorations, 15 chandeliers',
      'Fire walks (8 sets), laser machine, table lamps (20)',
      'Comprehensive theme install across the entire hall',
    ],
  },
];

export const beverageList = [
  { name: 'Flying Fish & Kilimanjaro Lite', price: 3000 },
  { name: 'Local Beer', price: 2500 },
  { name: 'Imported Beer', price: 4000 },
  { name: 'Soda', price: 1000 },
  { name: 'Azam Juice', price: 4000 },
  { name: 'Maji Kili 0.5L', price: 1000 },
  { name: 'Malta', price: 3000 },
  { name: 'Baltika', price: 5000 },
  { name: 'Bavaria', price: 3500 },
  { name: 'Savanna', price: 5000 },
  { name: 'Ceres Juice', price: 6000 },
  { name: 'Konyagi & KVant', price: 15000 },
  { name: 'Wine (5L)', price: 120000 },
];

export const conferencePackages: ConferencePackage[] = [
  {
    attendees: '30 - 50 guests',
    pricePoint: 'TZS 55,000 / 35,000 / 20,000 (venue dependent)',
    amenities: [
      'Hall setup + PA system',
      'Breakfast, lunch, soft drinks, stationery',
      'Multiple room options to fit the meeting tone',
    ],
  },
  {
    attendees: '100 - 200 guests',
    pricePoint: 'TZS 50,000 / 40,000 / 30,000 (venue dependent)',
    amenities: [
      'Hall setup + projector, PA & breakfast',
      'Stationery + soft drinks + lunch',
      'Dedicated desk for registration + support',
    ],
  },
  {
    attendees: '300 - 500 guests',
    pricePoint: 'TZS 45,000 / 40,000 / 35,000 (venue dependent)',
    amenities: [
      'Breakfast, lunch, evening tea',
      'P.A., projector, soft drinks and seating',
      'Multiple halls available for breakout sessions',
    ],
  },
];
