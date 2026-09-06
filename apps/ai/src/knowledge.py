"""禽康智检知识库加载与检索。

- 疾病知识域：62 章《禽病防治教材》+ 图谱诊断要点（atlas/）+ 附录（appendix/）+ 图注索引（manifest.md）
- 养殖知识域：12 章《养鸡疑难300问》（farming_knowledge/）

将本地 Markdown 章节加载为可检索的领域知识，用于给诊断提示词注入参考依据，
让模型依据教材而非凭空作答。
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge"
FARMING_KNOWLEDGE_DIR = Path(__file__).resolve().parent / "farming_knowledge"

# 禽种关键词 -> 加权分，用于按禽种优先匹配相关章节
_SPECIES_BOOST: dict[str, tuple[tuple[str, int], ...]] = {
    "chicken": (("鸡", 3), ("禽", 1)),
    "duck": (("鸭", 3),),
    "goose": (("鹅", 3),),
    "turkey": (("火鸡", 3), ("鸡", 1)),
}

# 兼容阿拉伯数字与中文数字章号、冒号/空格分隔（如 "第43章 鸡结核病"、"第4章：雏鸡的饲养管理"、"第十章：鸡舍及饲养设备"）
_TITLE_RE = re.compile(
    r"^#\s*第\s*[0-9一二三四五六七八九十百]+\s*章\s*[:：]?\s*(.+?)\s*$",
    re.MULTILINE,
)

# 图注中的图号（如 "图2-33"），用于映射到 images/ 下的 figX-YYY.jpg
_FIGURE_RE = re.compile(r"图(\d+)-(\d+)")

# 养鸡疑难300问的问答条目标题（如 "### Q5 什么叫配合力？育种时为什么测定？"）
_Q_RE = re.compile(r"^###\s*Q(\d+)\s*(.+?)\s*$")

# 图谱文件名 -> 展示名
_ATLAS_NAMES = {
    "chuanranbing-tupu": "传染病图谱",
    "jishengchong-tupu": "寄生虫图谱",
    "putongbing-tupu": "普通病图谱",
}

# 总论章节（ch01~ch03 为预防/诊断/药物治疗总论，非具体病种）
_TOTAL_CHAPTER_STEMS = {
    "ch01-qinbing-yufang",
    "ch02-qinbing-zhenduan",
    "ch03-qinbing-yaowu-zhiliao",
}

# 《养鸡疑难300问》章节 stem -> 分类名（作为养鸡技巧的分类目录）
_FARMING_CATEGORIES: dict[str, str] = {
    "ch01-pinzhong-fanyu": "鸡的品种与繁育",
    "ch02-fuhua": "孵化技术",
    "ch03-yingyang-siliao": "鸡的营养与饲料",
    "ch04-chuji-siyang": "雏鸡的饲养管理",
    "ch05-yucheng-siyang": "育成鸡的饲养管理",
    "ch06-chandan-siyang": "产蛋鸡的饲养管理",
    "ch07-rouzai-siyang": "肉用仔鸡的饲养管理",
    "ch08-rouyong-zhongji": "肉用种鸡的饲养管理",
    "ch09-wugonghai": "无公害养鸡技术要点",
    "ch10-jishe-shebei": "鸡舍与饲养设备",
    "ch11-jingying-guanli": "家庭鸡场的经营管理",
    "ch12-jibing-fangzhi": "鸡常见病及防治",
}


@dataclass
class Chapter:
    id: str      # 文件名 stem，如 ch05-xinchengyi
    title: str   # 疾病名，如 "新城疫"
    text: str


def _bigrams(text: str) -> set[str]:
    """中文按双字切分，提升短语召回率（如"拉血便"也能命中"血便"）。"""
    text = re.sub(r"\s+", "", text)
    return {text[i : i + 2] for i in range(len(text) - 1)}


def _extract_title(text: str) -> str:
    m = _TITLE_RE.search(text)
    return m.group(1).strip() if m else ""


def _parse_sections(text: str) -> list[tuple[str, str]]:
    """按 `## ` 二级标题切分，返回 [(标题, 正文)]。用于图谱分病种索引。"""
    sections: list[tuple[str, str]] = []
    cur_title: str | None = None
    cur_body: list[str] = []
    for line in text.splitlines():
        if line.startswith("## "):
            if cur_title is not None:
                sections.append((cur_title, "\n".join(cur_body)))
            cur_title = line[3:].strip()
            cur_body = []
        elif cur_title is not None:
            cur_body.append(line)
    if cur_title is not None:
        sections.append((cur_title, "\n".join(cur_body)))
    return sections


class _MarkdownKnowledge:
    """通用知识域基类：加载 chapters/*.md + cheatsheet/glossary/patterns，按关键词打分检索。"""

    def __init__(self, base_dir: Path) -> None:
        self.chapters: dict[str, Chapter] = {}
        self.cheatsheet = ""
        self.glossary = ""
        self.patterns = ""
        self._load(base_dir)

    def _load(self, base_dir: Path) -> None:
        chapters_dir = base_dir / "chapters"
        for path in sorted(chapters_dir.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            title = _extract_title(text)
            if title:
                self.chapters[path.stem] = Chapter(id=path.stem, title=title, text=text)

        for name in ("cheatsheet", "glossary", "patterns"):
            p = base_dir / f"{name}.md"
            if p.exists():
                setattr(self, name, p.read_text(encoding="utf-8"))

    def retrieve(
        self,
        symptoms: list[str],
        species: str = "chicken",
        top_k: int = 3,
    ) -> list[Chapter]:
        """按症状/病名关键词给章节打分，返回最相关的若干章。"""
        terms: set[str] = set()
        for s in symptoms or []:
            s = re.sub(r"\s+", "", s)
            if not s:
                continue
            terms.add(s)
            terms.update(_bigrams(s))

        scored: list[tuple[int, str]] = []
        for cid, ch in self.chapters.items():
            score = 0
            for t in terms:
                if t in ch.title:
                    score += 20
                score += ch.text.count(t)
            for kw, weight in _SPECIES_BOOST.get(species, ()):
                if kw in ch.title:
                    score += weight
            if score > 0:
                scored.append((score, cid))

        scored.sort(key=lambda x: -x[0])
        return [self.chapters[cid] for _, cid in scored[:top_k]]


class DiseaseKnowledge(_MarkdownKnowledge):
    """疾病知识域：62 章教材 + 图谱图注 + 附录。"""

    def __init__(self, base_dir: Path = KNOWLEDGE_DIR) -> None:
        self.atlas: list[tuple[str, str]] = []   # [(病种标题, 图注正文)]
        self.atlas_files: dict[str, list[tuple[str, str]]] = {}  # 图谱文件名 stem -> [(病种标题, 图注正文)]
        self.appendix: dict[str, str] = {}       # 附录名 -> 正文
        self.manifest = ""                        # 图号 -> 文件/页码索引
        super().__init__(base_dir)
        self._load_extras(base_dir)

    def _load_extras(self, base_dir: Path) -> None:
        atlas_dir = base_dir / "atlas"
        for path in sorted(atlas_dir.glob("*.md")):
            sections = _parse_sections(path.read_text(encoding="utf-8"))
            self.atlas.extend(sections)
            self.atlas_files[path.stem] = sections

        appendix_dir = base_dir / "appendix"
        for path in sorted(appendix_dir.glob("*.md")):
            self.appendix[path.stem] = path.read_text(encoding="utf-8")

        mp = base_dir / "manifest.md"
        if mp.exists():
            self.manifest = mp.read_text(encoding="utf-8")

    @property
    def disease_count(self) -> int:
        """具体病种章节数（扣除 ch01~ch03 总论）。"""
        return sum(1 for stem in self.chapters if stem not in _TOTAL_CHAPTER_STEMS)

    @property
    def figure_count(self) -> int:
        """图谱原图数量（从 manifest 图号索引统计）。"""
        return len(set(re.findall(r"fig\d+-\d+\.jpg", self.manifest)))

    @staticmethod
    def _name_match(name: str, header: str) -> bool:
        """病名与图谱标题模糊匹配（"新城疫" 命中 "鸡新城疫（p22–p30）"）。"""
        h = re.sub(r"[（(].*?[)）]", "", header).strip()
        n = (name or "").strip()
        if not n or not h:
            return False
        return n in h or h in n

    def lookup_figures(self, disease_title: str, top_k: int = 1) -> list[dict]:
        """按病名在图谱中查找病变图注，返回 [{title, text, images}]。

        images 为逐条图注（含 caption 与图号映射的图片文件名 figX-YYY.jpg），
        用于疾病详情页图文并茂展示；text 保留整段原始图注（供提示词注入）。
        """
        results: list[dict] = []
        for title, body in self.atlas:
            if self._name_match(disease_title, title):
                images: list[dict] = []
                for line in body.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    caption = line.lstrip("- ").strip()
                    m = _FIGURE_RE.search(caption)
                    images.append({
                        "caption": caption,
                        "file": f"fig{m.group(1)}-{int(m.group(2)):03d}.jpg" if m else None,
                    })
                results.append({"title": title, "text": body, "images": images})
                if len(results) >= top_k:
                    break
        return results

    def atlas_index(self) -> dict:
        """结构化图谱索引：3 本图谱 -> 病种 -> 图注 + 图号映射的图片文件名。"""
        atlases: list[dict] = []
        for stem, sections in self.atlas_files.items():
            diseases: list[dict] = []
            for title, body in sections:
                clean_title = re.sub(r"[（(].*?[)）]", "", title).strip()
                figures: list[dict] = []
                for line in body.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    text = line.lstrip("- ").strip()
                    m = _FIGURE_RE.search(text)
                    figures.append({
                        "text": text,
                        "file": f"fig{m.group(1)}-{int(m.group(2)):03d}.jpg" if m else None,
                    })
                diseases.append({"title": clean_title, "figures": figures})
            atlases.append({
                "id": stem,
                "name": _ATLAS_NAMES.get(stem, stem),
                "diseases": diseases,
            })
        return {"atlases": atlases, "total": sum(len(a["diseases"]) for a in atlases)}


class FarmingKnowledge(_MarkdownKnowledge):
    """养殖知识域：12 章《养鸡疑难300问》。"""

    def __init__(self, base_dir: Path = FARMING_KNOWLEDGE_DIR) -> None:
        self.articles: dict[str, list[dict]] = {}  # 章 stem -> [{q, title, text}]
        super().__init__(base_dir)
        self._parse_articles()

    def _parse_articles(self) -> None:
        """把每章的 `### QN 标题` 问答条目拆成单篇咨询文章，按章分类。"""
        for stem, ch in self.chapters.items():
            items: list[dict] = []
            cur_q = ""
            cur_title = ""
            cur_body: list[str] = []

            def flush() -> None:
                nonlocal cur_q, cur_title, cur_body
                if cur_q:
                    items.append({
                        "q": cur_q,
                        "title": cur_title,
                        "text": "\n".join(cur_body).strip(),
                    })
                cur_q = ""
                cur_title = ""
                cur_body = []

            for line in ch.text.splitlines():
                stripped = line.strip()
                m = _Q_RE.match(stripped)
                if m:
                    flush()
                    cur_q = m.group(1)
                    cur_title = m.group(2).strip()
                    cur_body = []
                elif stripped.startswith("## "):
                    # 章节级小节标题（如「关键处置要点」「关联」）不属于问答正文，终止当前问答
                    flush()
                elif cur_q:
                    cur_body.append(line)
            flush()
            self.articles[stem] = items

    def categories(self) -> list[dict]:
        """返回养鸡技巧分类目录（按章），含每类文章数与文章列表。"""
        result: list[dict] = []
        for stem, name in _FARMING_CATEGORIES.items():
            if stem not in self.articles:
                continue
            items = self.articles[stem]
            result.append({
                "id": stem,
                "name": name,
                "count": len(items),
                "articles": [
                    {"id": f"{stem}-q{q}", "title": title, "excerpt": text[:120]}
                    for q, title, text in (
                        (a["q"], a["title"], a["text"]) for a in items
                    )
                ],
            })
        return result

    def article(self, article_id: str) -> dict | None:
        """按 id（{章}-q{问号}）返回单篇问答全文。"""
        if "-q" not in article_id:
            return None
        stem, q = article_id.rsplit("-q", 1)
        category = _FARMING_CATEGORIES.get(stem)
        if not category:
            return None
        for a in self.articles.get(stem, []):
            if a["q"] == q:
                return {
                    "id": article_id,
                    "categoryId": stem,
                    "category": category,
                    "title": a["title"],
                    "content": a["text"],
                }
        return None



# 两个知识域单例
knowledge = DiseaseKnowledge()
farming_knowledge = FarmingKnowledge()
