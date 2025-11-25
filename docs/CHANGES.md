# 项目修改总结 / Project Modification Summary

## 概述 / Overview

本次修改为 ZZZ 成就追踪应用添加了：
1. 服务器端数据存储和同步功能（SQLite）
2. 令牌访问控制认证
3. 优化的同步策略（仅在必要时同步）

This modification adds:
1. Server-side data storage and synchronization (SQLite)
2. Token-based access control
3. Optimized sync strategy (sync only when needed)

## 新增文件 / New Files

### 服务器端 / Server-side

1. **server/package.json**
   - 服务器依赖配置
   - 依赖: express, better-sqlite3, cors, dotenv

2. **server/index.js**
   - Express 服务器主文件
   - RESTful API 端点（带令牌验证）
   - CORS 配置

3. **server/database.js**
   - SQLite 数据库初始化
   - 数据表结构定义
   - 数据库连接管理

4. **server/.env**
   - 服务器环境变量配置
   - **AUTH_TOKEN**: 访问令牌配置 ⭐

5. **server/.env.example**
   - 环境变量配置模板
   - 用户复制创建自己的 .env

6. **server/.gitignore**
   - 服务器端 gitignore 配置
   - 排除 node_modules、数据库文件和 .env

7. **server/README.md**
   - 服务器文档
   - API 端点说明（包含令牌路径）
   - 部署指南

### 前端 / Frontend

1. **src/services/syncService.js**
   - 同步服务核心逻辑
   - API 调用封装（自动添加令牌到 URL）
   - 智能同步策略

2. **src/stores/sync.js**
   - Pinia 同步状态管理
   - 移除定时自动同步
   - 服务器状态监控

3. **src/stores/authToken.js**
   - 令牌状态管理 ⭐
   - 令牌存储和加载
   - localStorage 持久化

4. **src/components/AuthTokenDialog.vue**
   - 令牌输入对话框 ⭐
   - 首次使用时自动弹出
   - 令牌验证

5. **src/views/Setting/TokenSetting.vue**
   - 令牌管理界面 ⭐
   - 更改/清除令牌
   - 显示掩码后的令牌

6. **src/views/Setting/SyncSetting.vue**
   - 同步设置界面组件
   - 同步状态显示
   - 手动同步控制

7. **.env**
   - 前端环境变量配置
   - API URL 配置

8. **.env.example**
   - 环境变量示例文件
   - 配置说明

### 脚本文件 / Scripts

1. **setup.bat**
   - 一键安装依赖脚本
   - Windows 批处理文件

2. **start-server.bat**
   - 一键启动服务器脚本
   - Windows 批处理文件

3. **start-frontend.bat**
   - 一键启动前端脚本
   - Windows 批处理文件

### 文档 / Documentation

1. **SYNC_GUIDE.md**
   - 详细的数据同步使用指南
   - 故障排查说明
   - 高级配置指南

2. **CHANGES.md** (本文件)
   - 项目修改总结
   - 技术实现说明

## 修改文件 / Modified Files

1. **src/views/Setting/index.vue**
   - 添加 SyncSetting 组件引用
   - 集成同步设置到设置页面

2. **src/stores/userInfo.js**
   - 导入 syncService
   - 添加 triggerSync 函数
   - saveUserInfo 触发自动同步

3. **src/stores/achievement.js**
   - 导入 syncService
   - saveUserAchievement 改为 async 并触发同步

4. **src/stores/textjoin.js**
   - 导入 syncService
   - saveUserTextjoin 改为 async 并触发同步

5. **src/stores/achievementCustomNotAchieved.js**
   - 导入 syncService
   - saveUserCustomNotAchieved 改为 async 并触发同步

6. **README.md**
   - 添加数据同步功能说明
   - 添加快速开始指南
   - 添加服务器运行说明

## 技术实现 / Technical Implementation

### 后端架构 / Backend Architecture

- **框架**: Express.js
- **数据库**: SQLite with better-sqlite3
- **数据表**:
  - user_info: 用户信息
  - user_achievement: 成就数据
  - user_textjoin: 文本连接设置
  - user_custom_not_achieved: 自定义暂不可获得设置

### API 端点 / API Endpoints

#### 用户信息 / User Info
- GET /api/userinfo - 获取所有用户
- POST /api/userinfo - 添加用户
- PUT /api/userinfo/:tokenId - 更新用户
- DELETE /api/userinfo/:tokenId - 删除用户

#### 数据同步 / Data Sync
- GET /api/sync - 从服务器拉取所有数据
- POST /api/sync - 推送所有数据到服务器

#### 具体数据 / Specific Data
- GET/POST /api/achievement/:uid
- GET/POST /api/textjoin/:uid
- GET/POST /api/custom-not-achieved/:uid

### 前端架构 / Frontend Architecture

- **状态管理**: Pinia store
- **HTTP 客户端**: Fetch API
- **同步策略**: Last-write-wins (最后写入优先)
- **离线支持**: 自动降级到本地存储

### 同步机制 / Sync Mechanism

1. **自动同步**: 每30秒自动触发
2. **手动同步**: 用户触发
3. **实时同步**: 数据修改后自动触发
4. **智能合并**: 本地和服务器数据智能合并

### 数据流 / Data Flow

```
用户操作 → Store 修改 → localStorage 保存 → 触发同步 → 服务器存储
User Action → Store Update → localStorage Save → Trigger Sync → Server Storage

服务器数据 → API 拉取 → 数据合并 → Store 更新 → UI 刷新
Server Data → API Fetch → Data Merge → Store Update → UI Refresh
```

## 特性 / Features

### 已实现 / Implemented

✅ SQLite 数据库持久化
✅ RESTful API
✅ 自动同步（30秒间隔）
✅ 手动同步
✅ 服务器状态监控
✅ 离线模式支持
✅ 数据智能合并
✅ CORS 支持
✅ WAL 模式提升性能

### 未实现（可扩展）/ Not Implemented (Extensible)

❌ 用户认证
❌ 数据加密
❌ 冲突解决 UI
❌ 同步历史记录
❌ 数据版本控制
❌ 实时推送（WebSocket）
❌ 多服务器支持
❌ 数据压缩

## 安全注意事项 / Security Notes

⚠️ **重要提示 / Important**:

1. 无用户认证 - 仅适用于受信任环境
2. 无数据加密 - 数据明文存储
3. 无访问控制 - 任何人都可访问 API
4. 建议仅在本地或内网使用
5. 公网部署需自行添加安全措施

## 性能优化 / Performance Optimization

1. **数据库**: SQLite WAL 模式
2. **索引**: 在关键字段创建索引
3. **批量操作**: 使用事务批量处理
4. **缓存**: 本地 localStorage 缓存
5. **按需同步**: 仅在数据变化时同步

## 使用方法 / Usage

### 快速开始 / Quick Start

```bash
# 1. 安装依赖
npm install
cd server && npm install && cd ..

# 2. 启动服务器
cd server
npm start

# 3. 启动前端（新终端）
npm run dev
```

### Windows 快捷方式 / Windows Shortcuts

```bash
# 安装
setup.bat

# 启动服务器
start-server.bat

# 启动前端
start-frontend.bat
```

## 配置 / Configuration

### 环境变量 / Environment Variables

```env
# .env
VITE_API_URL=http://localhost:3000/api
```

### 服务器配置 / Server Configuration

```bash
# 服务器端口
PORT=3000
```

## 故障排查 / Troubleshooting

1. **服务器离线**: 检查服务器是否运行，防火墙设置
2. **同步失败**: 查看控制台错误，检查网络连接
3. **数据丢失**: 备份 server/data.db 文件
4. **端口冲突**: 修改 PORT 环境变量

## 后续改进建议 / Future Improvements

1. 添加用户认证系统
2. 实现更智能的冲突解决
3. 添加数据备份和恢复功能
4. 支持数据导入导出
5. 添加同步日志查看
6. 实现增量同步减少数据传输
7. 添加数据加密
8. 支持 WebSocket 实时同步

## 技术栈 / Tech Stack

### 后端 / Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- CORS

### 前端 / Frontend
- Vue 3
- Pinia
- Element Plus
- Vite

## 兼容性 / Compatibility

- **Node.js**: v20.11.1+
- **浏览器**: Chrome, Firefox, Edge (最新版本)
- **操作系统**: Windows 10+, macOS, Linux

## 许可证 / License

与主项目保持一致 / Same as the main project

## 贡献者 / Contributors

- 数据同步功能实现 / Data sync feature implementation

## 联系方式 / Contact

- QQ: 1765931937
- GitHub: https://github.com/Ticca-Liyin/zzz.liyin.space

---

**最后更新 / Last Updated**: 2025-11-25

