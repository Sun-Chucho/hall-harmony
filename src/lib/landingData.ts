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

export interface PackageInfoTableRow {
  label: string;
  value: string;
}

export interface PackageInfoTable {
  title: string;
  capacity?: string;
  rows: PackageInfoTableRow[];
}

export interface PackageInfoBlock {
  title: string;
  items: string[];
}

export interface EventPackageCategory {
  id: string;
  title: string;
  summary: string;
  tables?: PackageInfoTable[];
  blocks: PackageInfoBlock[];
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
  'Kila huduma itatoka hapa kwetu kama huduma ya chakula, vinywaji, mapambo, pamoja na ukodishaji wa magari.',
  'Sherehe mwisho saa sita usiku (00:00) kwa mujibu wa sheria, MC azingatie muda.',
  'Malipo ya mwisho yafanyike wiki moja kabla ya tarehe ya sherehe (wasiliana na ofisi kwa mwongozo wa malipo).',
  'Malipo yote yalipwe kupitia account tajwa: CRDB 0150005526600 (Kuringe Real Estate) au NMB 40310046818 (Kuringe Real Estate).',
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
  'Kwa mawasiliano zaidi wasiliana nasi kwa namba 0652199985.',
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

export const eventPackageCategories: EventPackageCategory[] = [
  {
    id: 'halls-package',
    title: 'Halls Package',
    summary: 'Hall rental pricing plus wedding decoration options for Witness Hall, Kilimanjaro Hall, Garden, and Hall D.',
    tables: [
      {
        title: 'Witness Hall',
        capacity: 'PAX 500-700',
        rows: [
          { label: 'Jumamosi', value: 'TSH 3,835,000/=' },
          { label: 'Jumatatu na Jumanne', value: 'TSH 1,534,000/=' },
          { label: 'Jumatano, Alhamisi, Ijumaa na Jumapili', value: 'TSH 2,301,000/=' },
        ],
      },
      {
        title: 'Kilimanjaro Hall (Hall B) & Garden',
        capacity: 'Hall 200-300 & Garden 300-400',
        rows: [
          { label: 'Jumamosi', value: 'TSH 2,301,000/=' },
          { label: 'Jumatatu na Jumanne', value: 'TSH 1,227,000/=' },
          { label: 'Jumatano, Alhamisi, Ijumaa na Jumapili', value: 'TSH 1,534,000/=' },
        ],
      },
      {
        title: 'Hall D',
        capacity: 'Capacity 30-60',
        rows: [
          { label: 'Jumatatu na Jumanne', value: 'TSH 177,000/=' },
          { label: 'Jumatano, Alhamisi, Ijumaa, Jumamosi na Jumapili', value: 'TSH 236,000/=' },
        ],
      },
    ],
    blocks: [
      {
        title: 'Standard Decoration - TSH 2,000,000/=',
        items: [
          'Stage decoration',
          'Photobooth',
          'Fire walks 2',
          'Entrance decor',
          'Flowers (artificial and natural)',
          'Light (fairy lights)',
          'Table cover',
          'Flowers vase (ironic gold)',
          'Charger plate 4@table',
          'Napkins 5@table',
        ],
      },
      {
        title: 'V.I.P - TSH 5,000,000/=',
        items: [
          'Stage decoration',
          'Chrome chair',
          'Walking way sticker',
          'Entrance decor',
          'Flowers (artificial and natural)',
          'Fog machine 1',
          'Moving head 2',
          'Dancing floor sticker + printed names',
          'Truss',
          'Fire walk 4',
          'Vase candles 20 (ironic gold)',
          'Napkin 8@table',
          'Charger plate 8@table',
          'Table cover',
        ],
      },
      {
        title: 'Executive - TSH 8,000,000/=',
        items: [
          'Stage decoration',
          'Chrome chair',
          'Walking way sticker',
          'Entrance decor',
          'Flowers (artificial and natural)',
          'Dancing floor sticker + printed names',
          'Fire walk 4',
          'Fog machine 1',
          'Lizer machine on first dance',
          '6 chandelier',
          'Truss (8m x 10m) + decoration + printed banner',
          'Scarted stand flower',
          'Moving head 4',
          'Table cover',
          'Candle vase clear or black',
          'Charger plate @table',
          'Napkins 8@table',
          'Flowers vase (ironic or gold)',
          'Table runner',
        ],
      },
      {
        title: 'V.V.I.P - TSH 15,000,000/=',
        items: [
          'A lot of flowers',
          'Stage decoration',
          'Chrome chair',
          'Walking way sticker',
          'Entrance decor',
          'Flowers (artificial and natural)',
          'Fire walk 4',
          'Lizer machine on first dance',
          'Truss (8m x 10m)',
          'Scarted stand flower',
          'Moving head 4',
          'Natural flower on the table',
          'Printed bunner',
          'Dancing floor with glass sticker',
          'Themes setup whole hall',
          'Fog machine 2',
          'Table lamp 3',
          '2pc candles each table',
          '8 chandelier',
          'Fataki',
        ],
      },
      {
        title: 'Royal - TSH 20,000,000/=',
        items: [
          'A lot of flowers',
          'Stage decoration',
          'Chrome chair',
          'Walking way sticker',
          'Entrance decor',
          'Scarted stand flower',
          'Moving head 4',
          'Natural flower on the table',
          'Printed bunner',
          'Dancing floor with glass sticker',
          'Themes setup whole hall',
          'Table lamp 10',
          '3pc candles each table',
          '8 chandelier',
          'Fataki',
          'Truss (12m x 12m) + LED screen + decorations + 15 chandelier',
          'Fog machine 2',
          'Fire walks 4 set',
          'Lizer machine',
          'Screen showing memories',
          'Welcoming bunner',
          'Thanksful cards on the tables',
          'Natural flowers',
          'Royal boad designed',
        ],
      },
    ],
  },
  {
    id: 'birthday-package',
    title: 'Birthday Package',
    summary: 'Venue hire, decoration, food, cakes, drinks, and extra services for birthday celebrations.',
    tables: [
      {
        title: 'Birthday Venue Rates',
        rows: [
          { label: 'Balcon A & B (Capacity 100)', value: 'TSH 300,000/=' },
          { label: 'Ground Area (Capacity 200)', value: 'TSH 400,000/=' },
          { label: 'Hall D (Capacity 60)', value: 'TSH 177,000/=' },
        ],
      },
    ],
    blocks: [
      {
        title: 'Standard Decoration - TSH 250,000/=',
        items: [
          'Stage decoration',
          'Balloons',
          'Printed sticker with name and year of a person',
          'Artificial flowers',
          'Table cloth',
          'Charger plate',
          'Napkin',
        ],
      },
      {
        title: 'V.I.P Decoration - TSH 500,000/=',
        items: [
          'Stage decoration',
          'Artificial flower on the table',
          'Printed sticker with name and year of a person',
          'Balloons',
          'Theme in all venue',
          'Photo booth',
          'Welcoming note board',
          'Fire walks 2',
          'Red carpet',
          'Table cloth',
          'Charger plate',
          'Napkin',
          'Table vase',
          'Thanksful card on each table',
        ],
      },
      {
        title: 'V.V.I.P Decoration - TSH 1,000,000/=',
        items: [
          'Stage decoration',
          'Natural flower',
          'Printed sticker with name and year of a person',
          'Balloons',
          'Photo booth',
          'Welcoming note board',
          'Screen showing person memory',
          'Moving head light',
          'Fire walks 4',
          'White carpet (run way)',
        ],
      },
      {
        title: 'Food',
        items: [
          'TSH 12,000/= per plate: Popcorn, karanga, kuku robo, chips, ndizi, mshkaki, matunda, pilipili',
          'TSH 15,000/= per plate: Popcorn, karanga, tende, korosho, kuku robo, chips, ndizi, mshkaki, matunda, pilipili',
        ],
      },
      {
        title: 'Cakes',
        items: [
          'Cake - TSH 30,000/=',
          'Cake with cup cake - TSH 60,000/=',
          'A designed cake - TSH 100,000/=',
        ],
      },
      {
        title: 'Drinks',
        items: [
          'Flying Fish & Kilimanjaro Lite - TSH 3,000/=',
          'Local beer - TSH 2,500/=',
          'Imported beer - TSH 4,000/=',
          'Soda - TSH 1,000/=',
          'Azam Juice - TSH 4,000/=',
          'Maji Kili 0.5LT - TSH 1,000/=',
          'Malta - TSH 3,000/=',
          'Baltika - TSH 5,000/=',
          'Bavaria - TSH 3,500/=',
          'Savanna - TSH 5,000/=',
          'Ceres Juice - TSH 6,000/=',
          'Konyagi & K Vant - TSH 15,000/=',
          'Wine (5LTRS) - TSH 120,000/=',
        ],
      },
      {
        title: 'Muhimu',
        items: [
          'Bei zitakapobadilika mtajulishwa pale tu makampuni husika yakipandisha bei.',
        ],
      },
      {
        title: 'Huduma Nyingine Nje ya Ukumbi',
        items: [
          'Kukodisha magari',
          'Out catering',
          'Beverage service',
          'Decoration service',
          'Event rental service',
          'Places',
        ],
      },
    ],
  },
  {
    id: 'gala-dinner-package',
    title: 'Gala Dinner Package',
    summary: 'Hall hire, decoration by guest count, and food menus for gala dinner events.',
    tables: [
      {
        title: 'Witness Hall',
        capacity: '500-700',
        rows: [
          { label: 'Jumamosi', value: 'TSH 2,500,000/=' },
          { label: 'Jumatatu na Jumanne', value: 'TSH 1,000,000/=' },
          { label: 'Jumatano, Alhamisi, Ijumaa na Jumapili', value: 'TSH 1,500,000/=' },
        ],
      },
      {
        title: 'Kilimanjaro Hall & Garden',
        capacity: '200-300 & 300-400',
        rows: [
          { label: 'Jumamosi', value: 'TSH 1,500,000/=' },
          { label: 'Jumatatu na Jumanne', value: 'TSH 800,000/=' },
          { label: 'Jumatano, Alhamisi, Ijumaa na Jumapili', value: 'TSH 1,000,000/=' },
        ],
      },
      {
        title: 'Hall D',
        capacity: '30-60',
        rows: [
          { label: 'Jumatatu na Jumanne', value: 'TSH 150,000/=' },
          { label: 'Jumatano, Alhamisi, Ijumaa, Jumamosi na Jumapili', value: 'TSH 200,000/=' },
        ],
      },
    ],
    blocks: [
      {
        title: 'Decoration by PAX',
        items: [
          'PAX 50-100 - TSH 500,000/=: setup table, red carpet, stage decor, theme, LD light',
          'PAX 100-300 - TSH 800,000/=: setup table, flowers, charger plate, artificial flowers, stage decor, LD light, themes, flower table',
          'PAX 300-500 - TSH 1,000,000/=: setup table, artificial flowers, charger plate, LD light, stage decor, napkin, red carpet, themes, photo booth',
          'PAX 500-700 - TSH 1,500,000/=: setup table, artificial flower, red carpet, stage decor, napkin, charger plate, LD light, themes, photo booth, moving head',
        ],
      },
      {
        title: 'Food Menus',
        items: [
          'Menu 13,000/=: Starter - Mtori, samosa. Buffet - kuku choma 1/6, rojo nyama, wali maua, pilau, chips, salad, pilipili, tunda',
          'Menu 15,000/=: Starter - mtori/supu/mbogamboga, samosa, bagia. Buffet - kuku choma 1/4, rojo nyama, wali, tambi za mbogamboga, ndizi nyama, tunda, pilipili, salad',
        ],
      },
    ],
  },
  {
    id: 'graduation-package',
    title: 'Graduation Package',
    summary: 'Graduation venue pricing, decoration packages, food, cakes, drinks, and external services.',
    tables: [
      {
        title: 'Graduation Venue Rates',
        rows: [
          { label: 'Balcon A & B (Capacity 100)', value: 'TSH 300,000/=' },
          { label: 'Ground Area (Capacity 200)', value: 'TSH 400,000/=' },
          { label: 'Hall D (Capacity 60)', value: 'TSH 177,000/=' },
        ],
      },
    ],
    blocks: [
      {
        title: 'Standard Decoration - TSH 350,000/=',
        items: [
          'Stage decoration',
          'Sticker with the graduate name and graduation year',
          'Welcoming note board',
          'Balloons',
          'Artificial flowers',
          'Table cloth',
          'Charger plate',
          'Napkin',
        ],
      },
      {
        title: 'V.I.P Decoration - TSH 800,000/=',
        items: [
          'Stage decoration',
          'Bunner with the graduate name and graduation year',
          'Welcoming note board',
          'Balloons',
          'Natural flowers',
          'Memorial displays',
          'Lighting',
          'Flowers',
          'Table cloth',
          'Napkins',
          'Table runner',
          'Charger plate',
          'Center pieces (graduation caps, flower or candle on table)',
        ],
      },
      {
        title: 'Food',
        items: [
          'TSH 10,000/=: kuku 1/6, wali mauwa, pilau, viazi/chips, rojo ya nyama, salad, pilipili, matunda',
          'TSH 15,000/=: Starter - mtori, sambusa. Main dish - wali mauwa, pilau, kuku robo, roasted beef, viazi/chips, mbogamboga, papper souce, matunda',
        ],
      },
      {
        title: 'Cakes',
        items: [
          'Cake - TSH 30,000/=',
          'Cake with cup cake - TSH 60,000/=',
          'A designed cake - TSH 100,000/=',
        ],
      },
      {
        title: 'Drinks',
        items: [
          'Flying Fish & Kilimanjaro Lite - TSH 3,000/=',
          'Local beer - TSH 2,500/=',
          'Imported beer - TSH 4,000/=',
          'Soda - TSH 1,000/=',
          'Azam Juice - TSH 4,000/=',
          'Maji Kili 0.5LT - TSH 1,000/=',
          'Malta - TSH 3,000/=',
          'Baltika - TSH 5,000/=',
          'Bavaria - TSH 3,500/=',
          'Savanna - TSH 5,000/=',
          'Ceres Juice - TSH 6,000/=',
          'Konyagi & K Vant - TSH 15,000/=',
          'Wine (5LTRS) - TSH 120,000/=',
        ],
      },
      {
        title: 'Muhimu',
        items: [
          'Bei zitakapobadilika mtajulishwa pale tu makampuni husika yakipandisha bei.',
        ],
      },
      {
        title: 'Huduma Nyingine Nje ya Ukumbi',
        items: [
          'Kukodisha magari',
          'Out catering',
          'Beverage service',
          'Decoration service',
          'Event rental service',
          'Places for holding various meetings',
        ],
      },
    ],
  },
];
