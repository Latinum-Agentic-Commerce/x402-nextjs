import { NextRequest, NextResponse } from "next/server";
import { createFacilitatorRoutes } from "./routes";

/**
 * Pre-built GET handler for facilitator routes
 * Handles: /facilitator/verify, /facilitator/settle, /facilitator/supported, /facilitator/discovery
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ x402: string[] }> }
) {
    const { x402 } = await context.params;
    const path = x402[0];

    // Read config from environment variables
    const network = process.env.NETWORK || "base-sepolia";
    const supportedNetworks = process.env.SUPPORTED_NETWORKS
        ? process.env.SUPPORTED_NETWORKS.split(",")
        : [network];

    const routes = createFacilitatorRoutes({
        network,
        supportedNetworks,
    });

    // Route to appropriate handler
    if (path === "verify") return routes.verify.GET();
    if (path === "settle") return routes.settle.GET();
    if (path === "supported") return routes.supported.GET();
    if (path === "discovery") return routes.discovery.GET(req as any);

    return NextResponse.json({ error: "Not found" }, { status: 404 });
}

/**
 * Pre-built POST handler for facilitator routes
 * Handles: /facilitator/verify, /facilitator/settle
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ x402: string[] }> }
) {
    const { x402 } = await context.params;
    const path = x402[0];

    // Read config from environment variables
    const network = process.env.NETWORK || "base-sepolia";
    const privateKey = process.env.PRIVATE_KEY;

    const routes = createFacilitatorRoutes({
        network,
        privateKey,
    });

    // Route to appropriate handler
    if (path === "verify") return routes.verify.POST(req);
    if (path === "settle") return routes.settle.POST(req);

    return NextResponse.json({ error: "Not found" }, { status: 404 });
}
