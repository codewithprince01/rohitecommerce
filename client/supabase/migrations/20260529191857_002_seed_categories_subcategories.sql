/*
  # Seed Grocery Data

  Inserts sample data for:
  - Categories: Snacks & Namkeen, Beverages, Dairy, Bakery, Vegetables, Fruits
  - Subcategories under each category
  - Brands under subcategories
  - Products with multiple quantity variants
*/

-- Categories
INSERT INTO categories (name, slug, image, bg_color, sort_order) VALUES
('Snacks & Namkeen', 'snacks-namkeen', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=200', 'bg-orange-50', 1),
('Beverages', 'beverages', 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=200', 'bg-cyan-50', 2),
('Dairy', 'dairy', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=200', 'bg-blue-50', 3),
('Bakery', 'bakery', 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=200', 'bg-amber-50', 4),
('Vegetables', 'vegetables', 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200', 'bg-emerald-50', 5),
('Fruits', 'fruits', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200', 'bg-green-50', 6);

-- Subcategories for Snacks & Namkeen
INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Namkeen', 'namkeen', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=200', 1
FROM categories WHERE slug = 'snacks-namkeen';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Chips & Wafers', 'chips-wafers', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=200', 2
FROM categories WHERE slug = 'snacks-namkeen';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Biscuits & Cookies', 'biscuits-cookies', 'https://images.pexels.com/photos/1021821/pexels-photo-1021821.jpeg?auto=compress&cs=tinysrgb&w=200', 3
FROM categories WHERE slug = 'snacks-namkeen';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Noodles & Pasta', 'noodles-pasta', 'https://images.pexels.com/photos/6054038/pexels-photo-6054038.jpeg?auto=compress&cs=tinysrgb&w=200', 4
FROM categories WHERE slug = 'snacks-namkeen';

-- Subcategories for Beverages
INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Soft Drinks', 'soft-drinks', 'https://images.pexels.com/photos/1042423/pexels-photo-1042423.jpeg?auto=compress&cs=tinysrgb&w=200', 1
FROM categories WHERE slug = 'beverages';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Juices', 'juices', 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=200', 2
FROM categories WHERE slug = 'beverages';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Tea & Coffee', 'tea-coffee', 'https://images.pexels.com/photos/1454944/pexels-photo-1454944.jpeg?auto=compress&cs=tinysrgb&w=200', 3
FROM categories WHERE slug = 'beverages';

-- Subcategories for Dairy
INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Milk', 'milk', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=200', 1
FROM categories WHERE slug = 'dairy';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Paneer & Cheese', 'paneer-cheese', 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=200', 2
FROM categories WHERE slug = 'dairy';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Yogurt & Curd', 'yogurt-curd', 'https://images.pexels.com/photos/3738833/pexels-photo-3738833.jpeg?auto=compress&cs=tinysrgb&w=200', 3
FROM categories WHERE slug = 'dairy';

-- Subcategories for Bakery
INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Bread', 'bread', 'https://images.pexels.com/photos/1070946/pexels-photo-1070946.jpeg?auto=compress&cs=tinysrgb&w=200', 1
FROM categories WHERE slug = 'bakery';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Cakes & Pastries', 'cakes-pastries', 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=200', 2
FROM categories WHERE slug = 'bakery';

-- Subcategories for Vegetables
INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Fresh Vegetables', 'fresh-vegetables', 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200', 1
FROM categories WHERE slug = 'vegetables';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Leafy Greens', 'leafy-greens', 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=200', 2
FROM categories WHERE slug = 'vegetables';

-- Subcategories for Fruits
INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Fresh Fruits', 'fresh-fruits', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200', 1
FROM categories WHERE slug = 'fruits';

INSERT INTO subcategories (category_id, name, slug, image, sort_order)
SELECT id, 'Exotic Fruits', 'exotic-fruits', 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=200', 2
FROM categories WHERE slug = 'fruits';
