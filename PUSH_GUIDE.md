# GitDB 推送指南

## ✅ 本地提交已完成

代码已成功提交到本地 Git 仓库！

```
commit 8c4a060
Author: DarrenHost <darren.host@foxmail.com>
Date:   Sat Jun 14 05:30:00 2026

    ✨ GitDB V1.0.0 - 初始版本
```

---

## 📤 推送到 GitHub（3 种方式）

### 方式 1：使用 Personal Access Token（推荐）

1. **获取 Token**
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token"
   - 勾选 `repo` 权限
   - 生成并复制 Token

2. **推送代码**
   ```bash
   cd ~/gitdb
   git push -u origin main
   ```
   
3. **输入凭据**
   - Username: `DarrenHost`
   - Password: 粘贴刚才复制的 Token（不会显示）

---

### 方式 2：配置 SSH Key

1. **生成 SSH Key**
   ```bash
   ssh-keygen -t ed25519 -C "darren.host@foxmail.com"
   # 一路回车即可
   ```

2. **添加 SSH Key 到 GitHub**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # 复制输出的内容
   ```
   
   - 访问 https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴内容并保存

3. **切换为 SSH 推送**
   ```bash
   cd ~/gitdb
   git remote set-url origin git@github.com:DarrenHost/gitdb.git
   git push -u origin main
   ```

---

### 方式 3：使用 Git Credential Helper

1. **启用凭据缓存**
   ```bash
   git config --global credential.helper store
   ```

2. **推送代码**
   ```bash
   cd ~/gitdb
   git push -u origin main
   ```

3. **输入一次凭据后会保存**

---

## 🎯 快速推送命令

```bash
cd ~/gitdb

# 方式 1: HTTPS + Token
git push -u origin main
# 输入用户名 DarrenHost 和 Token

# 方式 2: SSH
git remote set-url origin git@github.com:DarrenHost/gitdb.git
git push -u origin main

# 方式 3: 使用脚本
./push.sh
```

---

## ✅ 推送成功后

### 访问项目页面
- **GitHub 仓库:** https://github.com/DarrenHost/gitdb
- **在线演示:** https://darrenhost.github.io/gitdb/

### 启用 GitHub Pages
1. 访问 https://github.com/DarrenHost/gitdb/settings/pages
2. Source 选择 `Deploy from a branch`
3. Branch 选择 `main` 和 `/ (root)`
4. 点击 Save
5. 等待几分钟后访问 https://darrenhost.github.io/gitdb/

---

## 📝 提交记录

```bash
cd ~/gitdb
git log --oneline
```

**当前提交:**
- `8c4a060` ✨ GitDB V1.0.0 - 初始版本
- `7d2ba41` ✨ 初始版本：完整的 GitDB 核心库和演示页面

---

## 🆘 常见问题

### Q: 推送时提示认证失败？
A: 使用 Personal Access Token 代替密码，或配置 SSH Key。

### Q: Token 在哪里获取？
A: https://github.com/settings/tokens

### Q: SSH Key 怎么添加？
A: 复制 `~/.ssh/id_ed25519.pub` 内容到 GitHub Settings → SSH and GPG keys

### Q: 推送成功但 GitHub 上看不到？
A: 刷新页面，或检查是否推送到正确的分支（main）。

---

**祝推送顺利！🚀**
