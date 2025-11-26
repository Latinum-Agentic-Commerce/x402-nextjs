import { Address } from "viem";
import { paymentMiddleware as x402NextMiddleware, Resource, Network } from "x402-next";
import { NextRequest } from "next/server";
import { PaymentMiddlewareConfig, RouteConfig } from "./types";

/**
 * Enhanced payment middleware with embedded facilitator
 * 
 * This middleware automatically configures the facilitator to use embedded routes,
 * eliminating the need for external facilitator services.
 * 
 * @param address - Wallet address to receive payments
 * @param routes - Route configuration mapping paths to prices
 * @param config - Optional configuration for facilitator and app settings
 * @returns Next.js middleware function
 * 
 * @example
 * ```typescript
 * // Simple usage - facilitator auto-configured
 * export const middleware = paymentMiddleware(
 *   "0xYourAddress",
 *   {
 *     "/protected": "$0.01",
 *     "/api/premium": {
 *       price: "$0.05",
 *       config: { description: "Premium API access" }
 *     }
 *   }
 * );
 * ```
 * 
 * @example
 * ```typescript
 * // Advanced usage with custom configuration
 * export const middleware = paymentMiddleware(
 *   "0xYourAddress",
 *   { "/protected": "$0.01" },
 *   {
 *     facilitator: {
 *       basePath: "/api/payments",
 *       network: "base-mainnet"
 *     },
 *     cdpClientKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
 *     appName: "My App"
 *   }
 * );
 * ```
 */
export function paymentMiddleware(
  address: Address,
  routes: Record<string, RouteConfig | string>,
  config?: Omit<PaymentMiddlewareConfig, "address" | "routes">
) {
  const {
    facilitator = {},
    cdpClientKey,
    appLogo,
    appName,
    sessionTokenEndpoint,
  } = config || {};

  const {
    basePath = "/facilitator",
    network = process.env.NETWORK || "base-sepolia",
  } = facilitator;

  // Normalize routes to RouteConfig format
  const normalizedRoutes: Record<string, RouteConfig> = {};
  for (const [path, routeConfig] of Object.entries(routes)) {
    if (typeof routeConfig === "string") {
      normalizedRoutes[path] = {
        price: routeConfig,
        network: network as any,
      };
    } else {
      normalizedRoutes[path] = {
        ...routeConfig,
        network: (routeConfig.network || network) as any,
      };
    }
  }

  // Construct the facilitator URL
  // In production, this will be the same domain as the app
  const getFacilitatorUrl = (req: NextRequest): Resource => {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    return `${protocol}://${host}${basePath}` as Resource;
  };

  // Create the underlying x402-next middleware
  return (req: NextRequest) => {
    const facilitatorUrl = getFacilitatorUrl(req);
    
    return x402NextMiddleware(
      address,
      normalizedRoutes as any,
      { url: facilitatorUrl },
      {
        cdpClientKey,
        appLogo,
        appName,
        sessionTokenEndpoint,
      }
    )(req);
  };
}
