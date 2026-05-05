/**
 * 简易原生 JS GitHub 文件编辑库
 * 功能：配置令牌 -> 读取文件 -> 编辑文件 -> 提交修改
 * 依赖：GitHub REST API v3
 */
class GitHubFileEditor {
  /**
   * 初始化配置
   * @param {Object} config - 配置项
   * @param {string} config.token - 个人访问令牌（必填）
   * @param {string} config.owner - 用户名/组织名（必填）
   * @param {string} config.repo - 仓库名（必填）
   * @param {string} [config.branch=main] - 操作分支，默认 main
   */
  constructor(config) {
    // 基础配置校验
    if (!config.token || !config.owner || !config.repo) {
      throw new Error('必须配置 token、owner、repo 三个必填项！');
    }

    this.baseUrl = 'https://api.github.com';
    this.token = config.token;
    this.owner = config.owner;
    this.repo = config.repo;
    this.branch = config.branch || 'main';

    // 请求头配置（身份验证）
    this.headers = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * 读取 GitHub 仓库中的文件内容
   * @param {string} filePath - 文件路径（如：README.md / src/index.js）
   * @returns {Promise<Object>} 文件数据（包含内容、sha 值等）
   */
  async getFile(filePath) {
    try {
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filePath}?ref=${this.branch}`;
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`读取文件失败：${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // GitHub 存储的文件内容是 base64 编码，需要解码
      const content = atob(data.content.replace(/\n/g, ''));
      
      return {
        rawData: data,
        content: content,
        sha: data.sha // 修改文件必须用到的 sha 值
      };
    } catch (error) {
      console.error('getFile 错误：', error);
      throw error;
    }
  }

  /**
   * 编辑并提交文件到 GitHub
   * @param {string} filePath - 文件路径
   * @param {string} newContent - 新的文件内容
   * @param {string} [message='Update file via JS Library'] - 提交信息
   * @returns {Promise<Object>} 提交结果
   */
  async updateFile(filePath, newContent, message = 'Update file via GitHubFileEditor') {
    try {
      // 1. 先获取文件的 sha 值（必须）
      const fileData = await this.getFile(filePath);
      
      // 2. 将新内容编码为 base64（GitHub API 要求）
      const encodedContent = btoa(unescape(encodeURIComponent(newContent)));

      // 3. 发送更新请求
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filePath}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          message: message,
          content: encodedContent,
          sha: fileData.sha,
          branch: this.branch
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`更新文件失败：${errData.message}`);
      }

      const result = await response.json();
      console.log('文件更新成功！', result);
      return result;
    } catch (error) {
      console.error('updateFile 错误：', error);
      throw error;
    }
  }
}

// 导出库（支持浏览器全局使用）
if (typeof window !== 'undefined') {
  window.GitHubFileEditor = GitHubFileEditor;
}