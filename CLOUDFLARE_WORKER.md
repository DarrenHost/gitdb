# Cloudflare Workers 部署指南

## 🌟 方案优势

使用 Cloudflare Workers 作为 GitHub API 的反向代理：

- ✅ **解决 CORS 问题** - 后端请求无跨域限制
- ✅ **保护 Token** - Token 存储在后端，不暴露在前端
- ✅ **免费额度** - 每天 10 万次请求（个人使用足够）
- ✅ **全球 CDN** - Cloudflare 全球节点加速
- ✅ **速率限制** - 可配置访问频率限制

---

## 📋 前置要求

1. **Cloudflare 账号** - 免费注册 https://cloudflare.com
2. **GitHub Token** - Fine-grained 或经典 Token 均可
3. **Node.js** - 用于部署（可选，也可用 Web 界面）

---

## 🚀 部署步骤

### 方式 1：Web 界面部署（推荐）⭐

**步骤 1：创建 Worker**

1. 登录 https://dash.cloudflare.com/
2. 左侧菜单 → **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Create Worker**
5. 输入名称：`gitdb-proxy`
6. 点击 **Deploy**

**步骤 2：配置代码**

1. 点击 **Edit code**
2. 复制 `worker.js` 的全部内容
3. 粘贴到编辑器
4. 点击 **Save and deploy**

**步骤 3：设置环境变量**

1. 点击 **Settings** → **Variables**
2. 点击 **Add variable**
3. 添加以下变量：

```
Variable name: GITHUB_TOKEN
Value: github_pat_xxx 或 ghp_xxx
Encrypt: ✅ 勾选

Variable name: ALLOWED_ORIGINS
Value: https://darrenhost.github.io,http://localhost:8080
Encrypt: ❌ 不勾选
```

4. 点击 **Save**
5. 点击 **Deploy** 重新部署

**步骤 4：获取 Worker URL**

```
https://gitdb-proxy.your-username.workers.dev
```

---

### 方式 2：Wrangler CLI 部署

**步骤 1：安装 Wrangler**

```bash
npm install -g wrangler
# 或
yarn global add wrangler
```

**步骤 2：登录 Cloudflare**

```bash
wrangler login
```

**步骤 3：初始化项目**

```bash
cd gitdb
wrangler init gitdb-proxy
```

**步骤 4：配置 wrangler.toml**

```toml
name = "gitdb-proxy"
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
ALLOWED_ORIGINS = "https://darrenhost.github.io,http://localhost:8080"

# 或使用 Secret（推荐）
# wrangler secret put GITHUB_TOKEN
```

**步骤 5：设置 Secret**

```bash
wrangler secret put GITHUB_TOKEN
# 输入你的 GitHub Token
```

**步骤 6：部署**

```bash
wrangler deploy
```

**输出：**
```
Deployed https://gitdb-proxy.your-username.workers.dev
```

---

## 🔧 配置 GitDB

### 更新 gitdb.js 支持代理

```javascript
// 添加 apiBaseUrl 配置
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    apiBaseUrl: 'https://gitdb-proxy.your-username.workers.dev'  // Worker URL
});
```

### 修改 _githubAPI 方法

```javascript
async _githubAPI(endpoint, method = 'GET', body = null) {
    // 支持自定义 API 基础 URL
    const baseUrl = this.apiBaseUrl || 'https://api.github.com';
    const url = `${baseUrl}${endpoint}`;
    
    // ... 其他代码不变
}
```

---

## 🔐 安全配置

### 1. 限制允许的域名

```toml
# wrangler.toml
[vars]
ALLOWED_ORIGINS = "https://your-domain.com,https://darrenhost.github.io"
```

**不要使用 `*`，限制具体域名更安全！**

### 2. 使用 Fine-grained Token

**权限配置：**
- ✅ Repository permissions → Contents: Read and write
- ✅ 只选择必要的仓库
- ❌ 不要选择 All repositories

### 3. 添加速率限制（可选）

```javascript
// worker.js 添加速率限制
const rateLimit = {
  max: 100,  // 每分钟最多请求数
  window: 60 // 时间窗口（秒）
};
```

---

## 📊 成本估算

### Cloudflare Workers 免费额度

| 资源 | 免费额度 | 说明 |
|------|---------|------|
| 请求数 | 100,000/天 | 足够个人使用 |
| CPU 时间 | 10ms/请求 | 代理请求通常 <5ms |
| 存储 | 1MB | 代码大小约 3KB |

### 付费计划

如果使用量大：

```
$5/月 - 1000 万次请求
$0.01/1000 次 - 超出部分
```

---

## 🔍 监控和日志

### 查看使用量

1. 登录 Cloudflare Dashboard
2. Workers & Pages → 选择 Worker
3. 点击 **Analytics**
4. 查看请求数、错误率、延迟

### 启用日志

```javascript
// worker.js 添加日志
console.log('Proxy request:', request.method, path);
```

**查看日志：**
```bash
wrangler tail gitdb-proxy
```

---

## 🎯 完整示例

### 前端配置

```html
<!DOCTYPE html>
<html>
<head>
    <title>GitDB Demo</title>
</head>
<body>
    <script src="gitdb.js"></script>
    <script>
        const db = new GitDB({
            owner: 'DarrenHost',
            repo: 'gitdb',
            apiBaseUrl: 'https://gitdb-proxy.your-username.workers.dev'
            // 不需要 token！Worker 会自动使用
        });
        
        // 开始使用...
        const databases = await db.show();
        console.log(databases);
    </script>
</body>
</html>
```

### Worker 配置

```toml
# wrangler.toml
name = "gitdb-proxy"
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
ALLOWED_ORIGINS = "https://darrenhost.github.io"

[env.production]
route = "gitdb-proxy.your-username.workers.dev/*"
```

---

## ⚠️ 注意事项

### 1. Token 安全

- ✅ 使用 Cloudflare Secrets 存储 Token
- ✅ 不要在代码中硬编码 Token
- ✅ 限制允许的域名
- ✅ 使用 Fine-grained Token

### 2. 性能优化

- ✅ 启用 Cloudflare 缓存
- ✅ 配置合适的超时时间
- ✅ 监控请求延迟

### 3. 错误处理

- ✅ 添加重试机制
- ✅ 记录错误日志
- ✅ 配置告警通知

---

## 🆘 故障排查

### 问题 1: 401 Unauthorized

**原因：** Token 无效或未设置

**解决：**
```bash
# 重新设置 Secret
wrangler secret put GITHUB_TOKEN
```

### 问题 2: CORS Error

**原因：** ALLOWED_ORIGINS 配置错误

**解决：**
```toml
# wrangler.toml
[vars]
ALLOWED_ORIGINS = "https://your-domain.com"
```

### 问题 3: 404 Not Found

**原因：** Worker URL 错误

**解决：**
```bash
# 查看部署的 URL
wrangler deploy
# 输出中会显示 URL
```

---

## 📚 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub API 文档](https://docs.github.com/en/rest)

---

**祝部署顺利！** 🚀
