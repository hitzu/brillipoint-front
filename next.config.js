const sanitizeBaseUrl = (value) => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return "";

  return trimmed.replace(/\/+$/, "");
};

const defaultApiBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://bookandsign-api.onrender.com"
    : "http://localhost:3000";

const apiBaseUrl =
  sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ||
  sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
  defaultApiBaseUrl;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Aquí puedes habilitar características experimentales si es necesario
  },
  async redirects() {
    return [
      {
        source: "/pages/c/:token",
        destination: "/reserva/:token",
        permanent: true,
      },
      {
        source: "/pages/reserva/:token",
        destination: "/reserva/:token",
        permanent: true,
      },
      {
        source: "/pages/sales",
        destination: "/sales",
        permanent: true,
      },
      {
        source: "/",
        destination: "/agenda",
        permanent: false,
      },
      {
        source: "/contract-list",
        destination: "/contracts",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.storage.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  env: {
    // API URL configuration
    // Defaults to localhost:3000 for local development
    // Override with NEXT_PUBLIC_API_URL environment variable for production
    NEXT_PUBLIC_API_URL: apiBaseUrl,
  },
};

module.exports = nextConfig;
