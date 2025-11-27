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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  POST: () => import_x402_next2.POST,
  createFacilitatorRoutes: () => createFacilitatorRoutes,
  paymentMiddleware: () => paymentMiddleware
});
module.exports = __toCommonJS(index_exports);

// src/middleware.ts
var import_x402_next = require("x402-next");
var import_server = require("next/server");
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
  return async (req) => {
    const facilitatorUrl = getFacilitatorUrl(req);
    const response = await (0, import_x402_next.paymentMiddleware)(
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
    if (response && response.status === 402) {
      const pathname = req.nextUrl.pathname;
      const routeConfig = normalizedRoutes[pathname];
      if (routeConfig && routeConfig.basket) {
        try {
          const data = await response.json();
          data.basket = routeConfig.basket;
          if (data.accepts && Array.isArray(data.accepts)) {
            data.accepts.forEach((accept) => {
              if (accept.extra) {
                accept.extra.basket = routeConfig.basket;
              }
            });
          }
          return import_server.NextResponse.json(data, {
            status: 402,
            headers: response.headers
          });
        } catch (error) {
          console.error("Failed to inject basket into 402 response:", error);
        }
      }
    }
    return response;
  };
}

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
var import_server2 = require("next/server");
var import_types3 = require("x402/types");
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
      const validatedResponse = import_types3.ListDiscoveryResourcesResponseSchema.parse(
        mockListDiscoveryResourcesResponse
      );
      return import_server2.NextResponse.json(validatedResponse);
    } catch (error) {
      console.error("Error in discover/list:", error);
      return import_server2.NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
var import_x402_next2 = require("x402-next");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  POST,
  createFacilitatorRoutes,
  paymentMiddleware
});
