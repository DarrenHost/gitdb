/**
 * GitDB GitHub API Proxy - Cloudflare Workers
 * 
 * 🚀 一键部署：复制全部代码粘贴到 Cloudflare Workers 编辑器
 * 
 * 📋 配置说明（只需修改下方 CONFIG 对象）：
 *   - GITHUB_TOKEN: 你的 GitHub Token
 * 
 * 📖 使用示例：
 *   GET  https://your-worker.workers.dev/proxy/repos/darrenhost/gitdb
 * 
 * 部署教程：https://developers.cloudflare.com/workers/
 */

// ═══════════════════════════════════════════════════════════
// 🔧 配置区域 - 只需修改这里
// ═══════════════════════════════════════════════════════════
const CONFIG = {
    // GitHub Token
    // 格式：ghp_xxx 或 github_pat_xxx
    // ⚠️ 建议通过 Cloudflare 环境变量设置，不要硬编码在这里
    GITHUB_TOKEN: ''
};

// ═══════════════════════════════════════════════════════════
// 🔐 TokenMixer 混淆工具（内联）
// ═══════════════════════════════════════════════════════════
class TokenMixer {
    static PREFIX = 'gitdb_';
    
    static CHAR_MAP = {
        '0': 'a', '1': 'b', '2': 'c', '3': 'd', '4': 'e',
        '5': 'f', '6': 'g', '7': 'h', '8': 'i', '9': 'j',
        'a': 'k', 'b': 'l', 'c': 'm', 'd': 'n', 'e': 'o',
        'f': 'p', 'g': 'q', 'h': 'r', 'i': 's', 'j': 't',
        'k': 'u', 'l': 'v', 'm': 'w', 'n': 'x', 'o': 'y',
        'p': 'z', 'q': 'A', 'r': 'B', 's': 'C', 't': 'D',
        'u': 'E', 'v': 'F', 'w': 'G', 'x': 'H', 'y': 'I',
        'z': 'J', 'A': 'K', 'B': 'L', 'C': 'M', 'D': 'N',
        'E': 'O', 'F': 'P', 'G': 'Q', 'H': 'R', 'I': 'S',
        'J': 'T', 'K': 'U', 'L': 'V', 'M': 'W', 'N': 'X',
        'O': 'Y', 'P': 'Z', 'Q': '0', 'R': '1', 'S': '2',
        'T': '3', 'U': '4', 'V': '5', 'W': '6', 'X': '7',
        'Y': '8', 'Z': '9', '_': '-', '-': '_'
    };
    
    static REVERSE_MAP = {};
    
    constructor() {
        if (Object.keys(TokenMixer.REVERSE_MAP).length === 0) {
            for (const [key, value] of Object.entries(TokenMixer.CHAR_MAP)) {
                TokenMixer.REVERSE_MAP[value] = key;
            }
        }
    }
    
    mix(token) {
        if (!token || typeof token !== 'string') {
            throw new Error('Invalid token');
        }
        
        const validPrefixes = ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', 'github_pat_'];
        const isValidFormat = validPrefixes.some(prefix => token.startsWith(prefix));
        
        if (!isValidFormat) {
            throw new Error('Invalid token format');
        }
        
        let mixed = TokenMixer.PREFIX;
        for (const char of token) {
            mixed += TokenMixer.CHAR_MAP[char] || char;
        }
        
        mixed += this._generateChecksum(token);
        return mixed;
    }
    
    unmix(mixedToken) {
        if (!mixedToken || typeof mixedToken !== 'string') {
            throw new Error('Invalid mixed token');
        }
        
        if (!mixedToken.startsWith(TokenMixer.PREFIX)) {
            throw new Error('Invalid token format: missing prefix');
        }
        
        const core = mixedToken.slice(TokenMixer.PREFIX.length, -4);
        const checksum = mixedToken.slice(-4);
        
        let original = '';
        for (const char of core) {
            original += TokenMixer.REVERSE_MAP[char] || char;
        }
        
        if (this._generateChecksum(original) !== checksum) {
            throw new Error('Invalid token checksum');
        }
        
        return original;
    }
    
    _generateChecksum(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(4, '0');
    }
    
    isMixed(token) {
        return token && token.startsWith(TokenMixer.PREFIX);
    }
    
    autoUnmix(token) {
        if (this.isMixed(token)) {
            try {
                return this.unmix(token);
            } catch (e) {
                console.error('Failed to unmix token:', e);
            }
        }
        return token;
    }
}

// ═══════════════════════════════════════════════════════════
// 🌐 Cloudflare Worker 主逻辑
// ═══════════════════════════════════════════════════════════
export default {
    async fetch(request, env, ctx) {
        // 获取请求路径
        const url = new URL(request.url);
        const path = url.pathname.replace('/proxy', '').replace('/github', '');
        
        // 🔐 获取认证 Token
        const token = getAuthToken(request, env);
        
        if (!token) {
            return new Response('Unauthorized: Missing or invalid token. Use ?token=gitdb_xxx or set GITHUB_TOKEN in environment.', { 
                status: 401
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
            const githubResponse = await fetch(githubRequest);
            
            // 创建响应
            const response = new Response(githubResponse.body, {
                status: githubResponse.status,
                statusText: githubResponse.statusText,
                headers: {
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
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};

// ═══════════════════════════════════════════════════════════
// 🔧 辅助函数
// ═══════════════════════════════════════════════════════════

/**
 * 获取认证 Token（支持多种方式）
 */
function getAuthToken(request, env) {
    const mixer = new TokenMixer();
    
    // 方式 1: 从 URL 查询参数获取 (?token=gitdb_xxx)
    const url = new URL(request.url);
    const urlToken = url.searchParams.get('token');
    if (urlToken) {
        return mixer.autoUnmix(urlToken);
    }
    
    // 方式 2: 从 Authorization Header 获取
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
        const token = authHeader.startsWith('token ') || authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : authHeader;
        return mixer.autoUnmix(token);
    }
    
    // 方式 3: 从 X-GitHub-Token Header 获取
    const tokenHeader = request.headers.get('X-GitHub-Token');
    if (tokenHeader) {
        return mixer.autoUnmix(tokenHeader);
    }
    
    // 方式 4: 从环境变量获取（最安全）
    if (env.GITHUB_TOKEN) {
        return env.GITHUB_TOKEN;
    }
    
    // 方式 5: 从 CONFIG 配置获取（开发环境）
    if (CONFIG.GITHUB_TOKEN) {
        return CONFIG.GITHUB_TOKEN;
    }
    
    return null;
}
