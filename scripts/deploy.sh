#!/usr/bin/env bash
# ============================================================
#  禽康智检 - 云服务器部署脚本
#
#  用法（在 Linux 云服务器上执行）：
#    1. 先安装 Docker + Docker Compose：
#       https://docs.docker.com/engine/install/
#    2. bash deploy.sh
#
#  首次运行会生成 .env 后退出，让你填入 JWT_SECRET / DOUBAO_API_KEY；
#  填好后再跑一次即可完成构建与启动。
# ============================================================
set -euo pipefail

REPO="${REPO:-https://github.com/zhongjian0328/qinkangzhijian-20260904.git}"
APP_DIR="${APP_DIR:-qinkangzhijian}"

echo "==> 1/4 检查 Docker ..."
if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker，请先安装：https://docs.docker.com/engine/install/"
  exit 1
fi

echo "==> 2/4 获取代码 ..."
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> 3/4 配置环境变量 ..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo "已生成 .env 模板，请编辑填入真实密钥后重新运行本脚本："
  echo "  vi $(pwd)/.env"
  echo
  echo "必填项："
  echo "  JWT_SECRET       后端 JWT 密钥（32+ 位随机字符串）"
  echo "  DOUBAO_API_KEY   豆包（火山方舟）API Key"
  exit 0
fi

echo "==> 4/4 构建并启动容器 ..."
docker compose up -d --build

echo
echo "部署完成："
echo "  API 文档   http://<服务器IP>:3000/api/docs"
echo "  AI 服务    http://<服务器IP>:5000"
echo "  PostgreSQL 5432（仅内网，请勿对外暴露）"
echo
echo "常用命令："
echo "  查看日志  docker compose logs -f api"
echo "  停止服务  docker compose down"
echo "  更新部署  bash deploy.sh"
