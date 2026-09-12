const request = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? "Something went wrong. Please try again.");
  }
  return payload;
};

export const signUp = (data) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(data) });
export const logIn = (data) => request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
export const logOut = () => request("/api/auth/logout", { method: "POST" });
export const getCurrentUser = () => request("/api/auth/me");
