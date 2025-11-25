# 系统架构图 / System Architecture

## 整体架构 / Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Vue 3 Application                      │     │
│  │                                                     │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │     │
│  │  │   Views      │  │   Stores     │  │ Services│  │     │
│  │  │              │  │   (Pinia)    │  │         │  │     │
│  │  │ - Setting    │  │              │  │  Sync   │  │     │
│  │  │ - Achievement│  │ - sync       │  │ Service │  │     │
│  │  │ - Character  │  │ - userInfo   │  │         │  │     │
│  │  │              │  │ - achievement│  │         │  │     │
│  │  │              │  │ - textjoin   │  │         │  │     │
│  │  │              │  │ - custom...  │  │         │  │     │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬────┘  │     │
│  │         │                 │                │       │     │
│  │         └─────────────────┴────────────────┘       │     │
│  │                          │                         │     │
│  └──────────────────────────┼─────────────────────────┘     │
│                             │                               │
│  ┌──────────────────────────┼─────────────────────────┐     │
│  │      localStorage        │                         │     │
│  │  ┌───────────────────────┴──────────────────────┐  │     │
│  │  │ - zzz-userInfo                              │  │     │
│  │  │ - zzz-userAchievement                       │  │     │
│  │  │ - zzz-userTextjoin                          │  │     │
│  │  │ - zzz-userCustomNotAchieved                 │  │     │
│  │  └─────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │ (Fetch)
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                    Express Server                            │
│                  (http://localhost:3000)                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Token Validation Middleware              │   │
│  │  - Validates /:token against AUTH_TOKEN (.env)       │   │
│  │  - Returns 403 if token doesn't match                │   │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────┴────────────────────────────────┐   │
│  │                  API Routes                           │   │
│  │                                                       │   │
│  │  /:token/api/userinfo      - 用户管理                │   │
│  │  /:token/api/achievement   - 成就数据                │   │
│  │  /:token/api/textjoin      - 文本设置                │   │
│  │  /:token/api/custom-not... - 自定义设置              │   │
│  │  /:token/api/sync          - 同步所有数据            │   │
│  │                                                       │   │
│  └──────────────────────┬────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────┴────────────────────────────────┐   │
│  │              Database Layer                           │   │
│  │              (better-sqlite3)                         │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │            SQLite Database (WAL)                │ │   │
│  │  │            (server/data.db)                     │ │   │
│  │  │                                                 │ │   │
│  │  │  Tables:                                        │ │   │
│  │  │  - user_info                                    │ │   │
│  │  │  - user_achievement                             │ │   │
│  │  │  - user_textjoin                                │ │   │
│  │  │  - user_custom_not_achieved                     │ │   │
│  │  │                                                 │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## 数据流 / Data Flow

### 写入流程 / Write Flow

```
用户操作
  │
  ├─> Vue Component
  │     │
  │     └─> Pinia Store (e.g., userInfo.js)
  │           │
  │           ├─> localStorage.setItem()
  │           │     │
  │           │     └─> 本地缓存更新
  │           │
  │           └─> triggerSync()
  │                 │
  │                 └─> syncService.pushToServer()
  │                       │
  │                       └─> POST /api/sync
  │                             │
  │                             └─> SQLite Database
  │                                   │
  │                                   └─> 数据持久化
```

### 读取流程 / Read Flow

```
应用启动
  │
  ├─> Store 初始化
  │     │
  │     └─> getUserInfo() / getUserAchievement() ...
  │           │
  │           ├─> localStorage.getItem()
  │           │     │
  │           │     └─> 加载本地数据
  │           │
  │           └─> (可选) syncService.pullFromServer()
  │                 │
  │                 └─> GET /api/sync
  │                       │
  │                       └─> SQLite Database
  │                             │
  │                             └─> 返回服务器数据
  │                                   │
  │                                   └─> 合并数据
  │                                         │
  │                                         └─> 更新 Store
```

### 自动同步流程 / Auto-sync Flow

```
定时器 (30秒)
  │
  └─> syncStore.syncData()
        │
        ├─> 1. 检查服务器状态
        │     │
        │     └─> syncService.checkServerStatus()
        │           │
        │           └─> GET /api/sync
        │
        ├─> 2. 收集本地数据
        │     │
        │     ├─> localStorage.getItem('zzz-userInfo')
        │     ├─> localStorage.getItem('zzz-userAchievement')
        │     ├─> localStorage.getItem('zzz-userTextjoin')
        │     └─> localStorage.getItem('zzz-userCustomNotAchieved')
        │
        ├─> 3. 获取服务器数据
        │     │
        │     └─> GET /api/sync
        │
        ├─> 4. 智能合并数据
        │     │
        │     └─> Last-write-wins 策略
        │
        └─> 5. 推送合并后数据
              │
              ├─> POST /api/sync
              │
              └─> 更新本地 localStorage 和 Store
```

## 同步设置组件 / Sync Settings Component

```
SyncSetting.vue
  │
  ├─> 服务器状态显示
  │   └─> serverAvailable (在线/离线)
  │
  ├─> 同步信息显示
  │   ├─> 同步状态 (同步中/正常/失败)
  │   ├─> 最后同步时间
  │   └─> 错误信息
  │
  ├─> 控制按钮
  │   ├─> 立即同步
  │   └─> 检查服务器
  │
  └─> 使用提示
      └─> 说明自动同步时机（页面加载、成就改变）

TokenSetting.vue
  │
  ├─> 当前令牌显示（掩码）
  │
  ├─> 控制按钮
  │   ├─> 更改令牌
  │   └─> 清除令牌
  │
  └─> 安全提示
```

## 数据库表结构 / Database Schema

```
user_info
├─ token_id (PRIMARY KEY)
├─ avatar
├─ uid (UNIQUE)
├─ name
├─ created_at
└─ updated_at

user_achievement
├─ uid (PRIMARY KEY, FOREIGN KEY)
├─ data (JSON TEXT)
└─ updated_at

user_textjoin
├─ uid (PRIMARY KEY, FOREIGN KEY)
├─ data (JSON TEXT)
└─ updated_at

user_custom_not_achieved
├─ uid (PRIMARY KEY, FOREIGN KEY)
├─ data (JSON TEXT)
└─ updated_at
```

## API 端点映射 / API Endpoint Mapping

```
用户管理 / User Management
├─ GET    /api/userinfo          → 获取所有用户
├─ POST   /api/userinfo          → 添加用户
├─ PUT    /api/userinfo/:tokenId → 更新用户
└─ DELETE /api/userinfo/:tokenId → 删除用户

成就数据 / Achievement Data
├─ GET  /api/achievement/:uid → 获取用户成就
└─ POST /api/achievement/:uid → 保存用户成就

文本设置 / Textjoin Settings
├─ GET  /api/textjoin/:uid → 获取用户设置
└─ POST /api/textjoin/:uid → 保存用户设置

自定义设置 / Custom Settings
├─ GET  /api/custom-not-achieved/:uid → 获取自定义设置
└─ POST /api/custom-not-achieved/:uid → 保存自定义设置

全量同步 / Full Sync
├─ GET  /api/sync → 从服务器拉取所有数据
└─ POST /api/sync → 推送所有数据到服务器
```

## 错误处理 / Error Handling

```
API 请求失败
  │
  ├─> 网络错误
  │   └─> 降级到本地存储模式
  │       └─> 继续使用 localStorage
  │
  ├─> 服务器错误 (500)
  │   └─> 显示错误消息
  │       └─> 保留本地数据
  │
  └─> 客户端错误 (400)
      └─> 显示错误消息
          └─> 不修改数据
```

## 部署架构 / Deployment Architecture

```
本地开发 / Local Development
├─ Frontend: http://localhost:5173
└─ Backend:  http://localhost:3000

生产环境 / Production
├─ Frontend: https://your-domain.com
├─ Backend:  https://your-domain.com/api
└─ Database: /path/to/data.db
```

