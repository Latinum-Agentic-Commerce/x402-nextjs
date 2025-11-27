"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/facilitator.ts
var facilitator_exports = {};
__export(facilitator_exports, {
  GET: () => GET,
  POST: () => POST
});
module.exports = __toCommonJS(facilitator_exports);
var import_server2 = require("next/server");

// src/routes/verify.ts
var import_types = require("x402/types");
var import_facilitator = require("x402/facilitator");
function createVerifyRoute(network = "base-sepolia") {
  const client = import_types.evm.createConnectedClient(network);
  async function POST2(req) {
    const body = await req.json();
    let paymentPayload;
    try {
      paymentPayload = import_types.PaymentPayloadSchema.parse(body.paymentPayload);
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
      paymentRequirements = import_types.PaymentRequirementsSchema.parse(body.paymentRequirements);
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
      const valid = await (0, import_facilitator.verify)(client, paymentPayload, paymentRequirements);
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
var import_facilitator2 = require("x402/facilitator");
var import_types2 = require("x402/types");
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
    const wallet = import_types2.evm.createSigner(network, key);
    const body = await req.json();
    let paymentPayload;
    try {
      paymentPayload = import_types2.PaymentPayloadSchema.parse(body.paymentPayload);
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
      paymentRequirements = import_types2.PaymentRequirementsSchema.parse(body.paymentRequirements);
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
      const response = await (0, import_facilitator2.settle)(wallet, paymentPayload, paymentRequirements);
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
var import_server = require("next/server");
var import_types3 = require("x402/types");
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
      const validatedResponse = import_types3.ListDiscoveryResourcesResponseSchema.parse(
        mockListDiscoveryResourcesResponse
      );
      return import_server.NextResponse.json(validatedResponse);
    } catch (error) {
      console.error("Error in discover/list:", error);
      return import_server.NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
  return import_server2.NextResponse.json({ error: "Not found" }, { status: 404 });
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
  return import_server2.NextResponse.json({ error: "Not found" }, { status: 404 });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GET,
  POST
});
