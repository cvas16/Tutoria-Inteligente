import { cookies } from "next/headers";

const TOKEN_COOKIE_NAME = "its_session_token";
const ROLE_COOKIE_NAME = "its_user_role";

export function getSessionToken(): string | undefined {
  return cookies().get(TOKEN_COOKIE_NAME)?.value;
}

export function getSessionRole(): string | undefined {
  return cookies().get(ROLE_COOKIE_NAME)?.value;
}

export function clearSessionCookies(): void {
  const store = cookies();
  store.delete(TOKEN_COOKIE_NAME);
  store.delete(ROLE_COOKIE_NAME);
}