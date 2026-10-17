-- Execute this entire file once in the Neon SQL Editor.
CREATE TABLE IF NOT EXISTS categories (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name VARCHAR(60) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS products (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 category_id INTEGER NOT NULL REFERENCES categories(id),
 name VARCHAR(120) NOT NULL,
 description VARCHAR(240) NOT NULL,
 price INTEGER NOT NULL CHECK (price > 0),
 image_url TEXT NOT NULL,
 rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
 badge VARCHAR(40),
 available BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 customer_name VARCHAR(100) NOT NULL,
 customer_email VARCHAR(200) NOT NULL,
 customer_phone VARCHAR(20) NOT NULL,
 delivery_address TEXT NOT NULL,
 subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
 delivery_fee INTEGER NOT NULL CHECK(delivery_fee >= 0),
 total INTEGER NOT NULL CHECK(total >= 0),
 status VARCHAR(20) NOT NULL DEFAULT 'Placed' CHECK(status IN ('Placed','Preparing','On the way','Delivered','Cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id INTEGER NOT NULL REFERENCES products(id),
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 20),
 unit_price INTEGER NOT NULL CHECK(unit_price > 0)
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);

INSERT INTO categories(name) VALUES ('Burgers'),('Pizza'),('Bowls'),('Sides'),('Drinks') ON CONFLICT (name) DO NOTHING;

INSERT INTO products(category_id,name,description,price,image_url,rating,badge)
SELECT c.id, d.name, d.description, d.price, d.image_url, d.rating,d.badge
FROM (VALUES
 ('Burgers','Smash House Burger','Double smashed patty, cheddar, secret sauce & pickles.',299,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85',4.9::numeric,'Bestseller'),
 ('Burgers','Crispy Chicken Burger','Golden crispy chicken, creamy slaw & spicy mayo.',279,'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=900&q=85',4.8::numeric,NULL),
 ('Pizza','Margherita Magic','San Marzano tomato, fresh mozzarella and basil.',349,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&q=85',4.9::numeric,'Popular'),
 ('Pizza','Pepperoni Party','Loaded pepperoni with a perfectly cheesy crust.',429,'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=900&q=85',4.8::numeric,NULL),
 ('Bowls','Teriyaki Power Bowl','Seasoned rice, fresh greens and rich teriyaki glaze.',329,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85',4.7::numeric,'Fresh'),
 ('Bowls','Mediterranean Bowl','Chickpeas, cucumber, greens and herby dressing.',289,'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&q=85',4.7::numeric,NULL),
 ('Sides','Loaded Fries','Crispy fries, melted cheese and house-made sauce.',179,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900&q=85',4.8::numeric,'Must try'),
 ('Sides','Garlic Bread','Freshly toasted garlic bread with herb butter.',149,'https://images.unsplash.com/photo-1619531040576-f9416740661b?w=900&q=85',4.6::numeric,NULL),
 ('Drinks','Strawberry Cooler','Refreshing fruity cooler with a bright citrus kick.',149,'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&q=85',4.8::numeric,NULL),
 ('Drinks','Iced Coffee','Smooth espresso and milk over ice.',169,'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900&q=85',4.7::numeric,NULL)
) AS d(category,name,description,price,image_url,rating,badge)
JOIN categories c ON c.name=d.category
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name=d.name);
