import axios from "axios";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

const axiosInstanceWithToken = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 50000,
});

axiosInstanceWithToken.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(new Error(error))
);

axiosInstanceWithToken.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const axiosInstanceWithoutToken = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
});

export { axiosInstanceWithToken, axiosInstanceWithoutToken };
