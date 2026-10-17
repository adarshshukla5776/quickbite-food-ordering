# QuickBite V3 — Food Ordering + Customer Accounts + Operator Dashboard

A full-stack **Next.js 15 + Neon PostgreSQL** food ordering **portfolio demo** with responsive UI. The project has the **complete original customer ordering site and protected operator console** from v2, plus new SQL-backed customer accounts. No real payments or deliveries.

## What's included?

| Route | Who can use it | Purpose |
| --- | --- | --- |
| `/` | Everyone | Browse/search menu, cart, guest or logged-in checkout; original order lookup |
| `/register` | Everyone | Create a customer account (name, email, password) |
| `/login` | Everyone | Customer login |
| `/account` | Signed-in customers | Their linked orders and statuses |
| `/admin/login` | Operator | Existing admin login (visible in footer) |
| `/admin` | Logged-in operator | Original sales, status chart, orders, status transitions |

Customer sessions and operator sessions have **different cookie names and signing secrets**; customer login does **not** grant admin access. Passwords are salted and hashed with Node.js `scrypt`, not stored in plaintext. Customer sessions use signed HttpOnly cookies. Public customer sign-in attempts and sign-up attempts are throttled in Postgres. **No email verification or password reset**: this is a classroom/portfolio demo, not a production auth service.

## Important: keep your existing projects

Extract this ZIP into a **new** folder, `D:\quickbite-v3`. Keep `D:\quickbite` and `D:\quickbite-v2` untouched. V3 is **standalone source code**; it does not import files from either old folder. You can use the same existing Neon database. V3's SQL migration is additive and keeps original menu, operator login data, and past orders.

## Fast setup on Windows PowerShell

From the `D:\quickbite-v3` directory in VS Code:

```powershell
npm install
Copy-Item D:\quickbite-v2\.env.local D:\quickbite-v3\.env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated output to **new** `D:\quickbite-v3\.env.local`:

```dotenv
CUSTOMER_SESSION_SECRET="PUT_YOUR_NEW_DIFFERENT_RANDOM_64_CHARACTER_OUTPUT_HERE"
```

Keep existing, working `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`. The **customer secret must be different from the admin secret**. Never upload `.env.local`, share it or send screenshots exposing secrets. Previously exposed admin session secret and password should be rotated; rotate the Neon password if that URL was previously accidentally included in an uploaded ZIP.

**IMPORTANT: Migrate the SAME existing Neon DB:** Neon Console > `quickbite-db` > SQL Editor > paste contents of **`database/customer-migration.sql`** > **Run**. This only adds `customers`, `customer_auth_attempts`, and a nullable `orders.customer_id` FK plus indexes. It does **not** delete or reset `orders`, `products`, `categories` or operator login data. Do **not** re-run `schema.sql` or delete tables.

Now:

```powershell
npm run dev
```

Open `http://localhost:3000/register` and create a **demo** account with a password of 12+ characters. Place an order while logged in: it'll show in `/account` and in `/admin`. Guest checkout still works. Registered users see **their own new signed-in orders**; historical guest orders do not automatically merge just because they used the same email (email ownership isn't verified). To look up a previous guest order use the original **My orders** modal with ID + checkout email.

## Checklist for testing

1. `/` shows menu data from existing Neon DB.
2. `/register` creates a demo customer; `/account` loads, initially empty.
3. Make demo order while signed in; `/account` displays that order, `/admin` shows it too.
4. Log out from `/account`; accessing `/account` should redirect to `/login`.
5. `/login` with the same password restores the account order list.
6. Footer's **Operator login** remains visible and needs **separate admin credentials**.
7. Guest checkout still works. Admin can update orders to Preparing, On the way and Delivered.
8. Test responsive design using Chrome F12 → Ctrl+Shift+M → 375px and ~768px.
9. Ensure no errors from `npm run build` before deployment.

## How the SQL works

- `categories` → `products`: foreign key, menu filtering.
- `orders` → `order_items`: a transaction stores the order, server-verified price and all its items.
- `customers`: ID, name, unique email, salted password hash, creation time.
- `orders.customer_id`: **nullable** FK means older guest orders remain valid. Signed-in checkout links orders to the session's customer ID; cannot impersonate a different user by supplying an email.
- `customer_auth_attempts`: throttles password guesses/registrations.
- `admin_login_attempts`: existing operator-auth throttling.

Useful presentation queries:

```sql
SELECT c.name, COUNT(o.id) AS orders, COALESCE(SUM(o.total),0) AS total_spend
FROM customers c LEFT JOIN orders o ON o.customer_id=c.id
GROUP BY c.id,c.name ORDER BY orders DESC;

SELECT o.id, o.total, o.status, c.email
FROM orders o JOIN customers c ON c.id=o.customer_id
ORDER BY o.id DESC;
```

## Vercel deployment

1. **Before deploying**, rotate any exposed secrets and run `npm run build` locally.
2. GitHub: create empty `quickbite-food-ordering` repo and push the **V3 source**. `.gitignore` excludes `.env.local`, `.next`, and `node_modules`. Check `git status` to verify no secrets are staged.
3. [Vercel](https://vercel.com/new): import GitHub repo, Framework Preset **Next.js**; keep default root (`package.json`).
4. Add exactly these **5 private environment variables** under the Vercel project: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CUSTOMER_SESSION_SECRET`. Set values from your own `.env.local`, do not use `NEXT_PUBLIC_`.
5. Deploy and test `/`, `/register`, `/login`, `/account`, `/admin/login`, `/admin`.

## Scope and safety

No payment gateway, no actual food service, no email verification or password reset. **Don't collect real customer information.** Customer order history shows only orders placed while authenticated; guest orders remain accessible via order ID/email. For a real service, use a managed authentication provider with verified email, MFA, password reset, stronger CSRF/rate limits, input sanitization, abuse protection and security review. Demo photo URLs should be replaced by licensed assets for commercial use.

## Troubleshooting

- **Menu won't load:** Verify `DATABASE_URL`, old Neon schema.
- **Registration / login 500:** Run **`database/customer-migration.sql`** in that same Neon DB and set `CUSTOMER_SESSION_SECRET`.
- **`/admin` won't open:** Check the existing admin credentials and `database/admin-migration.sql`; that old migration should already be applied.
- **New order doesn't show in account:** You must place it while logged in. Old/guest orders remain accessible via the original guest lookup.
- **Can't load local URL:** Keep `npm run dev` terminal running; check which port is printed.
