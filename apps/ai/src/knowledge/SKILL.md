---
name: qinbing-fangzhi
description: "Knowledge base from 《禽病防治教材》(a Chinese veterinary textbook on poultry disease prevention and control). Use when identifying, differentiating, preventing, or treating poultry diseases (病毒病/细菌病/寄生虫病/普通病), or when applying prevention-immunization-diagnosis-treatment workflows for poultry."
---

<!-- argument-hint: [病名、症状、鉴别诊断、免疫程序、用药、消毒、章节号] -->

# 禽病防治教材

**来源**: 禽病防治教材（兽医教学教材） | **章节**: 42 | **生成**: 2026-09-04

## How to Use This Skill

- **不带参数** — 加载下方核心框架，了解禽病防治的总思路
- **带病名** — 问「禽流感」「球虫」「新城疫」等，我会读取对应章节作答
- **带症状** — 描述症状（如「血便」「花斑肾」「腺胃乳头出血」），我用 cheatsheet 的鉴别诊断速查定位疑似病
- **带章节号** — 问 `ch05`、`ch04`，直接读取该章
- **浏览** — 问「有哪些章节？」查看完整索引

当你问及核心框架之外的具体内容时，我会先读取相应章节文件再回答。

---

## Core Frameworks & Mental Models

兽医禽病防治的四条总思路（对应 ch01–ch03，是全书各病的统摄框架）：

- **传染病流行三环节**：任何传染性禽病都必须同时具备「传染源 + 传播途径 + 易感禽群」才流行。防制即围绕三环节——消灭传染源（检疫、淘汰、隔离病禽）、切断传播途径（消毒、杀虫灭鼠、防鸟入舍、粪污处理）、降低易感性（免疫、提高抵抗力）。判断一个防控措施是否到位，先看它落在哪一环节。

- **诊断四步递进**（ch02）：先流行病学（发病季节、易感动物、发病率死亡率、传播速度），再临床检查（体温、采食、粪便、呼吸、神经症状），再病理剖检（特征性病变），最后实验室确诊（细菌分离、病毒分离、血清学 HI/琼扩/ELISA、镜检）。初步诊断靠前三步，确诊靠第四步；病变是「金线索」，例如腺胃乳头出血+肠道枣核状溃疡→新城疫。

- **免疫三法与应用场景**（ch01）：滴鼻点眼/饮水/喷雾/刺种/注射各有适用场景——呼吸道病疫苗（传支、喉气管炎）宜喷雾，禽痘翼膜刺种，马立克氏病 1 日龄皮下，灭活油苗肌注。**免疫合格判据**：接种后 2~3 周抗体较接种前升高 ≥4 倍、保护率 >70%。母源抗体干扰是雏禽免疫失败主因，需据抗体水平定首免日龄（如法氏囊病以母源抗体阳性率 <80% 决定 10~16 日龄首免）。

- **用药四原则**（ch03）：一是选对途径——氨基糖苷类肠道不吸收、勿投水治全身病，拌料/饮水/注射/气雾各有适用范围；二是防中毒——家禽对有机磷极敏感（敌百虫严禁内服）、链霉素/磺胺类多经肾排泄易伤肾；三是控制疗程（常规 3~5d）与停药期；四是夏季防热应激（饲料 0.04% 维生素 C 或 0.4% 碳酸氢钠）。

**各论部分（ch04–ch42）按「病种」组织**，每个病种固定六段：病原 → 流行病学 → 症状 → 病理变化 → 诊断 → 防制。诊断时优先用 cheatsheet 的「症状→疑似病」速查与「易混病鉴别要点」，再回读对应章节确认细节。

---

## Chapter Index

| # | 标题 | 关键内容 |
|---|------|---------|
| [ch01](chapters/ch01-qinbing-yufang.md) | 禽病的预防 | 解剖生理特点、传染病三环节、免疫方法、消毒杀虫灭鼠 |
| [ch02](chapters/ch02-qinbing-zhenduan.md) | 禽病的诊断 | 流行病学、临床、病理、实验室四步诊断 |
| [ch03](chapters/ch03-qinbing-yaowu-zhiliao.md) | 禽病的药物治疗 | 用药原则、用药方法、防中毒 |
| [ch04](chapters/ch04-qinliugan.md) | 禽流感 | A型流感病毒、H5N1/Re-1疫苗、人畜共患 |
| [ch05](chapters/ch05-xinchengyi.md) | 新城疫 | 腺胃乳头出血、枣核溃疡、HI判定 |
| [ch06](chapters/ch06-ji-chuanzhi.md) | 鸡传染性支气管炎 | 花斑肾、H120/H52疫苗 |
| [ch07](chapters/ch07-ji-chuanhou.md) | 鸡传染性喉气管炎 | 咳血、喉头干酪样凝栓 |
| [ch08](chapters/ch08-malikeshi.md) | 马立克氏病 | 神经型劈叉、法氏囊萎缩 |
| [ch09](chapters/ch09-qinbaixuebing.md) | 禽白血病 | 法氏囊肿大、净化 |
| [ch10](chapters/ch10-fashinang.md) | 传染性法氏囊病 | 免疫抑制、母源抗体首免 |
| [ch11](chapters/ch11-chuanpinxue.md) | 鸡传染性贫血 | 血细胞比容<20% |
| [ch12](chapters/ch12-wangzhuang-neipi.md) | 网状内皮组织增殖病 | 免疫抑制 |
| [ch13](chapters/ch13-xianbingdu.md) | 禽腺病毒病 | EDS-76、包涵体肝炎、安卡拉病 |
| [ch14](chapters/ch14-qindou.md) | 禽痘 | 翼膜刺种 |
| [ch15](chapters/ch15-bingduxing-guanjieyan.md) | 禽病毒性关节炎 | 跗关节 |
| [ch16](chapters/ch16-naojisuanyan.md) | 禽脑脊髓炎 | 观星状 |
| [ch17](chapters/ch17-yawen.md) | 鸭瘟 | 大头瘟、食道泄殖腔假膜 |
| [ch18](chapters/ch18-yabingduxing-ganyan.md) | 鸭病毒性肝炎 | 角弓反张 |
| [ch19](chapters/ch19-yatanbusu.md) | 鸭坦布苏病 | 雏鸭 |
| [ch20](chapters/ch20-chufanya-xixiao.md) | 雏番鸭细小病毒病 | 与小鹅瘟同科 |
| [ch21](chapters/ch21-xiaoewen.md) | 小鹅瘟 | 母鹅两针免疫 |
| [ch22](chapters/ch22-dachangganjun.md) | 禽大肠杆菌病 | O1/O2/O36/O78 |
| [ch23](chapters/ch23-shamenshijun.md) | 禽沙门氏菌病 | 鸡白痢、禽伤寒 |
| [ch24](chapters/ch24-bashiganjun.md) | 禽巴氏杆菌病 | 禽霍乱、两极浓染 |
| [ch25](chapters/ch25-chuanbiyan.md) | 鸡传染性鼻炎 | 多价灭活油苗 |
| [ch26](chapters/ch26-huaisixing-changyan.md) | 鸡坏死性肠炎 | 产气荚膜梭菌 |
| [ch27](chapters/ch27-putaoqiujun.md) | 鸡葡萄球菌病 | 金黄葡萄球菌 |
| [ch28](chapters/ch28-wanquganjun.md) | 禽弯曲杆菌性肝炎 | 肝星状坏死 |
| [ch29](chapters/ch29-lvnongganjun.md) | 鸡绿脓杆菌病 | 铜绿假单胞菌 |
| [ch30](chapters/ch30-yachuanranxing-jiangmoyan.md) | 鸭传染性浆膜炎 | 10~14日龄免疫 |
| [ch31](chapters/ch31-zhiyuanti.md) | 禽支原体病 | MG/MS、气囊炎 |
| [ch32](chapters/ch32-qumeijun.md) | 禽曲霉菌病 | 孵化室 |
| [ch33](chapters/ch33-nianzhujun.md) | 禽念珠菌病 | 嗉囊 |
| [ch34](chapters/ch34-yiyuanti.md) | 禽衣原体病 | 人畜共患 |
| [ch35](chapters/ch35-qiuchong.md) | 禽球虫病 | 盲肠球虫、血便 |
| [ch36](chapters/ch36-zuzhidichong.md) | 禽组织滴虫病 | 盲肠栓子+肝凹陷坏死 |
| [ch37](chapters/ch37-zhubaixibao.md) | 禽住白细胞虫病 | 库蠓/蚋传播 |
| [ch38](chapters/ch38-changnei-jishengchong.md) | 禽肠内寄生虫病 | 鸡蛔虫、鸡绦虫 |
| [ch39](chapters/ch39-tiwai-jishengchong.md) | 禽体外寄生虫病 | 皮刺螨、羽虱 |
| [ch40](chapters/ch40-yingyang-daixie.md) | 营养代谢病 | 痛风、维生素缺乏、钙磷缺乏 |
| [ch41](chapters/ch41-zhongdu.md) | 常见中毒病 | 霉菌毒素、食盐、农药 |
| [ch42](chapters/ch42-qita-changjian.md) | 家禽常见其他病 | 啄癖、肉鸡猝死综合征 |

## Topic Index

**总论**：禽病预防 → ch01 · 传染病三环节 → ch01 · 免疫方法 → ch01, ch03 · 消毒 → ch01 · 诊断 → ch02 · 用药 → ch03

**病毒病**：禽流感 → ch04 · 新城疫 → ch05 · 传支 → ch06 · 喉气管炎 → ch07 · 马立克氏病 → ch08 · 禽白血病 → ch09 · 法氏囊病 → ch10 · 传染性贫血 → ch11 · 网状内皮增殖病 → ch12 · 腺病毒病 → ch13 · 禽痘 → ch14 · 病毒性关节炎 → ch15 · 脑脊髓炎 → ch16 · 鸭瘟 → ch17 · 鸭病毒性肝炎 → ch18 · 鸭坦布苏病 → ch19 · 雏番鸭细小病毒病 → ch20 · 小鹅瘟 → ch21

**细菌病**：大肠杆菌病 → ch22 · 沙门氏菌病 → ch23 · 巴氏杆菌病 → ch24 · 传染性鼻炎 → ch25 · 坏死性肠炎 → ch26 · 葡萄球菌病 → ch27 · 弯曲杆菌性肝炎 → ch28 · 绿脓杆菌病 → ch29 · 鸭传染性浆膜炎 → ch30

**其他微生物病**：支原体病 → ch31 · 曲霉菌病 → ch32 · 念珠菌病 → ch33 · 衣原体病 → ch34

**寄生虫病**：球虫病 → ch35 · 组织滴虫病 → ch36 · 住白细胞虫病 → ch37 · 肠内寄生虫 → ch38 · 体外寄生虫 → ch39

**普通病**：营养代谢病/痛风 → ch40 · 中毒病 → ch41 · 啄癖/猝死综合征 → ch42

**鉴别诊断**：腺胃乳头出血 → ch05 · 花斑肾 → ch06 · 血便 → ch35, ch36 · 法氏囊萎缩/肿大 → ch08, ch09 · 角弓反张 → ch18 · 观星状 → ch16, ch40

## Supporting Files

- [glossary.md](glossary.md) — 关键术语定义（病名、诊断/免疫/解剖生理术语）
- [patterns.md](patterns.md) — 免疫、诊断、消毒、用药方法与程序
- [cheatsheet.md](cheatsheet.md) — 免疫程序、诊断阈值、鉴别诊断、用药禁忌速查表

---

## Scope & Limits

本 skill 仅覆盖《禽病防治教材》内容，为教学参考与诊疗思路梳理，不构成诊疗处方；实际用药须遵循当地兽药法规、停药期与执业兽医指导。源文件为 Word 文档（内含 0 张图片），故无解剖图/病理图。如需超出本书的疾病或最新防控方案，请结合现行标准与相关技能另行查证。
