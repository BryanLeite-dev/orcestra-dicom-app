export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate Manus login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://api.manus.im";
  const appId = import.meta.env.VITE_APP_ID || "orcestra-dicom-app";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Generate Google login URL - use server endpoint to avoid VITE_ env issues
export const getGoogleLoginUrl = () => {
  // Simply redirect to server endpoint which handles the OAuth flow
  return `${window.location.origin}/api/oauth/google/login`;
};
