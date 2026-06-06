# zzz.liyin.space

## 简介

zzz.liyin.space Zenless zone zero Achievement Web
zzz.liyin.space 绝区零成就网址

[zzz.liyin.space 网页](https://zzz.liyin.space/)

## 运行

### 运行环境

```
node v20.11.1
Windows 10+
```

### 运行

```
npm install
npm run dev
```

## 较源项目的改动

### 较源项目的改动

### 云端同步服务

##### 本地开发

前端开发服务：

```
npm run frontend:dev
```

后端 API 开发服务：

```
npm run server:dev
```

##### 生产运行

先构建前端：

```
npm run build
```

再设置 token 密钥并启动一体化服务：

```
npm run start
```

服务启动时会自动读取项目根目录 `.env`。可参考 `.env.example` 创建 `.env`：

```
AUTH_TOKEN_SECRET=replace-with-a-long-random-secret
```

`AUTH_TOKEN_SECRET` 必须替换为足够长的随机字符串；服务会拒绝使用示例占位值启动。

生产环境会由 Node 服务同时提供 `/api` 和 `dist` 静态文件。

##### 配置登录用户

本项目不开放注册。管理员需要手动创建 `server/data/users.json`，可参考 `server/data/users.example.json`。

生成密码 hash：

```
npm run hash-password -- your-password
```

把输出的 `scrypt:<salt>:<hash>` 写入用户的 `passwordHash` 字段。真实的 `server/data/users.json` 和 `server/data/progress.json` 会被 git 忽略。
