"""《禽病防治教材》知识库加载与检索。

将本地 Markdown 章节加载为可检索的领域知识，用于给诊断提示词注入参考依据，
让模型依据教材而非凭空作答。
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge"

# 禽种关键词 -> 加权分，用于按禽种优先匹配相关章节
_SPECIES_BOOST: dict[str, tuple[tuple[str, int], ...]] = {
    "chicken": (("鸡", 3), ("禽", 1)),
    "duck": (("鸭", 3),),
    "goose": (("鹅", 3),),
    "turkey": (("火鸡", 3), ("鸡", 1)),
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


class DiseaseKnowledge:
    def __init__(self, base_dir: Path = KNOWLEDGE_DIR) -> None:
        self.chapters: dict[str, Chapter] = {}
        self.cheatsheet = ""
        self.glossary = ""
        self.patterns = ""
        self._load(base_dir)

    def _load(self, base_dir: Path) -> None:
        chapters_dir = base_dir / "chapters"
        for path in sorted(chapters_dir.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            title = self._extract_title(text)
            if title:
                self.chapters[path.stem] = Chapter(
                    id=path.stem, title=title, text=text
                )

        for name in ("cheatsheet", "glossary", "patterns"):
            p = base_dir / f"{name}.md"
            if p.exists():
                setattr(self, name, p.read_text(encoding="utf-8"))

    @staticmethod
    def _extract_title(text: str) -> str:
        m = re.search(r"^#\s*第\d+章\s*(.+)$", text, re.MULTILINE)
        return m.group(1).strip() if m else ""

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
