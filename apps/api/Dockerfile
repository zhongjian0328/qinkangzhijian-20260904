# 禽康智检 API（NestJS）镜像
# 说明：单阶段构建，pnpm monorepo 全量安装以复用 lockfile（保证可复现）。
# 上线后可改用 pnpm deploy / 多阶段 + --filter 精简体积。

FROM node:20-bookworm-slim

RUN npm install -g pnpm@9.15.0

WORKDIR /app

# 先拷贝整个仓库（.dockerignore 已排除 node_modules/venv/上传图/密钥等）
COPY . .

# Prisma 引擎二进制走国内镜像（binaries.prisma.sh 被墙会导致 postinstall 卡死）
ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @qinkang/types build
RUN pnpm --filter api build
RUN pnpm --filter api db:generate

WORKDIR /app/apps/api
EXPOSE 3000

# 启动前确保数据库 schema 已就绪（db push 幂等）
CMD ["sh", "-c", "pnpm exec prisma db push --skip-generate && node dist/main.js"]
