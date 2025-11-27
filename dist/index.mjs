import {
  createFacilitatorRoutes,
  facilitator_exports
} from "./chunk-RD5DW23A.mjs";

// src/middleware.ts
import { paymentMiddleware as x402NextMiddleware } from "x402-next";
import { NextResponse } from "next/server";
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
    const response = await x402NextMiddleware(
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
          return NextResponse.json(data, {
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

// src/index.ts
import { POST } from "x402-next";
export {
  POST,
  createFacilitatorRoutes,
  facilitator_exports as facilitator,
  paymentMiddleware
};
