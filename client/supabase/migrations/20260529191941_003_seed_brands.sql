/*
  # Seed Brands and Products

  Inserts brands under each subcategory with products and variants
*/

-- Brands for Namkeen subcategory
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Haldiram', 'haldiram', 'https://logos-world.net/wp-content/uploads/2023/03/Haldirams-Logo.png', 'India''s most loved Namkeen brand'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'namkeen' AND c.slug = 'snacks-namkeen';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Bikaji', 'bikaji', 'https://bikaji.co.in/logo.png', 'Authentic Indian snacks and namkeen'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'namkeen' AND c.slug = 'snacks-namkeen';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Balaji', 'balaji', 'https://balajiwafers.com/logo.png', 'Premium wafers and namkeen'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'namkeen' AND c.slug = 'snacks-namkeen';

-- Brands for Chips & Wafers
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Lays', 'lays', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=100', 'World famous potato chips'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'chips-wafers' AND c.slug = 'snacks-namkeen';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Kurkure', 'kurkure', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=100', 'Crispy corn puffs'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'chips-wafers' AND c.slug = 'snacks-namkeen';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Pringles', 'pringles', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=100', 'Premium stacked chips'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'chips-wafers' AND c.slug = 'snacks-namkeen';

-- Brands for Biscuits
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Parle', 'parle', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=100', 'India''s biscuit brand'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'biscuits-cookies' AND c.slug = 'snacks-namkeen';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Britannia', 'britannia', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=100', 'Taste the quality'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'biscuits-cookies' AND c.slug = 'snacks-namkeen';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Sunfeast', 'sunfeast', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=100', 'Delicious cookies and biscuits'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'biscuits-cookies' AND c.slug = 'snacks-namkeen';

-- Brands for Noodles
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Maggie', 'maggi', 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=100', '2-minute noodles'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'noodles-pasta' AND c.slug = 'snacks-namkeen';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Yippee', 'yippee', 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=100', 'Non-sticky noodles'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'noodles-pasta' AND c.slug = 'snacks-namkeen';

-- Brands for Soft Drinks
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Coca-Cola', 'coca-cola', 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=100', 'Refresh your world'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'soft-drinks' AND c.slug = 'beverages';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Pepsi', 'pepsi', 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=100', 'For the love of it'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'soft-drinks' AND c.slug = 'beverages';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Sprite', 'sprite', 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=100', 'Clear refreshment'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'soft-drinks' AND c.slug = 'beverages';

-- Brands for Juices
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Real', 'real', 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=100', '100% fruit juice'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'juices' AND c.slug = 'beverages';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Tropicana', 'tropicana', 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=100', 'Premium fruit juices'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'juices' AND c.slug = 'beverages';

-- Brands for Milk
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Amul', 'amul', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=100', 'Taste of India'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'milk' AND c.slug = 'dairy';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Mother Dairy', 'mother-dairy', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=100', 'Pure and fresh'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'milk' AND c.slug = 'dairy';

-- Brands for Bread
INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Harvest Gold', 'harvest-gold', 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=100', 'Fresh baked goodness'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'bread' AND c.slug = 'bakery';

INSERT INTO brands (subcategory_id, name, slug, logo, description)
SELECT s.id, 'Britannia Bread', 'britannia-bread', 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=100', 'Daily essentials'
FROM subcategories s
JOIN categories c ON s.category_id = c.id
WHERE s.slug = 'bread' AND c.slug = 'bakery';
