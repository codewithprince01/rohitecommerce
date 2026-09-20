import slugify from 'slugify';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../config/logger.js';
import { Category, Subcategory, Brand, Product, ProductVariant } from '../models/Catalog.js';

const slug = (s) => slugify(s, { lower: true, strict: true });

const ADDITIONAL_CATALOG = [
  {
    name: 'Vegetables',
    bg_color: 'bg-emerald-100',
    image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort_order: 1,
    subs: [
      {
        name: 'Fresh Vegetables',
        image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=400',
        sort_order: 1,
        brands: [
          {
            name: 'Local Farm',
            logo: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=100',
            description: 'Fresh farm-sourced produce daily',
          },
          {
            name: 'Green Valley',
            logo: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=100',
            description: 'Cleaned and sorted premium vegetables',
          },
        ],
        products: [
          {
            name: 'Bottle Gourd (Lauki / Ghiya)',
            brand: 'Green Valley',
            description: 'Tender, sweet and watery green bottle gourd. Freshly procured daily from trusted farms.',
            image: 'https://images.pexels.com/photos/5966630/pexels-photo-5966630.jpeg?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'daily', 'healthy'],
            variants: [
              { quantity: '1 piece (600-800g)', price: 25, original_price: 32, discount: 21, stock: 120 },
              { quantity: '2 pieces', price: 46, original_price: 60, discount: 23, stock: 80 },
            ],
          },
          {
            name: 'Fresh Tomatoes',
            brand: 'Local Farm',
            description: 'Naturally ripened, firm and juicy red tomatoes.',
            image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'essential'],
            variants: [
              { quantity: '500g', price: 20, original_price: 25, discount: 20, stock: 150 },
              { quantity: '1kg', price: 38, original_price: 50, discount: 24, stock: 100 },
            ],
          },
          {
            name: 'Fresh Potatoes',
            brand: 'Local Farm',
            description: 'Clean, smooth-skinned golden potatoes suitable for daily cooking.',
            image: 'https://images.pexels.com/photos/144248/potatoes-vegetables-raw-food-144248.jpeg?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'essential'],
            variants: [
              { quantity: '1kg', price: 25, original_price: 30, discount: 16, stock: 200 },
              { quantity: '2kg', price: 48, original_price: 60, discount: 20, stock: 150 },
            ],
          },
          {
            name: 'Fresh Onions',
            brand: 'Green Valley',
            description: 'Crisp and pungent red onions, hand-sorted for quality.',
            image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'essential'],
            variants: [
              { quantity: '1kg', price: 30, original_price: 35, discount: 14, stock: 250 },
              { quantity: '2kg', price: 55, original_price: 65, discount: 15, stock: 180 },
            ],
          },
          {
            name: 'Green Capsicum (Shimla Mirch)',
            brand: 'Local Farm',
            description: 'Shiny, crunchy dark green bell peppers/capsicum.',
            image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'salad'],
            variants: [
              { quantity: '500g', price: 32, original_price: 40, discount: 20, stock: 100 },
              { quantity: '1kg', price: 60, original_price: 75, discount: 20, stock: 75 },
            ],
          },
          {
            name: 'Fresh Orange Carrots (Gajar)',
            brand: 'Local Farm',
            description: 'Crunchy and sweet orange carrots, washed and clean.',
            image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'sweet'],
            variants: [
              { quantity: '500g', price: 25, original_price: 32, discount: 21, stock: 140 },
              { quantity: '1kg', price: 46, original_price: 60, discount: 23, stock: 90 },
            ],
          },
          {
            name: 'Fresh Green Cucumber (Kheera)',
            brand: 'Green Valley',
            description: 'Refreshing and crisp green cucumbers, perfect for salads.',
            image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'salad'],
            variants: [
              { quantity: '500g', price: 20, original_price: 25, discount: 20, stock: 160 },
              { quantity: '1kg', price: 36, original_price: 48, discount: 25, stock: 110 },
            ],
          },
          {
            name: 'Lady Finger (Bhindi)',
            brand: 'Green Valley',
            description: 'Tender green lady finger/okra, free of fibrous stems.',
            image: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=compress&cs=tinysrgb&w=600',
            tags: ['fresh', 'daily'],
            variants: [
              { quantity: '500g', price: 28, original_price: 36, discount: 22, stock: 130 },
              { quantity: '1kg', price: 52, original_price: 70, discount: 25, stock: 80 },
            ],
          },
          {
            name: 'Spicy Green Chillies (Hari Mirch)',
            brand: 'Local Farm',
            description: 'Fresh and spicy dark green chillies.',
            image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=compress&cs=tinysrgb&w=600',
            tags: ['spicy', 'essential'],
            variants: [
              { quantity: '100g', price: 10, original_price: 15, discount: 33, stock: 200 },
              { quantity: '250g', price: 22, original_price: 32, discount: 31, stock: 150 },
            ],
          },
          {
            name: 'Fresh Ginger (Adrak)',
            brand: 'Local Farm',
            description: 'Aromatic spicy root ginger, washed and cleaned.',
            image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=compress&cs=tinysrgb&w=600',
            tags: ['aromatic', 'essential'],
            variants: [
              { quantity: '100g', price: 18, original_price: 24, discount: 25, stock: 180 },
              { quantity: '250g', price: 42, original_price: 55, discount: 23, stock: 120 },
            ],
          },
          {
            name: 'Garlic Bulbs (Desi Lehsun)',
            brand: 'Green Valley',
            description: 'Whole aromatic garlic bulbs with firm, flavorful cloves.',
            image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=compress&cs=tinysrgb&w=600',
            tags: ['essential', 'aromatic'],
            variants: [
              { quantity: '200g', price: 35, original_price: 45, discount: 22, stock: 140 },
              { quantity: '500g', price: 80, original_price: 100, discount: 20, stock: 90 },
            ],
          },
          {
            name: 'Fresh Green Peas (Hari Matar)',
            brand: 'Local Farm',
            description: 'Sweet and plump green peas in pods.',
            image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=compress&cs=tinysrgb&w=600',
            tags: ['sweet', 'fresh'],
            variants: [
              { quantity: '500g', price: 40, original_price: 52, discount: 23, stock: 150 },
              { quantity: '1kg', price: 76, original_price: 100, discount: 24, stock: 100 },
            ],
          },
        ],
      },
      {
        name: 'Leafy Greens',
        image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400',
        sort_order: 2,
        brands: [
          {
            name: 'Farm Fresh Greens',
            logo: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=100',
            description: 'Fresh organic greens and herbs',
          },
        ],
        products: [
          {
            name: 'Spinach (Palak)',
            brand: 'Farm Fresh Greens',
            description: 'Iron-rich fresh green spinach leaves.',
            image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=600',
            tags: ['organic', 'leafy'],
            variants: [
              { quantity: '250g', price: 15, original_price: 20, discount: 25, stock: 200 },
              { quantity: '500g', price: 28, original_price: 35, discount: 20, stock: 150 },
            ],
          },
          {
            name: 'Coriander Leaves',
            brand: 'Farm Fresh Greens',
            description: 'Fresh aromatic coriander leaves with roots.',
            image: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=600',
            tags: ['herb', 'fresh'],
            variants: [
              { quantity: '100g', price: 10, original_price: 15, discount: 33, stock: 250 },
              { quantity: '250g', price: 22, original_price: 30, discount: 26, stock: 180 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Fruits',
    bg_color: 'bg-green-100',
    image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort_order: 2,
    subs: [
      {
        name: 'Fresh Fruits',
        image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400',
        sort_order: 1,
        brands: [
          {
            name: 'Orchard Fresh',
            logo: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=100',
            description: 'Sun-ripened orchard fruits',
          },
        ],
        products: [
          {
            name: 'Fresh Bananas',
            brand: 'Orchard Fresh',
            description: 'Naturally ripened sweet bananas.',
            image: 'https://images.pexels.com/photos/22883/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600',
            tags: ['sweet', 'fresh'],
            variants: [
              { quantity: '1 Dozen', price: 50, original_price: 60, discount: 16, stock: 150 },
            ],
          },
          {
            name: 'Red Delicious Apples',
            brand: 'Orchard Fresh',
            description: 'Crisp and juicy sweet red apples.',
            image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=600',
            tags: ['crisp', 'fresh'],
            variants: [
              { quantity: '500g', price: 90, original_price: 110, discount: 18, stock: 120 },
              { quantity: '1kg', price: 170, original_price: 220, discount: 22, stock: 90 },
            ],
          },
        ],
      },
    ],
  },
];

async function seedFresh() {
  await connectDB();
  logger.info('Connected to DB for seeding fresh vegetables & fruits');

  for (const catData of ADDITIONAL_CATALOG) {
    const catSlug = slug(catData.name);
    let category = await Category.findOne({ slug: catSlug });
    if (!category) {
      category = await Category.create({
        name: catData.name,
        slug: catSlug,
        bg_color: catData.bg_color,
        image: catData.image,
        sort_order: catData.sort_order,
      });
      logger.info(`Created category: ${catData.name}`);
    } else {
      category.image = catData.image;
      await category.save();
    }

    for (const subData of catData.subs) {
      const subSlug = slug(subData.name);
      let subcategory = await Subcategory.findOne({ category_id: category._id, slug: subSlug });
      if (!subcategory) {
        subcategory = await Subcategory.create({
          category_id: category._id,
          name: subData.name,
          slug: subSlug,
          image: subData.image,
          sort_order: subData.sort_order,
        });
        logger.info(`Created subcategory: ${subData.name}`);
      }

      const brandMap = {};
      for (const bData of subData.brands) {
        const bSlug = slug(bData.name);
        let brand = await Brand.findOne({ subcategory_id: subcategory._id, slug: bSlug });
        if (!brand) {
          brand = await Brand.create({
            subcategory_id: subcategory._id,
            name: bData.name,
            slug: bSlug,
            logo: bData.logo,
            description: bData.description,
          });
          logger.info(`Created brand: ${bData.name}`);
        }
        brandMap[bData.name] = brand;
      }

      for (const prodData of subData.products) {
        const pSlug = slug(prodData.name);
        const brand = brandMap[prodData.brand] || Object.values(brandMap)[0];
        let product = await Product.findOne({ slug: pSlug });
        if (!product) {
          product = await Product.create({
            brand_id: brand._id,
            category_id: category._id,
            subcategory_id: subcategory._id,
            name: prodData.name,
            slug: pSlug,
            description: prodData.description,
            image: prodData.image,
            is_available: true,
            tags: prodData.tags,
          });
          logger.info(`Created product: ${prodData.name}`);

          for (const vData of prodData.variants) {
            await ProductVariant.create({
              product_id: product._id,
              quantity: vData.quantity,
              price: vData.price,
              original_price: vData.original_price,
              discount: vData.discount,
              stock: vData.stock,
              is_available: true,
            });
          }
        }
      }
    }
  }

  logger.info('Finished seeding fresh vegetables and fruits successfully!');
  await disconnectDB();
}

seedFresh().catch((err) => {
  logger.error(`Seed error: ${err.message}`);
  process.exit(1);
});
