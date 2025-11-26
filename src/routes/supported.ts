import { SupportedPaymentKindsResponse } from "x402/types";

/**
 * Creates a supported route handler for x402 payments
 * @param networks - Array of supported networks
 * @returns Next.js route handler (GET)
 */
export function createSupportedRoute(networks: string[] = ["base-sepolia"]): {
  GET: () => Promise<Response>;
} {
  async function GET() {
    const response: SupportedPaymentKindsResponse = {
      kinds: networks.map((network) => ({
        x402Version: 1,
        scheme: "exact",
        network: network as any,
      })),
    };

    return Response.json(response);
  }

  return { GET };
}
