/**
 * x402-nextjs - Zero-config x402 payment facilitator for Next.js
 * 
 * This library provides an embedded x402 facilitator that eliminates the need
 * for external facilitator services. Simply add the middleware to your Next.js
 * app and the facilitator routes are automatically configured.
 * 
 * @example
 * ```typescript
 * // middleware.ts
 * import { paymentMiddleware } from "x402-nextjs";
 * 
 * export const middleware = paymentMiddleware(
 *   "0xYourWalletAddress",
 *   {
 *     "/protected": "$0.01",
 *     "/api/premium": "$0.05"
 *   }
 * );
 * ```
 * 
 * @example
 * ```typescript
 * // app/facilitator/[...x402]/route.ts
 * export { GET, POST } from "x402-nextjs/facilitator";
 * ```
 */

export { paymentMiddleware } from "./middleware";
export { createFacilitatorRoutes } from "./routes";
export * as facilitator from "./facilitator";
export type {
  FacilitatorConfig,
  RouteConfig,
  PaymentMiddlewareConfig,
  PaymentPayload,
  PaymentRequirements,
  VerifyResponse,
  SettleResponse,
  SupportedPaymentKindsResponse,
} from "./types";

// Re-export session token handler
export { POST } from "x402-next";

// Re-export Network type
export type { Network } from "x402-next";
