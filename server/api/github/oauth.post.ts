export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const clientId = config.public.githubClientId
  const clientSecret = config.githubClientSecret

  if (!body.code) {
    throw createError({ statusCode: 400, statusMessage: 'Authorization code is required' })
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: body.code,
    }),
  })

  const data = await response.json()
  if (data.error) {
    throw createError({ statusCode: 400, statusMessage: data.error_description || data.error })
  }

  return { access_token: data.access_token }
})
