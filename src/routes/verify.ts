import {
  PaymentPayload,
  PaymentPayloadSchema,
  PaymentRequirements,
  PaymentRequirementsSchema,
  VerifyResponse,
  evm,
} from "x402/types";
import { verify } from "x402/facilitator";

type VerifyRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

/**
 * Creates a verify route handler for x402 payments
 * @param network - The blockchain network to use for verification
 * @returns Next.js route handlers (GET and POST)
 */
export function createVerifyRoute(network: string = "base-sepolia"): {
  GET: () => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
} {
  const client = evm.createConnectedClient(network);

  async function POST(req: Request) {
    const body = await req.json() as VerifyRequest;

    let paymentPayload: PaymentPayload;
    try {
      paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);
    } catch (error) {
      console.error("Invalid payment payload:", error);
      const payer = 'authorization' in (body.paymentPayload?.payload || {}) 
        ? (body.paymentPayload.payload as any).authorization?.from 
        : "";
        
      return Response.json(
        {
          isValid: false,
          invalidReason: "invalid_payload",
          payer,
        } as VerifyResponse,
        { status: 400 },
      );
    }

    let paymentRequirements: PaymentRequirements;
    try {
      paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    } catch (error) {
      console.error("Invalid payment requirements:", error);
      const payer = 'authorization' in paymentPayload.payload 
        ? (paymentPayload.payload as any).authorization.from 
        : "";

      return Response.json(
        {
          isValid: false,
          invalidReason: "invalid_payment_requirements",
          payer,
        } as VerifyResponse,
        { status: 400 },
      );
    }

    try {
      const valid = await verify(client, paymentPayload, paymentRequirements);
      return Response.json(valid);
    } catch (error) {
      console.error("Error verifying payment:", error);
      const payer = 'authorization' in paymentPayload.payload 
        ? (paymentPayload.payload as any).authorization.from 
        : "";

      return Response.json(
        {
          isValid: false,
          invalidReason: "unexpected_verify_error",
          payer,
        } as VerifyResponse,
        { status: 500 },
      );
    }
  }

  async function GET() {
    return Response.json({
      endpoint: "/verify",
      description: "POST to verify x402 payments",
      body: {
        paymentPayload: "PaymentPayload",
        paymentRequirements: "PaymentRequirements",
      },
    });
  }

  return { GET, POST };
}
