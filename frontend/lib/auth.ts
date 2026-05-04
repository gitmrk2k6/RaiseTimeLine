const ACCESS_TOKEN_KEY = "raisetimeline_access_token";
const REFRESH_TOKEN_KEY = "raisetimeline_refresh_token";
const USER_ID_KEY = "raisetimeline_user_id";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  document.cookie = `${ACCESS_TOKEN_KEY}=1; path=/; max-age=900; SameSite=Lax`;
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

export const setUserId = (id: number): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_ID_KEY, String(id));
};

export const getUserId = (): number | null => {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(USER_ID_KEY);
  return v ? Number(v) : null;
};

export const removeTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
};

export const isAuthenticated = (): boolean => !!getAccessToken();

// 後方互換
export const getToken = getAccessToken;
export const setToken = setAccessToken;
export const removeToken = removeTokens;
