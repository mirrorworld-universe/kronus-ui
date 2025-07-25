import { Connection } from "@solana/web3.js";
import { NETWORK_OPTIONS, type Network } from "./constants";

class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private latencies: Map<string, number> = new Map();
  private currentEndpoint: string;
  private checkInterval: NodeJS.Timeout | null = null;
  private network: Network = "mainnet";
  private transports: string[];

  constructor(network: Network = "mainnet") {
    this.network = network;
    const networkOption = NETWORK_OPTIONS.find((n) => n.value === network);
    if (!networkOption) {
      throw new Error(`Network '${network}' is not supported`);
    }
    this.transports = networkOption.transports;
    if (!this.transports.length) {
      throw new Error("No RPC endpoints configured for network: " + network);
    }
    this.currentEndpoint = this.transports[0]!;
    this.initializeConnections();
    this.startHealthCheck();
  }

  private initializeConnections() {
    this.transports.forEach((endpoint) => {
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
        this.transports.map((endpoint) => this.checkEndpointHealth(endpoint))
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
        console.log(
          `Switching RPC endpoint to ${bestEndpoint} (latency: ${bestLatency}ms)`
        );
        this.currentEndpoint = bestEndpoint;
      }
    }, 30000); // Check every 30 seconds
  }

  public getCurrentConnection(): Connection {
    return this.connections.get(this.currentEndpoint)!;
  }

  public getNetwork(): Network {
    return this.network;
  }

  public setNetwork(network: Network) {
    if (network === this.network) return;
    const networkOption = NETWORK_OPTIONS.find((n) => n.value === network);
    if (!networkOption) {
      throw new Error(`Network '${network}' is not supported`);
    }
    this.network = network;
    this.transports = networkOption.transports;
    if (!this.transports.length) {
      throw new Error("No RPC endpoints configured for network: " + network);
    }
    // Clean up old connections and latencies
    this.connections.clear();
    this.latencies.clear();
    this.currentEndpoint = this.transports[0]!;
    this.initializeConnections();
    // Restart health check if running in browser
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.startHealthCheck();
    }
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

export const connectionManager = new ConnectionManager();
