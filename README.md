# x402-nextjs

**Next.js x402 library without facilitator and 0 feess.
Accept crypto payments without expensive and slow external services.

## 🎯 Why x402-nextjs?

Most x402 implementations require you to run a separate facilitator service. **x402-nextjs embeds the facilitator directly into your Next.js app**, eliminating external dependencies and deployment complexity.

### Free Facilitator Included ✨

- ✅ **No external services** - Facilitator runs in your Next.js app
- ✅ **Zero configuration** - Auto-configures routes and middleware
- ✅ **Self-hosted** - Complete control over your payment infrastructure
- ✅ **No fees** - x402 protocol has 0% fees for merchants and customers
- ✅ **Instant settlement** - Payments settle in ~2 seconds on blockchain

## Installation

```bash
npm install x402-nextjs
# or
pnpm add x402-nextjs
# or
yarn add x402-nextjs
# or
bun add x402-nextjs
```

## Quick Start

### 1. Create Middleware

```typescript
// middleware.ts
import { paymentMiddleware } from "x402-nextjs";

export const middleware = paymentMiddleware(
  process.env.WALLET_ADDRESS, // Your wallet address
  {
    "/api/premium": "$0.01",  // Protect routes with pricing
    "/protected": {
      price: "$0.05",
      basket: [
        {
          name: "Premium Content",
          price: "$0.05",
          image_urls: ["https://example.com/image.png"]
        }
      ]
    }
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
```

### 2. Create Facilitator Route Handler

```typescript
// app/facilitator/[...x402]/route.ts
export { GET, POST } from "x402-nextjs/facilitator";
```

### 3. Set Environment Variables

```bash
WALLET_ADDRESS=0xYourWalletAddress
NETWORK=base-sepolia  # or base, polygon, etc.
PRIVATE_KEY=your_private_key  # For settlement
```

**That's it!** Your Next.js app now accepts crypto payments with an embedded facilitator.

## How It Works

```
┌─────────────────────────────────────────────────┐
│  Your Next.js App                               │
│                                                  │
│  ┌──────────────┐      ┌──────────────────┐    │
│  │  Middleware  │─────▶│  Facilitator     │    │
│  │  (x402-next) │      │  (Embedded!)     │    │
│  └──────────────┘      └──────────────────┘    │
│         │                       │               │
│         ▼                       ▼               │
│   Protected Routes         Blockchain           │
└─────────────────────────────────────────────────┘
```

When a user accesses a protected route:
1. Middleware checks for payment
2. If no payment → Returns HTTP 402
3. User pays via wallet
4. **Embedded facilitator** verifies payment on-chain
5. Access granted ✅

## Advanced Configuration

### Custom Network & Settings

```typescript
import { paymentMiddleware } from "x402-nextjs";

export const middleware = paymentMiddleware(
  process.env.WALLET_ADDRESS,
  {
    "/api/premium": {
      price: "$0.10",
      config: {
        description: "Premium API access"
      },
      network: "base", // Override network per route
      basket: [ // Optional basket for rich checkout experience
        {
          name: "Premium API Access",
          price: "$0.10",
          quantity: 1
        }
      ]
    }
  },
  {
    facilitator: {
      basePath: "/api/payments", // Custom facilitator path
      network: "base-sepolia",
      supportedNetworks: ["base-sepolia", "base"]
    },
    cdpClientKey: process.env.CDP_CLIENT_KEY,
    appName: "My App",
    appLogo: "/logo.png"
  }
);
```

## API Reference

### `paymentMiddleware(address, routes, config?)`

Creates payment middleware with embedded facilitator.

**Parameters:**
- `address` - Your wallet address (where payments are sent)
- `routes` - Object mapping paths to prices or `RouteConfig` objects
- `config` - Optional configuration object

### `RouteConfig`

Configuration object for individual routes:

- `price` - Price string (e.g. "$0.01")
- `basket` - Optional array of items for rich checkout
- `network` - Override network for this route
- `config` - Additional metadata

### `createFacilitatorRoutes(config?)`

Creates facilitator route handlers.

**Returns:**
- `verify` - Payment verification handlers (GET/POST)
- `settle` - Payment settlement handlers (GET/POST)
- `supported` - Supported networks handler (GET)
- `discovery` - Discovery endpoint handler (GET)

## Comparison

| Feature | x402-next | x402-nextjs |
|---------|-----------|-------------|
| Facilitator | External service required | ✅ Embedded |
| Configuration | Manual URL setup | ✅ Zero-config |
| Deployment | Multiple services | ✅ Single Next.js app |
| Cost | Depends on service | ✅ Free (self-hosted) |

## Requirements

- Next.js 14+
- Node.js 18+
- EVM-compatible wallet

## License

MIT

## Links

- [x402 Protocol](https://github.com/coinbase/x402)
- [Documentation](https://x402.gitbook.io/x402)
- [Issues](https://github.com/dennj/x402-nextjs/issues)
