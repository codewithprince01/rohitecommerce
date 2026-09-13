/*
  # Seed Product Variants

  Multiple quantity/price variants for each product
  Example: Haldiram Bhujia Sev - 100g (45), 200g (85), 500g (170)
*/

-- Haldiram Bhujia Sev Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '100g', 45, 50, 10, 200
FROM products p WHERE p.slug = 'haldiram-bhujia-sev';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200g', 85, 100, 15, 150
FROM products p WHERE p.slug = 'haldiram-bhujia-sev';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '500g', 170, 200, 15, 100
FROM products p WHERE p.slug = 'haldiram-bhujia-sev';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '1kg', 320, 380, 16, 50
FROM products p WHERE p.slug = 'haldiram-bhujia-sev';

-- Haldiram Aloo Bhujia Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '100g', 42, 48, 12, 200
FROM products p WHERE p.slug = 'haldiram-aloo-bhujia';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200g', 80, 95, 16, 150
FROM products p WHERE p.slug = 'haldiram-aloo-bhujia';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '500g', 165, 200, 18, 100
FROM products p WHERE p.slug = 'haldiram-aloo-bhujia';

-- Haldiram Ratlami Sev Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '100g', 40, 45, 11, 200
FROM products p WHERE p.slug = 'haldiram-ratlami-sev';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200g', 75, 90, 17, 150
FROM products p WHERE p.slug = 'haldiram-ratlami-sev';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '500g', 150, 180, 17, 100
FROM products p WHERE p.slug = 'haldiram-ratlami-sev';

-- Haldiram Navratan Mix Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200g', 95, 110, 14, 100
FROM products p WHERE p.slug = 'haldiram-navratan-mix';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '500g', 220, 260, 15, 80
FROM products p WHERE p.slug = 'haldiram-navratan-mix';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '1kg', 420, 500, 16, 40
FROM products p WHERE p.slug = 'haldiram-navratan-mix';

-- Lays Classic Salted Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '25g', 10, 12, 17, 500
FROM products p WHERE p.slug = 'lays-classic-salted';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '50g', 20, 25, 20, 400
FROM products p WHERE p.slug = 'lays-classic-salted';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '90g', 30, 35, 14, 300
FROM products p WHERE p.slug = 'lays-classic-salted';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '150g', 50, 60, 17, 200
FROM products p WHERE p.slug = 'lays-classic-salted';

-- Lays Masala Magic Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '25g', 10, 12, 17, 500
FROM products p WHERE p.slug = 'lays-masala-magic';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '50g', 20, 25, 20, 400
FROM products p WHERE p.slug = 'lays-masala-magic';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '90g', 30, 35, 14, 300
FROM products p WHERE p.slug = 'lays-masala-magic';

-- Lays India Magic Masala Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '25g', 10, 12, 17, 600
FROM products p WHERE p.slug = 'lays-india-magic-masala';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '50g', 20, 25, 20, 500
FROM products p WHERE p.slug = 'lays-india-magic-masala';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '90g', 30, 35, 14, 400
FROM products p WHERE p.slug = 'lays-india-magic-masala';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '150g', 50, 60, 17, 300
FROM products p WHERE p.slug = 'lays-india-magic-masala';

-- Kurkure Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '33g', 10, 12, 17, 500
FROM products p WHERE p.slug = 'kurkure-namkeen';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '65g', 20, 25, 20, 400
FROM products p WHERE p.slug = 'kurkure-namkeen';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '140g', 40, 50, 20, 300
FROM products p WHERE p.slug = 'kurkure-namkeen';

-- Pringles Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '53g', 75, 85, 12, 200
FROM products p WHERE p.slug = 'pringles-original';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '110g', 150, 170, 12, 150
FROM products p WHERE p.slug = 'pringles-original';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '53g', 75, 85, 12, 200
FROM products p WHERE p.slug = 'pringles-sour-cream-onion';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '110g', 150, 170, 12, 150
FROM products p WHERE p.slug = 'pringles-sour-cream-onion';

-- Parle-G Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '56g', 10, 12, 17, 800
FROM products p WHERE p.slug = 'parle-g-biscuit';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '128g', 25, 30, 17, 600
FROM products p WHERE p.slug = 'parle-g-biscuit';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '252g', 45, 55, 18, 400
FROM products p WHERE p.slug = 'parle-g-biscuit';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '800g', 140, 170, 18, 200
FROM products p WHERE p.slug = 'parle-g-biscuit';

-- Britannia Good Day Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '62g', 15, 18, 17, 400
FROM products p WHERE p.slug = 'britannia-good-day';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '125g', 30, 35, 14, 300
FROM products p WHERE p.slug = 'britannia-good-day';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '250g', 58, 70, 17, 200
FROM products p WHERE p.slug = 'britannia-good-day';

-- Maggi Masala Noodles Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '70g', 14, 16, 13, 1000
FROM products p WHERE p.slug = 'maggi-masala-noodles';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '140g', 28, 32, 13, 800
FROM products p WHERE p.slug = 'maggi-masala-noodles';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '280g', 52, 60, 13, 500
FROM products p WHERE p.slug = 'maggi-masala-noodles';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '560g', 100, 120, 17, 300
FROM products p WHERE p.slug = 'maggi-masala-noodles';

-- Maggi Atta Noodles Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '70g', 16, 18, 11, 500
FROM products p WHERE p.slug = 'maggi-atta-noodles';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '140g', 32, 36, 11, 400
FROM products p WHERE p.slug = 'maggi-atta-noodles';

-- Coca-Cola Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200ml', 15, 20, 25, 600
FROM products p WHERE p.slug = 'coca-cola-cola';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '400ml', 28, 35, 20, 500
FROM products p WHERE p.slug = 'coca-cola-cola';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '600ml', 38, 45, 16, 400
FROM products p WHERE p.slug = 'coca-cola-cola';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '750ml', 45, 55, 18, 300
FROM products p WHERE p.slug = 'coca-cola-cola';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '2L', 70, 90, 22, 200
FROM products p WHERE p.slug = 'coca-cola-cola';

-- Real Orange Juice Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200ml', 25, 30, 17, 300
FROM products p WHERE p.slug = 'real-orange-juice';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '1L', 85, 99, 14, 200
FROM products p WHERE p.slug = 'real-orange-juice';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '1.5L', 120, 140, 14, 150
FROM products p WHERE p.slug = 'real-orange-juice';

-- Amul Toned Milk Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200ml', 15, 18, 17, 500
FROM products p WHERE p.slug = 'amul-toned-milk';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '500ml', 32, 38, 16, 400
FROM products p WHERE p.slug = 'amul-toned-milk';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '1L', 58, 65, 11, 300
FROM products p WHERE p.slug = 'amul-toned-milk';

-- Harvest Gold Bread Variants
INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '200g', 25, 30, 17, 200
FROM products p WHERE p.slug = 'harvest-gold-whole-wheat-bread';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '400g', 45, 50, 10, 300
FROM products p WHERE p.slug = 'harvest-gold-whole-wheat-bread';

INSERT INTO product_variants (product_id, quantity, price, original_price, discount, stock)
SELECT p.id, '800g', 85, 95, 11, 200
FROM products p WHERE p.slug = 'harvest-gold-whole-wheat-bread';
