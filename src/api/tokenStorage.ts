const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// 브라우저 localStorage에 JWT 토큰을 저장합니다.
export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// API 요청 인터셉터에서 사용할 Access Token을 조회합니다.
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

// 토큰 재발급에 사용할 Refresh Token을 조회합니다.
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

// 로그아웃 또는 인증 만료 시 저장된 토큰을 제거합니다.
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
