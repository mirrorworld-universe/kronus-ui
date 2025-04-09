/* eslint-disable @typescript-eslint/no-unused-vars */
import type { WalletName } from "@solana/wallet-adapter-base";
import {
  BaseMessageSignerWalletAdapter,
  scopePollingDetectionStrategy,
  WalletAccountError,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletSignMessageError,
  WalletReadyState,
  WalletSignTransactionError,
} from "@solana/wallet-adapter-base";
import type {
  Transaction,
  TransactionVersion,
  VersionedTransaction,
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

interface SolanaBackpack {
  publicKey: PublicKey;
  connect(): Promise<PublicKey>;
  disconnect(): Promise<void>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  coonnected: boolean;
}

interface BackpackWindow extends Window {
  backpack?: SolanaBackpack;
}

export const BackpackWalletName = "Backpack" as WalletName<"Backpack">;

declare const window: BackpackWindow;

export class BackpackWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = BackpackWalletName;
  url = "https://www.backpack.app/";
  icon
    = "data:image/png;base64,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";

  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion>
    = new Set(["legacy", 0]);

  private _connected: boolean = false;
  private _connecting: boolean;
  private _publicKey: PublicKey | null;
  private _wallet: SolanaBackpack | null;
  private _readyState: WalletReadyState
    = typeof window === "undefined" || typeof document === "undefined"
      ? WalletReadyState.Unsupported
      : WalletReadyState.NotDetected;

  constructor() {
    super();
    this._connecting = false;
    this._publicKey = null;
    this._wallet = null;

    if (this._readyState !== WalletReadyState.Unsupported) {
      scopePollingDetectionStrategy(() => {
        if (window?.backpack) {
          this._readyState = WalletReadyState.Installed;
          this.emit("readyStateChange", this._readyState);
          return true;
        }
        return false;
      });
    }
  }

  get connecting() {
    return this._connecting;
  }

  override get connected() {
    return this._connected;
  }

  get readyState() {
    return this._readyState;
  }

  get publicKey() {
    return this._publicKey;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;
      if (this._readyState !== WalletReadyState.Installed)
        throw new WalletNotReadyError();

      this._connecting = true;

      const wallet = window.backpack!;

      try {
        await wallet.connect();
      } catch (error: any) {
        throw new WalletConnectionError(error?.message, error);
      }

      if (wallet.publicKey.toString() === "11111111111111111111111111111111")
        throw new WalletAccountError();

      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(wallet.publicKey.toBytes());
      } catch (error: any) {
        throw new WalletPublicKeyError(error?.message, error);
      }

      this._wallet = wallet;
      this._publicKey = publicKey;

      this.emit("connect", publicKey);
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this._wallet;
    if (wallet) {
      this._wallet = null;
      this._publicKey = null;

      try {
        await wallet.disconnect();
      } catch (error: any) {
        this.emit("error", new WalletDisconnectedError());
      }
    }

    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (await wallet.signTransaction(transaction)) as T;
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  override async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (await wallet.signAllTransactions(transactions)) as T[];
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        const { signature } = await wallet.signMessage(message);
        return signature;
      } catch (error: any) {
        throw new WalletSignMessageError(error?.message, error);
      }
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }
}
