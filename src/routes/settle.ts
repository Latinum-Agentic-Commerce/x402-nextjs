import { Hex } from "viem";
import { settle } from "x402/facilitator";
import {
  PaymentPayload,
  PaymentPayloadSchema,
  PaymentRequirements,
  PaymentRequirementsSchema,
  SettleResponse,
  evm,
} from "x402/types";

type SettleRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

/**
 * Creates a settle route handler for x402 payments
 * @param network - The blockchain network to use for settlement
 * @param privateKey - The private key for signing transactions
 * @returns Next.js route handlers (GET and POST)
 */
export function createSettleRoute(network: string = "base-sepolia", privateKey?: string): {
  GET: () => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
} {
  async function POST(req: Request) {
    const key = privateKey || process.env.PRIVATE_KEY;
    if (!key) {
      return Response.json(
        {
          success: false,
          errorReason: "missing_private_key",
          transaction: "",
          network: network,
        } as any,
        { status: 500 },
      );
    }

    const wallet = evm.createSigner(network, key as Hex);
    const body = await req.json() as SettleRequest;

    let paymentPayload: PaymentPayload;
    try {
      paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);
    } catch (error) {
      console.error("Invalid payment payload:", error);
      return Response.json(
        {
          success: false,
          errorReason: "invalid_payload",
          transaction: "",
          network: body.paymentPayload?.network || "",
        } as SettleResponse,
        { status: 400 },
      );
    }

    let paymentRequirements: PaymentRequirements;
    try {
      paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    } catch (error) {
      console.error("Invalid payment requirements:", error);
      return Response.json(
        {
          success: false,
          errorReason: "invalid_payment_requirements",
          transaction: "",
          network: paymentPayload.network,
        } as SettleResponse,
        { status: 400 },
      );
    }

    try {
      const response = await settle(wallet, paymentPayload, paymentRequirements);
      return Response.json(response);
    } catch (error) {
      console.error("Error settling payment:", error);
      return Response.json(
        {
          success: false,
          errorReason: "unexpected_settle_error",
          transaction: "",
          network: paymentPayload.network,
        } as SettleResponse,
        { status: 500 },
      );
    }
  }

  async function GET() {
    return Response.json({
      endpoint: "/settle",
      description: "POST to settle x402 payments",
      body: {
        paymentPayload: "PaymentPayload",
        paymentRequirements: "PaymentRequirements",
      },
    });
  }

  return { GET, POST };
}
