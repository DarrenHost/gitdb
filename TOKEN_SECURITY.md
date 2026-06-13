# 🔐 GitDB Token 安全使用指南

**重要：** GitHub 会扫描并禁用使用明文 token 的项目。请遵循以下安全实践！

---

## ⚠️ 禁止行为

### ❌ 不要硬编码 Token

```javascript
// ❌ 错误示例 - 会被 GitHub 禁用！
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    token: 'ghp_xxxxxxxxxxxx'  // 🔴 绝对不要这样做！
});
```

### ❌ 不要提交 .env 文件

```bash
# ❌ 错误 - 不要将 .env 添加到 Git
git add .env
git commit -m "Add token"  # 🔴 绝对不要这样做！
```

### ❌ 不要在代码中存储 Token

```javascript
// ❌ 错误 - 不要在代码文件中存储
const TOKEN = 'ghp_xxx';
const CONFIG = { token: 'ghp_xxx' };
```

---

## ✅ 推荐做法

### 方式 1：环境变量（Node.js）⭐⭐⭐

**1. 创建 .env 文件**
```bash
cd ~/gitdb
cp .env.example .env
# 编辑 .env 填入你的 token
```

**2. .env 文件内容**
```bash
GITDB_TOKEN=ghp_your_actual_token_here
GITDB_OWNER=DarrenHost
GITDB_REPO=gitdb
```

**3. 使用方式**
```javascript
// Node.js 自动读取环境变量
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb'
    // token 会自动从 process.env.GITDB_TOKEN 获取
});
```

**4. 确保 .env 在 .gitignore 中**
```bash
# .gitignore
.env
.env.local
```

---

### 方式 2：localStorage（浏览器）⭐⭐⭐

**1. 页面初始化时输入**
```javascript
// 用户输入 token 后安全存储
localStorage.setItem('gitdb_token', token);
```

**2. GitDB 自动读取**
```javascript
// GitDB 会自动从 localStorage 获取 token
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb'
    // token 会自动从 localStorage.getItem('gitdb_token') 获取
});
```

**3. 清除 token**
```javascript
localStorage.removeItem('gitdb_token');
```

---

### 方式 3：直接传入（一次性使用）⭐⭐

```javascript
// 从安全来源获取 token
const token = getSecureToken(); // 你自己的安全函数

const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    token: token  // 直接传入，不存储
});
```

---

### 方式 4：window 全局变量（浏览器）⭐⭐

**1. 在 HTML 中设置**
```html
<script>
    // 从安全的 API 获取 token
    window.GITDB_TOKEN = '从安全接口获取';
</script>
<script src="gitdb.js"></script>
```

**2. GitDB 自动读取**
```javascript
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb'
    // token 会自动从 window.GITDB_TOKEN 获取
});
```

---

## 🔒 最佳实践

### 1. 使用 Fine-grained Token

访问 https://github.com/settings/tokens

**权限设置：**
- ✅ 只勾选必要的权限
- ✅ 选择特定的仓库（而不是所有仓库）
- ✅ 设置过期时间

**推荐权限：**
- `Contents` - Read and write（访问仓库内容）

---

### 2. 定期更换 Token

- ⏰ 每 3-6 个月更换一次
- 🔄 发现泄露立即更换
- 📝 记录 token 创建日期

---

### 3. 使用 .gitignore

确保以下文件在 `.gitignore` 中：

```bash
# .gitignore
.env
.env.local
.env.*.local
*.log
```

---

### 4. 代码审查

**提交前检查：**
```bash
# 搜索可能的 token
git diff --cached | grep -E 'ghp_|gho_|ghu_|ghs_|ghr_'
```

**使用预提交钩子：**
```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached | grep -q 'ghp_'; then
    echo "❌ 检测到可能的 GitHub Token!"
    echo "请不要将 token 提交到代码仓库"
    exit 1
fi
```

---

## 🆘 如果 Token 泄露

### 1. 立即撤销 Token

1. 访问 https://github.com/settings/tokens
2. 找到泄露的 token
3. 点击 "Delete"

### 2. 检查使用情况

1. 访问 https://github.com/settings/security-log
2. 查看异常活动
3. 如有必要，启用双重认证

### 3. 生成新 Token

1. 创建新的 Fine-grained Token
2. 更新所有使用该 token 的地方
3. 确保安全存储

---

## 📋 安全检查清单

- [ ] Token 没有硬编码在代码中
- [ ] .env 文件在 .gitignore 中
- [ ] 使用 Fine-grained Token（最小权限）
- [ ] Token 设置了过期时间
- [ ] 定期更换 Token
- [ ] 代码审查时检查 token 泄露
- [ ] 启用 GitHub 双重认证

---

## 🔍 GitDB 的 Token 获取优先级

```
1. config.token（直接传入）
   ↓
2. process.env.GITDB_TOKEN（Node.js 环境变量）
   ↓
3. window.GITDB_TOKEN（浏览器全局变量）
   ↓
4. localStorage.getItem('gitdb_token')（浏览器本地存储）
```

---

## 📚 相关资源

- [GitHub Token 安全最佳实践](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Fine-grained Personal Access Tokens](https://github.blog/2022-10-18-introducing-fine-grained-personal-access-tokens-for-github/)
- [GitDB API 文档](API.md)

---

**🔐 保护你的 Token，就是保护你的 GitHub 账号！**
