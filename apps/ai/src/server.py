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
    role: str = "farmer"
    sub_role: str = ""


class KnowledgeSearchRequest(BaseModel):
    query: str
    species: str = "chicken"
    top_k: int = 5


class FarmingSearchRequest(BaseModel):
    query: str
    top_k: int = 5


class ConsultRequest(BaseModel):
    messages: list[dict] = []   # 对话历史 [{role, content}]
    image_urls: list[str] = []  # 本轮图片
    species: str = "chicken"
    role: str = "farmer"
    sub_role: str = ""


class DiagnosisResult(BaseModel):
    disease: str
    probability: float
    description: str
    recommendations: list[str]
    severity: str
    differential_diagnoses: list[dict]
    figures: list[dict] = []
    hybrid_infection_risk: Optional[dict] = None


class PreventionRequest(BaseModel):
    diagnosis: dict
    species: str = "chicken"
    symptoms: list[str] = []


class PreventionPlanResult(BaseModel):
    diagnosis_summary: str
    emergency_measures: list[str]
    green_medication: list[str]
    immunization: list[str]
    biosafety: list[str]
    monitoring_plan: list[str]
    follow_up_notes: str


class VetDiagnoseRequest(BaseModel):
    """AI兽医诊断：9 大维度结构化信息 + 图片（对齐《AI兽医诊断功能开发文档_v2.md》）"""
    species: str = "chicken"
    basic_info: Optional[dict] = None
    chief_complaint: Optional[dict] = None
    clinical_symptoms: Optional[dict] = None
    necropsy_lesions: Optional[dict] = None
    lab_tests: Optional[dict] = None
    immune_history: Optional[dict] = None
    medication_history: Optional[dict] = None
    environment: Optional[dict] = None
    epidemiology: Optional[dict] = None
    image_urls: list[str] = []
    role: str = "farmer"
    sub_role: str = ""


class VetOcrRequest(BaseModel):
    """AI兽医诊断：报告/记录拍照识别（OCR 文字提取）"""
    image_url: str
    field: str = ""


class VetDiagnosisResult(BaseModel):
    disease: str
    confidence: float
    severity: str
    primary: dict                    # {"disease": str, "confidence": float}
    secondaries: list[dict] = []     # [{"disease": str, "confidence": float}]
    excluded: list[str] = []         # 已排除疾病及原因
    evidence: list[str] = []         # 诊断依据
    differential_tests: list[str] = []  # 鉴别诊断建议（实验室检测）
    treatment: dict = {}             # {emergency/medication/immunization/disinfection/management: [..]}
    followup: list[str] = []         # 随访建议
    disclaimer: str = ""
    risk_warning: Optional[str] = None  # 危重预警


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


@app.get("/knowledge/atlas")
async def get_atlas_index():
    """返回结构化图谱索引（3 本图谱 -> 病种 -> 图注 + 图号映射的图片文件名），供图谱百科浏览。"""
    return knowledge.atlas_index()


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


def _build_reference(symptoms: list[str], species: str, top_k: int = 3) -> str:
    """构造注入提示词的教材知识：速查表 + 最相关章节（附图谱图注）。"""
    parts: list[str] = []

    # 鉴别诊断速查与用药禁忌（紧凑，始终携带）
    if knowledge.cheatsheet:
        parts.append("## 鉴别诊断速查与用药禁忌\n" + knowledge.cheatsheet)

    chapters = knowledge.retrieve(symptoms=symptoms, species=species, top_k=top_k)
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


def _role_persona(role: str = "farmer", sub_role: str = "") -> str:
    """AI 对话问诊的角色人设（对齐说明书 5.1 问诊人设表）。"""
    if role == "vet" or sub_role == "service":
        return "你是一位资深执业兽医，正在辅助同行做专业鉴别诊断。回答要专业、直接，给出鉴别诊断要点与实验室确诊建议。"
    if role == "student":
        return "你是一位禽病学带教老师，采用引导式教学：先帮学生理清思路、列出应排查方向，再循序渐进给出答案，避免直接给出标准答案。"
    if role == "institution" and sub_role == "teacher":
        return "你是一位禽病学教师的教学助手，帮助教师备课、讲解鉴别诊断要点、设计教学案例。"
    if role == "institution" and sub_role == "research":
        return "你是一位禽病科研专家，擅长混合感染风险评估、鉴别诊断要点与科研数据解读。"
    if role == "institution":
        return "你是一位禽病流行病学与疫情分析专家，擅长区域疫情风险评估、监测预警与处置建议。"
    if role == "merchant":
        return "你是一位兽药/疫苗/养殖设备产品专家，擅长结合症状与防控方案推荐合适产品并解答使用问题。"
    if role == "farmer" and sub_role in ("enterprise", "cooperative"):
        return "你是一位禽病兽医兼养殖经营顾问，擅长规模化鸡群的批量健康管理与死亡异常排查。"
    return "你是一位专业的禽病兽医，用通俗易懂、养殖户友好的语言解答鸡群健康问题，给出初步诊断建议。"


def _diagnose_role_note(role: str = "farmer", sub_role: str = "") -> str:
    """诊断 Tab 的角色自适应提示（对齐说明书 5.2）。"""
    if role == "vet" or sub_role == "service":
        return "请给出专业的鉴别诊断要点，并在建议中补充实验室确诊检测项目。"
    if role == "student":
        return "请给出更详尽的诊断依据（特征病变与病理机制），便于学生学习比对。"
    if role == "institution" and sub_role == "research":
        return "请重点评估混合感染风险与鉴别诊断依据。"
    return ""


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
    role_note = _diagnose_role_note(request.role, request.sub_role)

    prompt = f"""你是一位专业的禽类疾病诊断兽医。请根据图像与症状信息，参考下方《禽病防治教材》知识进行诊断。{role_note}

禽种: {request.species}{symptom_text}{env_text}

【教材参考知识】
{reference}

请仔细观察图像，结合教材知识给出诊断。注意：用药与免疫建议必须遵循教材中的禁忌（如有机磷类严禁内服、肾传支禁用磺胺类等）。description 需包含特征病变与诊断依据。请按以下JSON格式返回，仅返回JSON，不要其他内容：
{{
  "disease": "疾病名称",
  "probability": 0.0-1.0的置信度,
  "description": "疾病描述（含特征病变与诊断依据）",
  "recommendations": ["治疗建议1", "预防措施2"],
  "severity": "low/medium/high/critical",
  "differential_diagnoses": [
    {{"disease": "鉴别疾病", "probability": 0.0}}
  ],
  "hybrid_infection_risk": {{
    "risk_level": "低/中/高",
    "infection_combinations": [{{"pathogens": ["病原1", "病原2"], "probability": 0.0}}],
    "core_threat": "混合感染可能导致的核心威胁"
  }}
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


# ---------------- AI兽医诊断（结构化 9 维 + 多模态豆包） ----------------

DIM_LABELS = {
    "basic_info": "1. 基本信息",
    "chief_complaint": "2. 主诉与病史",
    "clinical_symptoms": "3. 临床症状",
    "necropsy_lesions": "4. 剖检病变",
    "lab_tests": "5. 实验室检测",
    "immune_history": "6. 免疫史",
    "medication_history": "7. 用药史",
    "environment": "8. 环境与管理",
    "epidemiology": "9. 流行病学",
}

FIELD_LABELS = {
    "species": "动物种类", "breed": "品种", "ageDays": "日龄(天)", "stock": "存栏量(羽)",
    "sickCount": "发病数(羽)", "deathCount": "死亡数(羽)", "feedingMode": "饲养方式",
    "productionStage": "养殖阶段", "mainProblem": "主诉", "onsetTime": "发病时间",
    "course": "病程", "progression": "发病经过", "mortalityTrend": "死亡率趋势",
    "transmissionSpeed": "传播速度", "pastHistory": "既往病史",
    "general": "一般状态", "digestive": "消化道", "respiratory": "呼吸道",
    "reproductive": "生殖道", "nervous": "神经", "skinMucosa": "皮肤黏膜",
    "motor": "运动", "other": "其他", "note": "补充描述",
    "subcutaneousMuscle": "皮下肌肉", "circulatory": "循环系统",
    "urinaryReproductive": "泌尿生殖", "immuneOrgans": "免疫器官",
    "serology": "血清学", "pathogen": "病原学", "bacteriology": "细菌学",
    "parasitology": "寄生虫", "biochemistry": "生化", "cbc": "血常规",
    "program": "免疫程序", "lastVaccine": "最近免疫", "postVaccineReaction": "免疫后反应",
    "antibodyTest": "抗体检测", "vaccineFailureHistory": "免疫失败史",
    "recentDrugs": "最近用药", "effect": "用药效果", "allergyHistory": "药物过敏史",
    "healthProducts": "保健药物", "withdrawalPeriod": "休药期",
    "temperature": "温度", "humidity": "湿度", "ventilation": "通风", "density": "密度",
    "feed": "饲料", "water": "饮水", "light": "光照", "weatherChange": "天气变化",
    "humanTraffic": "人员流动", "surroundingEpidemic": "周边疫情", "biosecurity": "生物安全",
    "introductionHistory": "引种史", "vaccineSource": "疫苗来源", "flockSource": "鸡群来源",
    "mixedFarming": "混养情况", "wildBirdContact": "野鸟接触", "similarFarms": "同类养殖场",
    "deadBirdDisposal": "病死鸡处理",
}

# 未选择即标注「未见异常」的症状/病变分类（一般状态除外，因其为常规描述项）
SYMPTOM_NEGATIVE_LABELS = {
    "digestive": "消化道症状",
    "respiratory": "呼吸道症状",
    "reproductive": "生殖道症状",
    "nervous": "神经症状",
    "skinMucosa": "皮肤黏膜",
    "motor": "运动症状",
    "other": "其他症状",
}

LESION_NEGATIVE_LABELS = {
    "subcutaneousMuscle": "皮下与肌肉",
    "digestive": "消化系统",
    "respiratory": "呼吸系统",
    "circulatory": "循环系统",
    "urinaryReproductive": "泌尿生殖",
    "immuneOrgans": "免疫器官",
    "nervous": "神经系统",
    "other": "其他病变",
}


def _fmt_field(label: str, value) -> str:
    if value is None or value == "" or value == [] or value == {}:
        return ""
    if isinstance(value, list):
        return f"- {label}：{'、'.join(str(v) for v in value)}"
    if isinstance(value, bool):
        return f"- {label}：{'是' if value else '否'}"
    return f"- {label}：{value}"


def _build_vet_case_text(req: VetDiagnoseRequest) -> str:
    """把 9 大维度结构化信息组装为紧凑的专业病例文本。"""
    lines = ["【病例信息】"]
    dims = [
        ("basic_info", req.basic_info),
        ("chief_complaint", req.chief_complaint),
        ("clinical_symptoms", req.clinical_symptoms),
        ("necropsy_lesions", req.necropsy_lesions),
        ("lab_tests", req.lab_tests),
        ("immune_history", req.immune_history),
        ("medication_history", req.medication_history),
        ("environment", req.environment),
        ("epidemiology", req.epidemiology),
    ]
    for dim_key, dim_val in dims:
        if not dim_val:
            continue
        lines.append(f"\n## {DIM_LABELS[dim_key]}")
        if isinstance(dim_val, dict):
            for field, value in dim_val.items():
                if field in ("photos", "photoUrls"):
                    continue
                line = _fmt_field(FIELD_LABELS.get(field, field), value)
                if line:
                    lines.append(line)
            # 未选择的症状/病变分类 → 明确标注「未见异常」，避免模型误判缺失
            if dim_key == "clinical_symptoms":
                for key, label in SYMPTOM_NEGATIVE_LABELS.items():
                    if not dim_val.get(key):
                        lines.append(f"- {label}：未见异常")
            elif dim_key == "necropsy_lesions":
                for key, label in LESION_NEGATIVE_LABELS.items():
                    if not dim_val.get(key):
                        lines.append(f"- {label}：未见异常")
        else:
            lines.append(str(dim_val))
    return "\n".join(lines)


def _collect_vet_symptoms(req: VetDiagnoseRequest) -> list[str]:
    """从结构化信息中提取关键词，用于知识库检索。"""
    symptoms: list[str] = []
    cs = req.clinical_symptoms or {}
    for cat in ("general", "digestive", "respiratory", "reproductive",
                "nervous", "skinMucosa", "motor", "other"):
        v = cs.get(cat)
        if isinstance(v, list):
            symptoms.extend(v)
    nl = req.necropsy_lesions or {}
    for cat in ("subcutaneousMuscle", "digestive", "respiratory", "circulatory",
                "urinaryReproductive", "immuneOrgans", "nervous", "other"):
        v = nl.get(cat)
        if isinstance(v, list):
            symptoms.extend(v)
    cc = req.chief_complaint or {}
    if cc.get("mainProblem"):
        symptoms.append(cc["mainProblem"])
    return symptoms


@app.post("/vet-diagnose", response_model=VetDiagnosisResult)
async def vet_diagnose(request: VetDiagnoseRequest):
    """AI兽医诊断：结构化 9 维信息 + 多模态豆包深度鉴别诊断（对齐 doc v2 第四章）。"""

    case_text = _build_vet_case_text(request)
    symptoms = _collect_vet_symptoms(request)
    reference = _build_reference(symptoms, request.species, top_k=3)
    role_note = _diagnose_role_note(request.role, request.sub_role)

    system_prompt = f"""你是一位经验丰富的禽病临床兽医专家，拥有20年临床诊断经验。请根据以下完整的结构化病例信息，进行专业的鉴别诊断。{role_note}

【诊断流程】
1. 综合分析9大维度信息（基本信息+主诉+临床症状+剖检病变+实验室检测+免疫史+用药史+环境管理+流行病学）
2. 列出最可能的疾病，按可能性从高到低排序，给出置信度
3. 详细列出支持每种疾病的依据（对应到具体症状/病变/检测结果）
4. 列出已排除的疾病及排除原因
5. 给出鉴别诊断建议（需做哪些实验室检测进一步确诊）
6. 给出完整防控方案（紧急处理+用药+免疫+消毒+管理）

【重要规则】
- 必须基于提供的信息诊断，不要编造不存在的症状
- 信息不足时要明确指出并建议补充
- 用药方案必须标注休药期，不给出具体处方剂量（处方权属于执业兽医）
- 烈性传染病（禽流感H5/H7、新城疫强毒等）必须在 risk_warning 中强烈建议立即上报疫控部门
- severity 取值：low/medium/high/critical
- 每次回复必须包含免责声明

【教材参考知识】
{reference}

请严格按以下 JSON 格式返回，仅返回 JSON，不要其他内容：
{{
  "disease": "首要诊断疾病名",
  "confidence": 0.0-1.0,
  "severity": "low/medium/high/critical",
  "primary": {{"disease": "首要诊断", "confidence": 0.0-1.0}},
  "secondaries": [{{"disease": "次要诊断", "confidence": 0.0-1.0}}],
  "excluded": ["已排除疾病及原因"],
  "evidence": ["诊断依据1", "依据2"],
  "differential_tests": ["实验室检测建议1", "建议2"],
  "treatment": {{
    "emergency": ["紧急处理"],
    "medication": ["用药方案"],
    "immunization": ["免疫建议"],
    "disinfection": ["消毒管理"],
    "management": ["管理调整"]
  }},
  "followup": ["3日回访要点", "7日回访要点", "15日回访要点"],
  "disclaimer": "本报告由AI生成，仅供参考，不能替代执业兽医诊断。",
  "risk_warning": "危重预警（无则 null）"
}}"""

    try:
        async with httpx.AsyncClient(timeout=DOUBAO_TIMEOUT) as client:
            content: list = [
                {"type": "input_text", "text": f"{system_prompt}\n\n{case_text}\n\n请根据以上完整病例信息，按照系统提示的诊断流程和输出格式，给出专业的鉴别诊断和防控方案。"}
            ]
            for url in (request.image_urls or []):
                content.append({"type": "input_image", "image_url": url})
            response = await client.post(
                DOUBAO_API_URL,
                headers={
                    "Authorization": f"Bearer {DOUBAO_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": DOUBAO_MODEL,
                    "thinking": {"type": "disabled"},
                    "input": [{"role": "user", "content": content}],
                },
            )
            response.raise_for_status()
            data = response.json()

        text = _extract_text(data)
        if not text:
            raise HTTPException(status_code=502, detail="AI服务未返回有效文本")

        result = _parse_json(text)
        # 归一化 treatment/followup 字段，兜底缺失
        treatment = result.get("treatment") or {}
        for key in ("emergency", "medication", "immunization", "disinfection", "management"):
            treatment.setdefault(key, [])
        result["treatment"] = treatment
        result.setdefault("secondaries", [])
        result.setdefault("excluded", [])
        result.setdefault("evidence", [])
        result.setdefault("differential_tests", [])
        result.setdefault("followup", [])
        result.setdefault("disclaimer", "本报告由AI生成，仅供参考，不能替代执业兽医诊断。")
        if "risk_warning" not in result:
            result["risk_warning"] = None
        return VetDiagnosisResult(**result)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI服务调用失败[{type(e).__name__}]: {e}")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(status_code=502, detail=f"AI返回结果解析失败: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI兽医诊断失败: {e}")


@app.post("/vet-diagnose/ocr")
async def vet_diagnose_ocr(request: VetOcrRequest):
    """报告/记录拍照识别：用豆包多模态读取图片中的文字内容，供前端填入表单。"""
    if not request.image_url:
        raise HTTPException(status_code=400, detail="缺少识别图片")

    field_hint = f"，这是一份「{request.field}」的报告/记录" if request.field else ""
    prompt = f"""请识别并转录这张图片中的全部文字内容{field_hint}。
要求：
1. 忠实转录图片中的文字、数字、单位与关键结论，不要添加解释或评价
2. 若图片中有表格，按「项目名：数值/内容」逐行整理
3. 保留关键检测指标及其结果（如抗体滴度、细菌培养结果、血液指标等）
4. 直接输出转录结果，不要任何前缀或说明"""

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
                    "thinking": {"type": "disabled"},
                    "input": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "input_image", "image_url": request.image_url},
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
        return {"text": text.strip()}

    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI服务调用失败[{type(e).__name__}]: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"报告识别失败: {e}")


@app.post("/prevention/generate", response_model=PreventionPlanResult)
async def generate_prevention(request: PreventionRequest):
    """根据 AI 诊断结果，结合教材知识生成结构化防控预案。"""
    diagnosis = request.diagnosis or {}
    disease = (diagnosis.get("disease") or "").strip()
    symptoms = request.symptoms or []
    if not disease and not symptoms:
        raise HTTPException(status_code=400, detail="缺少诊断信息")

    reference = _build_reference(symptoms or [disease], request.species)

    prompt = f"""你是一位禽病防控专家。请根据以下 AI 诊断结果，结合《禽病防治教材》知识，为养殖户制定一份结构化的防控预案。

禽种: {request.species}
诊断结果: {json.dumps(diagnosis, ensure_ascii=False)}

【教材参考知识】
{reference}

请务必遵循教材中的用药禁忌（如有机磷类严禁内服、肾传支禁用磺胺类等）。请按以下 JSON 格式返回，仅返回 JSON，不要其他内容：
{{
  "diagnosis_summary": "诊断结论摘要（1-2句话，含主要病变与风险等级）",
  "emergency_measures": ["紧急处置措施1", "措施2"],
  "green_medication": ["绿色用药建议1", "建议2"],
  "immunization": ["免疫建议1", "建议2"],
  "biosafety": ["生物安全措施1", "措施2"],
  "monitoring_plan": ["监测计划1", "计划2"],
  "follow_up_notes": "回访要点（处置后3日/7日分别观察哪些指标）"
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
                    "thinking": {"type": "disabled"},
                    "input": [
                        {
                            "role": "user",
                            "content": [{"type": "input_text", "text": prompt}],
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
        return PreventionPlanResult(**result)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI服务调用失败[{type(e).__name__}]: {e}")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(status_code=502, detail=f"AI返回结果解析失败: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预案生成失败: {e}")


@app.post("/consult")
async def consult(request: ConsultRequest):
    """AI 对话问诊：多轮对话 + 角色人设 + 知识库注入 + 可选图片。

    对齐《禽康智检APP_AI对话问诊开发文档_豆包2.1turbo》第五章提示词设计：
    问诊流程（倾听→追问→诊断→防控）、重要规则（禽病限定/处方权/危重预警/免责声明）、
    输出格式（分段/编号/加粗/疾病名【】标注），并按角色动态适配（养殖户/兽医/学生等）。
    """

    if not request.messages and not request.image_urls:
        raise HTTPException(status_code=400, detail="缺少对话内容")

    last_user = ""
    for m in reversed(request.messages):
        if isinstance(m, dict) and m.get("role") == "user":
            last_user = m.get("content") or ""
            break
    if not last_user and request.image_urls:
        last_user = "看图诊断"

    # 对话问诊对延迟更敏感，注入的教材章节从 3 章收紧到 2 章（速查表始终携带）
    reference = _build_reference([last_user], request.species, top_k=2) if last_user else ""
    persona = _role_persona(request.role, request.sub_role)
    history = "\n".join(
        f"{m.get('role')}: {m.get('content')}" for m in request.messages[-10:] if isinstance(m, dict)
    )

    prompt = f"""{persona}

你正服务于「禽康智检」AI问诊功能，请遵循以下问诊流程与规则，进行多轮对话式禽病问诊。

【问诊流程】
1. 先倾听并理解用户对鸡群异常的描述（症状、发病经过、管理情况）。
2. 若信息不足以确诊，主动、聚焦地追问关键信息：品种/日龄/存栏、发病时间/发病率/死亡率、粪便颜色与性状、呼吸症状、产蛋变化、精神状态、剖检病变、免疫史、用药史、环境（温度/通风/密度/天气变化）。
3. 信息充分后，给出诊断结论：首要怀疑（附置信度百分比）、次要怀疑、已排除的疾病及排除依据。
4. 给出防控建议：紧急处理、用药参考、免疫建议、消毒与管理措施、回访建议。

【重要规则】
- 只回答禽类（鸡）疾病与养殖健康相关问题，不回答无关内容。
- 你只提供用药参考，不给出处方剂量——处方权属于执业兽医。
- 高致死性传染病（禽流感、新城疫强毒等）必须强烈建议立即联系当地疫控部门和执业兽医，并做好隔离。
- 用药与免疫建议必须遵循教材禁忌（有机磷类严禁内服、肾传支禁用磺胺类等）。
- 不要编造不存在的药品或疗法；涉及用药时提醒休药期与药品说明书。

【输出格式】
- 分段清晰、适当编号，关键信息加粗，疾病名称用【】标注。
- 每次回复末尾务必注明：「以上建议由AI生成，仅供参考，确诊请结合实验室检测或执业兽医诊断」。

禽种: {request.species}

【对话历史】
{history or "(无)"}

【教材参考知识】
{reference or "(无相关章节)"}

请按以下 JSON 格式返回，仅返回 JSON，不要其他内容：
{{
  "reply": "自然语言回复（回答/追问，通俗易懂，末尾含免责声明）",
  "preliminary_diagnosis": "初步诊断（尚无把握则填空字符串）",
  "confidence": 0.0,
  "suggestions": ["建议1", "建议2"],
  "next_steps": "后续建议操作",
  "related_diseases": ["相关疾病1", "相关疾病2"]
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
                    "thinking": {"type": "disabled"},
                    "input": [
                        {
                            "role": "user",
                            "content": [
                                *[
                                    {"type": "input_image", "image_url": url}
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
        reply = (result.get("reply") or "").strip()
        # 免责声明兜底：模型未按格式返回时，代码层强制追加
        disclaimer = "以上建议由AI生成，仅供参考，确诊请结合实验室检测或执业兽医诊断"
        if reply and disclaimer not in reply:
            reply = f"{reply}\n\n{disclaimer}"
        return {
            "reply": reply,
            "preliminary_diagnosis": result.get("preliminary_diagnosis") or "",
            "confidence": result.get("confidence") or 0.0,
            "suggestions": result.get("suggestions") or [],
            "next_steps": result.get("next_steps") or "",
            "related_diseases": result.get("related_diseases") or [],
        }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI服务调用失败[{type(e).__name__}]: {e}")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(status_code=502, detail=f"AI返回结果解析失败: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"对话问诊失败: {e}")


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
