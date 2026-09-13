const request = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message ?? "Something went wrong. Please try again.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};

export const signUp = (data) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(data) });
export const logIn = (data) => request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
export const logOut = () => request("/api/auth/logout", { method: "POST" });
export const getCurrentUser = () => request("/api/auth/me");
export const getPackages = () => request("/api/packages");
export const getPackage = (id) => request(`/api/packages/${id}`);
export const createBooking = (data) => request("/api/bookings", { method: "POST", body: JSON.stringify(data) });
