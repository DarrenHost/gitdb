# GitDB 故障排查指南

## ⚠️ GitHub Pages CORS 问题

### 问题现象

```
❌ 401 Unauthorized
❌ Bad credentials
❌ OPTIONS preflight failed
```

### 原因

GitHub Pages 访问 GitHub API 时，浏览器会发送 **CORS 预检请求（OPTIONS）**，但 GitHub API 的 OPTIONS 请求**不携带 Authorization 头**，导致认证失败。

---

## ✅ 解决方案

### 方案 1：本地运行（推荐）⭐⭐⭐

**这是最可靠的方式！**

**步骤：**

1. **下载项目**
   ```bash
   git clone https://github.com/DarrenHost/gitdb.git
   cd gitdb
   ```

2. **启动本地服务器**
   ```bash
   # 使用 Node.js
   npx http-server .
   
   # 或使用 Python
   python -m http.server 8000
   
   # 或使用 PHP
   php -S localhost:8000
   ```

3. **访问页面**
   ```
   http://localhost:8080/demo.html
   ```

**优点：**
- ✅ 无 CORS 限制
- ✅ 完全控制
- ✅ 调试方便

---

### 方案 2：使用 GitHub CLI（高级）

**通过 gh auth 绕过 CORS：**

```bash
# 安装 GitHub CLI
brew install gh  # macOS
# 或
sudo apt install gh  # Linux

# 认证
gh auth login

# 使用 gh api 调用
gh api /repos/DarrenHost/gitdb/contents/data
```

---

### 方案 3：配置反向代理（需要服务器）

**使用 Nginx 反向代理：**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /github-api/ {
        proxy_pass https://api.github.com/;
        proxy_set_header Authorization "token YOUR_TOKEN";
        proxy_set_header Accept "application/vnd.github.v3+json";
        
        # 添加 CORS 头
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type';
    }
}
```

**使用：**
```javascript
const db = new GitDB({
    owner: 'DarrenHost',
    repo: 'gitdb',
    // 使用代理
    apiBaseUrl: 'https://your-domain.com/github-api/'
});
```

---

## 🔍 调试步骤

### 1. 检查 Token 格式

**打开浏览器控制台（F12）：**

```javascript
// 检查 Token 是否正确加载
console.log(localStorage.getItem('gitdb_token'));

// 应该显示：gitdb_xxx 或 github_pat_xxx
```

### 2. 检查 Token 权限

**访问：** https://github.com/settings/tokens

**确认：**
- ✅ Token 未过期
- ✅ 有 `Contents: Read and write` 权限
- ✅ 选择了正确的仓库

### 3. 检查网络请求

**浏览器控制台 → Network 标签：**

```
❌ 错误请求：
Request URL: https://api.github.com/repos/.../contents/data
Request Method: OPTIONS  ← 预检请求
Status Code: 401 Unauthorized

✅ 正确请求：
Request URL: https://api.github.com/repos/.../contents/data
Request Method: GET  ← 实际请求
Status Code: 200 OK
```

### 4. 查看详细错误

**浏览器控制台：**

```javascript
// 手动测试连接
const db = new GitDB({
    owner: 'your-username',
    repo: 'your-repo',
    token: 'your-token'
});

// 测试读取
db.show().then(dbs => {
    console.log('✅ 成功:', dbs);
}).catch(err => {
    console.error('❌ 失败:', err);
    console.log('错误详情:', err.message);
});
```

---

## 🎯 常见错误及解决方法

### 错误 1: 401 Unauthorized

**原因：** Token 无效或格式错误

**解决：**
```
1. 重新生成 Token
2. 确保使用混淆后的 Token（gitdb_xxx）
3. 检查 Token 是否过期
```

### 错误 2: 404 Not Found

**原因：** 仓库不存在或无权限

**解决：**
```
1. 检查用户名是否正确
2. 检查仓库名称是否正确
3. 确认 Token 有该仓库的访问权限
```

### 错误 3: 403 Forbidden

**原因：** Token 权限不足

**解决：**
```
1. 访问 https://github.com/settings/tokens
2. 编辑 Token
3. 勾选 Contents: Read and write
4. 保存后重新生成
```

### 错误 4: CORS Error

**原因：** 跨域限制

**解决：**
```
1. 使用本地运行方案（方案 1）
2. 或使用反向代理（方案 3）
```

---

## 📋 检查清单

使用前请确认：

- [ ] Token 已生成且未过期
- [ ] Token 有 Contents 权限
- [ ] 选择了正确的仓库
- [ ] 使用混淆后的 Token（推荐）
- [ ] 本地运行（避免 CORS 问题）
- [ ] 浏览器缓存已清除
- [ ] 控制台无 JavaScript 错误

---

## 🆘 仍然无法解决？

### 提供以下信息寻求帮助：

1. **浏览器控制台错误**（完整截图）
2. **Network 标签请求详情**
3. **Token 类型**（Classic 或 Fine-grained）
4. **运行方式**（GitHub Pages 或本地）
5. **浏览器版本**

### 联系方式：

- **GitHub Issues:** https://github.com/DarrenHost/gitdb/issues
- **Email:** darren.host@foxmail.com

---

## 📚 相关资源

- [GitHub API 文档](https://docs.github.com/en/rest)
- [CORS 详解](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Fine-grained Tokens](https://github.blog/2022-10-18-introducing-fine-grained-personal-access-tokens-for-github/)

---

**祝使用顺利！** 🎉
