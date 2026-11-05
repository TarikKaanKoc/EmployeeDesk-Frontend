"use client";

import { createContext, useContext } from "react";

/**
 * The per-request CSP nonce, for the few client components that add a
 * script tag of their own.
 *
 * The Proxy mints one nonce per request and puts it on the response's
 * `Content-Security-Policy`; Next stamps it onto its own inline scripts
 * automatically. A script this code adds by hand - the Turnstile loader -
 * is not Next's, so it has to carry the same nonce or the browser refuses
 * it. The root layout reads the nonce off the request and provides it here.
 *
 * Empty in any render that did not pass through the Proxy (there are none
 * for pages, but a component should not crash on the assumption).
 */
const NonceContext = createContext<string | undefined>(undefined);

export function NonceProvider({
  nonce,
  children,
}: {
  nonce?: string;
  children: React.ReactNode;
}) {
  return (
    <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
  );
}

export function useNonce(): string | undefined {
  return useContext(NonceContext);
}
