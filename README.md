# GitDB

> 🗄️ 把 GitHub 当作 JSON 数据库使用

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/DarrenHost/gitdb)

---

## 📖 简介

GitDB 是一个轻量级的 JavaScript 库，让你能够**使用 GitHub 仓库作为 JSON 数据库**。无需后端服务器，纯前端实现数据的增删改查。

### ✨ 核心特性

- ✅ **零后端** - 纯前端实现，直接使用 GitHub API
- ✅ **浏览器原生** - 无需 Node.js，CDN 引入即可使用
- ✅ **Token 混淆** - 避免 GitHub 扫描检测明文 token
- ✅ **版本控制** - 所有数据变更都有 Git 提交记录
- ✅ **简单易用** - 类似 MongoDB 的 API 设计

### 🎯 适用场景

- 静态网站内容管理
- 个人项目数据存储
- 博客评论系统
- 小型应用数据库
- 原型开发数据持久化

---

## 🚀 快速开始

### 3 步上手

**1. 引入库**
```html
<script src="https://darrenhost.github.io/gitdb/gitdb.js"></script>
```

**2. 初始化**
```javascript
const db = new GitDB({
    owner: 'your-username',
    repo: 'your-repo',
    token: 'gitdb_xxx'  // 使用混淆后的 token
});
```

**3. 开始使用**
```javascript
// 创建数据库
await db.create({ name: 'users' });

// 添加记录
await db.add({
    name: 'users',
    data: { name: 'John', email: 'john@example.com' }
});

// 查询记录
const users = await db.find({ name: 'users' });
```

---

## 🔐 Token 安全配置

**⚠️ 重要：** GitHub 会扫描并禁用使用明文 token 的项目！

### 🎯 推荐方案：Token 混淆

**1. 打开混淆工具**
```
https://darrenhost.github.io/gitdb/token-mixer.html
```

**2. 生成混淆 Token**
- 输入 GitHub Token（格式：`ghp_xxx`）
- 点击"生成混淆 Token"
- 复制结果（格式：`gitdb_xxx`）

**3. 自动解混淆**
```javascript
// GitDB 会自动检测并解混淆 token
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    token: 'gitdb_xxxxxxxxxxxx'  // 混淆后的 token
});
```

### 其他配置方式

**方式 1：环境变量（Node.js）**
```bash
# .env 文件
GITDB_TOKEN=gitdb_xxx
```

**方式 2：localStorage（浏览器）**
```javascript
localStorage.setItem('gitdb_token', 'gitdb_xxx');
```

**方式 3：全局变量**
```javascript
window.GITDB_TOKEN = 'gitdb_xxx';
```

### ❌ 禁止行为

```javascript
// ❌ 不要硬编码明文 token！
const db = new GitDB({
    token: 'ghp_xxx'  // 会被 GitHub 禁用！
});
```

**📖 详细指南：** [TOKEN_SECURITY.md](TOKEN_SECURITY.md)

---

## 📚 API 参考

### 核心方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `create()` | 创建数据库 | `db.create({ name: 'users' })` |
| `show()` | 获取数据库列表 | `db.show()` |
| `add()` | 添加记录 | `db.add({ name: 'users', data: {...} })` |
| `find()` | 查询记录 | `db.find({ name: 'users', query: {...} })` |
| `update()` | 更新记录 | `db.update({ name: 'users', query: {...}, data: {...} })` |
| `delete()` | 删除记录 | `db.delete({ name: 'users', query: {...} })` |
| `drop()` | 删除数据库 | `db.drop({ name: 'users' })` |

### 查询操作符

**比较操作符:** `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`

**逻辑操作符:** `$and`, `$or`, `$not`

**数组操作符:** `$in`, `$nin`

**使用示例:**
```javascript
// 查询年龄大于 18 岁
db.find({ name: 'users', query: { age: { $gt: 18 } } });

// 查询状态为 active 或 pending
db.find({ name: 'users', query: { status: { $in: ['active', 'pending'] } } });
```

**📖 完整文档：** [API.md](API.md)

---

## 📁 数据结构

每个数据库文件都是 JSON 格式：

```json
{
  "_meta_": {
    "name": "users",
    "description": "用户数据库",
    "createdAt": "2026-06-13T10:00:00Z",
    "updatedAt": "2026-06-13T10:05:00Z"
  },
  "_data_": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ]
}
```

**保留字段说明:**
- `_meta_` - 元数据（数据库信息）
- `_data_` - 数据记录（用户数据）

---

## 🌐 浏览器原生支持

### CDN 使用方式

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>我的应用</title>
</head>
<body>
    <script src="https://darrenhost.github.io/gitdb/gitdb.js"></script>
    <script>
        const db = new GitDB({
            owner: 'your-username',
            repo: 'your-repo',
            token: 'gitdb_xxx'
        });
        
        // 开始使用...
    </script>
</body>
</html>
```

### Token 混淆工具

**在线使用:**
```
https://darrenhost.github.io/gitdb/token-mixer.html
```

**本地使用:**
```bash
# 下载项目后打开
open token-mixer.html
```

**📖 详细指南：** [BROWSER_USAGE.md](BROWSER_USAGE.md)

---

## 🎓 使用示例

### 示例 1: 博客评论系统

```javascript
// 初始化
const db = new GitDB({
    owner: 'your-username',
    repo: 'your-repo',
    token: 'gitdb_xxx'
});

// 创建评论数据库
await db.create({ name: 'comments' });

// 添加评论
await db.add({
    name: 'comments',
    data: {
        postId: 'post-1',
        author: 'John',
        content: 'Great article!',
        createdAt: new Date().toISOString()
    }
});

// 查询某篇文章的评论
const comments = await db.find({
    name: 'comments',
    query: { postId: 'post-1' }
});
```

### 示例 2: 用户管理系统

```javascript
// 批量添加用户
await db.add({
    name: 'users',
    data: [
        { name: 'Alice', email: 'alice@example.com', role: 'admin' },
        { name: 'Bob', email: 'bob@example.com', role: 'user' }
    ]
});

// 查询管理员
const admins = await db.find({
    name: 'users',
    query: { role: 'admin' }
});

// 更新用户角色
await db.update({
    name: 'users',
    query: { email: 'bob@example.com' },
    data: { role: 'admin' }
});

// 删除用户
await db.delete({
    name: 'users',
    query: { email: 'bob@example.com' }
});
```

### 示例 3: 产品库存管理

```javascript
// 添加产品
await db.add({
    name: 'products',
    data: {
        name: 'iPhone 15',
        price: 7999,
        stock: 100,
        category: 'electronics'
    }
});

// 查询库存不足的产品
const lowStock = await db.find({
    name: 'products',
    query: { stock: { $lt: 10 } }
});

// 更新库存
await db.update({
    name: 'products',
    query: { name: 'iPhone 15' },
    data: { stock: 99 }
});
```

---

## ⚠️ 限制说明

| 限制项 | 值 | 说明 |
|--------|-----|------|
| GitHub API 速率 | 5,000 次/小时 | 认证用户 |
| 单文件大小 | 100 MB | GitHub 限制 |
| 推荐记录数 | < 10,000 条 | 性能考虑 |
| 本地缓存 | 5 分钟 | 减少 API 请求 |

---

## 🛠️ 开发

### 本地运行

```bash
# 克隆项目
git clone https://github.com/DarrenHost/gitdb.git
cd gitdb

# 启动本地服务器
npx http-server .

# 或使用 Python
python -m http.server 8000
```

访问 `http://localhost:8080`

### 项目结构

```
gitdb/
├── gitdb.js              # 核心库
├── token-mixer.js        # Token 混淆工具
├── token-mixer.html      # 混淆工具页面
├── index.html            # 演示页面
├── README.md             # 项目说明
├── API.md                # API 文档
├── TOKEN_SECURITY.md     # 安全指南
└── BROWSER_USAGE.md      # 浏览器使用指南
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/DarrenHost/gitdb)
- [在线演示](https://darrenhost.github.io/gitdb/)
- [Token 混淆工具](https://darrenhost.github.io/gitdb/token-mixer.html)
- [API 文档](API.md)
- [安全指南](TOKEN_SECURITY.md)
- [浏览器使用指南](BROWSER_USAGE.md)

---

**Made with ❤️ by [DarrenHost](https://github.com/DarrenHost)**
