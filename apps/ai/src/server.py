"""
禽康智检 - AI诊断服务
集成豆包多模态模型进行禽类疾病图像诊断，并接入《禽病防治教材》知识库作为诊断依据。
"""
import json
import os
import re
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

from knowledge import DiseaseKnowledge, FarmingKnowledge, knowledge, farming_knowledge

load_dotenv()

app = FastAPI(title="禽康智检 AI 诊断服务")

# 豆包多模态API配置
DOUBAO_API_KEY = os.getenv("DOUBAO_API_KEY")
DOUBAO_MODEL = os.getenv("DOUBAO_MODEL", "doubao-seed-2-1-turbo-260628")
DOUBAO_API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses"
DOUBAO_TIMEOUT = float(os.getenv("DOUBAO_TIMEOUT", "600"))


class DiagnosisRequest(BaseModel):
    image_urls: list[str] = []
    species: str = "chicken"
    symptoms: list[str] = []
    environment: Optional[dict] = None


class KnowledgeSearchRequest(BaseModel):
    query: str
    species: str = "chicken"
    top_k: int = 5


class FarmingSearchRequest(BaseModel):
    query: str
    top_k: int = 5


class DiagnosisResult(BaseModel):
    disease: str
    probability: float
    description: str
    recommendations: list[str]
    severity: str
    differential_diagnoses: list[dict]
    figures: list[dict] = []


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": DOUBAO_MODEL,
        "knowledge_chapters": len(knowledge.chapters),
        "atlas_sections": len(knowledge.atlas),
        "farming_chapters": len(farming_knowledge.chapters),
    }


@app.post("/knowledge/search")
async def search_knowledge(request: KnowledgeSearchRequest):
    """在《禽病防治教材》中检索相关疾病章节（供百科/参考）"""
    chapters = knowledge.retrieve(
        symptoms=[request.query], species=request.species, top_k=request.top_k
    )
    return {
        "total": len(chapters),
        "results": [
            {"id": ch.id, "title": ch.title, "excerpt": ch.text[:200]} for ch in chapters
        ],
    }


@app.post("/knowledge/farming/search")
async def search_farming_knowledge(request: FarmingSearchRequest):
    """在《养鸡疑难300问》中检索相关章节（养殖管理问答）"""
    chapters = farming_knowledge.retrieve(
        symptoms=[request.query], species="chicken", top_k=request.top_k
    )
    return {
        "total": len(chapters),
        "results": [
            {"id": ch.id, "title": ch.title, "excerpt": ch.text[:200]} for ch in chapters
        ],
    }


@app.get("/knowledge/figures")
async def get_figures(disease: str = ""):
    """按病名返回图谱病变图注（诊断结果附图号对照）"""
    if not disease:
        return {"total": 0, "results": []}
    matches = knowledge.lookup_figures(disease, top_k=3)
    return {"total": len(matches), "results": matches}


@app.get("/knowledge/chapter/{chapter_id}")
async def get_chapter(chapter_id: str):
    """按章节 id 返回全文（疾病教材或养鸡问答），疾病章节附图谱图注。"""
    ch = knowledge.chapters.get(chapter_id) or farming_knowledge.chapters.get(chapter_id)
    if not ch:
        raise HTTPException(status_code=404, detail="章节不存在")
    return {
        "id": ch.id,
        "title": ch.title,
        "text": ch.text,
        "figures": knowledge.lookup_figures(ch.title, top_k=1),
    }


def _build_reference(symptoms: list[str], species: str) -> str:
    """构造注入提示词的教材知识：速查表 + 最相关章节（附图谱图注）。"""
    parts: list[str] = []

    # 鉴别诊断速查与用药禁忌（紧凑，始终携带）
    if knowledge.cheatsheet:
        parts.append("## 鉴别诊断速查与用药禁忌\n" + knowledge.cheatsheet)

    chapters = knowledge.retrieve(symptoms=symptoms, species=species, top_k=3)
    if chapters:
        blocks: list[str] = []
        for ch in chapters:
            block = f"### {ch.title}\n{ch.text}"
            figs = knowledge.lookup_figures(ch.title, top_k=1)
            if figs:
                block += "\n\n#### 图谱诊断要点（病变图注）\n" + figs[0]["text"]
            blocks.append(block)
        parts.append("## 相关疾病章节\n" + "\n\n".join(blocks))

    return "\n\n".join(parts)


def _extract_text(data: dict) -> str:
    """从豆包 Responses API 返回中稳健提取文本。"""
    output = data.get("output")
    if isinstance(output, str):
        return output
    if isinstance(output, dict):
        return output.get("text", "") or json.dumps(output, ensure_ascii=False)
    if isinstance(output, list):
        texts: list[str] = []
        for item in output:
            if isinstance(item, str):
                texts.append(item)
            elif isinstance(item, dict):
                for key in ("text", "content"):
                    value = item.get(key)
                    if isinstance(value, str):
                        texts.append(value)
                    elif isinstance(value, list):
                        for block in value:
                            if isinstance(block, dict) and isinstance(block.get("text"), str):
                                texts.append(block["text"])
                            elif isinstance(block, str):
                                texts.append(block)
        return "".join(texts)
    return ""


def _parse_json(text: str) -> dict:
    """从模型输出中提取 JSON 对象，容忍 markdown 代码块包裹。"""
    text = text.strip()
    # 去掉 ```json ... ``` 包裹
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    # 截取第一个 { 到最后一个 } 之间的内容
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]
    return json.loads(text)


@app.post("/diagnose", response_model=DiagnosisResult)
async def diagnose(request: DiagnosisRequest):
    """使用豆包多模态模型进行禽类疾病诊断（结合教材知识）"""

    if not request.image_urls:
        raise HTTPException(status_code=400, detail="缺少诊断图片")

    symptom_text = (
        f"\n症状描述: {'、'.join(request.symptoms)}" if request.symptoms else ""
    )
    env_text = ""
    if request.environment:
        env = request.environment
        env_text = f"\n环境数据: 温度{env.get('temperature', 'N/A')}°C, 湿度{env.get('humidity', 'N/A')}%, "
        env_text += f"氨气{env.get('ammonia', 'N/A')}ppm, CO2{env.get('co2', 'N/A')}ppm"

    reference = _build_reference(request.symptoms, request.species)

    prompt = f"""你是一位专业的禽类疾病诊断兽医。请根据图像与症状信息，参考下方《禽病防治教材》知识进行诊断。

禽种: {request.species}{symptom_text}{env_text}

【教材参考知识】
{reference}

请仔细观察图像，结合教材知识给出诊断。注意：用药与免疫建议必须遵循教材中的禁忌（如有机磷类严禁内服、肾传支禁用磺胺类等）。请按以下JSON格式返回，仅返回JSON，不要其他内容：
{{
  "disease": "疾病名称",
  "probability": 0.0-1.0的置信度,
  "description": "疾病描述（含特征病变与诊断依据）",
  "recommendations": ["治疗建议1", "预防措施2"],
  "severity": "low/medium/high/critical",
  "differential_diagnoses": [
    {{"disease": "鉴别疾病", "probability": 0.0}}
  ]
}}"""

    try:
        async with httpx.AsyncClient(timeout=DOUBAO_TIMEOUT) as client:
            response = await client.post(
                DOUBAO_API_URL,
                headers={
                    "Authorization": f"Bearer {DOUBAO_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": DOUBAO_MODEL,
                    # 诊断是确定性视觉判断任务，关闭思维链（reasoning）可显著降低延迟
                    # （实测：开启 reasoning ~11s，关闭后 ~3.7s），且不影响诊断质量。
                    "thinking": {"type": "disabled"},
                    "input": [
                        {
                            "role": "user",
                            "content": [
                                *[
                                    {
                                        "type": "input_image",
                                        "image_url": url,
                                    }
                                    for url in request.image_urls
                                ],
                                {"type": "input_text", "text": prompt},
                            ],
                        }
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()

        text = _extract_text(data)
        if not text:
            raise HTTPException(status_code=502, detail="AI服务未返回有效文本")

        result = _parse_json(text)
        # 附上诊断疾病的图谱病变图注（供用户对照标准图谱）
        disease_name = (result.get("disease") or "").strip()
        result["figures"] = knowledge.lookup_figures(disease_name, top_k=1) if disease_name else []
        return DiagnosisResult(**result)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI服务调用失败[{type(e).__name__}]: {e}")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(status_code=502, detail=f"AI返回结果解析失败: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"诊断失败: {e}")


@app.post("/diagnose/upload")
async def diagnose_with_upload(
    file: UploadFile = File(...),
    species: str = "chicken",
    symptoms: str = "",
):
    """上传图片进行诊断（实际部署时应上传到OSS获取URL）"""
    # TODO: Upload to OSS and get URL, then call diagnose
    raise HTTPException(
        status_code=501,
        detail="文件上传功能需要配置对象存储，请使用image_url方式调用",
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "5000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
