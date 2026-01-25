export interface Salon {
  id: string;
  name: string;
  nameBn: string;
  address: string;
  addressBn: string;
  phone: string;
  lat: number;
  lng: number;
  totalWaste: number;
  totalEarnings: number;
}

export interface Collector {
  id: string;
  name: string;
  nameBn: string;
  phone: string;
  zone: string;
}

export interface WasteLog {
  id: string;
  salonId: string;
  salonName: string;
  date: string;
  weight: number;
  status: 'pending' | 'collected';
  collectorId?: string;
  amount: number;
  photo?: string;
}

export interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  description: string;
  image: string;
  tag: string;
  benefits: string[];
  howToUse: string[];
}

export const salons: Salon[] = [
  {
    id: 'salon-1',
    name: 'Beauty Queen Salon',
    nameBn: 'বিউটি কুইন সেলুন',
    address: 'Dhanmondi 27, Dhaka',
    addressBn: 'ধানমন্ডি ২৭, ঢাকা',
    phone: '+880 1812-456789',
    lat: 23.7461,
    lng: 90.3742,
    totalWaste: 125,
    totalEarnings: 2500,
  },
  {
    id: 'salon-2',
    name: 'Style Studio',
    nameBn: 'স্টাইল স্টুডিও',
    address: 'Gulshan 1, Dhaka',
    addressBn: 'গুলশান ১, ঢাকা',
    phone: '+880 1712-567890',
    lat: 23.7808,
    lng: 90.4169,
    totalWaste: 89,
    totalEarnings: 1780,
  },
  {
    id: 'salon-3',
    name: 'Glamour Point',
    nameBn: 'গ্ল্যামার পয়েন্ট',
    address: 'Banani, Dhaka',
    addressBn: 'বনানী, ঢাকা',
    phone: '+880 1912-678901',
    lat: 23.7937,
    lng: 90.4066,
    totalWaste: 67,
    totalEarnings: 1340,
  },
  {
    id: 'salon-4',
    name: 'Royal Beauty',
    nameBn: 'রয়্যাল বিউটি',
    address: 'Agrabad, Chittagong',
    addressBn: 'আগ্রাবাদ, চট্টগ্রাম',
    phone: '+880 1612-789012',
    lat: 22.3285,
    lng: 91.8123,
    totalWaste: 145,
    totalEarnings: 2900,
  },
  {
    id: 'salon-5',
    name: 'Urban Cuts',
    nameBn: 'আরবান কাটস',
    address: 'Nasirabad, Chittagong',
    addressBn: 'নাসিরাবাদ, চট্টগ্রাম',
    phone: '+880 1512-890123',
    lat: 22.3569,
    lng: 91.8317,
    totalWaste: 98,
    totalEarnings: 1960,
  },
];

export const collectors: Collector[] = [
  {
    id: 'collector-1',
    name: 'Karim Hasan',
    nameBn: 'করিম হাসান',
    phone: '+880 1912-567890',
    zone: 'Dhaka North',
  },
  {
    id: 'collector-2',
    name: 'Abdul Rahman',
    nameBn: 'আব্দুল রহমান',
    phone: '+880 1812-678901',
    zone: 'Dhaka South',
  },
  {
    id: 'collector-3',
    name: 'Salim Uddin',
    nameBn: 'সালিম উদ্দিন',
    phone: '+880 1712-789012',
    zone: 'Chittagong',
  },
];

export const wasteLogs: WasteLog[] = [
  {
    id: 'log-1',
    salonId: 'salon-1',
    salonName: 'Beauty Queen Salon',
    date: '2024-01-20',
    weight: 5.5,
    status: 'pending',
    amount: 110,
  },
  {
    id: 'log-2',
    salonId: 'salon-2',
    salonName: 'Style Studio',
    date: '2024-01-20',
    weight: 3.2,
    status: 'pending',
    amount: 64,
  },
  {
    id: 'log-3',
    salonId: 'salon-3',
    salonName: 'Glamour Point',
    date: '2024-01-19',
    weight: 4.8,
    status: 'collected',
    collectorId: 'collector-1',
    amount: 96,
  },
  {
    id: 'log-4',
    salonId: 'salon-1',
    salonName: 'Beauty Queen Salon',
    date: '2024-01-18',
    weight: 6.1,
    status: 'collected',
    collectorId: 'collector-1',
    amount: 122,
  },
  {
    id: 'log-5',
    salonId: 'salon-4',
    salonName: 'Royal Beauty',
    date: '2024-01-20',
    weight: 7.3,
    status: 'pending',
    amount: 146,
  },
  {
    id: 'log-6',
    salonId: 'salon-5',
    salonName: 'Urban Cuts',
    date: '2024-01-19',
    weight: 4.0,
    status: 'collected',
    collectorId: 'collector-3',
    amount: 80,
  },
  {
    id: 'log-7',
    salonId: 'salon-2',
    salonName: 'Style Studio',
    date: '2024-01-17',
    weight: 5.2,
    status: 'collected',
    collectorId: 'collector-2',
    amount: 104,
  },
  {
    id: 'log-8',
    salonId: 'salon-3',
    salonName: 'Glamour Point',
    date: '2024-01-16',
    weight: 3.5,
    status: 'collected',
    collectorId: 'collector-1',
    amount: 70,
  },
  {
    id: 'log-9',
    salonId: 'salon-4',
    salonName: 'Royal Beauty',
    date: '2024-01-15',
    weight: 8.0,
    status: 'collected',
    collectorId: 'collector-3',
    amount: 160,
  },
  {
    id: 'log-10',
    salonId: 'salon-5',
    salonName: 'Urban Cuts',
    date: '2024-01-14',
    weight: 2.8,
    status: 'collected',
    collectorId: 'collector-3',
    amount: 56,
  },
];

export const products: Product[] = [
  {
    id: 1,
    name: 'Kera-N Bio-Liquid (Standard)',
    size: '1 Liter Bottle',
    price: 250,
    tag: 'Best Seller',
    description:
      'The perfect balance of Nitrogen and Amino Acids for everyday crops. Doubles the size of your vegetables.',
    image:
      '/products/1.png',
    benefits: [
      'Doubles vegetable size in 2 weeks',
      'Rich in organic Nitrogen (16%)',
      'Safe for all home garden crops',
      'Improves soil water retention',
    ],
    howToUse: [
      'Mix 5ml (1 cap) per 1 Liter of water.',
      'Spray on leaves early in the morning.',
      'Repeat every 7 days.',
    ],
  },
  {
    id: 2,
    name: 'Foshul Gold (Agro Pack)',
    size: '5 Liter Jerry Can',
    price: 950,
    tag: 'Value',
    description:
      'High-efficiency bulk pack for large fields. Reduces Urea cost by 30%. Best for Rice and Wheat.',
    image:
      '/products/2.png',
    benefits: [
      'Reduces chemical Urea cost by 30%',
      'Boosts paddy yield significantly',
      'Restores soil pH balance',
      'Cost-effective for large acreage',
    ],
    howToUse: [
      'Mix 100ml per 10 Liters of water.',
      'Apply via knapsack sprayer.',
      'Use during vegetative growth stage.',
    ],
  },
  {
    id: 3,
    name: 'Rooftop Bloom (Urban Edition)',
    size: '250ml Spray',
    price: 120,
    tag: 'Premium',
    description:
      'Odorless, easy-to-spray formula for flowers and indoor plants. Keeps your home garden lush green.',
    image:
      '/products/3.png',
    benefits: [
      '100% Odorless (Indoor safe)',
      'Ready-to-use (No mixing needed)',
      'Makes leaves shiny and dust-free',
      'Promotes vibrant flowering',
    ],
    howToUse: [
      'Shake well before use.',
      'Spray directly on leaves and soil.',
      'Use twice a week for best results.',
    ],
  },
  {
    id: 4,
    name: 'Tea Estate Pro (Drum)',
    size: '20L Industrial Drum',
    price: 3200,
    tag: 'B2B',
    description:
      'Industrial strength growth booster for tea leaves. Maximum Nitrogen uptake for estates.',
    image:
      '/products/4.png',
    benefits: [
      'Maximizes leaf surface area',
      'Accelerates shoot regeneration',
      'Compatible with drip irrigation',
      'Bulk pricing for commercial estates',
    ],
    howToUse: [
      'Dilute 1:200 ratio in irrigation tanks.',
      'Apply post-plucking for rapid recovery.',
      'Consult agronomist for hectare dosage.',
    ],
  },
  {
    id: 5,
    name: 'Kera-Mini (Trial Sachet)',
    size: '100ml Sachet',
    price: 40,
    tag: 'Trial',
    description:
      'Try it on one row of crops. See the difference in 7 days for just 50 Taka.',
    image:
      '/products/5.png',
    benefits: [
      'Low cost, zero risk',
      'Enough for 1 Katha of land',
      'Visible greening in 7 days',
      'Easy to carry',
    ],
    howToUse: [
      'Cut open the sachet.',
      'Mix entire content in 20 Liters of water.',
      'Spray immediately.',
    ],
  },
  {
    id: 6,
    name: 'Spicy-Gro (Morich Special)',
    size: '500ml Bottle',
    price: 150,
    tag: 'Specialty',
    description:
      'Stops leaf curling (kukra rog) and increases spicy heat. Essential for winter crops.',
    image:
      '/products/6.png',
    benefits: [
      'Prevents leaf curl (Kukra Rog)',
      'Increases chili heat (Capsaicin)',
      'Boosts flowering in winter',
      'Strengthens roots',
    ],
    howToUse: [
      'Mix 3ml per Liter of water.',
      'Spray at the onset of flowering.',
      'Focus on the underside of leaves.',
    ],
  },
  {
    id: 7,
    name: 'Bloom Refill Pouch',
    size: '500ml Pouch',
    price: 180,
    tag: 'Eco-Friendly',
    description: 'Refill your Rooftop Bloom Spray. Save plastic, save money.',
    image:
      '/products/7.png',
    benefits: [
      'Uses 80% less plastic',
      'Cheaper than buying new bottles',
      'Easy-pour spout',
      'Same premium formula',
    ],
    howToUse: [
      'Unscrew cap of your spray bottle.',
      'Pour refill liquid carefully.',
      'No dilution required.',
    ],
  },
  {
    id: 8,
    name: 'Orchard Master (Fruit Boost)',
    size: '2 Liter Jug',
    price: 480,
    tag: 'Fruit Care',
    description:
      'Reduces fruit drop during storms. Makes fruits sweeter and shinier.',
    image:
      '/products/8.png',
    benefits: [
      'Prevents premature fruit drop',
      'Increases Brix (Sweetness) level',
      'Strengthens fruit stalks',
      'Improves fruit skin finish',
    ],
    howToUse: [
      'Mix 50ml per 10 Liters water.',
      'Perform Root Drenching (pour near trunk).',
      'Apply when fruits are pea-sized.',
    ],
  },
  {
    id: 9,
    name: 'Nursery Green (Pro Pack)',
    size: '10 Liter Can',
    price: 1800,
    tag: 'Pro',
    description:
      'Instant deep green color for saplings within 24 hours. Sell faster.',
    image:
      '/products/9.png',
    benefits: [
      'Instant greening effect (24 hours)',
      'Boosts seedling immunity',
      'High ROI for plant sellers',
      'Reduces transplant shock',
    ],
    howToUse: [
      'Mix 20ml per Liter.',
      'Spray heavily on foliage.',
      'Apply 2 days before taking to market.',
    ],
  },
  {
    id: 10,
    name: 'Leafy-Life (Shak/Spinach)',
    size: '1 Liter Bottle',
    price: 250,
    tag: 'Fast Growth',
    description:
      'High Nitrogen formula specifically for leafy growth. Harvest 5 days earlier.',
    image:
      '/products/10.png',
    benefits: [
      'Maximizes leaf expansion',
      'Harvest 5-7 days earlier',
      'Crispier, tastier leaves',
      'Prevents yellowing',
    ],
    howToUse: [
      'Mix 5ml per Liter.',
      'Spray every 3 days.',
      'Stop spraying 2 days before harvest.',
    ],
  },
];

export const weeklySupplyData = [
  { day: 'Sat', kg: 12 },
  { day: 'Sun', kg: 8 },
  { day: 'Mon', kg: 15 },
  { day: 'Tue', kg: 11 },
  { day: 'Wed', kg: 14 },
  { day: 'Thu', kg: 9 },
  { day: 'Fri', kg: 13 },
];

export const incomeGrowthData = [
  { month: 'Aug', bdt: 1200 },
  { month: 'Sep', bdt: 1800 },
  { month: 'Oct', bdt: 2100 },
  { month: 'Nov', bdt: 1950 },
  { month: 'Dec', bdt: 2400 },
  { month: 'Jan', bdt: 2800 },
];
