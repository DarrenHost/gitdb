# GitDB

> 🗄️ 把 GitHub 当作 JSON 数据库使用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/DarrenHost/gitdb)

---

## 📖 简介

GitDB 是一个轻量级的 JavaScript 库，让你能够**使用 GitHub 仓库作为 JSON 数据库**。无需后端服务器，利用 GitHub API 实现数据的增删改查。

### ✨ 特性

- ✅ **零后端** - 纯前端实现，直接使用 GitHub API
- ✅ **JSON 格式** - 数据以 JSON 文件形式存储，易于查看和编辑
- ✅ **版本控制** - 所有数据变更都有 Git 提交记录
- ✅ **离线优先** - 本地缓存减少 API 请求
- ✅ **简单易用** - 类似 MongoDB 的 API 设计

### 🎯 适用场景

- 个人项目数据存储
- 静态网站内容管理
- 配置文件管理
- 小型应用数据库
- 原型开发数据持久化

---

## 🚀 快速开始

### 1. 引入库

**浏览器:**
```html
<script src="gitdb.js"></script>
```

**Node.js:**
```javascript
const GitDB = require('./gitdb');
```

### 2. 初始化

```javascript
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    token: 'YOUR_GITHUB_TOKEN',
    branch: 'main',
    dataDir: 'data'
});
```

### 3. 基本使用

```javascript
// 创建数据库
await db.create({
    dbName: 'users',
    description: '用户信息数据库'
});

// 添加记录
await db.add({
    dbName: 'users',
    data: {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
    }
});

// 查询记录
const result = await db.find({
    dbName: 'users',
    query: { age: { $gte: 18 } }
});

// 更新记录
await db.update({
    dbName: 'users',
    query: { id: 1 },
    data: { age: 26 }
});

// 删除记录
await db.delete({
    dbName: 'users',
    query: { id: 1 }
});

// 删除数据库
await db.drop({ dbName: 'users' });
```

---

## 📚 API 文档

### 核心方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `create()` | 创建数据库 | `db.create({ dbName: 'users' })` |
| `add()` | 添加记录 | `db.add({ dbName: 'users', data: {...} })` |
| `find()` | 查询记录 | `db.find({ dbName: 'users', query: {...} })` |
| `update()` | 更新记录 | `db.update({ dbName: 'users', query: {...}, data: {...} })` |
| `delete()` | 删除记录 | `db.delete({ dbName: 'users', query: {...} })` |
| `drop()` | 删除数据库 | `db.drop({ dbName: 'users' })` |
| `listDatabases()` | 获取数据库列表 | `db.listDatabases()` |

### 查询操作符

**比较操作符:**
- `$eq` - 等于
- `$ne` - 不等于
- `$gt` - 大于
- `$gte` - 大于等于
- `$lt` - 小于
- `$lte` - 小于等于

**逻辑操作符:**
- `$and` - 与
- `$or` - 或
- `$not` - 非

**数组操作符:**
- `$in` - 在数组中
- `$nin` - 不在数组中

**使用示例:**
```javascript
// 查询年龄大于 18 岁的用户
db.find({
    dbName: 'users',
    query: { age: { $gt: 18 } }
});

// 查询状态为 active 或 pending 的用户
db.find({
    dbName: 'users',
    query: { status: { $in: ['active', 'pending'] } }
});

// 组合查询
db.find({
    dbName: 'users',
    query: {
        $and: [
            { age: { $gte: 18 } },
            { status: 'active' }
        ]
    }
});
```

---

## 📁 数据结构

每个数据库文件都是一个 JSON 文件，结构如下：

```json
{
  "_meta": {
    "name": "users",
    "description": "用户信息数据库",
    "schema": null,
    "createdAt": "2026-06-13T10:00:00Z",
    "updatedAt": "2026-06-13T10:05:00Z"
  },
  "_data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "age": 25
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "age": 30
    }
  ]
}
```

---

## 🔧 配置选项

### GitDB 构造函数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `owner` | string | ✅ | - | GitHub 用户名 |
| `repo` | string | ✅ | - | 仓库名称 |
| `token` | string | ✅ | - | GitHub Personal Access Token |
| `branch` | string | ❌ | `'main'` | 分支名称 |
| `dataDir` | string | ❌ | `'data'` | 数据目录 |

### 方法参数

#### create()
```javascript
db.create({
    dbName: 'users',          // 必填：数据库名称
    description: '用户数据库',  // 可选：描述
    schema: {}                // 可选：数据结构定义
});
```

#### add()
```javascript
db.add({
    dbName: 'users',          // 必填：数据库名称
    data: {},                 // 必填：数据（对象或数组）
    autoId: true              // 可选：是否自动添加 ID
});
```

#### find()
```javascript
db.find({
    dbName: 'users',          // 必填：数据库名称
    query: {},                // 可选：查询条件
    limit: 10,                // 可选：返回数量限制
    skip: 0                   // 可选：跳过记录数
});
```

#### update()
```javascript
db.update({
    dbName: 'users',          // 必填：数据库名称
    query: {},                // 必填：查询条件
    data: {},                 // 必填：要更新的数据
    multi: false              // 可选：是否更新多条
});
```

#### delete()
```javascript
db.delete({
    dbName: 'users',          // 必填：数据库名称
    query: {},                // 必填：查询条件
    multi: false              // 可选：是否删除多条
});
```

---

## 🔐 Token 安全配置

**⚠️ 重要：** GitHub 会扫描并禁用使用明文 token 的项目。请使用以下安全方式！

### 方式 1：环境变量（推荐）⭐⭐⭐

**1. 创建 .env 文件**
```bash
cp .env.example .env
# 编辑 .env 填入你的 token
```

**2. 使用方式**
```javascript
// Node.js 自动读取 process.env.GITDB_TOKEN
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb'
    // token 会自动从环境变量获取
});
```

### 方式 2：localStorage（浏览器）⭐⭐⭐

```javascript
// 页面中输入 token 后自动存储
localStorage.setItem('gitdb_token', token);

// GitDB 自动读取
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb'
});
```

### 方式 3：直接传入（一次性）⭐⭐

```javascript
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    token: '从安全来源获取'  // 不存储，一次性使用
});
```

### ❌ 禁止行为

```javascript
// ❌ 不要硬编码 token！
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    token: 'ghp_xxx'  // 🔴 会被 GitHub 禁用！
});
```

**📖 详细安全指南：** 查看 [TOKEN_SECURITY.md](TOKEN_SECURITY.md)


---

## 📊 限制说明

| 限制项 | 值 | 说明 |
|--------|-----|------|
| GitHub API 速率限制 | 5000 次/小时 | 认证用户 |
| 单文件大小限制 | 100 MB | GitHub 限制 |
| 推荐单文件记录数 | < 10,000 条 | 性能考虑 |
| 缓存时间 | 5 分钟 | 本地缓存 TTL |

---

## 🎓 使用示例

### 示例 1: 博客文章管理

```javascript
// 创建文章数据库
await db.create({ dbName: 'posts' });

// 添加文章
await db.add({
    dbName: 'posts',
    data: {
        title: '我的第一篇文章',
        content: 'Hello World!',
        tags: ['gitdb', 'blog'],
        published: true
    }
});

// 查询已发布的文章
const posts = await db.find({
    dbName: 'posts',
    query: { published: true }
});
```

### 示例 2: 用户管理系统

```javascript
// 批量添加用户
await db.add({
    dbName: 'users',
    data: [
        { name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { name: 'Bob', email: 'bob@example.com', role: 'user' },
        { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
    ]
});

// 查询管理员
const admins = await db.find({
    dbName: 'users',
    query: { role: 'admin' }
});

// 更新用户角色
await db.update({
    dbName: 'users',
    query: { email: 'bob@example.com' },
    data: { role: 'admin' }
});

// 删除用户
await db.delete({
    dbName: 'users',
    query: { email: 'charlie@example.com' }
});
```

### 示例 3: 产品库存管理

```javascript
// 添加产品
await db.add({
    dbName: 'products',
    data: {
        name: 'iPhone 15',
        price: 7999,
        stock: 100,
        category: 'electronics'
    }
});

// 查询库存不足的产品
const lowStock = await db.find({
    dbName: 'products',
    query: { stock: { $lt: 10 } }
});

// 更新库存
await db.update({
    dbName: 'products',
    query: { name: 'iPhone 15' },
    data: { stock: 99 }
});
```

---

## 🛠️ 开发

### 项目结构

```
gitdb/
├── README.md              # 项目说明
├── API.md                 # API 文档
├── gitdb.js               # 核心库
├── index.html             # 演示页面
└── examples/              # 使用示例
    ├── basic.js           # 基础示例
    └── advanced.js        # 高级示例
```

### 运行演示

```bash
# 使用任意 HTTP 服务器
npx http-server .

# 或使用 Python
python -m http.server 8000
```

然后访问 `http://localhost:8000`

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 更新日志

### v1.0.0 (2026-06-13)
- ✨ 初始版本发布
- ✅ 实现 CRUD 基本功能
- ✅ 支持查询操作符
- ✅ 本地缓存优化
- ✅ 完整的 API 文档

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🔗 相关链接

- [GitHub API 文档](https://docs.github.com/en/rest)
- [在线演示](https://darrenhost.github.io/gitdb/)
- [API 完整文档](API.md)

---

**Made with ❤️ by [DarrenHost](https://github.com/DarrenHost)**
