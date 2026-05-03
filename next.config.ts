import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
export default withNextIntl(nextConfig)
