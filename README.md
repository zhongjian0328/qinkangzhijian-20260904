# 禽康智检APP

AI辅助禽类疾病诊断移动应用

## 技术栈

- **前端**: Expo (React Native)
- **后端**: NestJS + PostgreSQL + Prisma
- **AI服务**: FastAPI + 豆包多模态模型
- **Monorepo**: pnpm + Turborepo

## 项目结构

```
qinkangzhijian-APP/
├── apps/
│   ├── mobile/        # Expo React Native 移动端
│   ├── api/           # NestJS 后端 API
│   ├── ai/            # Python AI 诊断服务
│   └── web/           # Web管理后台（待创建）
├── packages/
│   ├── types/         # 共享 TypeScript 类型
│   └── shared/        # 共享工具函数
├── prisma/            # 数据库迁移（共享）
└── docs/              # 文档
```

## 快速开始

### 前置要求

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 14+
- Python 3.11+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
# API 服务
cp apps/api/.env.example apps/api/.env

# AI 服务
cp apps/ai/.env.example apps/ai/.env

# 移动端
cp apps/mobile/.env.example apps/mobile/.env
```

### 启动服务

```bash
# 启动所有服务
pnpm dev

# 单独启动
pnpm api:dev       # 后端 API (端口3000)
pnpm mobile:dev    # 移动端 (Expo)
pnpm ai:dev        # AI服务 (端口5000)
```

### 数据库

```bash
cd apps/api
pnpm db:generate   # 生成 Prisma Client
pnpm db:migrate    # 运行迁移
pnpm db:push       # 推送 schema 到数据库（开发环境）
```

## API 文档

启动后端后访问: http://localhost:3000/api/docs

## 开发规范

- GitFlow 工作流
- Conventional Commits
- 所有API响应遵循统一格式

## AI模型

集成豆包(Doubao)多模态模型，支持：
- 禽类疾病图像识别
- 症状描述分析
- 环境数据关联诊断
- 多疾病鉴别诊断

API端点: `POST /diagnose`
