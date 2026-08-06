interface Env {
  NUXT_GITHUB_CLIENT_SECRET?: string
  NUXT_PUBLIC_GITHUB_CLIENT_ID?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { code?: string }
    const code = body?.code
    if (!code) {
      return new Response(JSON.stringify({ error: 'Authorization code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const clientId = context.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || ''
    const clientSecret = context.env.NUXT_GITHUB_CLIENT_SECRET || ''

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
  catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error exchanging OAuth code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
