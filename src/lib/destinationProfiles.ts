export interface DestinationRateRow {
  label: string;
  price: number;
}

export interface DestinationProfile {
  id: string;
  name: string;
  alias: string;
  capacity: string;
  marketingLine: string;
  shortDescription: string;
  heroSummary: string;
  signatureHighlights: string[];
  idealFor: string[];
  standardRentalRates: DestinationRateRow[];
  galaDinnerRates: DestinationRateRow[];
}

export const destinationProfiles: DestinationProfile[] = [
  {
    id: 'witness',
    name: 'Witness Hall',
    alias: 'Hall A',
    capacity: '500 - 700',
    marketingLine: 'Command the room with a flagship ballroom built for cinematic moments.',
    shortDescription: 'Grand ballroom atmosphere with premium stage and chandelier profile.',
    heroSummary:
      'Witness Hall is our flagship destination for high-capacity celebrations and gala-scale productions. The layout supports cinematic arrivals, premium stage reveals, and smooth guest circulation from welcome to finale.',
    signatureHighlights: [
      'High-capacity ballroom with stage-centered production design.',
      'Premium chandelier finish and flexible dance-floor zoning.',
      'Dedicated bridal waiting room and coordinated service flow.',
      'Power backup, security coverage, and managed guest access.',
    ],
    idealFor: ['Luxury Weddings', 'Gala Dinners', 'Corporate Nights', 'Award Ceremonies'],
    standardRentalRates: [
      { label: 'JUMAMOSI', price: 3835000 },
      { label: 'JUMATATU NA JUMANNE', price: 1534000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA NA JUMAPILI', price: 2301000 },
    ],
    galaDinnerRates: [
      { label: 'JUMAMOSI', price: 2500000 },
      { label: 'JUMATATU NA JUMANNE', price: 1000000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA NA JUMAPILI', price: 1500000 },
    ],
  },
  {
    id: 'kilimanjaro',
    name: 'Kilimanjaro Hall',
    alias: 'Hall B',
    capacity: '200 - 300',
    marketingLine: 'A polished indoor canvas for elegant weddings and premium corporate functions.',
    shortDescription: 'Balanced indoor setting for weddings, conferences, and receptions.',
    heroSummary:
      'Kilimanjaro Hall is designed for polished medium-size events that require both premium presentation and controlled logistics. It is ideal for couples and organizers who want a refined indoor environment.',
    signatureHighlights: [
      'Refined hall scale for premium mid-size celebrations.',
      'Strong compatibility with themed decor and staged entries.',
      'Integrated service lanes for smooth food and beverage flow.',
      'Reliable backup power and managed security.',
    ],
    idealFor: ['Weddings', 'Corporate Functions', 'Launch Events', 'Premium Receptions'],
    standardRentalRates: [
      { label: 'JUMAMOSI', price: 2301000 },
      { label: 'JUMATATU NA JUMANNE', price: 1227000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA NA JUMAPILI', price: 1534000 },
    ],
    galaDinnerRates: [
      { label: 'JUMAMOSI', price: 1500000 },
      { label: 'JUMATATU NA JUMANNE', price: 800000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA NA JUMAPILI', price: 1000000 },
    ],
  },
  {
    id: 'kilimanjaro-garden',
    name: 'Kilimanjaro Garden',
    alias: 'Garden Wing',
    capacity: '300 - 400',
    marketingLine: 'Create open-air ceremony drama with luxury flow from aisle to afterglow.',
    shortDescription: 'Open-air destination for ceremonies, cocktails, and stylish arrivals.',
    heroSummary:
      'Kilimanjaro Garden delivers an open-air signature for clients who want atmosphere, movement, and visual impact. It is perfect for ceremony setups, cocktail flow, and elegant outdoor presentations.',
    signatureHighlights: [
      'Open-air format for ceremony-led event storytelling.',
      'Natural-light friendly staging for photo and video teams.',
      'Flexible seating zones for cocktails and reception movement.',
      'Operationally paired with Kilimanjaro Hall service standards.',
    ],
    idealFor: ['Garden Weddings', 'Cocktail Receptions', 'Engagement Ceremonies', 'Sunset Events'],
    standardRentalRates: [
      { label: 'JUMAMOSI', price: 2301000 },
      { label: 'JUMATATU NA JUMANNE', price: 1227000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA NA JUMAPILI', price: 1534000 },
    ],
    galaDinnerRates: [
      { label: 'JUMAMOSI', price: 1500000 },
      { label: 'JUMATATU NA JUMANNE', price: 800000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA NA JUMAPILI', price: 1000000 },
    ],
  },
  {
    id: 'hall-d',
    name: 'Hall D',
    alias: 'Hall D',
    capacity: '30 - 60',
    marketingLine: 'An intimate boutique room where every detail feels personal and premium.',
    shortDescription: 'Boutique space for intimate events, private dinners, and board meetings.',
    heroSummary:
      'Hall D is a boutique destination built for intimate moments, executive sessions, and premium private dinners. The scale supports high attention to detail and close guest experience.',
    signatureHighlights: [
      'Intimate-capacity room for personalized event control.',
      'Fast conversion between meeting and dinner layouts.',
      'Decor-focused setup options for private celebrations.',
      'Efficient support team model for small-group experiences.',
    ],
    idealFor: ['Private Dinners', 'Board Meetings', 'Family Celebrations', 'Photoshoots'],
    standardRentalRates: [
      { label: 'JUMATATU NA JUMANNE', price: 177000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA, JUMAMOSI NA JUMAPILI', price: 236000 },
    ],
    galaDinnerRates: [
      { label: 'JUMATATU NA JUMANNE', price: 150000 },
      { label: 'JUMATANO, ALHAMISI, IJUMAA, JUMAMOSI NA JUMAPILI', price: 200000 },
    ],
  },
];

export const hallOperationsPolicy = [
  'Tutatoa meza na viti kulingana na idadi ya watu waliolipiwa chakula.',
  'Booking inakamilika pale tu malipo ya awali yanapofanyika nusu au malipo yote ya kukodi ukumbi.',
  'Standby generator ipo endapo umeme utakatika.',
  'Kila huduma itatoka hapa kwetu kama huduma ya chakula, vinywaji, mapambo, pamoja na ukodishaji wa magari.',
  'Malipo ya mwisho yafanyike wiki moja kabla ya sherehe; wasiliana na ofisi kwa mwongozo wa malipo.',
  'Malipo yote yalipwe kupitia account ya bank tajwa.',
];

export const bankAccounts = [
  { bank: 'CRDB BANK', account: '0150005526600', name: 'KURINGE REAL ESTATE' },
  { bank: 'NMB BANK', account: '40310046818', name: 'KURINGE REAL ESTATE' },
];

export const importantNotices = [
  'Sherehe isipofanyika, ada ya ukumbi haitarudishwa hadi pale atakapopatikana mteja mwingine kwa tarehe hiyo; utarejeshewa 70% ya kiasi kilicholipwa. Endapo mteja mwingine hatapatikana kwa tarehe hiyo, hakutakuwa na urejeshaji wowote.',
  'Vinywaji vyako vikibaki utavichukua kwa kuleta chupa tupu kulingana na vinywaji ulivyobakisha, vifatwe ndani ya siku tatu toka ulivyoandikisha.',
  'Haturuhusu sherehe mbili kwa wakati mmoja (two in one).',
  'Outcatering ni makubaliano na ofisi juu ya gharama za uendeshaji huduma.',
  'Gharama zote zilipwe VAT 18%.',
  'Mteja anatakiwa kwenda kulipia kibali cha sherehe Manispaa (ofisi ya utamaduni).',
  'AC zinawashwa ukumbini saa 17:30.',
];

export const decorByPax = [
  {
    title: 'PAX 50 - 100',
    price: 500000,
    items: ['Set up table', 'Red carpet', 'Stage decor', 'Theme', 'LED light'],
  },
  {
    title: 'PAX 100 - 300',
    price: 800000,
    items: ['Set up table', 'Flowers', 'Charger plate', 'Artificial flowers', 'Stage decor', 'LED light', 'Theme', 'Flower table'],
  },
  {
    title: 'PAX 300 - 500',
    price: 1000000,
    items: ['Set up table', 'Artificial flowers', 'Charger plate', 'LED light', 'Stage decor', 'Napkin', 'Red carpet', 'Theme', 'Photo booth'],
  },
  {
    title: 'PAX 500 - 700',
    price: 1500000,
    items: ['Set up table', 'Artificial flower', 'Red carpet', 'Stage decor', 'Napkin', 'Charger plate', 'LED light', 'Theme', 'Photo booth', 'Moving head'],
  },
];

export const photoshootPackage = {
  title: 'Photoshoot Package (PAX 30 - 60)',
  price: 600000,
  items: ['Red carpet', 'Artificial flowers', 'Theme setup', 'Royal chairs (King and Queen)', 'Bride and Groom names'],
};

export const foodMenus = [
  {
    title: 'MENU 13,000',
    starter: ['Mtori', 'Samosa'],
    buffet: ['Kuku choma 1/6', 'Rojo nyama', 'Wali maua', 'Pilau', 'Chips', 'Salad', 'Pilipili', 'Tunda'],
  },
  {
    title: 'MENU 15,000',
    starter: ['Mtori / Supu / Mbogamboga', 'Samosa', 'Bagia'],
    buffet: ['Kuku choma 1/4', 'Rojo nyama', 'Wali', 'Tambi za mbogamboga', 'Ndizi nyama', 'Tunda', 'Pilipili', 'Salad'],
  },
];

export const destinationContact = '0652199985';
