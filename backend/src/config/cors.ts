export function getCorsOrigin() {
  const origins = process.env.FRONTEND_URL
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins?.length ? origins : true
}
