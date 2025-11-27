var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/facilitator.ts
var facilitator_exports = {};
__export(facilitator_exports, {
  GET: () => GET,
  POST: () => POST
});
import { NextResponse as NextResponse2 } from "next/server";

// src/routes/verify.ts
import {
  PaymentPayloadSchema,
  PaymentRequirementsSchema,
  evm
} from "x402/types";
import { verify } from "x402/facilitator";
function createVerifyRoute(network = "base-sepolia") {
  const client = evm.createConnectedClient(network);
  async function POST2(req) {
    const body = await req.json();
    let paymentPayload;
    try {
      paymentPayload = PaymentPayloadSchema.parse(body.paymentPayload);
    } catch (error) {
      console.error("Invalid payment payload:", error);
      const payer = "authorization" in (body.paymentPayload?.payload || {}) ? body.paymentPayload.payload.authorization?.from : "";
      return Response.json(
        {
          isValid: false,
          invalidReason: "invalid_payload",
          payer
        },
        { status: 400 }
      );
    }
    let paymentRequirements;
    try {
      paymentRequirements = PaymentRequirementsSchema.parse(body.paymentRequirements);
    } catch (error) {
      console.error("Invalid payment requirements:", error);
      const payer = "authorization" in paymentPayload.payload ? paymentPayload.payload.authorization.from : "";
      return Response.json(
        {
          isValid: false,
          invalidReason: "invalid_payment_requirements",
          payer
        },
        { status: 400 }
      );
    }
    try {
      const valid = await verify(client, paymentPayload, paymentRequirements);
      return Response.json(valid);
    } catch (error) {
      console.error("Error verifying payment:", error);
      const payer = "authorization" in paymentPayload.payload ? paymentPayload.payload.authorization.from : "";
      return Response.json(
        {
          isValid: false,
          invalidReason: "unexpected_verify_error",
          payer
        },
        { status: 500 }
      );
    }
  }
  async function GET2() {
    return Response.json({
      endpoint: "/verify",
      description: "POST to verify x402 payments",
      body: {
        paymentPayload: "PaymentPayload",
        paymentRequirements: "PaymentRequirements"
      }
    });
  }
  return { GET: GET2, POST: POST2 };
}

// src/routes/settle.ts
import { settle } from "x402/facilitator";
import {
  PaymentPayloadSchema as PaymentPayloadSchema2,
  PaymentRequirementsSchema as PaymentRequirementsSchema2,
  evm as evm2
} from "x402/types";
function createSettleRoute(network = "base-sepolia", privateKey) {
  async function POST2(req) {
    const key = privateKey || process.env.PRIVATE_KEY;
    if (!key) {
      return Response.json(
        {
          success: false,
          errorReason: "missing_private_key",
          transaction: "",
          network
        },
        { status: 500 }
      );
    }
    const wallet = evm2.createSigner(network, key);
    const body = await req.json();
    let paymentPayload;
    try {
      paymentPayload = PaymentPayloadSchema2.parse(body.paymentPayload);
    } catch (error) {
      console.error("Invalid payment payload:", error);
      return Response.json(
        {
          success: false,
          errorReason: "invalid_payload",
          transaction: "",
          network: body.paymentPayload?.network || ""
        },
        { status: 400 }
      );
    }
    let paymentRequirements;
    try {
      paymentRequirements = PaymentRequirementsSchema2.parse(body.paymentRequirements);
    } catch (error) {
      console.error("Invalid payment requirements:", error);
      return Response.json(
        {
          success: false,
          errorReason: "invalid_payment_requirements",
          transaction: "",
          network: paymentPayload.network
        },
        { status: 400 }
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
          network: paymentPayload.network
        },
        { status: 500 }
      );
    }
  }
  async function GET2() {
    return Response.json({
      endpoint: "/settle",
      description: "POST to settle x402 payments",
      body: {
        paymentPayload: "PaymentPayload",
        paymentRequirements: "PaymentRequirements"
      }
    });
  }
  return { GET: GET2, POST: POST2 };
}

// src/routes/supported.ts
function createSupportedRoute(networks = ["base-sepolia"]) {
  async function GET2() {
    const response = {
      kinds: networks.map((network) => ({
        x402Version: 1,
        scheme: "exact",
        network
      }))
    };
    return Response.json(response);
  }
  return { GET: GET2 };
}

// src/routes/discovery.ts
import { NextResponse } from "next/server";
import {
  ListDiscoveryResourcesResponseSchema
} from "x402/types";
function createDiscoveryRoute() {
  async function GET2(request) {
    try {
      const { searchParams } = new URL(request.url);
      const { offset, limit } = Object.fromEntries(
        searchParams.entries()
      );
      const mockListDiscoveryResourcesResponse = {
        x402Version: 1,
        items: [],
        pagination: {
          limit: limit || 10,
          offset: offset || 0,
          total: 0
        }
      };
      const validatedResponse = ListDiscoveryResourcesResponseSchema.parse(
        mockListDiscoveryResourcesResponse
      );
      return NextResponse.json(validatedResponse);
    } catch (error) {
      console.error("Error in discover/list:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  return { GET: GET2 };
}

// src/routes/index.ts
function createFacilitatorRoutes(config = {}) {
  const {
    network = process.env.NETWORK || "base-sepolia",
    privateKey = process.env.PRIVATE_KEY,
    supportedNetworks = [network]
  } = config;
  return {
    verify: createVerifyRoute(network),
    settle: createSettleRoute(network, privateKey),
    supported: createSupportedRoute(supportedNetworks),
    discovery: createDiscoveryRoute()
  };
}

// src/facilitator.ts
async function GET(req, context) {
  const { x402 } = await context.params;
  const path = x402[0];
  const network = process.env.NETWORK || "base-sepolia";
  const supportedNetworks = process.env.SUPPORTED_NETWORKS ? process.env.SUPPORTED_NETWORKS.split(",") : [network];
  const routes = createFacilitatorRoutes({
    network,
    supportedNetworks
  });
  if (path === "verify") return routes.verify.GET();
  if (path === "settle") return routes.settle.GET();
  if (path === "supported") return routes.supported.GET();
  if (path === "discovery") return routes.discovery.GET(req);
  return NextResponse2.json({ error: "Not found" }, { status: 404 });
}
async function POST(req, context) {
  const { x402 } = await context.params;
  const path = x402[0];
  const network = process.env.NETWORK || "base-sepolia";
  const privateKey = process.env.PRIVATE_KEY;
  const routes = createFacilitatorRoutes({
    network,
    privateKey
  });
  if (path === "verify") return routes.verify.POST(req);
  if (path === "settle") return routes.settle.POST(req);
  return NextResponse2.json({ error: "Not found" }, { status: 404 });
}

export {
  createFacilitatorRoutes,
  GET,
  POST,
  facilitator_exports
};
