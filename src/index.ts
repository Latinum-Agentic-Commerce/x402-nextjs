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
 * import { createFacilitatorRoutes } from "x402-nextjs";
 * 
 * const routes = createFacilitatorRoutes();
 * 
 * export async function GET(req: Request, { params }: { params: { x402: string[] } }) {
 *   const path = params.x402[0];
 *   if (path === "verify") return routes.verify.GET(req);
 *   if (path === "settle") return routes.settle.GET(req);
 *   if (path === "supported") return routes.supported.GET();
 *   return Response.json({ error: "Not found" }, { status: 404 });
 * }
 * 
 * export async function POST(req: Request, { params }: { params: { x402: string[] } }) {
 *   const path = params.x402[0];
 *   if (path === "verify") return routes.verify.POST(req);
 *   if (path === "settle") return routes.settle.POST(req);
 *   return Response.json({ error: "Not found" }, { status: 404 });
 * }
 * ```
 */

export { paymentMiddleware } from "./middleware";
export { createFacilitatorRoutes } from "./routes";
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
