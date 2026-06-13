# GitDB API 设计文档

**版本：** V1.0  
**日期：** 2026-06-13  
**项目：** https://github.com/DarrenHost/gitdb

---

## 一、API 概述

GitDB 是一个基于 GitHub 的轻量级 JSON 数据库，通过 GitHub API 实现数据的增删改查。

### 1.1 核心概念

| 术语 | 说明 |
|------|------|
| **Database** | 一个 JSON 数据文件（如：`users.json`） |
| **Record** | JSON 数组中的一条记录 |
| **Repository** | GitHub 仓库，存储所有数据库文件 |

### 1.2 基础配置

```javascript
const CONFIG = {
    owner: 'DarrenHost',      // GitHub 用户名
    repo: 'gitdb',            // 仓库名称
    branch: 'main',           // 分支名称
    token: 'YOUR_GITHUB_TOKEN' // GitHub Personal Access Token
};
```

---

## 二、API 接口设计

### 2.1 CREATE - 创建数据库文件

**功能：** 创建一个新的 JSON 数据库文件

**端点：**
```
POST /api/db/create
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dbName` | string | ✅ | 数据库名称（不含 .json） |
| `description` | string | ❌ | 数据库描述 |
| `schema` | object | ❌ | 数据结构定义（可选） |

**请求示例：**
```javascript
GitDB.create({
    dbName: 'users',
    description: '用户信息数据库',
    schema: {
        id: 'number',
        name: 'string',
        email: 'string',
        createdAt: 'date'
    }
});
```

**响应格式：**
```json
{
    "success": true,
    "message": "数据库创建成功",
    "data": {
        "dbName": "users",
        "filePath": "data/users.json",
        "commitSha": "abc123...",
        "createdAt": "2026-06-13T10:00:00Z"
    }
}
```

**错误响应：**
```json
{
    "success": false,
    "error": "DATABASE_EXISTS",
    "message": "数据库已存在"
}
```

---

### 2.2 ADD - 添加记录

**功能：** 向数据库中添加一条或多条记录

**端点：**
```
POST /api/db/add
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dbName` | string | ✅ | 数据库名称 |
| `data` | object\|array | ✅ | 要添加的数据（单条或数组） |
| `autoId` | boolean | ❌ | 是否自动添加 ID（默认 true） |

**请求示例：**

**添加单条记录：**
```javascript
GitDB.add({
    dbName: 'users',
    data: {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
    }
});
```

**添加多条记录：**
```javascript
GitDB.add({
    dbName: 'users',
    data: [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
    ]
});
```

**响应格式：**
```json
{
    "success": true,
    "message": "记录添加成功",
    "data": {
        "dbName": "users",
        "addedCount": 1,
        "ids": [3],
        "commitSha": "def456...",
        "updatedAt": "2026-06-13T10:05:00Z"
    }
}
```

---

### 2.3 UPDATE - 更新记录

**功能：** 更新数据库中的记录

**端点：**
```
PUT /api/db/update
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dbName` | string | ✅ | 数据库名称 |
| `query` | object | ✅ | 查询条件 |
| `data` | object | ✅ | 要更新的数据 |
| `multi` | boolean | ❌ | 是否更新多条（默认 false） |

**请求示例：**

**根据 ID 更新：**
```javascript
GitDB.update({
    dbName: 'users',
    query: { id: 1 },
    data: {
        name: 'John Smith',
        email: 'john.smith@example.com'
    }
});
```

**根据条件更新多条：**
```javascript
GitDB.update({
    dbName: 'users',
    query: { age: { $lt: 18 } },
    data: { status: 'minor' },
    multi: true
});
```

**响应格式：**
```json
{
    "success": true,
    "message": "记录更新成功",
    "data": {
        "dbName": "users",
        "updatedCount": 1,
        "commitSha": "ghi789...",
        "updatedAt": "2026-06-13T10:10:00Z"
    }
}
```

---

### 2.4 DELETE - 删除记录

**功能：** 从数据库中删除记录

**端点：**
```
DELETE /api/db/delete
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dbName` | string | ✅ | 数据库名称 |
| `query` | object | ✅ | 查询条件 |
| `multi` | boolean | ❌ | 是否删除多条（默认 false） |

**请求示例：**

**删除单条记录：**
```javascript
GitDB.delete({
    dbName: 'users',
    query: { id: 1 }
});
```

**删除多条记录：**
```javascript
GitDB.delete({
    dbName: 'users',
    query: { status: 'inactive' },
    multi: true
});
```

**响应格式：**
```json
{
    "success": true,
    "message": "记录删除成功",
    "data": {
        "dbName": "users",
        "deletedCount": 1,
        "commitSha": "jkl012...",
        "updatedAt": "2026-06-13T10:15:00Z"
    }
}
```

---

### 2.5 DROP - 删除数据库文件

**功能：** 删除整个数据库文件

**端点：**
```
DELETE /api/db/drop
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dbName` | string | ✅ | 数据库名称 |

**请求示例：**
```javascript
GitDB.drop({
    dbName: 'users'
});
```

**响应格式：**
```json
{
    "success": true,
    "message": "数据库已删除",
    "data": {
        "dbName": "users",
        "filePath": "data/users.json",
        "commitSha": "mno345...",
        "deletedAt": "2026-06-13T10:20:00Z"
    }
}
```

---

### 2.6 FIND - 查询记录（额外功能）

**功能：** 查询数据库中的记录

**端点：**
```
GET /api/db/find
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dbName` | string | ✅ | 数据库名称 |
| `query` | object | ❌ | 查询条件（可选） |
| `limit` | number | ❌ | 返回数量限制 |
| `skip` | number | ❌ | 跳过记录数 |

**请求示例：**

**查询所有记录：**
```javascript
GitDB.find({ dbName: 'users' });
```

**条件查询：**
```javascript
GitDB.find({
    dbName: 'users',
    query: { age: { $gte: 18 } },
    limit: 10,
    skip: 0
});
```

**响应格式：**
```json
{
    "success": true,
    "data": {
        "dbName": "users",
        "totalCount": 100,
        "records": [
            { "id": 1, "name": "John", "email": "john@example.com" },
            { "id": 2, "name": "Jane", "email": "jane@example.com" }
        ]
    }
}
```

---

## 三、查询操作符

### 3.1 比较操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `$eq` | 等于 | `{ age: { $eq: 18 } }` |
| `$ne` | 不等于 | `{ age: { $ne: 18 } }` |
| `$gt` | 大于 | `{ age: { $gt: 18 } }` |
| `$gte` | 大于等于 | `{ age: { $gte: 18 } }` |
| `$lt` | 小于 | `{ age: { $lt: 18 } }` |
| `$lte` | 小于等于 | `{ age: { $lte: 18 } }` |

### 3.2 逻辑操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `$and` | 与 | `{ $and: [{ age: { $gt: 18 } }, { status: 'active' }] }` |
| `$or` | 或 | `{ $or: [{ age: { $lt: 18 } }, { status: 'minor' }] }` |
| `$not` | 非 | `{ age: { $not: { $eq: 18 } } }` |

### 3.3 数组操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `$in` | 在数组中 | `{ status: { $in: ['active', 'pending'] } }` |
| `$nin` | 不在数组中 | `{ status: { $nin: ['deleted'] } }` |

---

## 四、错误码定义

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| `SUCCESS` | 200 | 操作成功 |
| `DATABASE_EXISTS` | 409 | 数据库已存在 |
| `DATABASE_NOT_FOUND` | 404 | 数据库不存在 |
| `RECORD_NOT_FOUND` | 404 | 记录不存在 |
| `INVALID_PARAM` | 400 | 参数错误 |
| `UNAUTHORIZED` | 401 | 认证失败 |
| `RATE_LIMIT` | 429 | 请求频率超限 |
| `GITHUB_API_ERROR` | 500 | GitHub API 错误 |

---

## 五、使用示例

### 5.1 完整流程示例

```javascript
// 1. 初始化
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    token: 'YOUR_GITHUB_TOKEN'
});

// 2. 创建数据库
await db.create({
    dbName: 'users',
    description: '用户信息数据库'
});

// 3. 添加记录
await db.add({
    dbName: 'users',
    data: [
        { name: 'Alice', email: 'alice@example.com', age: 25 },
        { name: 'Bob', email: 'bob@example.com', age: 30 }
    ]
});

// 4. 查询记录
const users = await db.find({
    dbName: 'users',
    query: { age: { $gte: 25 } }
});

// 5. 更新记录
await db.update({
    dbName: 'users',
    query: { name: 'Alice' },
    data: { age: 26 }
});

// 6. 删除记录
await db.delete({
    dbName: 'users',
    query: { name: 'Bob' }
});

// 7. 删除数据库
await db.drop({ dbName: 'users' });
```

### 5.2 批量操作示例

```javascript
// 批量添加
await db.add({
    dbName: 'products',
    data: [
        { id: 1, name: 'Product A', price: 99 },
        { id: 2, name: 'Product B', price: 199 },
        { id: 3, name: 'Product C', price: 299 }
    ]
});

// 批量更新
await db.update({
    dbName: 'products',
    query: { price: { $lt: 150 } },
    data: { discount: 0.9 },
    multi: true
});

// 批量删除
await db.delete({
    dbName: 'products',
    query: { stock: 0 },
    multi: true
});
```

---

## 六、实现建议

### 6.1 核心类结构

```javascript
class GitDB {
    constructor(config) {
        this.owner = config.owner;
        this.repo = config.repo;
        this.token = config.token;
        this.branch = config.branch || 'main';
    }
    
    async create({ dbName, description, schema }) {}
    async add({ dbName, data, autoId }) {}
    async update({ dbName, query, data, multi }) {}
    async delete({ dbName, query, multi }) {}
    async drop({ dbName }) {}
    async find({ dbName, query, limit, skip }) {}
}
```

### 6.2 文件结构建议

```
gitdb/
├── README.md              # 项目说明
├── API.md                 # API 文档（本文件）
├── index.html             # 演示页面
├── gitdb.js               # 核心库
├── utils/
│   ├── github-api.js      # GitHub API 封装
│   ├── query-parser.js    # 查询解析器
│   └── validator.js       # 数据验证器
└── examples/              # 使用示例
    ├── basic.js
    └── advanced.js
```

### 6.3 缓存策略

```javascript
// 本地缓存避免频繁请求 GitHub API
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

async function getCachedData(key, fetchFn) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    const data = await fetchFn();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
}
```

---

## 七、安全建议

### 7.1 Token 管理

```javascript
// ❌ 不要硬编码 Token
const token = 'ghp_xxxxxxxxxxxx';

// ✅ 从环境变量读取
const token = process.env.GITHUB_TOKEN;

// ✅ 使用前端配置
const token = window.GITDB_CONFIG.token;
```

### 7.2 权限控制

```javascript
// 最小权限原则
// 创建 Personal Access Token 时只勾选必要权限：
// - repo (完全控制私有仓库)
// - workflow (如果使用 GitHub Actions)
```

---

## 八、性能优化

### 8.1 批量操作

```javascript
// ✅ 推荐：批量添加
await db.add({
    dbName: 'users',
    data: [/* 100 条记录 */]
});

// ❌ 不推荐：逐条添加
for (let user of users) {
    await db.add({ dbName: 'users', data: user });
}
```

### 8.2 查询优化

```javascript
// ✅ 推荐：使用 limit 限制返回数量
await db.find({ dbName: 'users', limit: 10 });

// ✅ 推荐：使用具体查询条件
await db.find({ dbName: 'users', query: { id: 1 } });

// ❌ 不推荐：查询全部数据
await db.find({ dbName: 'users' });
```

---

**© 2026 DarrenHost | MIT License**
