/*
  # Seed Products and Variants

  Products with multiple quantity/price variants
*/

-- Haldiram Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Bhujia Sev', 'haldiram-bhujia-sev', 'Classic spicy bhujia made from moth beans. Crispy, crunchy and delicious with authentic Rajasthani taste.', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['bestseller', 'spicy']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'haldiram' AND s.slug = 'namkeen';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Aloo Bhujia', 'haldiram-aloo-bhujia', 'Delicious potato-based bhujia with perfect blend of spices. A favorite tea-time snack.', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['popular', 'savory']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'haldiram' AND s.slug = 'namkeen';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Ratlami Sev', 'haldiram-ratlami-sev', 'Spicy and tangy sev from Ratlam. Perfect for adding crunch to your snacks.', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['spicy', 'traditional']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'haldiram' AND s.slug = 'namkeen';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Navratan Mix', 'haldiram-navratan-mix', 'Premium mixture of nine different savory ingredients. Rich and flavorful.', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['premium', 'mixture']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'haldiram' AND s.slug = 'namkeen';

-- Bikaji Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Bhujia', 'bikaji-bhujia', 'Authentic Bikaneri bhujia with traditional recipe. Crispy and flavorful.', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['traditional', 'bikaneri']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'bikaji' AND s.slug = 'namkeen';

-- Balaji Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Bhujia', 'balaji-bhujia', 'Crispy and spicy bhujia made with select ingredients. Great for snacking.', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['affordable', 'tasty']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'balaji' AND s.slug = 'namkeen';

-- Lays Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Classic Salted', 'lays-classic-salted', 'Americas favorite classic salted potato chips. Light and crispy.', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['classic', 'popular']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'lays' AND s.slug = 'chips-wafers';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Masala Magic', 'lays-masala-magic', 'Tangy Indian masala flavored chips. Perfect blend of spices.', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['indian', 'spicy']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'lays' AND s.slug = 'chips-wafers';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'India Magic Masala', 'lays-india-magic-masala', 'The most loved Indian flavor. Bold and taste.', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['bestseller', 'indian']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'lays' AND s.slug = 'chips-wafers';

-- Kurkure Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Namkeen', 'kurkure-namkeen', 'Crispy corn puffs with authentic namkeen taste. Tasty and crunchy.', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['crunchy', 'popular']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'kurkure' AND s.slug = 'chips-wafers';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Puffcorn', 'kurkure-puffcorn', 'Light and fluffy corn snack. Fun to eat anytime.', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['light', 'fluffy']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'kurkure' AND s.slug = 'chips-wafers';

-- Pringles Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Original', 'pringles-original', 'Classic original flavor stacked chips. Once you pop you cant stop.', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['imported', 'premium']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'pringles' AND s.slug = 'chips-wafers';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Sour Cream Onion', 'pringles-sour-cream-onion', 'Tangy sour cream and onion flavor. Rich and creamy taste.', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['tangy', 'popular']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'pringles' AND s.slug = 'chips-wafers';

-- Parle Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'G Biscuit', 'parle-g-biscuit', 'Indias most loved glucose biscuit. Perfect with tea.', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['classic', 'glucose']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'parle' AND s.slug = 'biscuits-cookies';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Monaco', 'parle-monaco', 'Salty and crispy crackers. Perfect for snacking.', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['salty', 'crackers']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'parle' AND s.slug = 'biscuits-cookies';

-- Britannia Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Good Day', 'britannia-good-day', 'Butter cookies with rich taste. India favorite.', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['butter', 'premium']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'britannia' AND s.slug = 'biscuits-cookies';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Marie Gold', 'britannia-marie-gold', 'Classic Marie biscuits. Light and nutritious.', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['light', 'marie']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'britannia' AND s.slug = 'biscuits-cookies';

-- Maggi Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Masala Noodles', 'maggi-masala-noodles', 'Indias favorite 2-minute noodles with classic masala taste.', 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['bestseller', 'quick']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'maggi' AND s.slug = 'noodles-pasta';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Atta Noodles', 'maggi-atta-noodles', 'Healthier whole wheat noodles with same great taste.', 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['healthy', 'wheat']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'maggi' AND s.slug = 'noodles-pasta';

-- Yippee Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Masala Noodles', 'yippee-masala-noodles', 'Non-sticky noodles with delicious masala.', 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['non-sticky', 'tasty']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'yippee' AND s.slug = 'noodles-pasta';

-- Coca-Cola Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Cola', 'coca-cola-cola', 'The original cola taste. Refresh your world.', 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['refreshing', 'classic']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'coca-cola' AND s.slug = 'soft-drinks';

-- Pepsi Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Cola', 'pepsi-cola', 'Bold and refreshing cola taste.', 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['bold', 'refreshing']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'pepsi' AND s.slug = 'soft-drinks';

-- Real Juice Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Orange Juice', 'real-orange-juice', '100 percent orange juice with no added sugar.', 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['healthy', 'natural']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'real' AND s.slug = 'juices';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Mixed Fruit Juice', 'real-mixed-fruit-juice', 'Blend of multiple fruit juices. Rich in vitamins.', 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['fruity', 'vitamin']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'real' AND s.slug = 'juices';

-- Amul Milk Products
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Toned Milk', 'amul-toned-milk', 'Fresh toned milk pasteurized for purity. Perfect for daily use.', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['daily', 'fresh']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'amul' AND s.slug = 'milk';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Full Cream Milk', 'amul-full-cream-milk', 'Rich full cream milk for growing children.', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['rich', 'creamy']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'amul' AND s.slug = 'milk';

-- Harvest Gold Bread
INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'Whole Wheat Bread', 'harvest-gold-whole-wheat-bread', 'Soft and fresh whole wheat bread high in fiber.', 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['healthy', 'fiber']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'harvest-gold' AND s.slug = 'bread';

INSERT INTO products (brand_id, category_id, subcategory_id, name, slug, description, image, tags)
SELECT b.id, c.id, s.id, 'White Bread', 'harvest-gold-white-bread', 'Classic soft white bread for sandwiches.', 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=400', ARRAY['soft', 'classic']
FROM brands b
JOIN subcategories s ON b.subcategory_id = s.id
JOIN categories c ON s.category_id = c.id
WHERE b.slug = 'harvest-gold' AND s.slug = 'bread';
