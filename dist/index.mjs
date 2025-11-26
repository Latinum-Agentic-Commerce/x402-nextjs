// src/middleware.ts
import { paymentMiddleware as x402NextMiddleware } from "x402-next";
function paymentMiddleware(address, routes, config) {
  const {
    facilitator = {},
    cdpClientKey,
    appLogo,
    appName,
    sessionTokenEndpoint
  } = config || {};
  const {
    basePath = "/facilitator",
    network = process.env.NETWORK || "base-sepolia"
  } = facilitator;
  const normalizedRoutes = {};
  for (const [path, routeConfig] of Object.entries(routes)) {
    if (typeof routeConfig === "string") {
      normalizedRoutes[path] = {
        price: routeConfig,
        network
      };
    } else {
      normalizedRoutes[path] = {
        ...routeConfig,
        network: routeConfig.network || network
      };
    }
  }
  const getFacilitatorUrl = (req) => {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    return `${protocol}://${host}${basePath}`;
  };
  return (req) => {
    const facilitatorUrl = getFacilitatorUrl(req);
    return x402NextMiddleware(
      address,
      normalizedRoutes,
      { url: facilitatorUrl },
      {
        cdpClientKey,
        appLogo,
        appName,
        sessionTokenEndpoint
      }
    )(req);
  };
}

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
  async function GET() {
    return Response.json({
      endpoint: "/verify",
      description: "POST to verify x402 payments",
      body: {
        paymentPayload: "PaymentPayload",
        paymentRequirements: "PaymentRequirements"
      }
    });
  }
  return { GET, POST: POST2 };
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
  async function GET() {
    return Response.json({
      endpoint: "/settle",
      description: "POST to settle x402 payments",
      body: {
        paymentPayload: "PaymentPayload",
        paymentRequirements: "PaymentRequirements"
      }
    });
  }
  return { GET, POST: POST2 };
}

// src/routes/supported.ts
function createSupportedRoute(networks = ["base-sepolia"]) {
  async function GET() {
    const response = {
      kinds: networks.map((network) => ({
        x402Version: 1,
        scheme: "exact",
        network
      }))
    };
    return Response.json(response);
  }
  return { GET };
}

// src/routes/discovery.ts
import { NextResponse } from "next/server";
import {
  ListDiscoveryResourcesResponseSchema
} from "x402/types";
function createDiscoveryRoute() {
  async function GET(request) {
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
  return { GET };
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

// src/index.ts
import { POST } from "x402-next";
export {
  POST,
  createFacilitatorRoutes,
  paymentMiddleware
};
