/**
 * A tiny store for the full-screen intro that bridges a sign-in into the
 * console.
 *
 * The overlay lives in the root layout so it survives the navigation into
 * `/dashboard`; whoever establishes the session flips this store and the
 * overlay picks it up through `useSyncExternalStore`. Two scenes share it:
 * the brand intro (after a sign-in) and the welcome (after an email
 * confirmation that signed the reader in) - same curtain, different stage.
 */

export interface IntroState {
  /** Path prefix the intro started on; "arrived" means we have left it. */
  from: string;
  /** When set, the welcome scene plays instead of the brand swarm. */
  welcome?: { title: string; line: string };
}

let state: IntroState | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function startIntro(options: Partial<IntroState> = {}) {
  if (state) return;
  state = { from: options.from ?? "/login", welcome: options.welcome };
  emit();
}

export function endIntro() {
  if (!state) return;
  state = null;
  emit();
}

export function subscribeIntro(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getIntroSnapshot(): IntroState | null {
  return state;
}

/** Server snapshot: the intro never renders on the server. */
export function getIntroServerSnapshot(): IntroState | null {
  return null;
}
