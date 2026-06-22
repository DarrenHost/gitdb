/**
 * GitDB Server - Cloudflare Workers 完整实现
 * 
 * 🚀 功能完整：包含所有 GitDB 核心功能（增删改查）
 * 📦 开箱即用：部署后直接通过 HTTP API 使用
 * 🔐 Token 支持：混淆 Token 自动解混淆
 * 
 * 📖 API 文档：
 *   POST   /create     - 创建数据库
 *   GET    /show       - 获取数据库列表
 *   POST   /add        - 添加记录
 *   POST   /find       - 查询记录
 *   POST   /update     - 更新记录
 *   POST   /delete     - 删除记录
 *   POST   /drop       - 删除数据库
 * 
 * 🔧 配置：修改下方 CONFIG 对象
 */

// ═══════════════════════════════════════════════════════════
// 🔧 配置区域
// ═══════════════════════════════════════════════════════════
const CONFIG = {
    // GitDB 配置
    GITDB_OWNER: '',       // 仓库所有者（GitHub 用户名）
    GITDB_REPO: '',        // 仓库名称
    GITDB_TOKEN: '',       // GitDB Token（支持混淆格式 gitdb_xxx）
    GITDB_BRANCH: 'main',  // 分支名称
    GITDB_DATA_DIR: 'data' // 数据目录
};

// ═══════════════════════════════════════════════════════════
// 🔐 TokenMixer 混淆工具
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
    
    unmix(mixedToken) {
        if (!mixedToken?.startsWith(TokenMixer.PREFIX)) {
            return mixedToken;
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
}

// ═══════════════════════════════════════════════════════════
// 🗄️ GitDB 核心实现
// ═══════════════════════════════════════════════════════════
class GitDBCore {
    constructor(owner, repo, token, branch = 'main', dataDir = 'data') {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.branch = branch;
        this.dataDir = dataDir;
        this.baseUrl = 'https://api.github.com';
        this.cache = new Map();
    }
    
    async _request(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`GitHub API: ${error.message || response.statusText}`);
        }
        
        return response.json();
    }
    
    async _getFile(filePath) {
        const cacheKey = filePath;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached;
        }
        
        try {
            const data = await this._request(
                `/repos/${this.owner}/${this.repo}/contents/${filePath}?ref=${this.branch}`
            );
            const content = JSON.parse(atob(data.content));
            const result = { data, sha: data.sha, content };
            this.cache.set(cacheKey, { ...result, timestamp: Date.now() });
            return result;
        } catch (e) {
            if (e.message.includes('404')) return null;
            throw e;
        }
    }
    
    async _commitFile(filePath, content, sha, message) {
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
        const result = await this._request(
            `/repos/${this.owner}/${this.repo}/contents/${filePath}`,
            'PUT',
            { message, content: encoded, sha, branch: this.branch }
        );
        this.cache.delete(filePath);
        return result;
    }
    
    _generateId(existingIds) {
        const maxId = existingIds.reduce((max, id) => Math.max(max, id || 0), 0);
        return maxId + 1;
    }
    
    _matches(record, query) {
        if (!query) return true;
        for (const key in query) {
            const cond = query[key];
            if (typeof cond === 'object') {
                for (const op in cond) {
                    const val = cond[op];
                    const recVal = record[key];
                    switch (op) {
                        case '$eq': if (recVal !== val) return false; break;
                        case '$ne': if (recVal === val) return false; break;
                        case '$gt': if (recVal <= val) return false; break;
                        case '$gte': if (recVal < val) return false; break;
                        case '$lt': if (recVal >= val) return false; break;
                        case '$lte': if (recVal > val) return false; break;
                        case '$in': if (!val.includes(recVal)) return false; break;
                        case '$nin': if (val.includes(recVal)) return false; break;
                    }
                }
            } else {
                if (record[key] !== cond) return false;
            }
        }
        return true;
    }
    
    // ========== 公开 API ==========
    
    async create({ name, description = '', schema = null }) {
        const filePath = `${this.dataDir}/${name}.json`;
        const existing = await this._getFile(filePath);
        if (existing) {
            throw new Error('DATABASE_EXISTS');
        }
        
        const initialData = {
            _meta_: { name, description, schema, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            _data_: []
        };
        
        const result = await this._commitFile(filePath, initialData, null, `Create database: ${name}`);
        return { success: true, message: '数据库创建成功', data: { name, filePath, commitSha: result.commit.sha } };
    }
    
    async show() {
        try {
            const files = await this._request(`/repos/${this.owner}/${this.repo}/contents/${this.dataDir}?ref=${this.branch}`);
            return files
                .filter(f => f.name.endsWith('.json'))
                .map(f => ({ name: f.name.replace('.json', ''), path: f.path, size: f.size }));
        } catch (e) {
            if (e.message.includes('404')) return [];
            throw e;
        }
    }
    
    async add({ name, data, autoId = true }) {
        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFile(filePath);
        if (!file) throw new Error('DATABASE_NOT_FOUND');
        
        const records = Array.isArray(data) ? data : [data];
        if (autoId) {
            const existingIds = file.content._data_.map(r => r.id).filter(id => id !== undefined);
            records.forEach((r, i) => { if (r.id === undefined) r.id = this._generateId(existingIds) + i; });
        }
        
        file.content._data_.push(...records);
        file.content._meta_.updatedAt = new Date().toISOString();
        
        const result = await this._commitFile(filePath, file.content, file.sha, `Add ${records.length} record(s) to ${name}`);
        return { success: true, message: '记录添加成功', data: { name, addedCount: records.length, ids: records.map(r => r.id), commitSha: result.commit.sha } };
    }
    
    async find({ name, query = null, limit = null, skip = 0 }) {
        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFile(filePath);
        if (!file) throw new Error('DATABASE_NOT_FOUND');
        
        let records = file.content._data_.filter(r => this._matches(r, query));
        const total = records.length;
        if (skip > 0) records = records.slice(skip);
        if (limit !== null) records = records.slice(0, limit);
        
        return { success: true, data: { name, totalCount: total, returnedCount: records.length, records } };
    }
    
    async update({ name, query, data, multi = false }) {
        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFile(filePath);
        if (!file) throw new Error('DATABASE_NOT_FOUND');
        
        let count = 0;
        for (const record of file.content._data_) {
            if (this._matches(record, query)) {
                Object.assign(record, data);
                count++;
                if (!multi) break;
            }
        }
        
        if (count === 0) throw new Error('RECORD_NOT_FOUND');
        
        file.content._meta_.updatedAt = new Date().toISOString();
        const result = await this._commitFile(filePath, file.content, file.sha, `Update ${count} record(s) in ${name}`);
        return { success: true, message: '记录更新成功', data: { name, updatedCount: count, commitSha: result.commit.sha } };
    }
    
    async delete({ name, query, multi = false }) {
        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFile(filePath);
        if (!file) throw new Error('DATABASE_NOT_FOUND');
        
        const initialLen = file.content._data_.length;
        let deleted = false;
        file.content._data_ = file.content._data_.filter(r => {
            if (this._matches(r, query)) {
                if (!multi || !deleted) {
                    deleted = true;
                    return false;
                }
                return !multi;
            }
            return true;
        });
        
        const count = initialLen - file.content._data_.length;
        if (count === 0) throw new Error('RECORD_NOT_FOUND');
        
        file.content._meta_.updatedAt = new Date().toISOString();
        const result = await this._commitFile(filePath, file.content, file.sha, `Delete ${count} record(s) from ${name}`);
        return { success: true, message: '记录删除成功', data: { name, deletedCount: count, commitSha: result.commit.sha } };
    }
    
    async drop({ name }) {
        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFile(filePath);
        if (!file) throw new Error('DATABASE_NOT_FOUND');
        
        const result = await this._request(
            `/repos/${this.owner}/${this.repo}/contents/${filePath}`,
            'DELETE',
            { message: `Drop database: ${name}`, sha: file.sha, branch: this.branch }
        );
        
        return { success: true, message: '数据库已删除', data: { name, filePath, commitSha: result.commit.sha } };
    }
}

// ═══════════════════════════════════════════════════════════
// 🌐 HTTP Router & Controller
// ═══════════════════════════════════════════════════════════
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitDB-Token'
        }
    });
}

function errorResponse(message, status = 400) {
    return jsonResponse({ success: false, error: message }, status);
}

async function handleRequest(request, db) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    const method = request.method;
    
    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitDB-Token',
                'Access-Control-Max-Age': '86400'
            }
        });
    }
    
    // 获取请求体
    let body = {};
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            body = await request.json();
        } catch (e) {
            return errorResponse('Invalid JSON body', 400);
        }
    }
    
    // 路由处理
    try {
        // GET 请求
        if (method === 'GET') {
            if (path === '/show') {
                const result = await db.show();
                return jsonResponse({ success: true, data: result });
            }
            if (path === '/health') {
                return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
            }
            return errorResponse('Not Found', 404);
        }
        
        // POST 请求
        if (method === 'POST') {
            // Create: POST /create { name, description?, schema? }
            if (path === '/create') {
                if (!body.name) return errorResponse('Missing required field: name');
                const result = await db.create(body);
                return jsonResponse(result);
            }
            
            // Add: POST /add { name, data, autoId? }
            if (path === '/add') {
                if (!body.name) return errorResponse('Missing required field: name');
                if (!body.data) return errorResponse('Missing required field: data');
                const result = await db.add(body);
                return jsonResponse(result);
            }
            
            // Find: POST /find { name, query?, limit?, skip? }
            if (path === '/find') {
                if (!body.name) return errorResponse('Missing required field: name');
                const result = await db.find(body);
                return jsonResponse(result);
            }
            
            // Update: POST /update { name, query, data, multi? }
            if (path === '/update') {
                if (!body.name) return errorResponse('Missing required field: name');
                if (!body.query) return errorResponse('Missing required field: query');
                if (!body.data) return errorResponse('Missing required field: data');
                const result = await db.update(body);
                return jsonResponse(result);
            }
            
            // Delete: POST /delete { name, query, multi? }
            if (path === '/delete') {
                if (!body.name) return errorResponse('Missing required field: name');
                if (!body.query) return errorResponse('Missing required field: query');
                const result = await db.delete(body);
                return jsonResponse(result);
            }
            
            // Drop: POST /drop { name }
            if (path === '/drop') {
                if (!body.name) return errorResponse('Missing required field: name');
                const result = await db.drop(body);
                return jsonResponse(result);
            }
            
            return errorResponse('Not Found', 404);
        }
        
        return errorResponse('Method Not Allowed', 405);
    } catch (e) {
        console.error('Error:', e.message);
        const statusMap = {
            'DATABASE_EXISTS': 409,
            'DATABASE_NOT_FOUND': 404,
            'RECORD_NOT_FOUND': 404
        };
        const status = statusMap[e.message] || 500;
        return errorResponse(e.message, status);
    }
}

// ═══════════════════════════════════════════════════════════
// 🚀 Worker 入口
// ═══════════════════════════════════════════════════════════
export default {
    async fetch(request, env, ctx) {
        // 获取配置（环境变量优先）
        const owner = env.GITDB_OWNER || CONFIG.GITDB_OWNER;
        const repo = env.GITDB_REPO || CONFIG.GITDB_REPO;
        const branch = env.GITDB_BRANCH || CONFIG.GITDB_BRANCH;
        const dataDir = env.GITDB_DATA_DIR || CONFIG.GITDB_DATA_DIR;
        
        // 获取并解混淆 Token
        let token = env.GITDB_TOKEN || CONFIG.GITDB_TOKEN;
        if (!token) {
            return errorResponse('GITDB_TOKEN not configured', 500);
        }
        
        try {
            const mixer = new TokenMixer();
            token = mixer.unmix(token);
        } catch (e) {
            // Token 不是混淆格式，直接使用
        }
        
        // 验证必要配置
        if (!owner || !repo) {
            return errorResponse('Missing GITDB_OWNER or GITDB_REPO configuration', 500);
        }
        
        // 创建 GitDB 实例
        const db = new GitDBCore(owner, repo, token, branch, dataDir);
        
        // 处理请求
        return handleRequest(request, db);
    }
};
