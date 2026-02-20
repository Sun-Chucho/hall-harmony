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

export interface CakeOption {
  title: string;
  pricePoint: string;
}

export const hallCatalog: HallCatalogEntry[] = [
  {
    id: 'witness',
    name: 'Witness Hall',
    alias: 'Hall A',
    description: 'Grand ballroom for 500-700 guests with a lush foyer, chandeliers, and a premium sound system.',
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
    description: 'Hall for 200-300 guests plus an adjacent garden that hosts 300-400 people for ceremonies and cocktails.',
    capacity: 'Hall 200 - 300 | Garden 300 - 400',
    rates: [
      { label: 'Jumamosi', price: 2301000 },
      { label: 'Jumatatu & Jumanne', price: 1227000 },
      { label: 'Jumatano, Alhamisi, Ijumaa & Jumapili', price: 1534000 },
    ],
  },
  {
    id: 'hall-d',
    name: 'Hall D',
    alias: 'Hall D',
    description: 'Boutique space suited for 30-60 guests with flexible layouts for board meetings or private dinners.',
    capacity: '30 - 60 guests',
    rates: [
      { label: 'Jumatatu & Jumanne', price: 177000 },
      { label: 'Jumatano, Alhamisi, Ijumaa, Jumamosi & Jumapili', price: 236000 },
    ],
  },
];

export const taratibuChecklist: string[] = [
  'Meza na viti vitatolewa kulingana na idadi ya watu waliolipiwa chakula.',
  'Ukumbi una parking ya kutosha na ulinzi wa uhakika.',
  'Booking inakamilika pale tu malipo ya awali yanapofanyika nusu au malipo yote ya kukodi ukumbi.',
  'Standby generator ipo endapo umeme utakatika.',
  'Sherehe mwisho saa sita usiku (00:00) kwa mujibu wa sheria, MC azingatie muda.',
  'Malipo ya mwisho yafanyike wiki moja kabla ya tarehe ya sherehe (wasiliana na ofisi kwa mwongozo wa malipo).',
  'Kuna chumba maalum cha maharusi (waiting room) cha kusubiri muda wa kuingia ukumbini.',
];

export const muhimuNotes: string[] = [
  'Sherehe isipofanyika ada ya ukumbi haitarudishwa hadi pale atakapopatikana mteja mwingine kwa tarehe hiyo, ndipo utarejeshewa 70% ya kiasi kilicholipwa. Endapo mteja mwingine hatapatikana kwa tarehe hiyo basi hakutakuwa na urejeshaji wowote.',
  'Vinywaji vyako vikibaki utavichukua kwa kuleta chupa tupu (empty) kulingana na vinywaji ulivyobakisha, vifatwe ndani ya siku tatu toka ulivyoandikisha.',
  'Haturuhusu sherehe mbili kwa wakati mmoja (two in one).',
  'Outcatering ni makubaliano na ofisi juu ya gharama za uendeshaji huduma.',
  'Gharama zote zilipwe VAT 18%.',
  'Mteja anatakiwa kwenda kulipia kibali cha sherehe Manispaa (ofisi ya utamaduni).',
  'AC zinawashwa ukumbini saa 17:30.',
];

export const decorationPackages: PackageFeature[] = [
  {
    title: 'Standard - 2,000,000 TZS',
    price: 2000000,
    highlights: [
      'Stage decoration',
      'Photobooth banner 3 metre',
      'Welcome note board',
      'Fire walks 2',
      'Entrance decor',
      'Flowers (artificial and natural)',
      'Dancing floor sticker + printed names',
      'Light (fairy lights)',
      'Table cover',
      'Flowers vase (ironic gold)',
      'Charger plate @table',
      'Napkins 4 @table',
      'Champagne glass 4',
    ],
  },
  {
    title: 'V.I.P - 5,000,000 TZS',
    price: 5000000,
    highlights: [
      'Stage decoration',
      'Chrome chair 400 (gold + silver + black)',
      'Walking way sticker',
      'Entrance decor',
      'Flowers (artificial and natural)',
      'Fog machine 1',
      'Moving head 2',
      'Dancing floor sticker + printed names',
      'Vase candles 20 (ironic gold)',
      'Napkin 10 @table',
      'Charger plate 10 @table',
      'Glass water 10',
      'Glass wines 10',
    ],
  },
  {
    title: 'Executive - 8,000,000 TZS',
    price: 8000000,
    highlights: [
      'LED on stage',
      'Laser machine on first dance',
      '8 chandelier',
      'Truss (8m x 10m) + decoration + printed banner',
      'Skirted stand flower',
      'Moving head 4',
      'Printed sticker walking way',
      'Table cover',
      'Water glass crystal 10 @table',
      'Wine glass crystal 10 @table',
      'Table number',
      'Candle vase clear or black',
    ],
  },
  {
    title: 'V.V.I.P - 15,000,000 TZS',
    price: 15000000,
    highlights: [
      'A lot of flowers',
      'Truss (12m x 12m) + LED screen + decorations and 10 chandelier',
      'Themes setup whole hall',
      'Fog machine 2',
      'Table lamp 10',
      '3pc candles each table',
      'Fire walks 6 set',
      'Laser machine',
    ],
  },
  {
    title: 'Royal - 20,000,000 TZS',
    price: 20000000,
    highlights: [
      'A lot of flowers',
      'Truss (12m x 12m) + LED screen + decorations + 15 chandelier',
      'Themes setup whole hall',
      'Fog machine 4',
      'Table lamp 20',
      '4pcs candle each table',
      'Fire walks 8 set',
      'Laser machine',
    ],
  },
];

export const beverageList = [
  { name: 'Flying Fish & Kilimanjaro Lite', price: 3000 },
  { name: 'Local Beer', price: 2500 },
  { name: 'Imported Beer', price: 4000 },
  { name: 'Soda', price: 1000 },
  { name: 'Azam Juice', price: 4000 },
  { name: 'Maji Kili 1/2 LT (0.5 LT)', price: 1000 },
  { name: 'Malta', price: 3000 },
  { name: 'Baltika', price: 5000 },
  { name: 'Bavaria', price: 3500 },
  { name: 'Savanna', price: 5000 },
  { name: 'Ceres Juice', price: 6000 },
  { name: 'Konyagi & K Vant', price: 15000 },
  { name: 'Wine (5 LTRS)', price: 120000 },
];

export const beverageNotes: string[] = [
  'Bei zitakapobadilika mtajulishwa pale tu makampuni husika yakipandisha bei.',
  'Unaruhusiwa kuleta pombe kali na champagne tu.',
  'NB: Gharama za kuingiza cocktail ukumbini ni TZS 150,000.',
];

export const cakeOptions: CakeOption[] = [
  {
    title: 'Mbuzi akiletwa na mteja ataokwa',
    pricePoint: 'TZS 100,000',
  },
  {
    title: 'Ndafu kamili (mbuzi na kumuoka)',
    pricePoint: 'TZS 350,000 - TZS 400,000',
  },
  {
    title: 'Toroli la ndafu (mteja anaruhusiwa kuleta ndafu yake)',
    pricePoint: 'TZS 20,000',
  },
];

export const externalServices: string[] = [
  'Kukodisha magari',
  'Out catering',
  'Beverage service',
  'Decoration service',
  'Event rental service',
  'Places for holding various meetings',
];

export const conferencePackages: ConferencePackage[] = [
  {
    attendees: 'Watu 30 - 50',
    pricePoint: '@TSH 55,000 / @TSH 35,000 / @TSH 20,000 (Lipa ukumbi)',
    amenities: [
      'Hall setup',
      'Breakfast',
      'Lunch',
      'Soft drinks',
      'Stationary',
      'P.A',
    ],
  },
  {
    attendees: 'Watu 100 - 200',
    pricePoint: '@TSH 50,000 / @TSH 40,000 / @TSH 30,000 (Lipa ukumbi)',
    amenities: [
      'Hall setup',
      'Breakfast',
      'Lunch',
      'Stationary',
      'P.A',
      'Projector',
      'Soft drinks',
    ],
  },
  {
    attendees: 'Watu 300 - 500',
    pricePoint: '@TSH 45,000 / @TSH 40,000 / @TSH 35,000 (Lipa ukumbi)',
    amenities: [
      'Hall setup',
      'Breakfast',
      'Lunch',
      'Evening tea',
      'Stationary',
      'P.A',
      'Projector',
      'Soft drinks',
    ],
  },
];

export const clientDeclaration =
  'Mimi __________________ nimesoma na kukubaliana na miongozo yote hapo juu na nitafuata yote yaliyoelekezwa hapo.';
