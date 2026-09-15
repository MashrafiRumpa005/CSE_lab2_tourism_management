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
export const getMyBookings = () => request("/api/bookings/my");
export const cancelBooking = (id) => request(`/api/bookings/${id}/cancel`, { method: "PATCH" });
export const getDestinations = () => request("/api/destinations");
export const getPackageReviews = (id) => request(`/api/packages/${id}/reviews`);
export const createPackageReview = (id, data) => request(`/api/packages/${id}/reviews`, { method: "POST", body: JSON.stringify(data) });
export const getAdminDashboard = () => request("/api/admin/dashboard");
export const getAdminDestinations = () => request("/api/admin/destinations");
export const createAdminDestination = (data) => request("/api/admin/destinations", { method: "POST", body: JSON.stringify(data) });
export const updateAdminDestination = (id, data) => request(`/api/admin/destinations/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteAdminDestination = (id) => request(`/api/admin/destinations/${id}`, { method: "DELETE" });
export const createAdminPackage = (data) => request("/api/admin/packages", { method: "POST", body: JSON.stringify(data) });
export const updateAdminPackage = (id, data) => request(`/api/admin/packages/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteAdminPackage = (id) => request(`/api/admin/packages/${id}`, { method: "DELETE" });
export const getAdminBookings = () => request("/api/admin/bookings");
export const updateAdminBooking = (id, status) => request(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const getAdminReviews = () => request("/api/admin/reviews");
export const updateAdminReview = (id, status) => request(`/api/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteAdminReview = (id) => request(`/api/admin/reviews/${id}`, { method: "DELETE" });

