const AUTH_API_BASE_URL = "http://localhost:5000/api/auth";
const AUTH_TOKEN_STORAGE_KEY = "i-nelory.auth.token";
const AUTH_USER_STORAGE_KEY = "i-nelory.auth.user";

export type AuthUser = {
  id: number | string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  bio?: string | null;
  location?: string | null;
  createdAt?: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

type LoginPayload = {
  username: string;
  password: string;
};

type RegisterResponse = {
  message: string;
  user: AuthUser;
};

type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

type MeResponse = {
  user: AuthUser;
};

function getValidationErrorMessage(errors: unknown) {
  if (Array.isArray(errors)) {
    return errors.filter((error) => typeof error === "string").join(" ");
  }

  if (typeof errors === "object" && errors !== null) {
    const messages = Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => typeof value === "string");

    return messages.join(" ");
  }

  return "";
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null) {
    const payload = data as {
      message?: unknown;
      error?: unknown;
      errors?: unknown;
    };
    const validationErrorMessage = getValidationErrorMessage(payload.errors);

    if (validationErrorMessage) {
      return validationErrorMessage;
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  }

  return fallback;
}

async function parseJsonResponse<T>(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallback));
  }

  return data as T;
}

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredAuthUser() {
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function saveAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${AUTH_API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<RegisterResponse>(response, "Registration failed");
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch(`${AUTH_API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<LoginResponse>(response, "Login failed");
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${AUTH_API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<MeResponse>(response, "Could not restore user");
}
