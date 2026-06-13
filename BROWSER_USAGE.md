# GitDB 浏览器原生使用指南

**无需 Node.js 环境，纯静态网站即可使用！**

---

## 🚀 快速开始

### 方式 1：直接使用 GitHub Pages

1. **访问演示页面**
   ```
   https://darrenhost.github.io/gitdb/
   ```

2. **输入配置**
   - GitHub 用户名：`DarrenHost`
   - 仓库名称：`gitdb`
   - Token: 使用混淆工具生成

3. **开始使用**
   - 创建数据库
   - 添加/查询/更新/删除记录

---

## 🔐 Token 混淆使用

### 步骤 1：生成混淆 Token

1. **打开混淆工具**
   ```
   https://darrenhost.github.io/gitdb/token-mixer.html
   ```

2. **输入 GitHub Token**
   - 访问 https://github.com/settings/tokens
   - 生成新的 Personal Access Token
   - 复制 Token（格式：`ghp_xxx`）

3. **生成混淆 Token**
   - 在混淆工具页面输入 Token
   - 点击"生成混淆 Token"
   - 复制结果（格式：`gitdb_xxx`）

### 步骤 2：配置到项目

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
        // 方式 1: 直接使用混淆后的 token
        const db = new GitDB({
            owner: 'DarrenHost',
            repo: 'gitdb',
            token: 'gitdb_xxxxxxxxxxxx'  // 混淆后的 token
        });
        
        // 方式 2: 配置到全局变量
        window.GITDB_TOKEN = 'gitdb_xxxxxxxxxxxx';
        const db = new GitDB({
            owner: 'DarrenHost',
            repo: 'gitdb'
        });
        
        // 方式 3: 存储到 localStorage
        localStorage.setItem('gitdb_token', 'gitdb_xxxxxxxxxxxx');
        const db = new GitDB({
            owner: 'DarrenHost',
            repo: 'gitdb'
        });
    </script>
</body>
</html>
```

---

## 📝 完整示例

### 示例 1：博客评论系统

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>博客评论</title>
    <script src="gitdb.js"></script>
</head>
<body>
    <div id="comments"></div>
    <form id="commentForm">
        <input type="text" id="author" placeholder="姓名" required>
        <textarea id="content" placeholder="评论" required></textarea>
        <button type="submit">提交</button>
    </form>
    
    <script>
        // 初始化数据库
        const db = new GitDB({
            owner: 'your-username',
            repo: 'your-repo',
            token: 'gitdb_xxx'  // 混淆后的 token
        });
        
        // 加载评论
        async function loadComments() {
            const result = await db.find({
                name: 'comments',
                query: { postId: 'post-1' }
            });
            
            const commentsDiv = document.getElementById('comments');
            commentsDiv.innerHTML = result.data.records
                .map(c => `<div><strong>${c.author}</strong>: ${c.content}</div>`)
                .join('');
        }
        
        // 提交评论
        document.getElementById('commentForm').onsubmit = async (e) => {
            e.preventDefault();
            
            await db.add({
                name: 'comments',
                data: {
                    postId: 'post-1',
                    author: document.getElementById('author').value,
                    content: document.getElementById('content').value,
                    createdAt: new Date().toISOString()
                }
            });
            
            loadComments();
        };
        
        loadComments();
    </script>
</body>
</html>
```

### 示例 2：用户管理系统

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>用户管理</title>
    <script src="gitdb.js"></script>
</head>
<body>
    <button onclick="createUserDB()">创建用户数据库</button>
    <button onclick="addUser()">添加用户</button>
    <button onclick="listUsers()">列出用户</button>
    
    <script>
        const db = new GitDB({
            owner: 'your-username',
            repo: 'your-repo',
            token: 'gitdb_xxx'
        });
        
        async function createUserDB() {
            const result = await db.create({
                name: 'users',
                description: '用户数据库'
            });
            alert('数据库创建成功！');
        }
        
        async function addUser() {
            await db.add({
                name: 'users',
                data: {
                    username: 'john',
                    email: 'john@example.com',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            });
            alert('用户添加成功！');
        }
        
        async function listUsers() {
            const result = await db.find({ name: 'users' });
            console.log('用户列表:', result.data.records);
            alert('用户列表已输出到控制台');
        }
    </script>
</body>
</html>
```

---

## 🎯 最佳实践

### 1. 使用混淆 Token

```javascript
// ✅ 推荐：使用混淆后的 token
const db = new GitDB({
    token: 'gitdb_xxx'
});

// ❌ 不推荐：使用明文 token
const db = new GitDB({
    token: 'ghp_xxx'
});
```

### 2. 存储到 localStorage

```javascript
// 首次配置
localStorage.setItem('gitdb_token', 'gitdb_xxx');

// 后续使用自动读取
const db = new GitDB({
    owner: 'your-username',
    repo: 'your-repo'
});
```

### 3. 错误处理

```javascript
try {
    const result = await db.find({ name: 'users' });
    console.log('查询成功:', result.data);
} catch (error) {
    console.error('查询失败:', error.message);
    
    if (error.message.includes('DATABASE_NOT_FOUND')) {
        // 数据库不存在，创建它
        await db.create({ name: 'users' });
    }
}
```

---

## 🔒 安全提示

1. **不要将 token 提交到 Git**
   ```bash
   # .gitignore
   .env
   *.local
   ```

2. **使用 Fine-grained Token**
   - 只授予必要的权限
   - 设置过期时间
   - 定期更换

3. **混淆不是加密**
   - 混淆只是防止 GitHub 扫描
   - 仍然要妥善保管 token
   - 不要公开分享混淆后的 token

---

## 📖 相关资源

- [API 文档](API.md)
- [Token 安全指南](TOKEN_SECURITY.md)
- [混淆工具](token-mixer.html)
- [GitHub 仓库](https://github.com/DarrenHost/gitdb)

---

**祝使用愉快！** 🎉
