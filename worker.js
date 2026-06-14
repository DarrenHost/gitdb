/**
 * GitDB GitHub API Proxy
 * 
 * 使用 Cloudflare Workers 作为反向代理，解决 CORS 问题
 * 支持多种 Token 传递方式：
 * 1. URL 参数 (?token=gitdb_xxx) - 推荐
 * 2. HTTP Header (Authorization: token gitdb_xxx)
 * 3. HTTP Header (X-GitHub-Token: gitdb_xxx)
 * 4. Worker 环境变量（最安全）
 * 
 * 部署：https://developers.cloudflare.com/workers/
 */

// 🔐 配置（在 Cloudflare 环境变量中设置）
// GITHUB_TOKEN - 你的 GitHub Token（可选）
// ALLOWED_ORIGINS - 允许的域名（逗号分隔）

// 导入 TokenMixer（需要和 token-mixer.js 一起部署）
import { TokenMixer } from './token-mixer.js';

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
    const path = url.pathname.replace('/proxy', '').replace('/github', '');
    
    // 🔐 获取 Token（支持多种方式）
    const token = getAuthToken(request, env);
    
    if (!token) {
      return new Response('Unauthorized: Missing or invalid Authorization header', { 
        status: 401,
        headers: getCORSHeaders(request, env)
      });
    }
    
    // 构建 GitHub API 请求
    const githubUrl = `https://api.github.com${path}`;
    const githubRequest = new Request(githubUrl, {
      method: request.method,
      headers: {
        'Authorization': `token ${token}`,
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
 * 获取认证 Token（支持多种方式）
 */
function getAuthToken(request, env) {
  // 方式 1: 从 URL 查询参数获取 (?token=gitdb_xxx)
  const url = new URL(request.url);
  const urlToken = url.searchParams.get('token');
  if (urlToken && urlToken.startsWith('gitdb_')) {
    // 解混淆 Token
    const mixer = new TokenMixer();
    try {
      return mixer.unmix(urlToken);
    } catch (e) {
      console.error('Failed to unmix token from URL:', e);
    }
  }
  
  // 方式 2: 从 Authorization Header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader && (authHeader.startsWith('token ') || authHeader.startsWith('Bearer '))) {
    const token = authHeader.split(' ')[1];
    // 支持混淆 Token
    if (token.startsWith('gitdb_')) {
      const mixer = new TokenMixer();
      try {
        return mixer.unmix(token);
      } catch (e) {
        console.error('Failed to unmix token from header:', e);
      }
    }
    return token;
  }
  
  // 方式 3: 从 X-GitHub-Token Header 获取
  const tokenHeader = request.headers.get('X-GitHub-Token');
  if (tokenHeader) {
    // 支持混淆 Token
    if (tokenHeader.startsWith('gitdb_')) {
      const mixer = new TokenMixer();
      try {
        return mixer.unmix(tokenHeader);
      } catch (e) {
        console.error('Failed to unmix token from header:', e);
      }
    }
    return tokenHeader;
  }
  
  // 方式 4: 从环境变量获取（最安全）
  if (env.GITHUB_TOKEN) {
    return env.GITHUB_TOKEN;
  }
  
  return null;
}

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
