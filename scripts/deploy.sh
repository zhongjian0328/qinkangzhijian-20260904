#!/usr/bin/env bash
# ============================================================
#  禽康智检 - 云服务器一键部署脚本
#
#  用法（在 Linux 云服务器上，以 root 运行）：
#    bash deploy.sh
#
#  本脚本会自动：
#    1. 安装 Docker + Docker Compose（若未安装，官方脚本，支持 Ubuntu/Debian）
#    2. 创建 2GB swap（内存紧张时兜底，若已存在则跳过）
#    3. 拉取代码
#    4. 首次运行生成 .env 后退出，填好密钥再跑一次
#    5. docker compose 构建并启动三容器
# ============================================================
set -euo pipefail

REPO="${REPO:-https://github.com/zhongjian0328/qinkangzhijian-20260904.git}"
APP_DIR="${APP_DIR:-qinkangzhijian}"
SWAP_SIZE_MB="${SWAP_SIZE_MB:-2048}"

# --- 0. 权限检查 ---
if [ "$(id -u)" -ne 0 ]; then
  echo "请以 root 运行：sudo bash deploy.sh"
  exit 1
fi

# --- 1. 安装 Docker（若未安装）---
echo "==> 1/5 检查并安装 Docker ..."
if ! command -v docker >/dev/null 2>&1; then
  echo "  未检测到 Docker，开始安装（官方脚本，支持 Ubuntu/Debian）..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker 安装失败，请手动安装后重试。"
  exit 1
fi
docker --version

# --- 2. 创建 swap（若不存在）---
echo "==> 2/5 检查并创建 swap ..."
if ! swapon --show 2>/dev/null | grep -q swapfile; then
  echo "  创建 ${SWAP_SIZE_MB}MB swapfile ..."
  fallocate -l ${SWAP_SIZE_MB}M /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=${SWAP_SIZE_MB}
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo "  swap 已启用："
  swapon --show
else
  echo "  swap 已存在，跳过："
  swapon --show
fi

# --- 3. 获取代码 ---
echo "==> 3/5 获取代码 ..."
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

# --- 4. 配置环境变量 ---
echo "==> 4/5 配置环境变量 ..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo "已生成 .env 模板，请编辑填入真实密钥后重新运行本脚本："
  echo "  vi $(pwd)/.env"
  echo
  echo "必填项："
  echo "  JWT_SECRET       后端 JWT 密钥（32+ 位随机字符串，可用 openssl rand -hex 32 生成）"
  echo "  DOUBAO_API_KEY   豆包（火山方舟）API Key"
  echo
  exit 0
fi

# --- 5. 构建并启动 ---
echo "==> 5/5 构建并启动容器 ..."
docker compose up -d --build

echo
echo "部署完成："
echo "  API 文档   http://<服务器IP>:3000/api/docs"
echo "  AI 服务    http://<服务器IP>:5000"
echo "  PostgreSQL 仅内网可访问（127.0.0.1:5432）"
echo
echo "常用命令："
echo "  查看日志  docker compose logs -f api"
echo "  停止服务  docker compose down"
echo "  更新部署  bash deploy.sh"
