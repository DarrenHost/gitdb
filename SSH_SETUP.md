# SSH Key 配置指南

## ✅ SSH Key 已生成

**私钥:** `~/.ssh/id_ed25519_gitdb`  
**公钥:** `~/.ssh/id_ed25519_gitdb.pub`

---

## 📝 复制公钥到 GitHub

### 1. 复制公钥内容

```bash
cat ~/.ssh/id_ed25519_gitdb.pub
```

**公钥内容:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2vZr1wWl1Ob4CmWFlN/K5nPoQOheSYK/ey3Yqb/RXA darren.host@foxmail.com
```

**一键复制命令:**
```bash
cat ~/.ssh/id_ed25519_gitdb.pub | xclip -selection clipboard
# 或
cat ~/.ssh/id_ed25519_gitdb.pub | xsel --clipboard
```

---

### 2. 添加到 GitHub

1. **访问:** https://github.com/settings/keys
2. **点击:** "New SSH key"
3. **填写:**
   - Title: `GitDB Key` 或任意名称
   - Key type: 选择 **Authentication Key**
   - Key: 粘贴刚才复制的公钥内容
4. **点击:** "Add SSH key"
5. **确认:** 如果需要，输入 GitHub 密码确认

---

### 3. 测试连接

```bash
ssh -T git@github.com
```

**成功输出:**
```
Hi DarrenHost! You've successfully authenticated, but GitHub does not provide shell access.
```

---

### 4. 推送代码

```bash
cd ~/gitdb
git push -u origin main
```

---

## 🔧 使用指定的 SSH Key

如果有多个 SSH Key，需要配置使用特定的 Key：

### 创建 SSH 配置文件

```bash
nano ~/.ssh/config
```

**添加内容:**
```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_gitdb
    IdentitiesOnly yes
```

**保存后再次推送:**
```bash
cd ~/gitdb
git push -u origin main
```

---

## 🆘 常见问题

### Q: 提示 Permission denied？
A: 确保 SSH Key 已添加到 GitHub，并测试连接 `ssh -T git@github.com`

### Q: 有多个 SSH Key 怎么办？
A: 创建 `~/.ssh/config` 文件指定使用哪个 Key

### Q: 公钥复制不了？
A: 使用 `cat ~/.ssh/id_ed25519_gitdb.pub | xclip -selection clipboard`

### Q: 推送还是失败？
A: 检查：
1. SSH Key 是否正确添加到 GitHub
2. 远程仓库 URL 是否为 SSH 格式
3. 运行 `ssh -T git@github.com` 测试连接

---

## 📋 检查清单

- [ ] SSH Key 已生成
- [ ] 公钥已复制到剪贴板
- [ ] 公钥已添加到 GitHub
- [ ] 测试连接成功
- [ ] 推送代码成功

---

**下一步：复制公钥并添加到 GitHub，然后再次推送！** 🚀
