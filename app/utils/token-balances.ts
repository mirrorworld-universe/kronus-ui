import type {
  Connection } from "@solana/web3.js";
import {
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import fetch from "node-fetch";
import {
  TOKEN_2022_PROGRAM_ID,
  // getMint,
  // getMetadataPointerState,
  getTokenMetadata as _getTokenMetadata,
} from "@solana/spl-token";

import { connectionManager } from "@/utils/connection.manager";

const METADATA_CACHE: Record<string, {
  uri: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  attributes: any;
}> = {
  qPzdrTCvxK3bxoh2YoTZtDcGVgRUwm37aQcC3abFgBy: {
    uri: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/63ae6c0a0415d480c00880e64ec8a9c3724b4e37/deployments/warp_routes/USDT/metadata.json",
    name: "Tether USD",
    symbol: "USDT",
    description: "Warp Route USDT",
    image: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/refs/heads/main/deployments/warp_routes/USDT/logo.svg",
    attributes: []
  },
  HbDgpvHVxeNSRCGEUFvapCYmtYfqxexWcCbxtYecruy8: {
    uri: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/63ae6c0a0415d480c00880e64ec8a9c3724b4e37/deployments/warp_routes/USDC/metadata.json",
    name: "USD Coin",
    symbol: "USDC",
    description: "Warp Route USDC",
    image: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/refs/heads/main/deployments/warp_routes/USDC/logo.svg",
    attributes: []
  },
  mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL: {
    uri: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/63ae6c0a0415d480c00880e64ec8a9c3724b4e37/deployments/warp_routes/SONIC/metadata.json",
    name: "Sonic SVM",
    symbol: "SONIC",
    description: "SONIC is the official governance and utility token for Sonic SVM. Warp route bridged via Hyperlane.",
    image: "https://arweave.net/599UDQd5YAUfesAJCTNZ-4ELWLHX5pbid-ahpoJ-w1A",
    website: "https://sonic.game",
    attributes: []
  }
};

// Define token program IDs
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
// const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// Define interfaces for type safety
interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  image?: string | null;
}

export interface TokenBalance {
  name: string;
  symbol: string;
  mint: string;
  address: string;
  decimals: number;
  amount: string;
  uiAmount: number;
  tokenProgram: string;
  metadata: {
    uri: string | null;
    image: string | null;
  } | null;
}

export interface TokenBalanceWithPrice extends TokenBalance {
  tokenPrice: number;
}
export interface FormattedTokenBalanceWithPrice extends TokenBalanceWithPrice {
  tokenValue: number;
}

interface KnownToken {
  name: string;
  symbol: string;
  decimals: number;
}

// Basic token info cache - could be expanded if necessary
const KNOWN_TOKENS: Record<string, KnownToken> = {
  So11111111111111111111111111111111111111112: {
    name: "Wrapped SOL",
    symbol: "wSOL",
    decimals: 9
  },
  HbDgpvHVxeNSRCGEUFvapCYmtYfqxexWcCbxtYecruy8: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6
  },
  qPzdrTCvxK3bxoh2YoTZtDcGVgRUwm37aQcC3abFgBy: {
    name: "USDT",
    symbol: "USDT",
    decimals: 6
  }
};

// Function to get metadata PDA for a mint
function getMetadataPDA(mint: string): PublicKey {
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      new PublicKey(mint).toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return metadataPDA;
}

// Function to decode standard Metaplex metadata
function decodeMetadata(buffer: Buffer): TokenMetadata {
  try {
    // Skip the metadata prefix (first byte)
    let offset = 1;

    // Read name length and name
    const nameLength = buffer.readUInt32LE(offset);
    offset += 4;
    const name = buffer.toString("utf8", offset, offset + nameLength).replace(/\0/g, "");
    offset += nameLength;

    // Read symbol length and symbol
    const symbolLength = buffer.readUInt32LE(offset);
    offset += 4;
    const symbol = buffer.toString("utf8", offset, offset + symbolLength).replace(/\0/g, "");
    offset += symbolLength;

    // Read uri length and uri
    const uriLength = buffer.readUInt32LE(offset);
    offset += 4;
    const uri = buffer.toString("utf8", offset, offset + uriLength).replace(/\0/g, "");

    return {
      name,
      symbol,
      uri
    };
  } catch (error) {
    console.warn(`Failed to decode metadata: ${error instanceof Error ? error.message : String(error)}`);
    return {
      name: "Unknown",
      symbol: "UNKNOWN",
      uri: ""
    };
  }
}

export type TokenPrices = Record<string, string>;
export async function getTokenPrices(mints: string[]) {
  const response = await $fetch<{
    data: TokenPrices;
    id: string;
    success?: boolean;
  }>(`https://api.sega.so/api/mint/price?mints=${mints.join(",")}`);

  return response.data;
}

// Function to fetch on-chain metadata for a token mint
async function getTokenMetadata(connection: Connection, mint: string): Promise<TokenMetadata | null> {
  try {
    // Check for Metaplex metadata
    const metadataPDA = getMetadataPDA(mint);
    const accountInfo = await connection.getAccountInfo(metadataPDA);

    if (accountInfo) {
      // Parse Metaplex metadata
      const metadata = decodeMetadata(accountInfo.data);

      // Fetch additional metadata from URI if available
      const uri = metadata.uri.trim();
      let image = null;

      if (uri) {
        try {
          const response = await fetch(uri);
          const jsonData = await response.json();
          image = (jsonData as any).image || null;
        } catch (error) {
          console.warn(`Failed to fetch metadata URI: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        image
      };
    }

    // If no metadata found, return null
    return null;
  } catch (error) {
    console.warn(`Failed to fetch metadata for mint ${mint}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Function to get Token-2022 metadata extension data
async function getToken2022Metadata(connection: Connection, mint: string): Promise<TokenMetadata | null> {
  try {
    // const mintInfo = await getMint(
    //   connection,
    //   new PublicKey(mint),
    //   "confirmed",
    //   TOKEN_2022_PROGRAM_ID,
    // );

    // Retrieve and log the metadata pointer state
    // const metadataPointer = getMetadataPointerState(mintInfo);
    // console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));

    const metadata = await _getTokenMetadata(
      connection,
      new PublicKey(mint), // Mint Account address
    );
    let image = null;

    if (metadata) {
      // Fetch additional metadata from URI if available
      const uri = metadata.uri.trim();

      if (uri) {
        const mintAddress = new PublicKey(mint);
        const cachedEntry = METADATA_CACHE[mintAddress.toBase58()];

        if (cachedEntry?.uri === uri) {
          return {
            name: cachedEntry.name,
            symbol: cachedEntry.symbol,
            uri: cachedEntry.uri,
            image: cachedEntry.image
          };
        }

        try {
          const response = await fetch(uri);
          const jsonData = await response.json();
          image = (jsonData as any).image || null;
        } catch (error) {
          console.warn(`Failed to fetch metadata URI: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      return {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        image
      };
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch Token-2022 metadata for ${mint}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Main function to query token balances
export async function getTokenBalances(address: string): Promise<TokenBalanceWithPrice[]> {
  const connection = connectionManager.getCurrentConnection();
  const publicKey = new PublicKey(address);

  // Get SOL balance first
  const solBalance = await connection.getBalance(publicKey);
  const solTokenInfo: TokenBalance = {
    name: "Solana",
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    address: publicKey.toString(),
    decimals: 9,
    amount: solBalance.toString(),
    uiAmount: solBalance / LAMPORTS_PER_SOL,
    tokenProgram: "System Program",
    metadata: null
  };

  // Query for Legacy SPL token accounts
  const { value: tokenAccounts } = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );

  // Query for Token-2022 accounts
  const { value: token2022Accounts } = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    { programId: TOKEN_2022_PROGRAM_ID }
  );

  // Combine all token accounts
  const allTokenAccounts = [...tokenAccounts, ...token2022Accounts];

  // Process token accounts
  const tokenPromises = allTokenAccounts.map(async (tokenAccount) => {
    const parsedInfo = tokenAccount.account.data.parsed.info;
    const mintAddress = parsedInfo.mint;
    const tokenAmount = parsedInfo.tokenAmount;

    // Skip tokens with zero balance
    if (tokenAmount.amount === "0") {
      return null;
    }

    // Check if it's a known token
    const knownToken = KNOWN_TOKENS[mintAddress];

    // Determine which token program the token belongs to
    const isToken2022 = tokenAccount.account.owner.equals(TOKEN_2022_PROGRAM_ID);
    const tokenProgram = isToken2022 ? "Token-2022 Program" : "Token Program";

    // Try to get metadata based on token type
    let metadata: TokenMetadata | null = null;

    if (isToken2022) {
      // Try to get Token-2022 metadata extension
      metadata = await getToken2022Metadata(connection, mintAddress);
    }

    // If no Token-2022 metadata or if it's a Legacy token, try Metaplex metadata
    if (!metadata) {
      metadata = await getTokenMetadata(connection, mintAddress);
    }

    // Use known token info or fallback if metadata not available
    const name = metadata?.name || knownToken?.name || `Unknown Token (${mintAddress.slice(0, 6)}...)`;
    const symbol = metadata?.symbol || knownToken?.symbol || "UNKNOWN";

    return {
      name,
      symbol,
      mint: mintAddress,
      address: tokenAccount.pubkey.toString(),
      decimals: tokenAmount.decimals,
      amount: tokenAmount.amount,
      uiAmount: tokenAmount.uiAmount,
      tokenProgram,
      metadata: metadata
        ? {
            uri: metadata.uri || null,
            image: metadata.image || null
          }
        : null
    };
  });

  // Resolve all promises and filter out null values
  const tokens = (await Promise.all(tokenPromises)).filter((token): token is TokenBalance => token !== null);

  // Return combined results with SOL first, filtering out NFTs (tokens with 0 decimals)
  const nonNftTokens = tokens.filter(token => token.decimals > 0);

  const allTokens = [solTokenInfo, ...nonNftTokens];

  const allTokenMints = allTokens.map(token => token.mint);
  const allTokenMintPrices = await getTokenPrices(allTokenMints);

  const allTokensWithPrices = allTokens.map(token => ({
    ...token,
    tokenPrice: parseFloat(allTokenMintPrices[token.mint] || "0")
  }));

  return allTokensWithPrices;
}

// Format balances for display
export function formatBalances(balances: TokenBalanceWithPrice[]): FormattedTokenBalanceWithPrice[] {
  return balances.map(token => ({
    name: token.name,
    symbol: token.symbol,
    mint: token.mint,
    address: token.address,
    metadata: token.metadata,
    decimals: token.decimals,
    amount: token.amount,
    uiAmount: token.uiAmount,
    tokenProgram: token.tokenProgram,
    tokenPrice: token.tokenPrice,
    tokenValue: Number(token.tokenPrice * token.uiAmount)
  }));
}
