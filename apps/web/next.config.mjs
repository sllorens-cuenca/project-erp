/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@erp/shared'],
  // La sección «Listados» pasó a llamarse «Historial»: mantenemos viva la URL
  // antigua (con su `?obra=`) redirigiendo a la nueva.
  async redirects() {
    return [
      { source: '/listados', destination: '/historial', permanent: false },
      { source: '/listados/:id', destination: '/historial/:id', permanent: false },
    ]
  },
}

export default nextConfig
