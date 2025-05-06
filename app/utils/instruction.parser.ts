import { TransferAssetType } from "~~/server/validations/schemas";
/**
 * Interface representing a Solana transaction message
 */
export interface SolanaTransactionMessage {
  numSigners: number;
  numWritableSigners: number;
  numWritableNonSigners: number;
  accountKeys: string[];
  instructions: SolanaInstruction[];
  addressTableLookups: any[];
}

/**
 * Interface representing a Solana instruction
 */
export interface SolanaInstruction {
  programIdIndex: number;
  accountIndexes: string;
  data: string;
}

/**
 * Interface representing parsed SOL transfer details
 */
export interface SOLTransferDetails {
  type: string;
  from: string;
  to: string;
  amount: number;
  amountInSOL: number;
  programId: string;
}

/**
 * Interface representing parsed SPL token transfer details
 */
export interface SPLTokenTransferDetails {
  type: string;
  from: string;
  to: string;
  amount: number;
  mint: string;
  programId: string;
}

/**
 * Parses a Solana transaction message and extracts instruction data for SOL transfers
 * @param {SolanaTransactionMessage} message - The JSON transaction message
 * @returns {SOLTransferDetails} The parsed SOL transfer details
 * @throws {Error} If message format is invalid or not a SOL transfer instruction
 */
export function parseSOLTransferInstruction(message: SolanaTransactionMessage): SOLTransferDetails {
  // Validate message format
  if (!message.instructions || message.instructions.length === 0) {
    throw new Error("No instructions found in message");
  }

  // Get the instruction (focusing on the first one for this example)
  const instruction = message.instructions[0]!;

  // Check if this is a System Program instruction (SOL transfer)
  const programId = message.accountKeys[instruction.programIdIndex];
  if (programId !== "11111111111111111111111111111111") {
    throw new Error("Not a System Program instruction");
  }

  // Convert object-based account indexes to array
  const accountIndexes = Object.values(instruction.accountIndexes)!;

  // @ts-expect-error Get the source accounts
  const fromAccount = message.accountKeys[accountIndexes[1]];
  // @ts-expect-error Get the destination accounts
  const toAccount = message.accountKeys[accountIndexes[0]];

  // Convert object-based data to array
  const dataBytes = Object.values(instruction.data);

  // For System Program transfers:
  // - First 4 bytes (32 bits) represent the instruction type (2 = transfer)
  // - Next 8 bytes (64 bits) represent the amount in lamports
  const _instructionType = dataBytes[0];

  // Extract the amount (next 8 bytes, little-endian)
  let amount = 0;
  let multiplier = 1;
  for (let i = 4; i < 12; i++) {
    // @ts-expect-error untyped variable
    amount += dataBytes[i]! * multiplier;
    multiplier *= 256;
  }

  return {
    type: TransferAssetType.SOL,
    from: fromAccount,
    to: toAccount,
    amount: amount,
    amountInSOL: amount / 1_000_000_000, // Convert lamports to SOL
    programId: programId
  };
}

/**
 * Parses a Solana transaction message specifically for SPL token transfers
 * @param {SolanaTransactionMessage} message - The JSON transaction message
 * @returns {SPLTokenTransferDetails} The parsed SPL token transfer details
 * @throws {Error} If not an SPL token transfer instruction
 */
export function parseSPLTokenTransferInstruction(message: SolanaTransactionMessage): SPLTokenTransferDetails {
  // Validate message format
  if (!message.instructions || message.instructions.length === 0) {
    throw new Error("No instructions found in message");
  }

  // Find the Token Program instruction (typically with instruction type 3 for Transfer)
  // First identify the Token Program ID
  const tokenProgramId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const tokenProgramAltId = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"; // Alternative ID

  // Find the instruction that uses the Token Program
  const tokenInstructionIndex = message.instructions.findIndex((instr) => {
    const programId = message.accountKeys[instr.programIdIndex]!;
    return programId === tokenProgramId || programId === tokenProgramAltId;
  });

  if (tokenInstructionIndex === -1) {
    throw new Error("No SPL Token Program instruction found");
  }

  const instruction = message.instructions[tokenInstructionIndex]!;
  const programId = message.accountKeys[instruction.programIdIndex];

  // Convert object-based account indexes to array
  const accountIndexes = Object.values(instruction.accountIndexes);

  // For SPL Token transfers, the accounts are typically:
  // [source token account, destination token account, owner of source token account, ...]
  if (accountIndexes.length < 3) {
    throw new Error("Invalid number of accounts for SPL token transfer");
  }
  // @ts-expect-error Get the owner account
  const owner = message.accountKeys[accountIndexes[2]]; // Owner of the source account

  // Convert object-based data to array
  const dataBytes = instruction.data ? Object.values(instruction.data) : [];

  let amount = 0;
  let multiplier = 1;

  // @ts-expect-error Check if this is indeed a transfer instruction (code 3)
  if (dataBytes.length > 0 && dataBytes[0] === 3) {
    // Extract the amount (next 8 bytes, little-endian)
    for (let i = 1; i < Math.min(9, dataBytes.length); i++) {
      // @ts-expect-error untyped variable
      amount += dataBytes[i] * multiplier;
      multiplier *= 256;
    }
  } else {
    throw new Error("Not a token transfer instruction");
  }

  // In a real implementation, you would query on-chain data to get these details
  const mint = "Unknown"; // Would need additional on-chain query to determine
  const destinationOwner = "Unknown"; // Would need additional on-chain query to determine

  return {
    type: TransferAssetType.SPL,
    from: owner,
    to: destinationOwner,
    amount: amount,
    mint: mint,
    programId: programId!
  };
}

// Example usage:
// const solTransferDetails = parseSOLTransferInstruction(solTransactionMessage);
// console.log(solTransferDetails);

// const splTokenTransferDetails = parseSPLTokenTransferInstruction(splTokenTransactionMessage);
// console.log(splTokenTransferDetails);
