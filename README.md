# PizzaHub API — Backend

Express.js API for PizzaHub, a role-based pizza ordering and delivery platform. The backend handles authentication integration, business data, role-based access, menu management, orders, vendor subscriptions, and admin operations.

## Repositories

- **Live Client:** https://pizzahub-client-beryl.vercel.app/
- **Client Repository:** https://github.com/nibirshafuan/pizzahub-client
- **Server Repository:** https://github.com/nibirshafuan/pizzahub-server

## Main Responsibilities

- Connect to MongoDB and manage PizzaHub business data.
- Provide menu item, order, vendor, and admin API endpoints.
- Enforce authentication, roles, and resource ownership on protected routes.
- Validate incoming data and return appropriate HTTP status codes.
- Create Stripe Checkout sessions for vendor Premium subscriptions.
- Verify Stripe webhook events before activating Premium.
- Store subscription transaction records.
- Support menu item image upload using ImgBB.

## Technology Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Better Auth integration
- JWT verification
- Stripe Checkout and webhooks
- ImgBB API

## Getting Started

### Requirements
- Node.js and npm
- MongoDB database
- Required third-party credentials configured in environment variables

### Installation

```bash
git clone https://github.com/nibirshafuan/pizzahub-server.git
cd pizzahub-server
npm install
```

Create a local `.env` file using `.env.example` as a guide. Fill in your own credentials; never commit `.env`.

### Run locally

Use the scripts available in `package.json`. For a typical development setup:

```bash
npm run dev
```

Build and run the production server using the scripts defined in `package.json`:

```bash
npm run build
npm start
```

If the script names differ in your local `package.json`, use the listed scripts.

## Environment Variables

Configure the variables listed in `.env.example`:

- MongoDB connection string
- Server port
- Client/CORS origin
- Better Auth secret and base URL
- Google OAuth client ID and client secret
- Stripe secret key, webhook signing secret, and Premium price/plan configuration
- ImgBB API key

Use the exact names from `.env.example` when configuring the deployment environment. Keep all secret values on the server and do not commit them.

## API Security

- Protected endpoints must verify valid, non-expired authentication tokens.
- Role-based authorization is enforced on the server.
- Resource ownership is checked before updates or deletions.
- Do not trust role or user ID values supplied by the client.
- Use `401 Unauthorized` for missing/invalid authentication and `403 Forbidden` for authenticated users without permission.
- Public registration must not create Admin accounts.

## Data Collections

Better Auth manages its authentication collections. PizzaHub business data uses:

- `menuItems`
- `orders`
- `transactions`

## Stripe Subscription Flow

1. Vendor requests a Premium checkout session.
2. Server creates a Stripe Checkout session for the authenticated vendor.
3. Stripe sends a webhook after the payment event.
4. Server verifies the webhook signature and payment status.
5. Server records the transaction and activates Premium only after verified confirmation.

The frontend success redirect alone must never activate Premium.

## Advanced Search and Sorting

Menu search and sorting should be handled through the menu API query parameters. The client can request search/filter and ascending or descending price order. Validate and apply query parameters on the server.

## Deployment

Deploy the Express API to a Node.js hosting provider and configure all environment variables in its dashboard. Configure the client origin in CORS and set the client to use the deployed API URL.

## Security Notes

- Never push `.env` files, private keys, tokens, or credentials.
- Keep `.env.example` limited to variable names and safe placeholders.
- Do not manually mark a failed transaction as successful.
- Verify webhook signatures using the raw request body as required by Stripe.

## License

This project was developed for the PizzaHub Assignment 9.
