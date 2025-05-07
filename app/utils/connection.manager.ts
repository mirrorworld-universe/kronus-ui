import { Connection } from "@solana/web3.js/lib/index.esm";
import { RPC_CONNECTION_TRANSPORTS } from "./constants";

class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private latencies: Map<string, number> = new Map();
  private currentEndpoint: string;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (!RPC_CONNECTION_TRANSPORTS.length) {
      throw new Error("No RPC endpoints configured");
    }
    this.currentEndpoint = RPC_CONNECTION_TRANSPORTS[0]!;
    this.initializeConnections();
    this.startHealthCheck();
  }

  private initializeConnections() {
    RPC_CONNECTION_TRANSPORTS.forEach((endpoint) => {
      this.connections.set(endpoint, new Connection(endpoint, "confirmed"));
      this.latencies.set(endpoint, 0);
    });
  }

  private async checkEndpointHealth(endpoint: string) {
    const connection = this.connections.get(endpoint);
    if (!connection) return;

    try {
      const start = performance.now();
      await connection.getLatestBlockhash();
      const latency = performance.now() - start;
      this.latencies.set(endpoint, latency);
    } catch {
      this.latencies.set(endpoint, Infinity);
    }
  }

  private async startHealthCheck() {
    // Do not run setInterval in the server-side
    if (typeof window === "undefined") return;

    this.checkInterval = setInterval(async () => {
      await Promise.all(
        RPC_CONNECTION_TRANSPORTS.map(endpoint => this.checkEndpointHealth(endpoint))
      );

      // Find endpoint with lowest latency
      let bestEndpoint = this.currentEndpoint;
      let bestLatency = this.latencies.get(this.currentEndpoint) || Infinity;

      this.latencies.forEach((latency, endpoint) => {
        if (latency < bestLatency) {
          bestLatency = latency;
          bestEndpoint = endpoint;
        }
      });

      if (bestEndpoint !== this.currentEndpoint) {
        console.log(`Switching RPC endpoint to ${bestEndpoint} (latency: ${bestLatency}ms)`);
        this.currentEndpoint = bestEndpoint;
      }
    }, 30000); // Check every 30 seconds
  }

  public getCurrentConnection(): Connection {
    return this.connections.get(this.currentEndpoint)!;
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

export const connectionManager = new ConnectionManager();
