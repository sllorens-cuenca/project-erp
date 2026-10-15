/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@erp/shared'],
  // La sección «Listados» pasó a llamarse «Historial»: la URL antigua
  // redirige de forma permanente a la nueva (con su `?obra=` intacto).
  async redirects() {
    return [
      { source: '/listados', destination: '/historial', permanent: true },
      { source: '/listados/:id', destination: '/historial/:id', permanent: true },
    ]
  },
}

export default nextConfig
