export function getAppOrigin(requestUrl: string): string {
  const fromEnv =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim();

  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // fall through to request origin
    }
  }

  return new URL(requestUrl).origin;
}
