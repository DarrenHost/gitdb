/**
 * GitDB GitHub API Proxy
 * 
 * 使用 Cloudflare Workers 作为反向代理，解决 CORS 问题
 * 同时保护 GitHub Token 不暴露在前端
 * 
 * 部署：https://developers.cloudflare.com/workers/
 */

// 🔐 配置（在 Cloudflare 环境变量中设置）
// GITHUB_TOKEN - 你的 GitHub Token
// ALLOWED_ORIGINS - 允许的域名（逗号分隔）

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }
    
    // 验证请求方法
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (!validMethods.includes(request.method)) {
      return new Response('Method not allowed', { 
        status: 405,
        headers: getCORSHeaders(request, env)
      });
    }
    
    // 获取请求 URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/proxy', '');
    
    // 验证 Token
    const authHeader = request.headers.get('Authorization');
    const workerToken = env.GITHUB_TOKEN;
    
    if (!workerToken) {
      return new Response('Server configuration error: GITHUB_TOKEN not set', { 
        status: 500,
        headers: getCORSHeaders(request, env)
      });
    }
    
    // 构建 GitHub API 请求
    const githubUrl = `https://api.github.com${path}`;
    const githubRequest = new Request(githubUrl, {
      method: request.method,
      headers: {
        'Authorization': `token ${workerToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'GitDB-Proxy/1.0'
      },
      body: request.method !== 'GET' ? await request.text() : undefined
    });
    
    try {
      // 发送请求到 GitHub API
      const githubResponse = await fetch(githubUrl, githubRequest);
      
      // 创建响应
      const response = new Response(githubResponse.body, {
        status: githubResponse.status,
        statusText: githubResponse.statusText,
        headers: {
          ...getCORSHeaders(request, env),
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': githubResponse.headers.get('X-RateLimit-Limit') || '',
          'X-RateLimit-Remaining': githubResponse.headers.get('X-RateLimit-Remaining') || '',
          'X-RateLimit-Reset': githubResponse.headers.get('X-RateLimit-Reset') || ''
        }
      });
      
      return response;
    } catch (error) {
      return new Response(JSON.stringify({ 
        message: 'Proxy error', 
        error: error.message 
      }), { 
        status: 500,
        headers: {
          ...getCORSHeaders(request, env),
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

/**
 * 获取 CORS 头
 */
function getCORSHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : ['*'];
  
  const allowOrigin = allowedOrigins.includes('*') || allowedOrigins.includes(origin) 
    ? origin || '*' 
    : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-cache'
  };
}

/**
 * 处理 CORS 预检请求
 */
function handleCORS(request, env) {
  return new Response(null, {
    status: 204,
    headers: {
      ...getCORSHeaders(request, env),
      'Content-Length': '0'
    }
  });
}
