export type AuthUser = {
  id: string;
  userId: string;
  role: "ADMIN" | "USER";
};

const fallbackUser: AuthUser = {
  id: "local-admin",
  userId: "local-admin",
  role: "ADMIN",
};

export async function getCurrentUser() {
  return fallbackUser;
}

export async function requireUser() {
  return fallbackUser;
}

export async function requireAdmin() {
  return fallbackUser;
}
