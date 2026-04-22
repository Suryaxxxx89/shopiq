const ALLOWED_ORIGIN = '*'; // lock to your domain in production e.g. 'http://localhost:5500'

export default {
  async fetch(request, env, ctx) {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);

    // 1. Title Extraction Endpoint (for pasted URLs)
    if (url.pathname === '/extract') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) return new Response('Missing url parameter', { status: 400 });

      try {
        const targetRes = await fetch(targetUrl, {
          headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        let title = '';
        const rewriter = new HTMLRewriter().on('title', {
          text(text) {
            title += text.text;
          }
        });
        await rewriter.transform(targetRes).text();

        return new Response(JSON.stringify({ title: title.trim() }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500, 
          headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } 
        });
      }
    }

    // 2. SerpAPI Proxy with Caching
    if (url.pathname === '/search' || url.pathname === '/') {
      const cacheUrl = new URL(request.url);
      const cacheKey = new Request(cacheUrl.toString(), request);
      const cache = caches.default;
      
      let response = await cache.match(cacheKey);
      
      if (!response) {
        const params = new URLSearchParams(url.search);
        // Inject the API key securely from env
        params.set('api_key', env.SERPAPI_KEY);
        
        const serpRes = await fetch(`https://serpapi.com/search.json?${params}`);
        const data = await serpRes.json();
        
        response = new Response(JSON.stringify(data), {
          status: serpRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours (86400 seconds)
          },
        });
        
        if (serpRes.status === 200) {
          ctx.waitUntil(cache.put(cacheKey, response.clone()));
        }
      } else {
        // Ensure CORS headers are present on cached responses
        response = new Response(response.body, response);
        response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
      }
      
      return response;
    }

    return new Response('Endpoint not found', { 
      status: 404, 
      headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } 
    });
  },
};
