export function createSolanaExplorerUrl(publicKey: string): string {
  const explorerUrl = `https://explorer.sonic.game`;
  const baseUrl = `${explorerUrl}/address/`;
  return `${baseUrl}${publicKey}`;
}
