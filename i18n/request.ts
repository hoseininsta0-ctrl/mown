import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'fa'
  const validLocale = ['en', 'fa'].includes(locale) ? locale : 'fa'

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  }
})
