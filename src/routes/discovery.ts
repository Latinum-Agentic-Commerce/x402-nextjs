import { NextRequest, NextResponse } from "next/server";
import {
  ListDiscoveryResourcesRequest,
  ListDiscoveryResourcesResponse,
  ListDiscoveryResourcesResponseSchema,
} from "x402/types";

/**
 * Creates a discovery route handler for x402 payments
 * @returns Next.js route handler (GET)
 */
export function createDiscoveryRoute(): {
  GET: (request: NextRequest) => Promise<NextResponse>;
} {
  async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const { offset, limit } = Object.fromEntries(
        searchParams.entries(),
      ) as ListDiscoveryResourcesRequest;

      const mockListDiscoveryResourcesResponse: ListDiscoveryResourcesResponse = {
        x402Version: 1,
        items: [],
        pagination: {
          limit: limit || 10,
          offset: offset || 0,
          total: 0,
        },
      };

      const validatedResponse = ListDiscoveryResourcesResponseSchema.parse(
        mockListDiscoveryResourcesResponse,
      );

      return NextResponse.json(validatedResponse);
    } catch (error) {
      console.error("Error in discover/list:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return { GET };
}
