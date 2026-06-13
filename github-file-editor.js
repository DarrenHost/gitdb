/**
 * GitHubFileEditor - 简易原生 JS GitHub 文件编辑库
 * 基于 GitHub REST API v3，零依赖，浏览器/Node.js 通用
 * 
 * 使用示例：
 * const editor = new GitHubFileEditor({
 *   token: 'ghp_xxxxxxxxxxxx',
 *   owner: 'username',
 *   repo: 'repo-name',
 *   branch: 'main'
 * });
 * 
 * // 读取文件
 * const file = await editor.getFile('README.md');
 * console.log(file.content);
 * 
 * // 编辑文件
 * await editor.updateFile('README.md', '# New Content', 'Update README');
 */
class GitHubFileEditor {
  /**
   * 初始化配置
   * @param {Object} config - 配置项
   * @param {string} config.token - 个人访问令牌（必填）
   * @param {string} config.owner - 用户名/组织名（必填）
   * @param {string} config.repo - 仓库名（必填）
   * @param {string} [config.branch='main'] - 操作分支
   * @param {string} [config.baseUrl='https://api.github.com'] - API 基础地址
   * @param {number} [config.timeout=10000] - 请求超时时间(ms)
   */
  constructor(config) {
    // 基础配置校验
    if (!config || typeof config !== 'object') {
      throw new TypeError('配置项必须是一个对象');
    }
    if (!config.token || typeof config.token !== 'string') {
      throw new Error('必须提供有效的 token（字符串类型）');
    }
    if (!config.owner || typeof config.owner !== 'string') {
      throw new Error('必须提供有效的 owner（字符串类型）');
    }
    if (!config.repo || typeof config.repo !== 'string') {
      throw new Error('必须提供有效的 repo（字符串类型）');
    }

    this.baseUrl = (config.baseUrl || 'https://api.github.com').replace(/\/$/, '');
    this.token = config.token;
    this.owner = config.owner;
    this.repo = config.repo;
    this.branch = config.branch || 'main';
    this.timeout = config.timeout || 10000;

    // 请求头配置（身份验证）
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'GitHubFileEditor/1.0'
    };

    // 速率限制信息缓存
    this.rateLimit = null;
  }

  /**
   * 内部：带超时的 fetch 请求
   * @private
   */
  async _fetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { ...this.headers, ...options.headers }
      });

      // 缓存速率限制信息
      this.rateLimit = {
        limit: response.headers.get('X-RateLimit-Limit'),
        remaining: response.headers.get('X-RateLimit-Remaining'),
        reset: response.headers.get('X-RateLimit-Reset')
      };

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`请求超时（>${this.timeout}ms）：${url}`);
      }
      throw error;
    }
  }

  /**
   * 内部：处理 API 错误响应
   * @private
   */
  async _handleError(response, context = '') {
    let message = `${context}失败：HTTP ${response.status}`;

    try {
      const data = await response.json();
      if (data.message) {
        message += ` - ${data.message}`;
      }
      if (data.errors) {
        message += ` (${JSON.stringify(data.errors)})`;
      }
    } catch {
      message += ` ${response.statusText}`;
    }

    // 特定状态码的友好提示
    if (response.status === 401) {
      message += ' [Token 无效或已过期]';
    } else if (response.status === 403) {
      message += ' [权限不足或触发速率限制]';
    } else if (response.status === 404) {
      message += ' [文件/仓库不存在]';
    } else if (response.status === 409) {
      message += ' [存在冲突，文件可能已被修改]';
    } else if (response.status === 422) {
      message += ' [请求参数错误]';
    }

    const error = new Error(message);
    error.status = response.status;
    error.response = response;
    throw error;
  }

  /**
   * 内部：Base64 编码（支持 Unicode）
   * @private
   */
  _encodeBase64(str) {
    if (typeof window !== 'undefined' && window.btoa) {
      return btoa(unescape(encodeURIComponent(str)));
    }
    // Node.js 环境
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf-8').toString('base64');
    }
    throw new Error('当前环境不支持 Base64 编码');
  }

  /**
   * 内部：Base64 解码（支持 Unicode）
   * @private
   */
  _decodeBase64(str) {
    if (typeof window !== 'undefined' && window.atob) {
      return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
    }
    // Node.js 环境
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'base64').toString('utf-8');
    }
    throw new Error('当前环境不支持 Base64 解码');
  }

  /**
   * 读取 GitHub 仓库中的文件内容
   * @param {string} filePath - 文件路径（如：README.md / src/index.js）
   * @param {boolean} [includeRaw=false] - 是否包含原始 API 响应
   * @returns {Promise<Object>} 文件数据
   */
  async getFile(filePath, includeRaw = false) {
    if (!filePath || typeof filePath !== 'string') {
      throw new TypeError('filePath 必须是有效的字符串');
    }

    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${encodedPath}?ref=${encodeURIComponent(this.branch)}`;

    const response = await this._fetch(url);

    if (!response.ok) {
      await this._handleError(response, '读取文件');
    }

    const data = await response.json();

    // 处理可能是目录的情况
    if (Array.isArray(data)) {
      throw new Error(`路径 "${filePath}" 是一个目录，请指定具体文件`);
    }

    const result = {
      path: data.path,
      name: data.name,
      sha: data.sha,
      size: data.size,
      url: data.html_url,
      content: this._decodeBase64(data.content),
      encoding: data.encoding,
      lastCommit: {
        sha: data.sha,
        url: data.html_url
      }
    };

    if (includeRaw) {
      result.rawData = data;
    }

    return result;
  }

  /**
   * 获取目录下的文件列表
   * @param {string} [dirPath=''] - 目录路径（如：src/ 或 docs/）
   * @returns {Promise<Array>} 文件/目录列表
   */
  async listFiles(dirPath = '') {
    const encodedPath = dirPath ? encodeURIComponent(dirPath).replace(/%2F/g, '/') : '';
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${encodedPath}?ref=${encodeURIComponent(this.branch)}`;

    const response = await this._fetch(url);

    if (!response.ok) {
      await this._handleError(response, '列出文件');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(`路径 "${dirPath || '根目录'}" 不是一个目录`);
    }

    return data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type, // 'file' | 'dir'
      size: item.size,
      sha: item.sha,
      url: item.html_url,
      downloadUrl: item.download_url
    }));
  }

  /**
   * 编辑并提交文件到 GitHub（自动获取 sha，无需手动处理）
   * @param {string} filePath - 文件路径
   * @param {string} newContent - 新的文件内容
   * @param {string} [message] - 提交信息（默认自动生成）
   * @param {Object} [options] - 额外选项
   * @param {string} [options.committerName] - 提交者名称
   * @param {string} [options.committerEmail] - 提交者邮箱
   * @returns {Promise<Object>} 提交结果
   */
  async updateFile(filePath, newContent, message, options = {}) {
    if (!filePath || typeof filePath !== 'string') {
      throw new TypeError('filePath 必须是有效的字符串');
    }
    if (typeof newContent !== 'string') {
      throw new TypeError('newContent 必须是字符串');
    }

    const commitMessage = message || `Update ${filePath} via GitHubFileEditor`;
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');

    // 1. 先获取文件的 sha 值（必须）
    let fileSha;
    try {
      const fileData = await this.getFile(filePath);
      fileSha = fileData.sha;
    } catch (error) {
      if (error.status === 404) {
        // 文件不存在，创建新文件（不需要 sha）
        fileSha = undefined;
      } else {
        throw error;
      }
    }

    // 2. 构建请求体
    const body = {
      message: commitMessage,
      content: this._encodeBase64(newContent),
      branch: this.branch
    };

    // 只有更新已有文件时才需要 sha
    if (fileSha) {
      body.sha = fileSha;
    }

    // 自定义提交者信息
    if (options.committerName || options.committerEmail) {
      body.committer = {};
      if (options.committerName) body.committer.name = options.committerName;
      if (options.committerEmail) body.committer.email = options.committerEmail;
    }

    // 3. 发送更新/创建请求
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${encodedPath}`;
    const response = await this._fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      await this._handleError(response, fileSha ? '更新文件' : '创建文件');
    }

    const result = await response.json();

    return {
      success: true,
      action: fileSha ? 'updated' : 'created',
      path: result.content?.path || filePath,
      sha: result.content?.sha,
      size: result.content?.size,
      commit: {
        sha: result.commit?.sha,
        message: result.commit?.message,
        url: result.commit?.html_url
      },
      branch: this.branch
    };
  }

  /**
   * 创建新文件（如果文件已存在会报错）
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   * @param {string} [message] - 提交信息
   * @returns {Promise<Object>} 创建结果
   */
  async createFile(filePath, content, message) {
    // 先检查文件是否已存在
    try {
      await this.getFile(filePath);
      throw new Error(`文件 "${filePath}" 已存在，请使用 updateFile() 修改`);
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    return this.updateFile(filePath, content, message || `Create ${filePath}`);
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @param {string} [message] - 提交信息
   * @returns {Promise<Object>} 删除结果
   */
  async deleteFile(filePath, message) {
    if (!filePath || typeof filePath !== 'string') {
      throw new TypeError('filePath 必须是有效的字符串');
    }

    // 获取文件 sha
    const fileData = await this.getFile(filePath);
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
    const commitMessage = message || `Delete ${filePath}`;

    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${encodedPath}`;
    const response = await this._fetch(url, {
      method: 'DELETE',
      body: JSON.stringify({
        message: commitMessage,
        sha: fileData.sha,
        branch: this.branch
      })
    });

    if (!response.ok) {
      await this._handleError(response, '删除文件');
    }

    const result = await response.json();
    return {
      success: true,
      action: 'deleted',
      path: filePath,
      commit: {
        sha: result.commit?.sha,
        message: result.commit?.message
      }
    };
  }

  /**
   * 批量更新多个文件（使用 Git Trees API，只产生一次提交）
   * @param {Array<Object>} files - 文件列表 [{path, content, mode}]
   * @param {string} [message] - 提交信息
   * @returns {Promise<Object>} 提交结果
   */
  async batchUpdate(files, message) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new TypeError('files 必须是非空数组');
    }

    const commitMessage = message || `Batch update ${files.length} files`;

    // 1. 获取当前分支的最新 commit
    const branchUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/git/ref/heads/${this.branch}`;
    const branchRes = await this._fetch(branchUrl);
    if (!branchRes.ok) await this._handleError(branchRes, '获取分支');
    const branchData = await branchRes.json();
    const baseCommitSha = branchData.object.sha;

    // 2. 获取基础 tree
    const commitUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/git/commits/${baseCommitSha}`;
    const commitRes = await this._fetch(commitUrl);
    if (!commitRes.ok) await this._handleError(commitRes, '获取提交');
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. 创建新 tree
    const treeItems = files.map(file => ({
      path: file.path,
      mode: file.mode || '100644',
      type: 'blob',
      content: file.content
    }));

    const treeUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/git/trees`;
    const treeRes = await this._fetch(treeUrl, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });
    if (!treeRes.ok) await this._handleError(treeRes, '创建树');
    const treeData = await treeRes.json();

    // 4. 创建新 commit
    const newCommitUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/git/commits`;
    const newCommitRes = await this._fetch(newCommitUrl, {
      method: 'POST',
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [baseCommitSha]
      })
    });
    if (!newCommitRes.ok) await this._handleError(newCommitRes, '创建提交');
    const newCommitData = await newCommitRes.json();

    // 5. 更新分支指针
    const updateRefUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/git/refs/heads/${this.branch}`;
    const updateRes = await this._fetch(updateRefUrl, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false
      })
    });
    if (!updateRes.ok) await this._handleError(updateRes, '更新分支');

    return {
      success: true,
      action: 'batch_update',
      filesUpdated: files.length,
      commit: {
        sha: newCommitData.sha,
        message: newCommitData.message,
        url: newCommitData.html_url
      }
    };
  }

  /**
   * 获取仓库的分支列表
   * @returns {Promise<Array>} 分支列表
   */
  async listBranches() {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/branches`;
    const response = await this._fetch(url);

    if (!response.ok) {
      await this._handleError(response, '列出分支');
    }

    const data = await response.json();
    return data.map(branch => ({
      name: branch.name,
      protected: branch.protected,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url
      }
    }));
  }

  /**
   * 获取当前 Token 的速率限制状态
   * @returns {Promise<Object>} 速率限制信息
   */
  async getRateLimit() {
    const url = `${this.baseUrl}/rate_limit`;
    const response = await this._fetch(url);

    if (!response.ok) {
      await this._handleError(response, '获取速率限制');
    }

    const data = await response.json();
    return {
      limit: data.resources.core.limit,
      remaining: data.resources.core.remaining,
      reset: new Date(data.resources.core.reset * 1000).toLocaleString(),
      used: data.resources.core.used
    };
  }

  /**
   * 获取最近一次请求的速率限制信息（无需额外请求）
   * @returns {Object|null}
   */
  getLastRateLimit() {
    if (!this.rateLimit || !this.rateLimit.limit) {
      return null;
    }
    return {
      ...this.rateLimit,
      resetDate: this.rateLimit.reset 
        ? new Date(parseInt(this.rateLimit.reset) * 1000).toLocaleString()
        : null
    };
  }
}

// 导出库（支持多种模块规范）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubFileEditor;
} else if (typeof window !== 'undefined') {
  window.GitHubFileEditor = GitHubFileEditor;
}