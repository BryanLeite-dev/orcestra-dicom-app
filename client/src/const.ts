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

// Generate Google login URL
export const getGoogleLoginUrl = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    console.error("VITE_GOOGLE_CLIENT_ID not configured");
    return null;
  }

  const redirectUri = `${window.location.origin}/api/oauth/google/callback`;
  const scope = ["openid", "email", "profile"].join(" ");
  const responseType = "code";
  const accessType = "online";

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", responseType);
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", accessType);

  return url.toString();
};
