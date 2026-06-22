# Cloudflare Workers 部署指南

## 🌟 功能特性

GitDB Server 是完整的 GitDB 实现，部署后可直接通过 HTTP API 使用：

- ✅ **完整 CRUD** - 创建、查询、添加、更新、删除全支持
- ✅ **RESTful API** - 标准 HTTP 接口，任何语言都能调用
- ✅ **Token 混淆** - 自动解混淆 gitdb_ 格式的 Token
- ✅ **零前端代码** - 无需部署前端，Worker 独立运行
- ✅ **免费额度** - 每天 10 万次请求（个人使用足够）

---

## 📋 前置要求

1. **Cloudflare 账号** - 免费注册 https://cloudflare.com
2. **GitHub Token** - Fine-grained 或经典 Token
3. **GitHub 仓库** - 用于存储数据

---

## 🚀 部署步骤

### 方式 1：Web 界面部署（推荐）⭐

**步骤 1：创建 Worker**

1. 登录 https://dash.cloudflare.com/
2. 左侧菜单 → **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Create Worker**
5. 输入名称：`gitdb-server`
6. 点击 **Deploy**

**步骤 2：配置代码**

1. 点击 **Edit code**
2. 复制 `src/worker.js` 的全部内容
3. 粘贴到编辑器（替换默认代码）
4. 点击 **Save**

**步骤 3：设置环境变量** ⚠️ 必须

点击 **Settings** → **Variables** → **Add variable**，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `GITDB_OWNER` | `your-username` | 仓库所有者（GitHub 用户名） |
| `GITDB_REPO` | `your-repo` | 存储数据的仓库 |
| `GITDB_TOKEN` | `gitdb_xxx` | GitDB Token（支持混淆格式） |
| `GITDB_BRANCH` | `main` | 分支名称（可选） |
| `GITDB_DATA_DIR` | `data` | 数据目录（可选） |

**步骤 4：重新部署**

1. 点击 **Deploy** → **Deploy new deployment**
2. 等待部署完成

**步骤 5：获取 Worker URL**

```
https://gitdb-server.your-username.workers.dev
```

---

### 方式 2：Wrangler CLI 部署

**步骤 1：安装 Wrangler**

```bash
npm install -g wrangler
```

**步骤 2：登录 Cloudflare**

```bash
wrangler login
```

**步骤 3：初始化项目**

```bash
cd gitdb
wrangler init gitdb-server
```

**步骤 4：配置 wrangler.toml**

```toml
name = "gitdb-server"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[vars]
GITDB_OWNER = "your-username"
GITDB_REPO = "your-repo"
GITDB_BRANCH = "main"
GITDB_DATA_DIR = "data"
```

**步骤 5：设置 Secret（Token）**

```bash
wrangler secret put GITDB_TOKEN
# 输入你的 GitDB Token（支持混淆格式 gitdb_xxx）
```

**步骤 6：部署**

```bash
wrangler deploy
```

**输出：**
```
Deployed https://gitdb-server.your-username.workers.dev
```

---

## 📖 API 使用文档

### 基础信息

**Base URL:** `https://gitdb-server.your-username.workers.dev`

**请求格式:** JSON

**响应格式:** JSON

---

### API 端点

#### 1. 健康检查

```http
GET /health
```

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-23T10:00:00.000Z"
}
```

---

#### 2. 创建数据库

```http
POST /create
Content-Type: application/json

{
  "name": "users",
  "description": "用户数据库",
  "schema": null
}
```

**响应:**
```json
{
  "success": true,
  "message": "数据库创建成功",
  "data": {
    "name": "users",
    "filePath": "data/users.json",
    "commitSha": "abc123..."
  }
}
```

---

#### 3. 获取数据库列表

```http
GET /show
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "name": "users",
      "path": "data/users.json",
      "size": 1024
    },
    {
      "name": "products",
      "path": "data/products.json",
      "size": 2048
    }
  ]
}
```

---

#### 4. 添加记录

```http
POST /add
Content-Type: application/json

{
  "name": "users",
  "data": {
    "name": "John",
    "email": "john@example.com",
    "age": 25
  },
  "autoId": true
}
```

**批量添加:**
```json
{
  "name": "users",
  "data": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob", "email": "bob@example.com" }
  ],
  "autoId": true
}
```

**响应:**
```json
{
  "success": true,
  "message": "记录添加成功",
  "data": {
    "name": "users",
    "addedCount": 1,
    "ids": [1],
    "commitSha": "def456..."
  }
}
```

---

#### 5. 查询记录

```http
POST /find
Content-Type: application/json

{
  "name": "users",
  "query": {
    "age": { "$gt": 18 }
  },
  "limit": 10,
  "skip": 0
}
```

**查询操作符:**

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `$eq` | 等于 | `{ "age": { "$eq": 25 } }` |
| `$ne` | 不等于 | `{ "status": { "$ne": "deleted" } }` |
| `$gt` | 大于 | `{ "age": { "$gt": 18 } }` |
| `$gte` | 大于等于 | `{ "age": { "$gte": 18 } }` |
| `$lt` | 小于 | `{ "age": { "$lt": 60 } }` |
| `$lte` | 小于等于 | `{ "age": { "$lte": 60 } }` |
| `$in` | 在数组中 | `{ "status": { "$in": ["active", "pending"] } }` |
| `$nin` | 不在数组中 | `{ "status": { "$nin": ["deleted"] } }` |

**响应:**
```json
{
  "success": true,
  "data": {
    "name": "users",
    "totalCount": 5,
    "returnedCount": 3,
    "records": [
      { "id": 1, "name": "John", "email": "john@example.com", "age": 25 },
      { "id": 2, "name": "Jane", "email": "jane@example.com", "age": 30 }
    ]
  }
}
```

---

#### 6. 更新记录

```http
POST /update
Content-Type: application/json

{
  "name": "users",
  "query": {
    "email": "john@example.com"
  },
  "data": {
    "age": 26
  },
  "multi": false
}
```

**参数说明:**
- `multi: true` - 更新所有匹配的记录
- `multi: false` - 只更新第一条匹配的记录

**响应:**
```json
{
  "success": true,
  "message": "记录更新成功",
  "data": {
    "name": "users",
    "updatedCount": 1,
    "commitSha": "ghi789..."
  }
}
```

---

#### 7. 删除记录

```http
POST /delete
Content-Type: application/json

{
  "name": "users",
  "query": {
    "id": 1
  },
  "multi": false
}
```

**参数说明:**
- `multi: true` - 删除所有匹配的记录
- `multi: false` - 只删除第一条匹配的记录

**响应:**
```json
{
  "success": true,
  "message": "记录删除成功",
  "data": {
    "name": "users",
    "deletedCount": 1,
    "commitSha": "jkl012..."
  }
}
```

---

#### 8. 删除数据库

```http
POST /drop
Content-Type: application/json

{
  "name": "users"
}
```

**响应:**
```json
{
  "success": true,
  "message": "数据库已删除",
  "data": {
    "name": "users",
    "filePath": "data/users.json",
    "commitSha": "mno345..."
  }
}
```

---

## 💻 使用示例

### JavaScript / Fetch

```javascript
const BASE_URL = 'https://gitdb-server.your-username.workers.dev';

// 创建数据库
async function createDatabase(name) {
  const response = await fetch(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: 'My database' })
  });
  return response.json();
}

// 添加记录
async function addRecord(dbName, data) {
  const response = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: dbName, data })
  });
  return response.json();
}

// 查询记录
async function findRecords(dbName, query) {
  const response = await fetch(`${BASE_URL}/find`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: dbName, query })
  });
  return response.json();
}

// 使用示例
await createDatabase('users');
await addRecord('users', { name: 'John', email: 'john@example.com' });
const users = await findRecords('users', { age: { $gt: 18 } });
console.log(users);
```

### Python / Requests

```python
import requests

BASE_URL = 'https://gitdb-server.your-username.workers.dev'

# 创建数据库
def create_database(name):
    response = requests.post(f'{BASE_URL}/create', json={
        'name': name,
        'description': 'My database'
    })
    return response.json()

# 添加记录
def add_record(db_name, data):
    response = requests.post(f'{BASE_URL}/add', json={
        'name': db_name,
        'data': data
    })
    return response.json()

# 查询记录
def find_records(db_name, query):
    response = requests.post(f'{BASE_URL}/find', json={
        'name': db_name,
        'query': query
    })
    return response.json()

# 使用示例
create_database('users')
add_record('users', { 'name': 'John', 'email': 'john@example.com' })
users = find_records('users', { 'age': { '$gt': 18 } })
print(users)
```

### cURL

```bash
# 健康检查
curl https://gitdb-server.your-username.workers.dev/health

# 创建数据库
curl -X POST https://gitdb-server.your-username.workers.dev/create \
  -H "Content-Type: application/json" \
  -d '{"name":"users","description":"User database"}'

# 添加记录
curl -X POST https://gitdb-server.your-username.workers.dev/add \
  -H "Content-Type: application/json" \
  -d '{"name":"users","data":{"name":"John","email":"john@example.com"}}'

# 查询记录
curl -X POST https://gitdb-server.your-username.workers.dev/find \
  -H "Content-Type: application/json" \
  -d '{"name":"users","query":{"age":{"$gt":18}}}'
```

---

## 🔐 Token 混淆

### 为什么要混淆？

GitHub 会扫描并禁用明文 token。使用混淆后的 token 可以避免被检测。

### 使用步骤

1. **打开混淆工具**
   ```
   https://darrenhost.github.io/gitdb/demo/token-mixer.html
   ```

2. **输入 GitHub Token**
   - 格式：`ghp_xxx` 或 `github_pat_xxx`

3. **生成混淆 Token**
   - 格式：`gitdb_xxx`

4. **在 Cloudflare 环境变量中使用**
   ```
   GITHUB_TOKEN = gitdb_xxxxxxxxxxxx
   ```

Worker 会自动解混淆，无需额外配置！

---

## 📊 成本估算

### Cloudflare Workers 免费额度

| 资源 | 免费额度 | 说明 |
|------|---------|------|
| 请求数 | 100,000/天 | 足够个人使用 |
| CPU 时间 | 10ms/请求 | 通常 <5ms |
| 存储 | 1MB | 代码大小约 19KB |

### 付费计划

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

Worker 会自动记录错误到 Cloudflare Logs。

**查看日志：**
```bash
wrangler tail gitdb-server
```

---

## ⚠️ 错误处理

### 常见错误码

| 错误 | 状态码 | 说明 |
|------|--------|------|
| `DATABASE_EXISTS` | 409 | 数据库已存在 |
| `DATABASE_NOT_FOUND` | 404 | 数据库不存在 |
| `RECORD_NOT_FOUND` | 404 | 记录不存在 |
| `GITHUB_TOKEN not configured` | 500 | 未配置 Token |
| `Missing GITHUB_OWNER` | 500 | 未配置 Owner |

### 错误响应格式

```json
{
  "success": false,
  "error": "DATABASE_NOT_FOUND"
}
```

---

## 🆘 故障排查

### 问题 1: 500 Internal Server Error

**原因：** 环境变量未配置

**解决：**
```
检查 Settings → Variables 是否配置了：
- GITDB_OWNER
- GITDB_REPO
- GITDB_TOKEN
```

### 问题 2: 401 Unauthorized

**原因：** Token 无效或权限不足

**解决：**
```bash
# 重新生成 Token
https://github.com/settings/tokens

# 确保勾选了 repo 权限
```

### 问题 3: 404 Not Found

**原因：** 仓库不存在或数据目录不存在

**解决：**
```bash
# 检查仓库是否存在
https://github.com/your-username/your-repo

# 首次使用会自动创建 data 目录
```

---

## 📚 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [Token 混淆工具](https://darrenhost.github.io/gitdb/demo/token-mixer.html)

---

**祝部署顺利！** 🚀
