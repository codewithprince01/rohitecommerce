import type { Category, Subcategory, Brand, ProductWithVariants } from './supabase';

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Snacks & Namkeen',
    slug: 'snacks-namkeen',
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=200',
    bg_color: 'bg-orange-50',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat-2',
    name: 'Beverages',
    slug: 'beverages',
    image: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=200',
    bg_color: 'bg-cyan-50',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat-3',
    name: 'Dairy',
    slug: 'dairy',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=200',
    bg_color: 'bg-blue-50',
    sort_order: 3,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat-4',
    name: 'Bakery',
    slug: 'bakery',
    image: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=200',
    bg_color: 'bg-amber-50',
    sort_order: 4,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat-5',
    name: 'Vegetables',
    slug: 'vegetables',
    image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200',
    bg_color: 'bg-emerald-50',
    sort_order: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 'cat-6',
    name: 'Fruits',
    slug: 'fruits',
    image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200',
    bg_color: 'bg-green-50',
    sort_order: 6,
    created_at: new Date().toISOString()
  }
];

export const mockSubcategories: Subcategory[] = [
  // Snacks & Namkeen (cat-1)
  {
    id: 'subcat-1',
    category_id: 'cat-1',
    name: 'Namkeen',
    slug: 'namkeen',
    image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-2',
    category_id: 'cat-1',
    name: 'Chips & Wafers',
    slug: 'chips-wafers',
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-3',
    category_id: 'cat-1',
    name: 'Biscuits & Cookies',
    slug: 'biscuits-cookies',
    image: 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 3,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-4',
    category_id: 'cat-1',
    name: 'Noodles & Pasta',
    slug: 'noodles-pasta',
    image: 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 4,
    created_at: new Date().toISOString()
  },
  // Beverages (cat-2)
  {
    id: 'subcat-5',
    category_id: 'cat-2',
    name: 'Soft Drinks',
    slug: 'soft-drinks',
    image: 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-6',
    category_id: 'cat-2',
    name: 'Juices',
    slug: 'juices',
    image: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-7',
    category_id: 'cat-2',
    name: 'Tea & Coffee',
    slug: 'tea-coffee',
    image: 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 3,
    created_at: new Date().toISOString()
  },
  // Dairy (cat-3)
  {
    id: 'subcat-8',
    category_id: 'cat-3',
    name: 'Milk',
    slug: 'milk',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-9',
    category_id: 'cat-3',
    name: 'Paneer & Cheese',
    slug: 'paneer-cheese',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-10',
    category_id: 'cat-3',
    name: 'Yogurt & Curd',
    slug: 'yogurt-curd',
    image: 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 3,
    created_at: new Date().toISOString()
  },
  // Bakery (cat-4)
  {
    id: 'subcat-11',
    category_id: 'cat-4',
    name: 'Bread',
    slug: 'bread',
    image: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-12',
    category_id: 'cat-4',
    name: 'Cakes & Pastries',
    slug: 'cakes-pastries',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  // Vegetables (cat-5)
  {
    id: 'subcat-13',
    category_id: 'cat-5',
    name: 'Fresh Vegetables',
    slug: 'fresh-vegetables',
    image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-14',
    category_id: 'cat-5',
    name: 'Leafy Greens',
    slug: 'leafy-greens',
    image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  // Fruits (cat-6)
  {
    id: 'subcat-15',
    category_id: 'cat-6',
    name: 'Fresh Fruits',
    slug: 'fresh-fruits',
    image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'subcat-16',
    category_id: 'cat-6',
    name: 'Exotic Fruits',
    slug: 'exotic-fruits',
    image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200',
    sort_order: 2,
    created_at: new Date().toISOString()
  }
];

export const mockBrands: Brand[] = [
  // Namkeen (subcat-1)
  {
    id: 'brand-1',
    subcategory_id: 'subcat-1',
    name: 'Haldiram',
    slug: 'haldiram',
    logo: 'https://logos-world.net/wp-content/uploads/2023/03/Haldirams-Logo.png',
    description: "India's most loved Namkeen brand",
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-2',
    subcategory_id: 'subcat-1',
    name: 'Bikaji',
    slug: 'bikaji',
    logo: 'https://bikaji.co.in/logo.png',
    description: 'Authentic Indian snacks and namkeen',
    created_at: new Date().toISOString()
  },
  // Chips & Wafers (subcat-2)
  {
    id: 'brand-4',
    subcategory_id: 'subcat-2',
    name: 'Lays',
    slug: 'lays',
    logo: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'World famous potato chips',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-6',
    subcategory_id: 'subcat-2',
    name: 'Pringles',
    slug: 'pringles',
    logo: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Premium stacked chips',
    created_at: new Date().toISOString()
  },
  // Biscuits (subcat-3)
  {
    id: 'brand-7',
    subcategory_id: 'subcat-3',
    name: 'Parle',
    slug: 'parle',
    logo: 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: "India's biscuit brand",
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-8',
    subcategory_id: 'subcat-3',
    name: 'Britannia',
    slug: 'britannia',
    logo: 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Taste the quality',
    created_at: new Date().toISOString()
  },
  // Noodles (subcat-4)
  {
    id: 'brand-10',
    subcategory_id: 'subcat-4',
    name: 'Maggie',
    slug: 'maggi',
    logo: 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: '2-minute noodles',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-11',
    subcategory_id: 'subcat-4',
    name: 'Yippee',
    slug: 'yippee',
    logo: 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Non-sticky noodles',
    created_at: new Date().toISOString()
  },
  // Soft drinks (subcat-5)
  {
    id: 'brand-12',
    subcategory_id: 'subcat-5',
    name: 'Coca-Cola',
    slug: 'coca-cola',
    logo: 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Refresh your world',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-13',
    subcategory_id: 'subcat-5',
    name: 'Pepsi',
    slug: 'pepsi',
    logo: 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'For the love of it',
    created_at: new Date().toISOString()
  },
  // Juices (subcat-6)
  {
    id: 'brand-15',
    subcategory_id: 'subcat-6',
    name: 'Real',
    slug: 'real',
    logo: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: '100% fruit juice',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-16',
    subcategory_id: 'subcat-6',
    name: 'Tropicana',
    slug: 'tropicana',
    logo: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Premium fruit juices',
    created_at: new Date().toISOString()
  },
  // Tea & Coffee (subcat-7)
  {
    id: 'brand-23',
    subcategory_id: 'subcat-7',
    name: 'Tata Tea',
    slug: 'tata-tea',
    logo: 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Fresh and strong tea leaves',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-24',
    subcategory_id: 'subcat-7',
    name: 'Nescafe',
    slug: 'nescafe',
    logo: 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Rich coffee flavor and aroma',
    created_at: new Date().toISOString()
  },
  // Milk (subcat-8)
  {
    id: 'brand-17',
    subcategory_id: 'subcat-8',
    name: 'Amul',
    slug: 'amul',
    logo: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Taste of India',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-18',
    subcategory_id: 'subcat-8',
    name: 'Mother Dairy',
    slug: 'mother-dairy',
    logo: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Pure and fresh',
    created_at: new Date().toISOString()
  },
  // Paneer & Cheese (subcat-9)
  {
    id: 'brand-25',
    subcategory_id: 'subcat-9',
    name: 'Amul Dairy',
    slug: 'amul-dairy',
    logo: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Amul dairy paneer and cheese',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-26',
    subcategory_id: 'subcat-9',
    name: 'Britannia Dairy',
    slug: 'britannia-dairy',
    logo: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Premium processed cheese slices and cubes',
    created_at: new Date().toISOString()
  },
  // Yogurt & Curd (subcat-10)
  {
    id: 'brand-27',
    subcategory_id: 'subcat-10',
    name: 'Mother Dairy Yogurt',
    slug: 'mother-dairy-yogurt',
    logo: 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Fresh dahi and sweet fruit yogurt',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-28',
    subcategory_id: 'subcat-10',
    name: 'Epigamia',
    slug: 'epigamia',
    logo: 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Healthy high protein Greek yogurt',
    created_at: new Date().toISOString()
  },
  // Bread (subcat-11)
  {
    id: 'brand-19',
    subcategory_id: 'subcat-11',
    name: 'Harvest Gold',
    slug: 'harvest-gold',
    logo: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Fresh baked goodness',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-20',
    subcategory_id: 'subcat-11',
    name: 'Britannia Bread',
    slug: 'britannia-bread',
    logo: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Daily bread essentials',
    created_at: new Date().toISOString()
  },
  // Cakes & Pastries (subcat-12)
  {
    id: 'brand-29',
    subcategory_id: 'subcat-12',
    name: 'Winkies',
    slug: 'winkies',
    logo: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Delicious tea cakes and swiss rolls',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-30',
    subcategory_id: 'subcat-12',
    name: 'Elite',
    slug: 'elite',
    logo: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Rich muffins and plum cakes',
    created_at: new Date().toISOString()
  },
  // Fresh Vegetables (subcat-13)
  {
    id: 'brand-21',
    subcategory_id: 'subcat-13',
    name: 'Local Farm',
    slug: 'local-farm',
    logo: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Fresh from local farms',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-31',
    subcategory_id: 'subcat-13',
    name: 'Green Valley',
    slug: 'green-valley',
    logo: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Premium clean fresh vegetables',
    created_at: new Date().toISOString()
  },
  // Leafy Greens (subcat-14)
  {
    id: 'brand-32',
    subcategory_id: 'subcat-14',
    name: 'Farm Fresh Greens',
    slug: 'farm-fresh-greens',
    logo: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Organic spinach, coriander and herbs',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-33',
    subcategory_id: 'subcat-14',
    name: 'Hydro Farms',
    slug: 'hydro-farms',
    logo: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Hydroponic premium leafy salad greens',
    created_at: new Date().toISOString()
  },
  // Fresh Fruits (subcat-15)
  {
    id: 'brand-22',
    subcategory_id: 'subcat-15',
    name: 'Organic Orchards',
    slug: 'organic-orchards',
    logo: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Pure organic orchard fruits',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-34',
    subcategory_id: 'subcat-15',
    name: 'Sunny Farms',
    slug: 'sunny-farms',
    logo: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Sun-ripened oranges and papayas',
    created_at: new Date().toISOString()
  },
  // Exotic Fruits (subcat-16)
  {
    id: 'brand-35',
    subcategory_id: 'subcat-16',
    name: 'Exotic Growers',
    slug: 'exotic-growers',
    logo: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Fresh dragon fruits, kiwis and exotic treats',
    created_at: new Date().toISOString()
  },
  {
    id: 'brand-36',
    subcategory_id: 'subcat-16',
    name: 'Imported Delights',
    slug: 'imported-delights',
    logo: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=100',
    description: 'Imported blueberries, avocados and berries',
    created_at: new Date().toISOString()
  }
];

export const mockProducts: ProductWithVariants[] = [
  // Haldiram (brand-1, cat-1, subcat-1)
  {
    id: 'prod-1',
    brand_id: 'brand-1',
    category_id: 'cat-1',
    subcategory_id: 'subcat-1',
    name: 'Bhujia Sev',
    slug: 'haldiram-bhujia-sev',
    description: 'Classic spicy bhujia made from moth beans. Crispy, crunchy and delicious with authentic Rajasthani taste.',
    image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['bestseller', 'spicy'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-1-1', product_id: 'prod-1', quantity: '100g', price: 45, original_price: 50, discount: 10, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-1-2', product_id: 'prod-1', quantity: '200g', price: 85, original_price: 100, discount: 15, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-2',
    brand_id: 'brand-1',
    category_id: 'cat-1',
    subcategory_id: 'subcat-1',
    name: 'Aloo Bhujia',
    slug: 'haldiram-aloo-bhujia',
    description: 'Delicious potato-based bhujia with perfect blend of spices. A favorite tea-time snack.',
    image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['popular', 'savory'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-2-1', product_id: 'prod-2', quantity: '100g', price: 42, original_price: 48, discount: 12, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-2-2', product_id: 'prod-2', quantity: '200g', price: 80, original_price: 95, discount: 16, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Bikaji (brand-2, cat-1, subcat-1)
  {
    id: 'prod-3',
    brand_id: 'brand-2',
    category_id: 'cat-1',
    subcategory_id: 'subcat-1',
    name: 'Bikaji Bhujia',
    slug: 'bikaji-bhujia',
    description: 'Authentic Bikaneri bhujia with traditional recipe. Crispy and flavorful.',
    image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['traditional', 'bikaneri'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-3-1', product_id: 'prod-3', quantity: '200g', price: 80, original_price: 90, discount: 11, stock: 100, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-3-2', product_id: 'prod-3', quantity: '500g', price: 190, original_price: 220, discount: 13, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-4',
    brand_id: 'brand-2',
    category_id: 'cat-1',
    subcategory_id: 'subcat-1',
    name: 'Bikaji Kuch-Kuch Mix',
    slug: 'bikaji-kuch-kuch',
    description: 'Perfect sweet and sour mixture of namkeen items.',
    image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['mix', 'tasty'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-4-1', product_id: 'prod-4', quantity: '200g', price: 85, original_price: 100, discount: 15, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-4-2', product_id: 'prod-4', quantity: '400g', price: 160, original_price: 185, discount: 13, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Lays Chips (brand-4, cat-1, subcat-2)
  {
    id: 'prod-5',
    brand_id: 'brand-4',
    category_id: 'cat-1',
    subcategory_id: 'subcat-2',
    name: 'Classic Salted',
    slug: 'lays-classic-salted',
    description: "America's favorite classic salted potato chips. Light and crispy.",
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['classic', 'popular'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-5-1', product_id: 'prod-5', quantity: '25g', price: 10, original_price: 12, discount: 17, stock: 500, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-5-2', product_id: 'prod-5', quantity: '50g', price: 20, original_price: 25, discount: 20, stock: 400, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-6',
    brand_id: 'brand-4',
    category_id: 'cat-1',
    subcategory_id: 'subcat-2',
    name: 'India Magic Masala',
    slug: 'lays-india-magic-masala',
    description: 'The most loved Indian spicy flavor potato chips.',
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['bestseller', 'indian'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-6-1', product_id: 'prod-6', quantity: '25g', price: 10, original_price: 12, discount: 17, stock: 600, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-6-2', product_id: 'prod-6', quantity: '50g', price: 20, original_price: 25, discount: 20, stock: 500, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Pringles (brand-6, cat-1, subcat-2)
  {
    id: 'prod-7',
    brand_id: 'brand-6',
    category_id: 'cat-1',
    subcategory_id: 'subcat-2',
    name: 'Pringles Original',
    slug: 'pringles-original',
    description: "Classic original flavor stacked chips. Once you pop you can't stop.",
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['imported', 'premium'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-7-1', product_id: 'prod-7', quantity: '53g', price: 75, original_price: 85, discount: 12, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-7-2', product_id: 'prod-7', quantity: '110g', price: 150, original_price: 170, discount: 12, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-8',
    brand_id: 'brand-6',
    category_id: 'cat-1',
    subcategory_id: 'subcat-2',
    name: 'Pringles Sour Cream Onion',
    slug: 'pringles-sour-cream-onion',
    description: 'Tangy sour cream and onion flavor stacked chips.',
    image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['tangy', 'popular'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-8-1', product_id: 'prod-8', quantity: '53g', price: 75, original_price: 85, discount: 12, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-8-2', product_id: 'prod-8', quantity: '110g', price: 150, original_price: 170, discount: 12, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Parle (brand-7, cat-1, subcat-3)
  {
    id: 'prod-9',
    brand_id: 'brand-7',
    category_id: 'cat-1',
    subcategory_id: 'subcat-3',
    name: 'Parle-G Biscuit',
    slug: 'parle-g-biscuit',
    description: "India's most loved glucose biscuit. Perfect with tea.",
    image: 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['classic', 'glucose'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-9-1', product_id: 'prod-9', quantity: '128g', price: 25, original_price: 30, discount: 17, stock: 600, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-9-2', product_id: 'prod-9', quantity: '252g', price: 45, original_price: 55, discount: 18, stock: 400, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-10',
    brand_id: 'brand-7',
    category_id: 'cat-1',
    subcategory_id: 'subcat-3',
    name: 'Parle Monaco',
    slug: 'parle-monaco',
    description: 'Salty and crispy crackers. Perfect for snacking.',
    image: 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['salty', 'crackers'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-10-1', product_id: 'prod-10', quantity: '75g', price: 15, original_price: 20, discount: 25, stock: 350, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-10-2', product_id: 'prod-10', quantity: '150g', price: 28, original_price: 35, discount: 20, stock: 250, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Britannia (brand-8, cat-1, subcat-3)
  {
    id: 'prod-11',
    brand_id: 'brand-8',
    category_id: 'cat-1',
    subcategory_id: 'subcat-3',
    name: 'Good Day',
    slug: 'britannia-good-day',
    description: 'Butter cookies with rich taste. India favorite.',
    image: 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['butter', 'premium'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-11-1', product_id: 'prod-11', quantity: '125g', price: 30, original_price: 35, discount: 14, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-11-2', product_id: 'prod-11', quantity: '250g', price: 58, original_price: 70, discount: 17, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-12',
    brand_id: 'brand-8',
    category_id: 'cat-1',
    subcategory_id: 'subcat-3',
    name: 'Britannia Marie Gold',
    slug: 'britannia-marie-gold',
    description: 'Classic Marie tea biscuits, crisp and light.',
    image: 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['marie', 'tea-biscuit'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-12-1', product_id: 'prod-12', quantity: '120g', price: 20, original_price: 25, discount: 20, stock: 400, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-12-2', product_id: 'prod-12', quantity: '250g', price: 38, original_price: 45, discount: 15, stock: 300, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Maggi (brand-10, cat-1, subcat-4)
  {
    id: 'prod-13',
    brand_id: 'brand-10',
    category_id: 'cat-1',
    subcategory_id: 'subcat-4',
    name: 'Maggi Masala Noodles',
    slug: 'maggi-masala-noodles',
    description: "India's favorite 2-minute noodles with classic masala taste.",
    image: 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['bestseller', 'quick'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-13-1', product_id: 'prod-13', quantity: '70g', price: 14, original_price: 16, discount: 13, stock: 1000, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-13-2', product_id: 'prod-13', quantity: '280g', price: 52, original_price: 60, discount: 13, stock: 500, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-14',
    brand_id: 'brand-10',
    category_id: 'cat-1',
    subcategory_id: 'subcat-4',
    name: 'Atta Noodles',
    slug: 'maggi-atta-noodles',
    description: 'Healthier whole wheat noodles with same great taste.',
    image: 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['healthy', 'wheat'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-14-1', product_id: 'prod-14', quantity: '70g', price: 16, original_price: 18, discount: 11, stock: 500, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-14-2', product_id: 'prod-14', quantity: '140g', price: 32, original_price: 36, discount: 11, stock: 400, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Yippee (brand-11, cat-1, subcat-4)
  {
    id: 'prod-15',
    brand_id: 'brand-11',
    category_id: 'cat-1',
    subcategory_id: 'subcat-4',
    name: 'Yippee Masala Noodles',
    slug: 'yippee-masala-noodles',
    description: 'Non-sticky round noodles with rich tasty masala.',
    image: 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['non-sticky', 'tasty'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-15-1', product_id: 'prod-15', quantity: '70g', price: 14, original_price: 15, discount: 6, stock: 500, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-15-2', product_id: 'prod-15', quantity: '280g', price: 50, original_price: 55, discount: 9, stock: 300, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-16',
    brand_id: 'brand-11',
    category_id: 'cat-1',
    subcategory_id: 'subcat-4',
    name: 'Yippee Moods Noodles',
    slug: 'yippee-moods-noodles',
    description: 'Spicy noodles with different mood-boosting masala packs.',
    image: 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['spicy', 'new'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-16-1', product_id: 'prod-16', quantity: '70g', price: 15, original_price: 18, discount: 16, stock: 400, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-16-2', product_id: 'prod-16', quantity: '280g', price: 55, original_price: 65, discount: 15, stock: 300, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Coca-Cola (brand-12, cat-2, subcat-5)
  {
    id: 'prod-17',
    brand_id: 'brand-12',
    category_id: 'cat-2',
    subcategory_id: 'subcat-5',
    name: 'Coca-Cola Classic',
    slug: 'coca-cola-cola',
    description: 'The original cola taste. Refresh your world.',
    image: 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['refreshing', 'classic'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-17-1', product_id: 'prod-17', quantity: '600ml', price: 38, original_price: 45, discount: 16, stock: 400, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-17-2', product_id: 'prod-17', quantity: '2L', price: 70, original_price: 90, discount: 22, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-18',
    brand_id: 'brand-12',
    category_id: 'cat-2',
    subcategory_id: 'subcat-5',
    name: 'Diet Coke',
    slug: 'diet-coke',
    description: 'Sugar free Coca-Cola taste with zero calories.',
    image: 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['sugarfree', 'diet'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-18-1', product_id: 'prod-18', quantity: '300ml Can', price: 40, original_price: 40, discount: 0, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-18-2', product_id: 'prod-18', quantity: '600ml', price: 45, original_price: 50, discount: 10, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Pepsi (brand-13, cat-2, subcat-5)
  {
    id: 'prod-19',
    brand_id: 'brand-13',
    category_id: 'cat-2',
    subcategory_id: 'subcat-5',
    name: 'Pepsi Cola',
    slug: 'pepsi-cola',
    description: 'Refreshing carbonated soft drink to uplift your spirits.',
    image: 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['pepsi', 'refreshing'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-19-1', product_id: 'prod-19', quantity: '600ml', price: 38, original_price: 45, discount: 16, stock: 400, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-19-2', product_id: 'prod-19', quantity: '2L', price: 70, original_price: 90, discount: 22, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-20',
    brand_id: 'brand-13',
    category_id: 'cat-2',
    subcategory_id: 'subcat-5',
    name: 'Mirinda Orange',
    slug: 'mirinda-orange',
    description: 'Delicious orange flavored soft drink, fizzy and sweet.',
    image: 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['orange', 'sweet'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-20-1', product_id: 'prod-20', quantity: '600ml', price: 35, original_price: 40, discount: 12, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-20-2', product_id: 'prod-20', quantity: '2L', price: 65, original_price: 80, discount: 18, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Real (brand-15, cat-2, subcat-6)
  {
    id: 'prod-21',
    brand_id: 'brand-15',
    category_id: 'cat-2',
    subcategory_id: 'subcat-6',
    name: 'Real Orange Juice',
    slug: 'real-orange-juice',
    description: '100 percent orange juice with no added sugar.',
    image: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['healthy', 'natural'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-21-1', product_id: 'prod-21', quantity: '200ml', price: 25, original_price: 30, discount: 17, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-21-2', product_id: 'prod-21', quantity: '1L', price: 85, original_price: 99, discount: 14, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-22',
    brand_id: 'brand-15',
    category_id: 'cat-2',
    subcategory_id: 'subcat-6',
    name: 'Real Mixed Fruit Juice',
    slug: 'real-mixed-fruit-juice',
    description: 'Blend of multiple fruit juices. Rich in vitamins.',
    image: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['fruity', 'vitamin'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-22-1', product_id: 'prod-22', quantity: '200ml', price: 25, original_price: 30, discount: 17, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-22-2', product_id: 'prod-22', quantity: '1L', price: 85, original_price: 99, discount: 14, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Tropicana (brand-16, cat-2, subcat-6)
  {
    id: 'prod-23',
    brand_id: 'brand-16',
    category_id: 'cat-2',
    subcategory_id: 'subcat-6',
    name: 'Tropicana Apple Juice',
    slug: 'tropicana-apple-juice',
    description: 'Sweet apple juice, pure and high-quality.',
    image: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['apple', 'pure'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-23-1', product_id: 'prod-23', quantity: '200ml', price: 30, original_price: 35, discount: 14, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-23-2', product_id: 'prod-23', quantity: '1L', price: 95, original_price: 110, discount: 13, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-24',
    brand_id: 'brand-16',
    category_id: 'cat-2',
    subcategory_id: 'subcat-6',
    name: 'Tropicana Cranberry Juice',
    slug: 'tropicana-cranberry-juice',
    description: 'Tart and refreshing cranberry juice.',
    image: 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['cranberry', 'refreshing'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-24-1', product_id: 'prod-24', quantity: '200ml', price: 35, original_price: 40, discount: 12, stock: 250, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-24-2', product_id: 'prod-24', quantity: '1L', price: 110, original_price: 130, discount: 15, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Tata Tea (brand-23, cat-2, subcat-7)
  {
    id: 'prod-25',
    brand_id: 'brand-23',
    category_id: 'cat-2',
    subcategory_id: 'subcat-7',
    name: 'Tata Tea Premium',
    slug: 'tata-tea-premium',
    description: "India's most popular daily tea leaves, rich in flavor.",
    image: 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['tea', 'popular'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-25-1', product_id: 'prod-25', quantity: '250g', price: 100, original_price: 120, discount: 16, stock: 500, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-25-2', product_id: 'prod-25', quantity: '500g', price: 190, original_price: 230, discount: 17, stock: 400, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-26',
    brand_id: 'brand-23',
    category_id: 'cat-2',
    subcategory_id: 'subcat-7',
    name: 'Tata Tea Gold',
    slug: 'tata-tea-gold',
    description: 'Premium tea blend with rich aroma and golden color.',
    image: 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['premium', 'aroma'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-26-1', product_id: 'prod-26', quantity: '250g', price: 135, original_price: 150, discount: 10, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-26-2', product_id: 'prod-26', quantity: '500g', price: 260, original_price: 290, discount: 10, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Nescafe (brand-24, cat-2, subcat-7)
  {
    id: 'prod-27',
    brand_id: 'brand-24',
    category_id: 'cat-2',
    subcategory_id: 'subcat-7',
    name: 'Nescafe Classic',
    slug: 'nescafe-classic',
    description: '100% pure instant coffee powder, rich taste and aroma.',
    image: 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['coffee', 'classic'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-27-1', product_id: 'prod-27', quantity: '50g', price: 165, original_price: 185, discount: 10, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-27-2', product_id: 'prod-27', quantity: '100g', price: 310, original_price: 350, discount: 11, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-28',
    brand_id: 'brand-24',
    category_id: 'cat-2',
    subcategory_id: 'subcat-7',
    name: 'Nescafe Gold',
    slug: 'nescafe-gold',
    description: 'Premium freeze-dried coffee blend for a smoother taste.',
    image: 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['coffee', 'gold', 'premium'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-28-1', product_id: 'prod-28', quantity: '50g', price: 280, original_price: 320, discount: 12, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-28-2', product_id: 'prod-28', quantity: '100g', price: 530, original_price: 600, discount: 11, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Amul Milk (brand-17, cat-3, subcat-8)
  {
    id: 'prod-29',
    brand_id: 'brand-17',
    category_id: 'cat-3',
    subcategory_id: 'subcat-8',
    name: 'Amul Taaza Toned Milk',
    slug: 'amul-toned-milk',
    description: 'Fresh toned milk pasteurized for purity. Perfect for daily use.',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['daily', 'fresh'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-29-1', product_id: 'prod-29', quantity: '500ml', price: 32, original_price: 38, discount: 16, stock: 400, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-29-2', product_id: 'prod-29', quantity: '1L', price: 58, original_price: 65, discount: 11, stock: 300, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-30',
    brand_id: 'brand-17',
    category_id: 'cat-3',
    subcategory_id: 'subcat-8',
    name: 'Amul Gold Full Cream Milk',
    slug: 'amul-full-cream-milk',
    description: 'Rich full cream pasteurized milk for daily health.',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['creamy', 'rich'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-30-1', product_id: 'prod-30', quantity: '500ml', price: 36, original_price: 40, discount: 10, stock: 350, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-30-2', product_id: 'prod-30', quantity: '1L', price: 68, original_price: 75, discount: 9, stock: 250, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Mother Dairy Milk (brand-18, cat-3, subcat-8)
  {
    id: 'prod-31',
    brand_id: 'brand-18',
    category_id: 'cat-3',
    subcategory_id: 'subcat-8',
    name: 'Mother Dairy Toned Milk',
    slug: 'mother-dairy-toned-milk',
    description: 'Pasteurized toned milk, ideal for tea, coffee and drinking.',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['toned', 'fresh'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-31-1', product_id: 'prod-31', quantity: '500ml', price: 31, original_price: 35, discount: 11, stock: 400, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-31-2', product_id: 'prod-31', quantity: '1L', price: 57, original_price: 62, discount: 8, stock: 300, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-32',
    brand_id: 'brand-18',
    category_id: 'cat-3',
    subcategory_id: 'subcat-8',
    name: 'Mother Dairy Cow Milk',
    slug: 'mother-dairy-cow-milk',
    description: 'Fresh pasteurized cow milk, easy to digest and healthy.',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['cow-milk', 'healthy'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-32-1', product_id: 'prod-32', quantity: '500ml', price: 33, original_price: 36, discount: 8, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-32-2', product_id: 'prod-32', quantity: '1L', price: 60, original_price: 66, discount: 9, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Amul Dairy Paneer/Cheese (brand-25, cat-3, subcat-9)
  {
    id: 'prod-33',
    brand_id: 'brand-25',
    category_id: 'cat-3',
    subcategory_id: 'subcat-9',
    name: 'Amul Fresh Paneer',
    slug: 'amul-fresh-paneer',
    description: 'Pure dairy paneer cubes, soft and delicious.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['paneer', 'fresh'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-33-1', product_id: 'prod-33', quantity: '200g', price: 90, original_price: 100, discount: 10, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-33-2', product_id: 'prod-33', quantity: '500g', price: 210, original_price: 240, discount: 12, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-34',
    brand_id: 'brand-25',
    category_id: 'cat-3',
    subcategory_id: 'subcat-9',
    name: 'Amul Cheese Blocks',
    slug: 'amul-cheese-blocks',
    description: 'Processed cheese blocks, rich in dairy nutrition.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['cheese', 'block'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-34-1', product_id: 'prod-34', quantity: '200g', price: 140, original_price: 150, discount: 6, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-34-2', product_id: 'prod-34', quantity: '500g', price: 330, original_price: 360, discount: 8, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Britannia Dairy Paneer/Cheese (brand-26, cat-3, subcat-9)
  {
    id: 'prod-35',
    brand_id: 'brand-26',
    category_id: 'cat-3',
    subcategory_id: 'subcat-9',
    name: 'Britannia Cheese Slices',
    slug: 'britannia-cheese-slices',
    description: 'Cheese slices perfect for burger, sandwich and toasts.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['cheese', 'slices'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-35-1', product_id: 'prod-35', quantity: '100g', price: 85, original_price: 95, discount: 10, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-35-2', product_id: 'prod-35', quantity: '200g', price: 160, original_price: 180, discount: 11, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-36',
    brand_id: 'brand-26',
    category_id: 'cat-3',
    subcategory_id: 'subcat-9',
    name: 'Britannia Fresh Paneer',
    slug: 'britannia-fresh-paneer',
    description: 'Hygienically packed premium cottage cheese block.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['paneer', 'cottage-cheese'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-36-1', product_id: 'prod-36', quantity: '200g', price: 95, original_price: 105, discount: 9, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-36-2', product_id: 'prod-36', quantity: '400g', price: 180, original_price: 200, discount: 10, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Mother Dairy Yogurt (brand-27, cat-3, subcat-10)
  {
    id: 'prod-37',
    brand_id: 'brand-27',
    category_id: 'cat-3',
    subcategory_id: 'subcat-10',
    name: 'Mother Dairy Classic Dahi',
    slug: 'mother-dairy-classic-dahi',
    description: 'Thick and creamy classic curd, perfect for daily meals.',
    image: 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['curd', 'dahi'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-37-1', product_id: 'prod-37', quantity: '200g', price: 35, original_price: 40, discount: 12, stock: 400, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-37-2', product_id: 'prod-37', quantity: '400g', price: 65, original_price: 75, discount: 13, stock: 300, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-38',
    brand_id: 'brand-27',
    category_id: 'cat-3',
    subcategory_id: 'subcat-10',
    name: 'Mother Dairy Mango Yogurt',
    slug: 'mother-dairy-mango-yogurt',
    description: 'Sweet mango flavored creamy yogurt snack.',
    image: 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['yogurt', 'mango', 'sweet'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-38-1', product_id: 'prod-38', quantity: '100g', price: 25, original_price: 30, discount: 16, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-38-2', product_id: 'prod-38', quantity: '200g', price: 45, original_price: 50, discount: 10, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Epigamia (brand-28, cat-3, subcat-10)
  {
    id: 'prod-39',
    brand_id: 'brand-28',
    category_id: 'cat-3',
    subcategory_id: 'subcat-10',
    name: 'Epigamia Greek Yogurt Blueberry',
    slug: 'epigamia-yogurt-blueberry',
    description: 'High protein Greek yogurt with real blueberry pulp.',
    image: 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['greek-yogurt', 'blueberry'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-39-1', product_id: 'prod-39', quantity: '90g', price: 60, original_price: 65, discount: 7, stock: 250, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-39-2', product_id: 'prod-39', quantity: '180g', price: 110, original_price: 120, discount: 8, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-40',
    brand_id: 'brand-28',
    category_id: 'cat-3',
    subcategory_id: 'subcat-10',
    name: 'Epigamia Greek Yogurt Strawberry',
    slug: 'epigamia-yogurt-strawberry',
    description: 'High protein Greek yogurt with real strawberry pulp.',
    image: 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['greek-yogurt', 'strawberry'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-40-1', product_id: 'prod-40', quantity: '90g', price: 60, original_price: 65, discount: 7, stock: 250, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-40-2', product_id: 'prod-40', quantity: '180g', price: 110, original_price: 120, discount: 8, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Harvest Gold Bread (brand-19, cat-4, subcat-11)
  {
    id: 'prod-41',
    brand_id: 'brand-19',
    category_id: 'cat-4',
    subcategory_id: 'subcat-11',
    name: 'Whole Wheat Bread',
    slug: 'harvest-gold-whole-wheat-bread',
    description: 'Soft and fresh whole wheat bread high in fiber.',
    image: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['healthy', 'fiber'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-41-1', product_id: 'prod-41', quantity: '400g', price: 45, original_price: 50, discount: 10, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-41-2', product_id: 'prod-41', quantity: '800g', price: 85, original_price: 95, discount: 11, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-42',
    brand_id: 'brand-19',
    category_id: 'cat-4',
    subcategory_id: 'subcat-11',
    name: 'White Bread',
    slug: 'harvest-gold-white-bread',
    description: 'Classic soft white bread, perfect for toast and sandwiches.',
    image: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['soft', 'classic'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-42-1', product_id: 'prod-42', quantity: '350g', price: 30, original_price: 35, discount: 14, stock: 350, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-42-2', product_id: 'prod-42', quantity: '700g', price: 55, original_price: 65, discount: 15, stock: 250, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Britannia Bread (brand-20, cat-4, subcat-11)
  {
    id: 'prod-43',
    brand_id: 'brand-20',
    category_id: 'cat-4',
    subcategory_id: 'subcat-11',
    name: 'Britannia Atta Bread',
    slug: 'britannia-atta-bread',
    description: '100% whole wheat flour bread, nutritious and healthy.',
    image: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['atta', 'healthy'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-43-1', product_id: 'prod-43', quantity: '400g', price: 45, original_price: 50, discount: 10, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-43-2', product_id: 'prod-43', quantity: '800g', price: 85, original_price: 95, discount: 11, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-44',
    brand_id: 'brand-20',
    category_id: 'cat-4',
    subcategory_id: 'subcat-11',
    name: 'Britannia Sandwich Bread',
    slug: 'britannia-sandwich-bread',
    description: 'Large size white bread slice, ideal for club sandwiches.',
    image: 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['sandwich', 'white'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-44-1', product_id: 'prod-44', quantity: '400g', price: 35, original_price: 40, discount: 12, stock: 350, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-44-2', product_id: 'prod-44', quantity: '800g', price: 65, original_price: 75, discount: 13, stock: 250, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Winkies (brand-29, cat-4, subcat-12)
  {
    id: 'prod-45',
    brand_id: 'brand-29',
    category_id: 'cat-4',
    subcategory_id: 'subcat-12',
    name: 'Winkies Swiss Roll',
    slug: 'winkies-swiss-roll',
    description: 'Soft sponge roll filled with creamy jam and cream.',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['sweet', 'swiss-roll'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-45-1', product_id: 'prod-45', quantity: '150g', price: 60, original_price: 70, discount: 14, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-45-2', product_id: 'prod-45', quantity: '300g', price: 110, original_price: 130, discount: 15, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-46',
    brand_id: 'brand-29',
    category_id: 'cat-4',
    subcategory_id: 'subcat-12',
    name: 'Winkies Fruit Cake',
    slug: 'winkies-fruit-cake',
    description: 'Baked bar cake with sweet candied fruits.',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['fruit-cake', 'baked'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-46-1', product_id: 'prod-46', quantity: '120g', price: 50, original_price: 60, discount: 16, stock: 250, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-46-2', product_id: 'prod-46', quantity: '250g', price: 95, original_price: 110, discount: 13, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Elite (brand-30, cat-4, subcat-12)
  {
    id: 'prod-47',
    brand_id: 'brand-30',
    category_id: 'cat-4',
    subcategory_id: 'subcat-12',
    name: 'Elite Chocolate Muffin',
    slug: 'elite-chocolate-muffin',
    description: 'Soft sweet muffins loaded with chocolate chips.',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['chocolate', 'muffin'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-47-1', product_id: 'prod-47', quantity: '100g', price: 40, original_price: 45, discount: 11, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-47-2', product_id: 'prod-47', quantity: '200g', price: 75, original_price: 85, discount: 11, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-48',
    brand_id: 'brand-30',
    category_id: 'cat-4',
    subcategory_id: 'subcat-12',
    name: 'Elite Plum Cake',
    slug: 'elite-plum-cake',
    description: 'Rich dark plum cake filled with dry fruits.',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['plum-cake', 'rich'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-48-1', product_id: 'prod-48', quantity: '250g', price: 120, original_price: 140, discount: 14, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-48-2', product_id: 'prod-48', quantity: '500g', price: 230, original_price: 260, discount: 11, stock: 80, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Local Farm Veg (brand-21, cat-5, subcat-13)
  {
    id: 'prod-49',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Tomatoes',
    slug: 'fresh-tomatoes',
    description: 'Organic local tomatoes, red and ripe.',
    image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'organic'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-49-1', product_id: 'prod-49', quantity: '500g', price: 20, original_price: 25, discount: 20, stock: 100, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-49-2', product_id: 'prod-49', quantity: '1kg', price: 38, original_price: 50, discount: 24, stock: 80, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-50',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Potatoes',
    slug: 'fresh-potatoes',
    description: 'Freshly harvested local potatoes, clean and high-quality.',
    image: 'https://images.pexels.com/photos/144248/potatoes-vegetables-raw-food-144248.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'essential'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-50-1', product_id: 'prod-50', quantity: '1kg', price: 25, original_price: 30, discount: 16, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-50-2', product_id: 'prod-50', quantity: '2kg', price: 48, original_price: 60, discount: 20, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Green Valley Veg (brand-31, cat-5, subcat-13)
  {
    id: 'prod-51',
    brand_id: 'brand-31',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Onions',
    slug: 'fresh-onions',
    description: 'Fresh and crispy red onions, perfect for salads and cooking.',
    image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['essential', 'fresh'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-51-1', product_id: 'prod-51', quantity: '1kg', price: 30, original_price: 35, discount: 14, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-51-2', product_id: 'prod-51', quantity: '2kg', price: 55, original_price: 65, discount: 15, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-52',
    brand_id: 'brand-31',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Cauliflower',
    slug: 'fresh-cauliflower',
    description: 'Clean and tight white cauliflower head.',
    image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['veg', 'fresh'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-52-1', product_id: 'prod-52', quantity: '1 piece', price: 25, original_price: 30, discount: 16, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-52-2', product_id: 'prod-52', quantity: '2 pieces', price: 45, original_price: 55, discount: 18, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v1',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Green Capsicum (Shimla Mirch)',
    slug: 'green-capsicum',
    description: 'Crisp and shiny dark green capsicum, farm fresh.',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'salad', 'bestseller'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v1-1', product_id: 'prod-v1', quantity: '500g', price: 32, original_price: 40, discount: 20, stock: 120, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v1-2', product_id: 'prod-v1', quantity: '1kg', price: 60, original_price: 75, discount: 20, stock: 90, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v2',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Orange Carrots (Gajar)',
    slug: 'fresh-orange-carrots',
    description: 'Sweet, juicy and crunchy orange carrots.',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'sweet', 'salad'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v2-1', product_id: 'prod-v2', quantity: '500g', price: 25, original_price: 32, discount: 21, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v2-2', product_id: 'prod-v2', quantity: '1kg', price: 46, original_price: 60, discount: 23, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v3',
    brand_id: 'brand-31',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Green Cucumber (Kheera)',
    slug: 'fresh-cucumber',
    description: 'Crispy and hydrating local fresh green cucumbers.',
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'salad', 'cooling'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v3-1', product_id: 'prod-v3', quantity: '500g', price: 20, original_price: 25, discount: 20, stock: 180, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v3-2', product_id: 'prod-v3', quantity: '1kg', price: 36, original_price: 48, discount: 25, stock: 120, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v4',
    brand_id: 'brand-31',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Lady Finger (Bhindi)',
    slug: 'fresh-lady-finger',
    description: 'Tender and slender fresh green okra/bhindi.',
    image: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'daily'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v4-1', product_id: 'prod-v4', quantity: '500g', price: 28, original_price: 36, discount: 22, stock: 140, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v4-2', product_id: 'prod-v4', quantity: '1kg', price: 52, original_price: 70, discount: 25, stock: 80, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v5',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Spicy Green Chillies (Hari Mirch)',
    slug: 'green-chillies',
    description: 'Spicy and fresh pungent green chillies for tadka.',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=compress&cs=tinysrgb&w=400',
    tags: ['spicy', 'essential'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v5-1', product_id: 'prod-v5', quantity: '100g', price: 10, original_price: 15, discount: 33, stock: 250, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v5-2', product_id: 'prod-v5', quantity: '250g', price: 22, original_price: 32, discount: 31, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v6',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Ginger (Adrak)',
    slug: 'fresh-ginger',
    description: 'Aromatic and spicy root ginger, washed and clean.',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=compress&cs=tinysrgb&w=400',
    tags: ['aromatic', 'essential'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v6-1', product_id: 'prod-v6', quantity: '100g', price: 18, original_price: 24, discount: 25, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v6-2', product_id: 'prod-v6', quantity: '250g', price: 42, original_price: 55, discount: 23, stock: 120, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v7',
    brand_id: 'brand-31',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Garlic Bulbs (Desi Lehsun)',
    slug: 'fresh-garlic',
    description: 'Pungent whole garlic bulbs with large aromatic cloves.',
    image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=compress&cs=tinysrgb&w=400',
    tags: ['essential', 'cooking'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v7-1', product_id: 'prod-v7', quantity: '200g', price: 35, original_price: 45, discount: 22, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v7-2', product_id: 'prod-v7', quantity: '500g', price: 80, original_price: 100, discount: 20, stock: 90, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v8',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Juicy Yellow Lemon (Nimbu)',
    slug: 'fresh-lemon',
    description: 'Zesty and juicy thin-skinned yellow lemons.',
    image: 'https://images.unsplash.com/photo-1533082831833-2a5a755cdd76?auto=compress&cs=tinysrgb&w=400',
    tags: ['citrus', 'essential'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v8-1', product_id: 'prod-v8', quantity: '4 pieces', price: 20, original_price: 25, discount: 20, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v8-2', product_id: 'prod-v8', quantity: '8 pieces', price: 38, original_price: 48, discount: 20, stock: 200, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v9',
    brand_id: 'brand-31',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Bottle Gourd (Lauki / Ghiya)',
    slug: 'fresh-bottle-gourd',
    description: 'Tender, sweet and watery green bottle gourd.',
    image: 'https://images.pexels.com/photos/5966630/pexels-photo-5966630.jpeg?auto=compress&cs=tinysrgb&w=600',
    tags: ['healthy', 'light'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v9-1', product_id: 'prod-v9', quantity: '1 piece (600-800g)', price: 25, original_price: 32, discount: 21, stock: 110, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v9-2', product_id: 'prod-v9', quantity: '2 pieces', price: 46, original_price: 60, discount: 23, stock: 70, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-v10',
    brand_id: 'brand-21',
    category_id: 'cat-5',
    subcategory_id: 'subcat-13',
    name: 'Fresh Green Peas (Hari Matar)',
    slug: 'fresh-green-peas',
    description: 'Sweet and plump freshly shelled green peas in pod.',
    image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=compress&cs=tinysrgb&w=400',
    tags: ['sweet', 'fresh', 'seasonal'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-v10-1', product_id: 'prod-v10', quantity: '500g', price: 40, original_price: 52, discount: 23, stock: 160, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-v10-2', product_id: 'prod-v10', quantity: '1kg', price: 76, original_price: 100, discount: 24, stock: 95, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Farm Fresh Greens (brand-32, cat-5, subcat-14)
  {
    id: 'prod-53',
    brand_id: 'brand-32',
    category_id: 'cat-5',
    subcategory_id: 'subcat-14',
    name: 'Spinach (Palak)',
    slug: 'spinach-palak',
    description: 'Fresh organic green spinach leaves, iron-rich and clean.',
    image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['organic', 'leafy'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-53-1', product_id: 'prod-53', quantity: '250g', price: 15, original_price: 20, discount: 25, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-53-2', product_id: 'prod-53', quantity: '500g', price: 28, original_price: 35, discount: 20, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-54',
    brand_id: 'brand-32',
    category_id: 'cat-5',
    subcategory_id: 'subcat-14',
    name: 'Coriander Leaves',
    slug: 'coriander-leaves',
    description: 'Fresh aromatic coriander leaves for garnishing.',
    image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['herb', 'fresh'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-54-1', product_id: 'prod-54', quantity: '100g', price: 10, original_price: 15, discount: 33, stock: 300, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-54-2', product_id: 'prod-54', quantity: '250g', price: 22, original_price: 30, discount: 26, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Hydro Farms (brand-33, cat-5, subcat-14)
  {
    id: 'prod-55',
    brand_id: 'brand-33',
    category_id: 'cat-5',
    subcategory_id: 'subcat-14',
    name: 'Hydroponic Lettuce',
    slug: 'hydroponic-lettuce',
    description: 'Fresh pesticide-free hydroponic salad lettuce leaves.',
    image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['hydroponic', 'premium'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-55-1', product_id: 'prod-55', quantity: '150g', price: 60, original_price: 70, discount: 14, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-55-2', product_id: 'prod-55', quantity: '300g', price: 110, original_price: 130, discount: 15, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-56',
    brand_id: 'brand-33',
    category_id: 'cat-5',
    subcategory_id: 'subcat-14',
    name: 'Hydroponic Basil',
    slug: 'hydroponic-basil',
    description: 'Fresh and premium hydroponically grown Italian sweet basil.',
    image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['basil', 'premium'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-56-1', product_id: 'prod-56', quantity: '50g', price: 40, original_price: 45, discount: 11, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-56-2', product_id: 'prod-56', quantity: '100g', price: 75, original_price: 85, discount: 11, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Organic Orchards (brand-22, cat-6, subcat-15)
  {
    id: 'prod-57',
    brand_id: 'brand-22',
    category_id: 'cat-6',
    subcategory_id: 'subcat-15',
    name: 'Fresh Bananas',
    slug: 'fresh-bananas',
    description: 'Sweet and perfectly ripe bananas from premium orchards.',
    image: 'https://images.pexels.com/photos/22883/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'sweet'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-57-1', product_id: 'prod-57', quantity: '1 Dozen', price: 50, original_price: 60, discount: 16, stock: 120, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-57-2', product_id: 'prod-57', quantity: '2 Dozen', price: 95, original_price: 115, discount: 17, stock: 80, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-58',
    brand_id: 'brand-22',
    category_id: 'cat-6',
    subcategory_id: 'subcat-15',
    name: 'Red Apples',
    slug: 'fresh-red-apples',
    description: 'Crispy and sweet red apples, handpicked for quality.',
    image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['fresh', 'crispy'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-58-1', product_id: 'prod-58', quantity: '500g', price: 90, original_price: 110, discount: 18, stock: 100, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-58-2', product_id: 'prod-58', quantity: '1kg', price: 170, original_price: 220, discount: 22, stock: 80, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Sunny Farms (brand-34, cat-6, subcat-15)
  {
    id: 'prod-59',
    brand_id: 'brand-34',
    category_id: 'cat-6',
    subcategory_id: 'subcat-15',
    name: 'Sweet Oranges',
    slug: 'sweet-oranges',
    description: 'Juicy and sweet oranges, source of Vitamin C.',
    image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['orange', 'citrus'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-59-1', product_id: 'prod-59', quantity: '500g', price: 45, original_price: 55, discount: 18, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-59-2', product_id: 'prod-59', quantity: '1kg', price: 85, original_price: 100, discount: 15, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-60',
    brand_id: 'brand-34',
    category_id: 'cat-6',
    subcategory_id: 'subcat-15',
    name: 'Fresh Papaya',
    slug: 'fresh-papaya',
    description: 'Sweet and fully ripe yellow papayas.',
    image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['papaya', 'sweet'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-60-1', product_id: 'prod-60', quantity: '1 piece', price: 60, original_price: 70, discount: 14, stock: 100, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-60-2', product_id: 'prod-60', quantity: '2 pieces', price: 110, original_price: 135, discount: 18, stock: 50, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Exotic Growers Fruits (brand-35, cat-6, subcat-16)
  {
    id: 'prod-61',
    brand_id: 'brand-35',
    category_id: 'cat-6',
    subcategory_id: 'subcat-16',
    name: 'Dragon Fruit',
    slug: 'dragon-fruit',
    description: 'Fresh exotic dragon fruit with white flesh and black seeds.',
    image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['exotic', 'dragonfruit'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-61-1', product_id: 'prod-61', quantity: '1 piece', price: 80, original_price: 100, discount: 20, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-61-2', product_id: 'prod-61', quantity: '2 pieces', price: 150, original_price: 185, discount: 18, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-62',
    brand_id: 'brand-35',
    category_id: 'cat-6',
    subcategory_id: 'subcat-16',
    name: 'Kiwi Fruit',
    slug: 'kiwi-fruit',
    description: 'Fresh kiwi fruits pack, tangy and packed with nutrients.',
    image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['kiwi', 'tangy'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-62-1', product_id: 'prod-62', quantity: '3 pieces', price: 70, original_price: 80, discount: 12, stock: 200, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-62-2', product_id: 'prod-62', quantity: '6 pieces', price: 130, original_price: 150, discount: 13, stock: 150, is_available: true, created_at: new Date().toISOString() }
    ]
  },

  // Imported Delights Fruits (brand-36, cat-6, subcat-16)
  {
    id: 'prod-63',
    brand_id: 'brand-36',
    category_id: 'cat-6',
    subcategory_id: 'subcat-16',
    name: 'Imported Blueberries',
    slug: 'imported-blueberries',
    description: 'Fresh sweet blueberries imported from quality farms.',
    image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['blueberry', 'imported'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-63-1', product_id: 'prod-63', quantity: '125g Pack', price: 180, original_price: 220, discount: 18, stock: 150, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-63-2', product_id: 'prod-63', quantity: '250g Pack', price: 340, original_price: 400, discount: 15, stock: 100, is_available: true, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'prod-64',
    brand_id: 'brand-36',
    category_id: 'cat-6',
    subcategory_id: 'subcat-16',
    name: 'Avocado (Imported)',
    slug: 'imported-avocado',
    description: 'Premium rich butter avocado fruit, perfect for toasts and smoothies.',
    image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['avocado', 'imported'],
    is_available: true,
    created_at: new Date().toISOString(),
    variants: [
      { id: 'var-64-1', product_id: 'prod-64', quantity: '1 piece', price: 120, original_price: 150, discount: 20, stock: 100, is_available: true, created_at: new Date().toISOString() },
      { id: 'var-64-2', product_id: 'prod-64', quantity: '2 pieces', price: 220, original_price: 280, discount: 21, stock: 50, is_available: true, created_at: new Date().toISOString() }
    ]
  }
];
