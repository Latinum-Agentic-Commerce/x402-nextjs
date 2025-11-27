import { Address } from 'viem';
import * as next_server from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
export { f as facilitator } from './facilitator-Cqc-50_B.js';
export { Network, POST } from 'x402-next';
export { PaymentPayload, PaymentRequirements, SettleResponse, SupportedPaymentKindsResponse, VerifyResponse } from 'x402/types';

interface FacilitatorConfig {
    /**
     * Base path for facilitator routes (default: "/facilitator")
     */
    basePath?: string;
    /**
     * Blockchain network to use (default: "base-sepolia")
     */
    network?: string;
    /**
     * Private key for settlement transactions
     * If not provided, will use process.env.PRIVATE_KEY
     */
    privateKey?: string;
    /**
     * List of supported networks
     * If not provided, will use [network]
     */
    supportedNetworks?: string[];
}
interface BasketItem {
    id?: string;
    name: string;
    price: string;
    quantity?: number;
    tax?: string;
    discount?: string;
    image_urls?: string[];
    metadata?: Record<string, any>;
}
type Basket = BasketItem[];
interface RouteConfig {
    /**
     * Price for accessing this route (e.g., "$0.01")
     */
    price: string;
    /**
     * Optional basket of items for this route
     */
    basket?: Basket;
    /**
     * Additional configuration for the route
     */
    config?: {
        description?: string;
        [key: string]: any;
    };
    /**
     * Network for this specific route
     * Overrides the global network setting
     */
    network?: string;
}
interface PaymentMiddlewareConfig {
    /**
     * Wallet address to receive payments
     */
    address: Address;
    /**
     * Route configuration mapping paths to prices
     */
    routes: Record<string, RouteConfig | string>;
    /**
     * Facilitator configuration
     */
    facilitator?: FacilitatorConfig;
    /**
     * CDP client key for OnchainKit integration
     */
    cdpClientKey?: string;
    /**
     * Application logo URL
     */
    appLogo?: string;
    /**
     * Application name
     */
    appName?: string;
    /**
     * Session token endpoint
     */
    sessionTokenEndpoint?: string;
}

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
declare function paymentMiddleware(address: Address, routes: Record<string, RouteConfig | string>, config?: Omit<PaymentMiddlewareConfig, "address" | "routes">): (req: NextRequest) => Promise<NextResponse<any>>;

interface FacilitatorRouteConfig {
    network?: string;
    privateKey?: string;
    supportedNetworks?: string[];
}
/**
 * Creates all facilitator route handlers
 * @param config - Configuration for the facilitator routes
 * @returns Object containing all route handlers
 */
declare function createFacilitatorRoutes(config?: FacilitatorRouteConfig): {
    verify: {
        GET: () => Promise<Response>;
        POST: (req: Request) => Promise<Response>;
    };
    settle: {
        GET: () => Promise<Response>;
        POST: (req: Request) => Promise<Response>;
    };
    supported: {
        GET: () => Promise<Response>;
    };
    discovery: {
        GET: (request: next_server.NextRequest) => Promise<next_server.NextResponse>;
    };
};

export { type FacilitatorConfig, type PaymentMiddlewareConfig, type RouteConfig, createFacilitatorRoutes, paymentMiddleware };
