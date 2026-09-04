# 禽康智检 AI 诊断服务（FastAPI）镜像
FROM python:3.12-slim

WORKDIR /app

COPY apps/ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 源码与 42 章知识库（knowledge.py 通过 __file__ 定位 knowledge/ 目录，路径无关）
COPY apps/ai/src ./src

EXPOSE 5000

CMD ["python", "src/server.py"]
