import { useUserStore, type User } from "../stores/useUserStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";

type MessageSigner = (message: string, options: { address: string }) => Promise<{
  signedMessage: string | Uint8Array | null;
  signerAddress: string;
  error?: unknown;
}>;

async function readJson(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? body.error?.message ?? "Unable to sign in. Please try again.");
  return body;
}

export async function establishWalletSession(address: string, signMessage: MessageSigner) {
  const store = useUserStore.getState();
  store.clearUser();
  const challenge = await readJson(await fetch(`${API_URL}/auth/challenge`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicKey: address }),
  }));
  const signed = await signMessage(challenge.data.message, { address });
  if (signed.error || !signed.signedMessage || signed.signerAddress !== address) {
    throw new Error("Approve the TrustLend sign-in message with your connected wallet to continue.");
  }
  const signature = typeof signed.signedMessage === "string" ? signed.signedMessage : btoa(String.fromCharCode(...signed.signedMessage));
  const login = await readJson(await fetch(`${API_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: address, message: challenge.data.message, signature }),
  }));
  const headers = { Authorization: `Bearer ${login.data.token}` };
  const [profile, session] = await Promise.all([
    readJson(await fetch(`${API_URL}/user/profile`, { headers })),
    readJson(await fetch(`${API_URL}/auth/verify`, { headers })),
  ]);
  store.setAuthToken(login.data.token);
  store.setUser({ ...profile, role: session.data.role, scopes: session.data.scopes } as User);
}

export async function clearWalletSession() {
  const token = useUserStore.getState().authToken;
  useUserStore.getState().clearUser();
  if (token) await fetch(`${API_URL}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
}
