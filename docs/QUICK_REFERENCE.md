# 快速参考卡 / Quick Reference Card

## 🚀 快速开始 / Quick Start

### Windows 用户

```bash
# 终端 1 - 服务器
cd server
npm install
npm start

# 终端 2 - 前端
npm install
npm run dev
```

## 📡 默认地址 / Default URLs

- 前端: http://localhost:5173
- 后端: http://localhost:3000
- API:  http://localhost:3000/{token}/api

## 🔐 访问令牌设置 / Token Setup

### 首次使用
1. 启动前端后，会自动弹出"输入访问令牌"对话框
2. 输入任意令牌（例如：`mytoken123`）
3. 令牌会保存在浏览器本地存储中
4. 所有API请求会自动包含此令牌

### 管理令牌
- 在"设置 > 访问令牌管理"可以更改或清除令牌
- 更改令牌后页面会自动刷新
- 令牌格式：`http://localhost:3000/{你的令牌}/api`

**注意**: 令牌用于基本访问控制，不同令牌访问不同数据集。

## ⚙️ 配置文件 / Configuration

### .env (项目根目录)
```env
VITE_API_URL=http://localhost:3000
```
注意：令牌会自动添加到URL中，无需在配置文件中指定

## 🔄 同步功能 / Sync Features

### 自动同步时机
- ✅ 页面加载时自动同步
- ✅ 成就状态改变时自动同步（勾选/取消勾选）
- ✅ 手动同步: 在"设置"页面点击"立即同步"按钮

**注意**: 不再使用定时自动同步，仅在必要时同步数据。

## 📊 同步的数据 / Synced Data

- ✅ 用户信息 (头像、UID、昵称)
- ✅ 成就进度
- ✅ 角色设置 (性别等)
- ✅ 自定义设置

## 🛠️ 常用命令 / Common Commands

### 服务器
```bash
cd server
npm start          # 启动服务器
npm run dev        # 开发模式(自动重载)
```

### 前端
```bash
npm run dev        # 开发模式
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
```

## 📁 重要文件 / Important Files

```
项目根目录/
├── .env                    # 环境变量配置
├── setup.bat              # 安装脚本
├── start-server.bat       # 服务器启动脚本
├── start-frontend.bat     # 前端启动脚本
├── server/
│   ├── index.js          # 服务器主文件 (包含令牌验证)
│   ├── database.js       # 数据库配置
│   └── data.db           # SQLite 数据库 (自动生成)
└── src/
    ├── components/
    │   └── AuthTokenDialog.vue   # 令牌输入对话框
    ├── services/
    │   └── syncService.js    # 同步服务 (自动添加令牌)
    ├── stores/
    │   ├── authToken.js      # 令牌状态管理
    │   └── sync.js           # 同步状态管理
    └── views/Setting/
        ├── TokenSetting.vue  # 令牌管理界面
        └── SyncSetting.vue   # 同步设置界面
```

## 🔍 故障排查 / Troubleshooting

### 问题: 服务器显示离线
```bash
1. 检查服务器是否在运行
2. 访问 http://localhost:3000/{你的令牌}/api/sync
3. 检查 .env 中的 VITE_API_URL
4. 检查防火墙设置
```

### 问题: 同步失败
```bash
1. 检查是否已设置访问令牌
2. 打开浏览器控制台 (F12)
3. 查看 Console 标签的错误信息
4. 检查 Network 标签的请求状态
5. 查看服务器终端的日志
6. 尝试在设置中更改令牌
```

### 问题: 令牌相关
```bash
# 忘记令牌
- 在设置中清除令牌，页面会重新提示输入
- 检查服务器 .env 文件中的 AUTH_TOKEN

# 令牌无效 (403 Forbidden)
- 前端令牌与服务器配置的令牌不匹配
- 检查服务器 .env 文件: server/.env
- 确保前端输入的令牌与 AUTH_TOKEN 完全一致

# 服务器未配置令牌
- 如果服务器未设置 AUTH_TOKEN，默认为 'default'
- 建议在 server/.env 中设置自己的令牌
```

### 问题: 端口被占用
```bash
# 修改服务器端口
# 在 server 目录创建 .env 文件
PORT=3001

# 同时修改项目根目录的 .env
VITE_API_URL=http://localhost:3001
```

## 💾 数据备份 / Data Backup

### 备份服务器数据
```bash
# 复制数据库文件
cp server/data.db server/data.backup.db
```

### 恢复数据
```bash
# 替换数据库文件
cp server/data.backup.db server/data.db
```

### 导出本地数据
- 使用应用内的"导出"功能
- 生成 JSON 文件

## 🌐 网络配置 / Network Configuration

### 局域网访问
1. 查看服务器 IP 地址:
   ```bash
   ipconfig  # Windows
   ifconfig  # Linux/Mac
   ```

2. 修改 .env:
   ```env
   VITE_API_URL=http://192.168.1.100:3000
   ```
   注意：令牌会自动添加，无需在URL中包含

3. 确保防火墙允许 3000 端口

4. 在其他设备访问时，首次会提示输入令牌

## 📖 更多文档 / More Documentation

- 📗 [CHANGES.md](../CHANGES.md) - 修改总结
- 📙 [ARCHITECTURE.md](../ARCHITECTURE.md) - 架构说明
- 📕 [server/README.md](../server/README.md) - 服务器文档

## 🔐 安全提示 / Security Notice

⚠️ **重要**:
- 使用令牌访问控制，服务器验证每个请求
- 令牌存储在 `server/.env` 文件中
- 前端令牌必须与服务器配置完全一致
- 仅适用于本地或受信任网络
- 不要在公共仓库提交 `server/.env` 文件
- 公网部署需添加 HTTPS 等安全措施

## 📝 版本信息 / Version Info

- 前端版本: 0.3.0
- 数据同步功能添加日期: 2025-11-25
- 令牌认证功能添加日期: 2025-11-25

---

**提示**: 将此文件打印或保存为快速参考！
**Tip**: Print or save this file for quick reference!

