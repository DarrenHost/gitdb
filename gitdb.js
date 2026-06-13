/**
 * GitDB - 基于 GitHub 的轻量级 JSON 数据库
 * @version 1.1.0
 * @author DarrenHost
 * @license MIT
 * 
 * 🔐 安全提示：不要将 token 硬编码在代码中！
 * 使用环境变量、.env 文件或 localStorage 安全存储
 */

class GitDB {
    /**
     * 初始化 GitDB
     * @param {Object} config - 配置对象
     * @param {string} config.owner - GitHub 用户名
     * @param {string} config.repo - 仓库名称
     * @param {string} [config.token] - GitHub Token（可选，会从多处自动获取）
     * @param {string} [config.branch='main'] - 分支名称
     * @param {string} [config.dataDir='data'] - 数据目录
     * 
     * 🔐 Token 获取优先级：
     * 1. config.token（直接传入）
     * 2. process.env.GITDB_TOKEN（Node.js 环境变量）
     * 3. window.GITDB_TOKEN（浏览器全局变量）
     * 4. localStorage.getItem('gitdb_token')（浏览器本地存储）
     * 5. .env 文件中的 GITDB_TOKEN（需要构建工具支持）
     */
    constructor(config) {
        if (!config.owner || !config.repo) {
            throw new Error('GitDB: Missing required config (owner, repo)');
        }

        this.owner = config.owner;
        this.repo = config.repo;
        this.branch = config.branch || 'main';
        this.dataDir = config.dataDir || 'data';

        // 🔐 安全获取 token（多来源）
        this.token = this._getSecureToken(config.token);

        if (!this.token) {
            throw new Error('GitDB: Token required. Please provide token via:\n' +
                '  1. config.token\n' +
                '  2. process.env.GITDB_TOKEN (Node.js)\n' +
                '  3. window.GITDB_TOKEN (Browser)\n' +
                '  4. localStorage.getItem("gitdb_token") (Browser)\n' +
                '\n🔐 安全提示：不要将 token 硬编码在代码中！');
        }

        // 本地缓存
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 分钟
    }

    /**
     * 🔐 安全获取 token（多来源 + 自动解混淆）
     * @private
     */
    _getSecureToken(providedToken) {
        let token = null;
        
        // 1. 优先使用直接传入的 token
        if (providedToken) {
            token = providedToken;
        }
        
        // 2. Node.js 环境变量
        if (!token && typeof process !== 'undefined' && process.env) {
            const envToken = process.env.GITDB_TOKEN;
            if (envToken) {
                console.log('🔐 Token loaded from environment variable');
                token = envToken;
            }
        }
        
        // 3. 浏览器全局变量
        if (!token && typeof window !== 'undefined' && window.GITDB_TOKEN) {
            console.log('🔐 Token loaded from window.GITDB_TOKEN');
            token = window.GITDB_TOKEN;
        }
        
        // 4. localStorage（浏览器）
        if (!token && typeof localStorage !== 'undefined') {
            const storedToken = localStorage.getItem('gitdb_token');
            if (storedToken) {
                console.log('🔐 Token loaded from localStorage');
                token = storedToken;
            }
        }
        
        // 🔐 自动解混淆 token
        if (token && typeof window !== 'undefined' && window.TokenMixer) {
            const mixer = new window.TokenMixer();
            if (mixer.isMixed(token)) {
                console.log('🔐 Auto-unmixing token...');
                try {
                    token = mixer.unmix(token);
                    console.log('✅ Token successfully unmixed');
                } catch (error) {
                    console.error('❌ Failed to unmix token:', error.message);
                }
            }
        }
        
        return token;
    }

    // ==================== 内部方法 ====================

    /**
     * 调用 GitHub API
     * @private
     */
    async _githubAPI(endpoint, method = 'GET', body = null) {
        const url = `https://api.github.com/${endpoint}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        const config = { method, headers };
        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API Error: ${error.message}`);
        }

        return response.json();
    }

    /**
     * 获取文件内容
     * @private
     */
    async _getFileContent(filePath) {
        const cacheKey = `${this.owner}/${this.repo}/${filePath}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        try {
            const data = await this._githubAPI(
                `repos/${this.owner}/${this.repo}/contents/${filePath}?ref=${this.branch}`
            );

            // 解码 Base64 内容
            const content = atob(data.content);
            const jsonData = JSON.parse(content);

            this.cache.set(cacheKey, {
                data: jsonData,
                sha: data.sha,
                timestamp: Date.now()
            });

            return { data: jsonData, sha: data.sha };
        } catch (error) {
            if (error.message.includes('404')) {
                return null; // 文件不存在
            }
            throw error;
        }
    }

    /**
     * 提交文件更改
     * @private
     */
    async _commitFile(filePath, content, sha, message) {
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

        const body = {
            message,
            content: encodedContent,
            branch: this.branch
        };

        if (sha) {
            body.sha = sha;
        }

        const result = await this._githubAPI(
            `repos/${this.owner}/${this.repo}/contents/${filePath}`,
            'PUT',
            body
        );

        // 清除缓存
        const cacheKey = `${this.owner}/${this.repo}/${filePath}`;
        this.cache.delete(cacheKey);

        return result;
    }

    /**
     * 生成唯一 ID
     * @private
     */
    _generateId(existingIds = []) {
        const maxId = existingIds.reduce((max, id) => Math.max(max, id || 0), 0);
        return maxId + 1;
    }

    /**
     * 查询匹配
     * @private
     */
    _matchesQuery(record, query) {
        if (!query) return true;

        for (const key in query) {
            const condition = query[key];

            // 处理操作符
            if (typeof condition === 'object') {
                for (const op in condition) {
                    const value = condition[op];
                    const recordValue = record[key];

                    switch (op) {
                        case '$eq': if (recordValue !== value) return false; break;
                        case '$ne': if (recordValue === value) return false; break;
                        case '$gt': if (recordValue <= value) return false; break;
                        case '$gte': if (recordValue < value) return false; break;
                        case '$lt': if (recordValue >= value) return false; break;
                        case '$lte': if (recordValue > value) return false; break;
                        case '$in': if (!value.includes(recordValue)) return false; break;
                        case '$nin': if (value.includes(recordValue)) return false; break;
                        case '$not': if (recordValue === value) return false; break;
                    }
                }
            } else {
                // 简单相等
                if (record[key] !== condition) return false;
            }
        }

        return true;
    }

    // ==================== 公开 API ====================

    /**
     * CREATE - 创建数据库文件
     * @param {Object} options
     * @param {string} options.name - 数据库名称
     * @param {string} [options.description] - 描述
     * @param {Object} [options.schema] - 数据结构定义
     * @returns {Promise<Object>}
     */
    async create({ name, description = '', schema = null }) {
        if (!name) {
            throw new Error('GitDB.create: name is required');
        }

        const filePath = `${this.dataDir}/${name}.json`;

        // 检查是否已存在
        const existing = await this._getFileContent(filePath);
        if (existing) {
            throw new Error('DATABASE_EXISTS: Database already exists');
        }

        // 创建初始数据
        const initialData = {
            _meta: {
                name,
                description,
                schema,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            _data: []
        };

        const result = await this._commitFile(
            filePath,
            initialData,
            null,
            `Create database: ${name}`
        );

        return {
            success: true,
            message: '数据库创建成功',
            data: {
                name,
                filePath,
                commitSha: result.commit.sha,
                createdAt: initialData._meta.createdAt
            }
        };
    }

    /**
     * ADD - 添加记录
     * @param {Object} options
     * @param {string} options.name - 数据库名称
     * @param {Object|Array} options.data - 要添加的数据
     * @param {boolean} [options.autoId=true] - 是否自动添加 ID
     * @returns {Promise<Object>}
     */
    async add({ name, data, autoId = true }) {
        if (!name) {
            throw new Error('GitDB.add: name is required');
        }
        if (!data) {
            throw new Error('GitDB.add: data is required');
        }

        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFileContent(filePath);

        if (!file) {
            throw new Error('DATABASE_NOT_FOUND: Database not found');
        }

        // 转换为数组
        const recordsToAdd = Array.isArray(data) ? data : [data];

        // 生成 ID
        if (autoId) {
            const existingIds = file._data.map(r => r.id).filter(id => id !== undefined);
            recordsToAdd.forEach((record, index) => {
                if (record.id === undefined) {
                    record.id = this._generateId(existingIds) + index;
                }
            });
        }

        // 添加记录
        file._data.push(...recordsToAdd);
        file._meta.updatedAt = new Date().toISOString();

        const result = await this._commitFile(
            filePath,
            file,
            file.sha,
            `Add ${recordsToAdd.length} record(s) to ${name}`
        );

        return {
            success: true,
            message: '记录添加成功',
            data: {
                name,
                addedCount: recordsToAdd.length,
                ids: recordsToAdd.map(r => r.id),
                commitSha: result.commit.sha,
                updatedAt: file._meta.updatedAt
            }
        };
    }

    /**
     * UPDATE - 更新记录
     * @param {Object} options
     * @param {string} options.name - 数据库名称
     * @param {Object} options.query - 查询条件
     * @param {Object} options.data - 要更新的数据
     * @param {boolean} [options.multi=false] - 是否更新多条
     * @returns {Promise<Object>}
     */
    async update({ name, query, data, multi = false }) {
        if (!dbName) {
            throw new Error('GitDB.update: dbName is required');
        }
        if (!query) {
            throw new Error('GitDB.update: query is required');
        }
        if (!data) {
            throw new Error('GitDB.update: data is required');
        }

        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFileContent(filePath);

        if (!file) {
            throw new Error('DATABASE_NOT_FOUND: Database not found');
        }

        // 查找并更新记录
        let updatedCount = 0;
        for (const record of file._data) {
            if (this._matchesQuery(record, query)) {
                Object.assign(record, data);
                updatedCount++;

                if (!multi) break; // 只更新第一条
            }
        }

        if (updatedCount === 0) {
            throw new Error('RECORD_NOT_FOUND: No matching records found');
        }

        file._meta.updatedAt = new Date().toISOString();

        const result = await this._commitFile(
            filePath,
            file,
            file.sha,
            `Update ${updatedCount} record(s) in ${dbName}`
        );

        return {
            success: true,
            message: '记录更新成功',
            data: {
                name,
                updatedCount,
                commitSha: result.commit.sha,
                updatedAt: file._meta.updatedAt
            }
        };
    }

    /**
     * DELETE - 删除记录
     * @param {Object} options
     * @param {string} options.name - 数据库名称
     * @param {Object} options.query - 查询条件
     * @param {boolean} [options.multi=false] - 是否删除多条
     * @returns {Promise<Object>}
     */
    async delete({ name, query, multi = false }) {
        if (!dbName) {
            throw new Error('GitDB.delete: dbName is required');
        }
        if (!query) {
            throw new Error('GitDB.delete: query is required');
        }

        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFileContent(filePath);

        if (!file) {
            throw new Error('DATABASE_NOT_FOUND: Database not found');
        }

        // 查找并删除记录
        const initialLength = file._data.length;
        file._data = file._data.filter(record => {
            if (this._matchesQuery(record, query)) {
                if (!multi) {
                    multi = false; // 只删除第一条
                    return false;
                }
                return false;
            }
            return true;
        });

        const deletedCount = initialLength - file._data.length;

        if (deletedCount === 0) {
            throw new Error('RECORD_NOT_FOUND: No matching records found');
        }

        file._meta.updatedAt = new Date().toISOString();

        const result = await this._commitFile(
            filePath,
            file,
            file.sha,
            `Delete ${deletedCount} record(s) from ${dbName}`
        );

        return {
            success: true,
            message: '记录删除成功',
            data: {
                name,
                deletedCount,
                commitSha: result.commit.sha,
                updatedAt: file._meta.updatedAt
            }
        };
    }

    /**
     * DROP - 删除数据库文件
     * @param {Object} options
     * @param {string} options.name - 数据库名称
     * @returns {Promise<Object>}
     */
    async drop({ dbName }) {
        if (!dbName) {
            throw new Error('GitDB.drop: dbName is required');
        }

        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFileContent(filePath);

        if (!file) {
            throw new Error('DATABASE_NOT_FOUND: Database not found');
        }

        // 删除文件
        const result = await this._githubAPI(
            `repos/${this.owner}/${this.repo}/contents/${filePath}`,
            'DELETE',
            {
                message: `Drop database: ${dbName}`,
                sha: file.sha,
                branch: this.branch
            }
        );

        // 清除缓存
        const cacheKey = `${this.owner}/${this.repo}/${filePath}`;
        this.cache.delete(cacheKey);

        return {
            success: true,
            message: '数据库已删除',
            data: {
                name,
                filePath,
                commitSha: result.commit.sha,
                deletedAt: new Date().toISOString()
            }
        };
    }

    /**
     * FIND - 查询记录
     * @param {Object} options
     * @param {string} options.name - 数据库名称
     * @param {Object} [options.query] - 查询条件
     * @param {number} [options.limit] - 返回数量限制
     * @param {number} [options.skip] - 跳过记录数
     * @returns {Promise<Object>}
     */
    async find({ name, query = null, limit = null, skip = 0 }) {
        if (!name) {
            throw new Error('GitDB.find: name is required');
        }

        const filePath = `${this.dataDir}/${name}.json`;
        const file = await this._getFileContent(filePath);

        if (!file) {
            throw new Error('DATABASE_NOT_FOUND: Database not found');
        }

        // 过滤记录
        let records = file._data.filter(record => this._matchesQuery(record, query));

        const totalCount = records.length;

        // 分页
        if (skip > 0) {
            records = records.slice(skip);
        }
        if (limit !== null) {
            records = records.slice(0, limit);
        }

        return {
            success: true,
            data: {
                name,
                totalCount,
                returnedCount: records.length,
                records
            }
        };
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * SHOW - 获取数据库列表
     * @returns {Promise<Array>}
     */
    async show() {
        try {
            const data = await this._githubAPI(
                `repos/${this.owner}/${this.repo}/contents/${this.dataDir}?ref=${this.branch}`
            );

            return data
                .filter(item => item.name.endsWith('.json'))
                .map(item => ({
                    name: item.name.replace('.json', ''),
                    path: item.path,
                    size: item.size
                }));
        } catch (error) {
            if (error.message.includes('404')) {
                return []; // 目录不存在
            }
            throw error;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitDB;
}

if (typeof window !== 'undefined') {
    window.GitDB = GitDB;
}
