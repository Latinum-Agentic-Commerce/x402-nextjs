import { Address } from "viem";

export interface FacilitatorConfig {
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

export interface RouteConfig {
  /**
   * Price for accessing this route (e.g., "$0.01")
   */
  price: string;

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

export interface PaymentMiddlewareConfig {
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

// Re-export types from x402
export type {
  PaymentPayload,
  PaymentRequirements,
  VerifyResponse,
  SettleResponse,
  SupportedPaymentKindsResponse,
} from "x402/types";
