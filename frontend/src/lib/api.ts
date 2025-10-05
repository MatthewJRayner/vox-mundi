import axios from "axios";

const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  const publicEndpoints = ["/register/", "/token/", "/token/refresh/"];
  const isPublic = publicEndpoints.some((path) =>
    config.url?.includes(path)
  );

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem("refresh");
                if (!refresh) throw new Error("No refresh token");

                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`, {
                    refresh,
                });

                const newAccess = res.data.access;
                localStorage.setItem("access", newAccess);
                originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                return api(originalRequest);
            } catch (err) {
                console.error("Token refresh failed", err);
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;