import { createVerifyRoute } from "./verify";
import { createSettleRoute } from "./settle";
import { createSupportedRoute } from "./supported";
import { createDiscoveryRoute } from "./discovery";

export interface FacilitatorRouteConfig {
  network?: string;
  privateKey?: string;
  supportedNetworks?: string[];
}

/**
 * Creates all facilitator route handlers
 * @param config - Configuration for the facilitator routes
 * @returns Object containing all route handlers
 */
export function createFacilitatorRoutes(config: FacilitatorRouteConfig = {}) {
  const {
    network = process.env.NETWORK || "base-sepolia",
    privateKey = process.env.PRIVATE_KEY,
    supportedNetworks = [network],
  } = config;

  return {
    verify: createVerifyRoute(network),
    settle: createSettleRoute(network, privateKey),
    supported: createSupportedRoute(supportedNetworks),
    discovery: createDiscoveryRoute(),
  };
}

export * from "./verify";
export * from "./settle";
export * from "./supported";
export * from "./discovery";
