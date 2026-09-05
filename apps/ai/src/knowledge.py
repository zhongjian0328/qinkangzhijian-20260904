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
        self.appendix: dict[str, str] = {}       # 附录名 -> 正文
        self.manifest = ""                        # 图号 -> 文件/页码索引
        super().__init__(base_dir)
        self._load_extras(base_dir)

    def _load_extras(self, base_dir: Path) -> None:
        atlas_dir = base_dir / "atlas"
        for path in sorted(atlas_dir.glob("*.md")):
            self.atlas.extend(_parse_sections(path.read_text(encoding="utf-8")))

        appendix_dir = base_dir / "appendix"
        for path in sorted(appendix_dir.glob("*.md")):
            self.appendix[path.stem] = path.read_text(encoding="utf-8")

        mp = base_dir / "manifest.md"
        if mp.exists():
            self.manifest = mp.read_text(encoding="utf-8")

    @staticmethod
    def _name_match(name: str, header: str) -> bool:
        """病名与图谱标题模糊匹配（"新城疫" 命中 "鸡新城疫（p22–p30）"）。"""
        h = re.sub(r"[（(].*?[)）]", "", header).strip()
        n = (name or "").strip()
        if not n or not h:
            return False
        return n in h or h in n

    def lookup_figures(self, disease_title: str, top_k: int = 1) -> list[dict]:
        """按病名在图谱中查找病变图注，返回 [{title, text}]。"""
        results: list[dict] = []
        for title, body in self.atlas:
            if self._name_match(disease_title, title):
                results.append({"title": title, "text": body})
                if len(results) >= top_k:
                    break
        return results


class FarmingKnowledge(_MarkdownKnowledge):
    """养殖知识域：12 章《养鸡疑难300问》。"""

    def __init__(self, base_dir: Path = FARMING_KNOWLEDGE_DIR) -> None:
        super().__init__(base_dir)


# 两个知识域单例
knowledge = DiseaseKnowledge()
farming_knowledge = FarmingKnowledge()
