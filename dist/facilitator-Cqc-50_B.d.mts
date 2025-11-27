import { NextRequest } from 'next/server';

/**
 * Pre-built GET handler for facilitator routes
 * Handles: /facilitator/verify, /facilitator/settle, /facilitator/supported, /facilitator/discovery
 */
declare function GET(req: NextRequest, context: {
    params: Promise<{
        x402: string[];
    }>;
}): Promise<Response>;
/**
 * Pre-built POST handler for facilitator routes
 * Handles: /facilitator/verify, /facilitator/settle
 */
declare function POST(req: NextRequest, context: {
    params: Promise<{
        x402: string[];
    }>;
}): Promise<Response>;

declare const facilitator_GET: typeof GET;
declare const facilitator_POST: typeof POST;
declare namespace facilitator {
  export { facilitator_GET as GET, facilitator_POST as POST };
}

export { GET as G, POST as P, facilitator as f };
