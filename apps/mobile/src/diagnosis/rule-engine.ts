// AI兽医诊断：离线规则引擎（26 种禽病，移植自 v3 原型《禽病防治教材》42 章）
// 作为豆包在线诊断的离线兜底：无网络或 AI 不可用时，基于症状/病变权重匹配给出基础诊断。
import type { VetDiagnosisResult } from '@qinkang/types';

export interface DiseaseRule {
  id: string;
  name: string;
  category: string; // viral | bacterial | fungal | parasitic | nutritional | toxic
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  zoonotic: boolean;
  symptoms: { name: string; weight: number; characteristic: boolean }[];
  lesions: { name: string; weight: number; characteristic: boolean }[];
  treatment: string[];
  prevention: string[];
}

export const DISEASE_RULES: DiseaseRule[] = [
  {
    id: 'avian_influenza', name: '禽流感', category: 'viral', riskLevel: 'critical', zoonotic: true,
    symptoms: [
      { name: '体温升高', weight: 2, characteristic: false },
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '采食量下降', weight: 2, characteristic: false },
      { name: '呼吸困难', weight: 3, characteristic: false },
      { name: '头颈部水肿', weight: 5, characteristic: true },
      { name: '冠髯发黑发紫', weight: 5, characteristic: true },
      { name: '脚鳞出血', weight: 5, characteristic: true },
      { name: '产蛋量骤降', weight: 3, characteristic: false },
      { name: '神经症状', weight: 3, characteristic: false },
      { name: '绿色稀便', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '全身浆膜黏膜出血', weight: 4, characteristic: false },
      { name: '腺胃乳头出血', weight: 3, characteristic: false },
      { name: '肌胃角质层下出血', weight: 3, characteristic: false },
      { name: '胰腺坏死出血', weight: 4, characteristic: true },
      { name: '呼吸道黏膜出血', weight: 3, characteristic: false },
      { name: '输卵管炎', weight: 2, characteristic: false },
    ],
    treatment: ['抗病毒中药（双黄连、板青颗粒）混饮5-7天', '抗生素防继发感染（阿莫西林）饮水3-5天', '电解多维+维生素C饮水'],
    prevention: ['Re-1株灭活苗免疫', '加强生物安全，杜绝候鸟接触'],
  },
  {
    id: 'newcastle_disease', name: '新城疫', category: 'viral', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '体温升高', weight: 2, characteristic: false },
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '呼吸困难', weight: 3, characteristic: false },
      { name: '排绿色稀便', weight: 4, characteristic: true },
      { name: '神经症状（扭颈、观星状）', weight: 5, characteristic: true },
      { name: '产蛋量下降', weight: 3, characteristic: false },
      { name: '软壳蛋增多', weight: 2, characteristic: false },
      { name: '翅腿麻痹', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '腺胃乳头出血', weight: 5, characteristic: true },
      { name: '肠道枣核状溃疡', weight: 5, characteristic: true },
      { name: '盲肠扁桃体出血坏死', weight: 4, characteristic: true },
      { name: '直肠黏膜条纹状出血', weight: 3, characteristic: false },
      { name: '呼吸道黏膜充血出血', weight: 2, characteristic: false },
    ],
    treatment: ['新城疫Ⅳ系/克隆30紧急接种2-4羽份', '抗病毒中药混饮5天', '抗生素防继发感染', '电解多维饮水'],
    prevention: ['6-10日龄三联弱毒苗+油苗', '60日龄I系肌注', '120日龄二联油苗'],
  },
  {
    id: 'infectious_bronchitis', name: '传染性支气管炎', category: 'viral', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '咳嗽', weight: 3, characteristic: false },
      { name: '打喷嚏', weight: 3, characteristic: false },
      { name: '气管啰音', weight: 4, characteristic: true },
      { name: '流鼻涕', weight: 2, characteristic: false },
      { name: '产蛋量下降', weight: 3, characteristic: false },
      { name: '蛋壳异常', weight: 4, characteristic: true },
      { name: '蛋白稀薄', weight: 3, characteristic: true },
      { name: '肾脏肿大苍白', weight: 4, characteristic: false },
    ],
    lesions: [
      { name: '气管黏膜充血水肿', weight: 3, characteristic: false },
      { name: '气管内浆液性渗出物', weight: 3, characteristic: false },
      { name: '花斑肾', weight: 5, characteristic: true },
      { name: '输尿管扩张', weight: 3, characteristic: false },
      { name: '卵泡充血出血', weight: 2, characteristic: false },
    ],
    treatment: ['抗病毒中药混饮5天', '抗生素防继发感染（肾型禁用磺胺类）', '肾肿解毒药（小苏打0.1-0.2%饮水）', '电解多维饮水'],
    prevention: ['1-3日龄H120滴鼻点眼', '25-30日龄H52饮水'],
  },
  {
    id: 'infectious_laryngotracheitis', name: '传染性喉气管炎', category: 'viral', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '呼吸困难', weight: 5, characteristic: true },
      { name: '伸颈张口呼吸', weight: 5, characteristic: true },
      { name: '咳血性渗出物', weight: 5, characteristic: true },
      { name: '喘鸣', weight: 4, characteristic: true },
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '产蛋量下降', weight: 2, characteristic: false },
      { name: '结膜炎', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '喉头气管黏膜出血', weight: 4, characteristic: false },
      { name: '喉头干酪样凝栓', weight: 5, characteristic: true },
      { name: '气管内血性渗出物', weight: 5, characteristic: true },
      { name: '气管黏膜糜烂', weight: 3, characteristic: false },
    ],
    treatment: ['抗病毒中药混饮5天', '泰乐菌素防继发感染', '氨茶碱缓解呼吸困难', '电解多维+维生素A饮水'],
    prevention: ['35-40日龄弱毒苗1羽份', '80-100日龄二免（疫区）'],
  },
  {
    id: 'mareks_disease', name: '马立克氏病', category: 'viral', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '劈叉姿势（一腿前伸一腿后伸）', weight: 5, characteristic: true },
      { name: '翅下垂', weight: 4, characteristic: true },
      { name: '斜颈', weight: 3, characteristic: false },
      { name: '消瘦', weight: 3, characteristic: false },
      { name: '虹膜褪色（灰眼）', weight: 4, characteristic: true },
      { name: '瞳孔缩小不规则', weight: 4, characteristic: true },
      { name: '皮肤毛囊肿瘤', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '坐骨神经单侧肿大', weight: 5, characteristic: true },
      { name: '神经横纹消失', weight: 4, characteristic: true },
      { name: '法氏囊萎缩', weight: 4, characteristic: true },
      { name: '内脏肿瘤', weight: 3, characteristic: false },
      { name: '性腺肿瘤', weight: 3, characteristic: false },
    ],
    treatment: ['无特效治疗，淘汰病鸡', '加强生物安全全进全出'],
    prevention: ['1日龄内火鸡疱疹病毒苗颈部皮下1羽份'],
  },
  {
    id: 'infectious_bursal', name: '传染性法氏囊病', category: 'viral', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '羽毛蓬松', weight: 2, characteristic: false },
      { name: '排白色水样稀便', weight: 4, characteristic: true },
      { name: '啄肛', weight: 3, characteristic: true },
      { name: '震颤', weight: 3, characteristic: false },
      { name: '脱水', weight: 3, characteristic: false },
      { name: '畏寒扎堆', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '法氏囊肿大出血', weight: 5, characteristic: true },
      { name: '法氏囊内胶冻样渗出', weight: 4, characteristic: true },
      { name: '胸肌腿肌出血', weight: 4, characteristic: true },
      { name: '腺胃与肌胃交界处出血', weight: 3, characteristic: false },
    ],
    treatment: ['高免卵黄抗体肌注（发病早期）', '肾肿解毒药（小苏打）饮水', '抗生素防继发感染', '电解多维+葡萄糖饮水'],
    prevention: ['母源抗体<80%则10-16日龄首免', '种鸡18-20周龄灭活油苗'],
  },
  {
    id: 'fowl_cholera', name: '禽霍乱（巴氏杆菌病）', category: 'bacterial', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '最急性突然死亡', weight: 5, characteristic: true },
      { name: '体温升高', weight: 3, characteristic: false },
      { name: '呼吸困难', weight: 2, characteristic: false },
      { name: '口流涎', weight: 2, characteristic: false },
      { name: '排绿色或灰白色稀便', weight: 3, characteristic: false },
      { name: '冠髯发黑肿胀', weight: 3, characteristic: false },
      { name: '关节肿大（慢性）', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '肝针尖大灰白色坏死点', weight: 5, characteristic: true },
      { name: '心冠脂肪出血', weight: 4, characteristic: true },
      { name: '十二指肠出血性炎症', weight: 3, characteristic: false },
      { name: '心包积液', weight: 2, characteristic: false },
    ],
    treatment: ['阿莫西林0.02%饮水3-5天', '恩诺沙星0.005%饮水3-5天', '磺胺嘧啶0.2%拌料（产蛋鸡慎用）'],
    prevention: ['禽霍乱灭活苗免疫', '加强消毒减少应激'],
  },
  {
    id: 'colibacillosis', name: '禽大肠杆菌病', category: 'bacterial', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '采食量下降', weight: 2, characteristic: false },
      { name: '呼吸困难', weight: 3, characteristic: false },
      { name: '排黄绿色稀便', weight: 2, characteristic: false },
      { name: '脐炎（雏鸡）', weight: 4, characteristic: true },
      { name: '眼炎', weight: 3, characteristic: false },
      { name: '关节肿大', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '气囊炎', weight: 5, characteristic: true },
      { name: '心包炎', weight: 5, characteristic: true },
      { name: '肝周炎', weight: 5, characteristic: true },
      { name: '卵黄性腹膜炎', weight: 4, characteristic: true },
      { name: '输卵管炎', weight: 3, characteristic: false },
    ],
    treatment: ['恩诺沙星0.005%饮水3-5天', '阿莫西林+克拉维酸饮水3-5天', '氟苯尼考（产蛋期禁用）'],
    prevention: ['加强通风降密度', '种蛋消毒', '大肠杆菌多价苗'],
  },
  {
    id: 'coccidiosis', name: '球虫病', category: 'parasitic', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '排血便（盲肠球虫）', weight: 5, characteristic: true },
      { name: '排西红柿样便（小肠球虫）', weight: 4, characteristic: true },
      { name: '贫血鸡冠苍白', weight: 3, characteristic: false },
      { name: '消瘦', weight: 3, characteristic: false },
      { name: '扎堆畏寒', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '盲肠肿大3-5倍', weight: 5, characteristic: true },
      { name: '盲肠内充满暗红血液或血凝块', weight: 5, characteristic: true },
      { name: '小肠黏膜出血点', weight: 4, characteristic: false },
      { name: '肠壁增厚', weight: 3, characteristic: false },
    ],
    treatment: ['磺胺氯吡嗪钠0.03%饮水3天', '地克珠利1ppm饮水3-5天', '氨丙啉饮水5天', '维生素K+电解多维饮水'],
    prevention: ['球虫疫苗或药物轮换预防', '保持鸡舍干燥', '粪便堆积发酵'],
  },
  {
    id: 'histomoniasis', name: '组织滴虫病（黑头病）', category: 'parasitic', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '排硫磺色稀便', weight: 4, characteristic: true },
      { name: '冠髯发黑发紫（黑头）', weight: 5, characteristic: true },
      { name: '消瘦', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '盲肠肿大变硬', weight: 4, characteristic: false },
      { name: '盲肠内同心层干酪样栓子', weight: 5, characteristic: true },
      { name: '肝表面圆形凹陷坏死灶', weight: 5, characteristic: true },
    ],
    treatment: ['甲硝唑0.05%饮水5-7天（产蛋期禁用）', '地美硝唑0.05%拌料5天', '左旋咪唑驱异刺线虫'],
    prevention: ['定期驱虫', '鸡火鸡分开饲养', '清除蚯蚓'],
  },
  {
    id: 'mycoplasmosis', name: '慢性呼吸道病(CRD)', category: 'bacterial', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '流鼻涕', weight: 3, characteristic: false },
      { name: '咳嗽', weight: 3, characteristic: false },
      { name: '气管啰音', weight: 4, characteristic: false },
      { name: '呼吸困难', weight: 3, characteristic: false },
      { name: '结膜炎', weight: 3, characteristic: false },
      { name: '眶下窦肿胀', weight: 4, characteristic: true },
      { name: '生长迟缓', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '气囊增厚浑浊', weight: 4, characteristic: false },
      { name: '气囊内干酪样渗出物', weight: 4, characteristic: true },
      { name: '气管黏膜充血', weight: 2, characteristic: false },
    ],
    treatment: ['泰乐菌素0.05%饮水5天', '替米考星饮水5天', '强力霉素0.01%饮水5天'],
    prevention: ['种鸡群净化', '种蛋高温处理', '支原体疫苗'],
  },
  {
    id: 'gout', name: '家禽痛风', category: 'nutritional', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '排石灰水样白色稀便', weight: 5, characteristic: true },
      { name: '消瘦', weight: 2, characteristic: false },
      { name: '关节肿大（关节型）', weight: 4, characteristic: false },
      { name: '运动迟缓', weight: 2, characteristic: false },
      { name: '鸡冠苍白', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '内脏表面白色石膏样尿酸盐沉积', weight: 5, characteristic: true },
      { name: '花斑肾', weight: 4, characteristic: false },
      { name: '输尿管扩张充满尿酸盐', weight: 4, characteristic: true },
    ],
    treatment: ['降低饲料蛋白水平', '小苏打0.1-0.2%饮水3-5天', '肾肿解毒药饮水', '保证充足饮水'],
    prevention: ['合理蛋白水平', '避免肾毒性药物', '补充维生素A'],
  },
  {
    id: 'chicken_anemia', name: '鸡传染性贫血', category: 'viral', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '鸡冠肉垂苍白', weight: 4, characteristic: true },
      { name: '翅膀皮炎（蓝翅病）', weight: 4, characteristic: true },
      { name: '生长迟缓', weight: 2, characteristic: false },
      { name: '点状出血', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '股骨骨髓脂肪化（黄白色）', weight: 5, characteristic: true },
      { name: '胸腺萎缩', weight: 4, characteristic: true },
      { name: '法氏囊萎缩', weight: 3, characteristic: false },
      { name: '皮下肌肉出血', weight: 3, characteristic: false },
    ],
    treatment: ['无特效治疗，支持疗法', '抗生素防继发感染', '电解多维+铁制剂饮水'],
    prevention: ['种鸡13-15周龄活苗饮水免疫'],
  },
  {
    id: 'fowl_pox', name: '禽痘', category: 'viral', riskLevel: 'low', zoonotic: false,
    symptoms: [
      { name: '冠肉垂眼睑皮肤痘疹', weight: 5, characteristic: true },
      { name: '痘疹结痂', weight: 4, characteristic: true },
      { name: '口腔咽喉假膜（白喉型）', weight: 5, characteristic: true },
      { name: '呼吸困难（白喉型）', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '皮肤型-冠肉垂无毛处结节', weight: 5, characteristic: true },
      { name: '白喉型-口腔咽喉黏膜假膜', weight: 5, characteristic: true },
    ],
    treatment: ['无特效抗病毒药，对症治疗', '碘甘油涂擦痘疹', '抗生素防继发感染', '电解多维+维生素A饮水'],
    prevention: ['15日龄前后翼膜刺种弱毒苗'],
  },
  {
    id: 'salmonellosis', name: '禽沙门氏菌病', category: 'bacterial', riskLevel: 'medium', zoonotic: true,
    symptoms: [
      { name: '雏鸡白痢-白色糊状便', weight: 5, characteristic: true },
      { name: '肛门周围羽毛被粪便污染', weight: 4, characteristic: true },
      { name: '精神沉郁扎堆', weight: 2, characteristic: false },
      { name: '禽伤寒-冠髯苍白皱缩', weight: 3, characteristic: false },
      { name: '排黄绿色稀便', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '雏鸡-肝肿大条纹状出血', weight: 3, characteristic: false },
      { name: '肺灰白色坏死结节', weight: 3, characteristic: false },
      { name: '禽伤寒-肝古铜色', weight: 5, characteristic: true },
      { name: '肝脾肿大', weight: 2, characteristic: false },
    ],
    treatment: ['氟苯尼考饮水（产蛋期禁用）', '恩诺沙星0.005%饮水3-5天', '阿莫西林0.02%饮水3-5天'],
    prevention: ['种鸡群检疫净化', '种蛋消毒', '雏鸡开口药预防'],
  },
  {
    id: 'aspergillosis', name: '禽曲霉菌病', category: 'fungal', riskLevel: 'medium', zoonotic: true,
    symptoms: [
      { name: '呼吸困难', weight: 4, characteristic: false },
      { name: '喘气', weight: 3, characteristic: false },
      { name: '采食量下降', weight: 2, characteristic: false },
      { name: '眼炎（一侧眼瞬膜下黄色干酪样团块）', weight: 4, characteristic: true },
      { name: '扭颈等神经症状（脑型）', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '肺表面灰白色或黄白色结节', weight: 5, characteristic: true },
      { name: '气囊膜上圆形结节或霉斑', weight: 5, characteristic: true },
      { name: '结节切面干酪样', weight: 4, characteristic: true },
    ],
    treatment: ['制霉菌素拌料3-5天', '克霉唑1%拌料3-5天', '硫酸铜1:2000饮水3天', '更换发霉饲料垫料'],
    prevention: ['不喂发霉饲料', '垫料干燥', '通风降湿'],
  },
  {
    id: 'necrotic_enteritis', name: '坏死性肠炎', category: 'bacterial', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '采食量下降', weight: 2, characteristic: false },
      { name: '排黑色或血样稀便', weight: 4, characteristic: true },
      { name: '突然死亡', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '小肠中后段黏膜坏死', weight: 5, characteristic: true },
      { name: '肠壁增厚', weight: 3, characteristic: false },
      { name: '肠腔内灰黄色假膜', weight: 4, characteristic: true },
      { name: '肝肿大有坏死灶', weight: 2, characteristic: false },
    ],
    treatment: ['阿莫西林0.02%饮水3-5天', '青霉素饮水3-5天', '杆菌肽锌拌料5天', '合并球虫时同时治疗'],
    prevention: ['控制球虫', '避免高蛋白饲料', '益生菌调节肠道'],
  },
  {
    id: 'duck_plague', name: '鸭瘟', category: 'viral', riskLevel: 'critical', zoonotic: false,
    symptoms: [
      { name: '头颈肿胀（大头瘟）', weight: 5, characteristic: true },
      { name: '体温升高', weight: 3, characteristic: false },
      { name: '脚软行走困难', weight: 3, characteristic: false },
      { name: '排绿色或灰白色稀便', weight: 3, characteristic: false },
      { name: '流泪眼睑水肿', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '食道黏膜假膜溃疡', weight: 5, characteristic: true },
      { name: '泄殖腔黏膜假膜溃疡', weight: 5, characteristic: true },
      { name: '肝表面不规则坏死灶', weight: 4, characteristic: false },
      { name: '头颈皮下胶样浸润', weight: 4, characteristic: true },
    ],
    treatment: ['鸭瘟高免血清/卵黄抗体肌注（早期）', '抗生素防继发感染', '电解多维饮水'],
    prevention: ['雏鸭20日龄首免鸭胚化弱毒苗'],
  },
  {
    id: 'duck_viral_hepatitis', name: '鸭病毒性肝炎', category: 'viral', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '角弓反张（背脖）', weight: 5, characteristic: true },
      { name: '运动失调', weight: 4, characteristic: true },
      { name: '侧卧两腿痉挛', weight: 4, characteristic: true },
      { name: '死亡快（发病后数小时）', weight: 4, characteristic: true },
    ],
    lesions: [
      { name: '肝肿大质地脆弱', weight: 4, characteristic: false },
      { name: '肝表面出血点或出血斑', weight: 5, characteristic: true },
      { name: '胆囊肿大', weight: 3, characteristic: false },
      { name: '脾肿大有斑驳状出血', weight: 2, characteristic: false },
    ],
    treatment: ['高免卵黄抗体肌注（早期）', '抗病毒中药混饮', '电解多维+葡萄糖饮水'],
    prevention: ['母鸭开产前2次弱毒苗皮下注射'],
  },
  {
    id: 'gosling_plague', name: '小鹅瘟', category: 'viral', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '采食量下降', weight: 2, characteristic: false },
      { name: '排灰白色或黄绿色稀便', weight: 3, characteristic: false },
      { name: '鼻孔流出浆液性分泌物', weight: 2, characteristic: false },
      { name: '角弓反张', weight: 3, characteristic: false },
      { name: '抽搐', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '小肠中后段膨大', weight: 4, characteristic: false },
      { name: '肠腔内香肠状栓子', weight: 5, characteristic: true },
      { name: '肠黏膜坏死脱落', weight: 4, characteristic: true },
      { name: '肝肿大充血', weight: 2, characteristic: false },
    ],
    treatment: ['小鹅瘟高免血清皮下注射（早期）', '抗病毒中药混饮', '电解多维饮水'],
    prevention: ['母鹅留种前1个月肌注弱毒苗'],
  },
  {
    id: 'infectious_coryza', name: '传染性鼻炎', category: 'bacterial', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '流鼻涕', weight: 4, characteristic: false },
      { name: '打喷嚏', weight: 3, characteristic: false },
      { name: '面部水肿', weight: 5, characteristic: true },
      { name: '结膜炎', weight: 3, characteristic: false },
      { name: '眶下窦肿胀', weight: 4, characteristic: true },
      { name: '产蛋量下降', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '鼻腔和眶下窦黏膜充血肿胀', weight: 3, characteristic: false },
      { name: '窦内大量浆液性或脓性分泌物', weight: 4, characteristic: true },
      { name: '面部皮下水肿', weight: 4, characteristic: true },
    ],
    treatment: ['磺胺二甲氧嘧啶0.05%饮水5天（产蛋鸡慎用）', '红霉素0.01%饮水5天', '泰乐菌素0.05%饮水5天'],
    prevention: ['35日龄多价灭活油苗', '100日龄1mL二免'],
  },
  {
    id: 'duck_riemerella', name: '鸭传染性浆膜炎', category: 'bacterial', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '眼鼻分泌物增多', weight: 3, characteristic: false },
      { name: '咳嗽打喷嚏', weight: 2, characteristic: false },
      { name: '运动失调', weight: 3, characteristic: false },
      { name: '角弓反张（濒死期）', weight: 3, characteristic: false },
      { name: '排黄绿色稀便', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '纤维素性心包炎', weight: 4, characteristic: false },
      { name: '纤维素性肝周炎', weight: 4, characteristic: false },
      { name: '纤维素性气囊炎', weight: 4, characteristic: false },
      { name: '脑膜炎', weight: 3, characteristic: false },
    ],
    treatment: ['氟苯尼考0.01%饮水3-5天', '头孢噻呋肌注3天', '恩诺沙星0.005%饮水3-5天'],
    prevention: ['10-14日龄灭活菌苗', '减少应激加强通风'],
  },
  {
    id: 'leucocytozoonosis', name: '住白细胞虫病', category: 'parasitic', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '鸡冠苍白（白冠病）', weight: 5, characteristic: true },
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '咯血', weight: 4, characteristic: true },
      { name: '排绿色稀便', weight: 2, characteristic: false },
      { name: '突然死亡', weight: 3, characteristic: false },
    ],
    lesions: [
      { name: '肌肉白色小结节', weight: 5, characteristic: true },
      { name: '肝脾肿大', weight: 2, characteristic: false },
      { name: '血液稀薄', weight: 3, characteristic: false },
    ],
    treatment: ['磺胺间甲氧嘧啶0.05-0.1%饮水5天（产蛋鸡慎用）', '氯羟吡啶0.0125%拌料5天', '维生素K+电解多维饮水'],
    prevention: ['消灭库蠓', '纱窗防蠓', '流行季节药物预防'],
  },
  {
    id: 'eds76', name: '产蛋下降综合征(EDS-76)', category: 'viral', riskLevel: 'medium', zoonotic: false,
    symptoms: [
      { name: '产蛋量骤降20-38%', weight: 5, characteristic: true },
      { name: '软壳蛋', weight: 4, characteristic: true },
      { name: '薄壳蛋', weight: 4, characteristic: true },
      { name: '畸形蛋', weight: 3, characteristic: true },
      { name: '蛋壳颜色变浅', weight: 3, characteristic: false },
      { name: '一过性腹泻', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '卵巢萎缩', weight: 3, characteristic: false },
      { name: '输卵管炎', weight: 3, characteristic: false },
      { name: '子宫黏膜水肿', weight: 3, characteristic: false },
    ],
    treatment: ['无特效治疗，对症支持', '抗生素防继发感染', '电解多维+维生素AD3E饮水7天'],
    prevention: ['110-120日龄EDS-76灭活苗0.5mL肌注'],
  },
  {
    id: 'ankara_disease', name: '安卡拉病（心包积水综合征）', category: 'viral', riskLevel: 'high', zoonotic: false,
    symptoms: [
      { name: '精神沉郁', weight: 2, characteristic: false },
      { name: '采食量下降', weight: 2, characteristic: false },
      { name: '排黄色稀便', weight: 2, characteristic: false },
      { name: '突然死亡', weight: 4, characteristic: true },
      { name: '呼吸困难', weight: 2, characteristic: false },
    ],
    lesions: [
      { name: '心包大量清亮积液', weight: 5, characteristic: true },
      { name: '肝肿大发黄质脆', weight: 4, characteristic: true },
      { name: '肝坏死灶', weight: 3, characteristic: false },
      { name: '肾肿大', weight: 2, characteristic: false },
    ],
    treatment: ['安卡拉病高免卵黄抗体肌注（早期）', '保肝护肾中药混饮', '抗生素防继发感染', '电解多维饮水'],
    prevention: ['种鸡免疫腺病毒灭活苗', '控制免疫抑制病'],
  },
];

const SYNONYM_MAP: Record<string, string> = {
  发烧: '体温升高', 发热: '体温升高', 不吃食: '采食量下降', 食欲下降: '采食量下降',
  减料: '采食量下降', 没精神: '精神沉郁', 萎靡: '精神沉郁', 打蔫: '精神沉郁',
  喘: '呼吸困难', 喘气: '呼吸困难', 呼噜: '气管啰音', 甩鼻: '打喷嚏',
  拉稀: '排绿色稀便', 绿便: '排绿色稀便', 白便: '排白色水样稀便',
  血便: '排血便', 降蛋: '产蛋量下降', 产蛋下降: '产蛋量下降', 软蛋: '软壳蛋增多',
  歪头: '神经症状', 扭颈: '神经症状', 劈叉: '劈叉姿势', 甩头: '咳嗽',
  流泪: '结膜炎', 肿脸: '面部水肿', 肿头: '头颈部水肿', 紫冠: '冠髯发黑发紫',
  黑冠: '冠髯发黑发紫', 白冠: '鸡冠苍白', 贫血: '鸡冠苍白', 扎堆: '畏寒扎堆', 啄肛: '啄肛',
};

// 归一化：去掉所有标点/空格（全角/半角），用于鲁棒的标签匹配
function norm(s: string): string {
  return (s || '').replace(/[^一-龥a-zA-Z0-9]/g, '');
}

export function normalizeSymptom(input: string): string {
  const trimmed = input.trim();
  if (SYNONYM_MAP[trimmed]) return SYNONYM_MAP[trimmed];
  for (const [syn, standard] of Object.entries(SYNONYM_MAP)) {
    if (trimmed.includes(syn) || syn.includes(trimmed)) return standard;
  }
  return trimmed;
}

export interface OfflineResultItem {
  disease: string;
  id: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  zoonotic: boolean;
  confidence: number; // 0-100
  matchedSymptoms: string[];
  missingKeySymptoms: string[];
}

export function runDiagnosis(symptoms: string[], lesions: string[] = []): OfflineResultItem[] {
  const signs = [...symptoms.map(normalizeSymptom), ...lesions.map(normalizeSymptom)].map(norm);
  const results: OfflineResultItem[] = [];

  for (const disease of DISEASE_RULES) {
    const allSigns = [...disease.symptoms, ...disease.lesions];
    const totalWeight = allSigns.reduce((s, x) => s + x.weight, 0);
    let matchedWeight = 0;
    const matched: string[] = [];
    const missingKey: string[] = [];
    for (const sign of allSigns) {
      const sn = norm(sign.name);
      const hit = signs.some((us) => us.includes(sn) || sn.includes(us));
      if (hit) {
        matchedWeight += sign.weight;
        matched.push(sign.name);
      } else if (sign.characteristic) {
        missingKey.push(sign.name);
      }
    }
    const confidence = Math.min(95, Math.round((matchedWeight / totalWeight) * 100));
    if (confidence >= 15) {
      results.push({
        disease: disease.name,
        id: disease.id,
        category: disease.category,
        riskLevel: disease.riskLevel,
        zoonotic: disease.zoonotic,
        confidence,
        matchedSymptoms: matched,
        missingKeySymptoms: missingKey,
      });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, 5);
}

// 把规则引擎结果转换为统一的结构化诊断报告（与在线豆包输出同构）
export function buildOfflineReport(results: OfflineResultItem[]): VetDiagnosisResult {
  const top = results[0];
  if (!top) {
    return {
      disease: '未能匹配',
      confidence: 0,
      severity: 'low',
      primary: { disease: '未能匹配', confidence: 0 },
      secondaries: [],
      excluded: [],
      evidence: ['提供的症状/病变不足以匹配已知疾病，建议补充剖检病变并联网使用 AI 深度诊断。'],
      differentialTests: [],
      treatment: { emergency: [], medication: [], immunization: [], disinfection: [], management: [] },
      followup: [],
      disclaimer: '离线诊断由规则引擎生成，准确度有限，仅供参考，不能替代执业兽医诊断。',
      riskWarning: null,
    };
  }

  const rule = DISEASE_RULES.find((d) => d.id === top.id);
  const warnings: string[] = [];
  if (top.zoonotic) warnings.push('本病为人畜共患病，请注意个人防护');
  if (top.riskLevel === 'critical') warnings.push('疑似烈性传染病，请立即上报当地疫控部门');

  return {
    disease: top.disease,
    confidence: top.confidence / 100,
    severity: top.riskLevel,
    primary: { disease: top.disease, confidence: top.confidence / 100 },
    secondaries: results.slice(1).map((r) => ({ disease: r.disease, confidence: r.confidence / 100 })),
    excluded: [],
    evidence: [
      `匹配症状/病变：${top.matchedSymptoms.join('、') || '无'}`,
      top.missingKeySymptoms.length ? `缺少特征性病变：${top.missingKeySymptoms.join('、')}` : '特征性病变基本齐备',
    ],
    differentialTests: ['建议采集病料送实验室确诊（血清学/病原学检测）'],
    treatment: {
      emergency: ['立即隔离病禽，避免交叉感染', ...warnings],
      medication: rule?.treatment ?? [],
      immunization: rule?.prevention ?? [],
      disinfection: ['对养殖场进行全面消毒'],
      management: ['密切观察健康禽群', '保证充足饮水与通风'],
    },
    followup: ['3日后回访评估死亡率与食欲变化', '如无好转立即联系执业兽医或疫控部门'],
    disclaimer: '离线诊断由规则引擎生成，准确度有限，仅供参考，不能替代执业兽医诊断。建议联网后使用 AI 深度诊断。',
    riskWarning: top.riskLevel === 'critical' || top.zoonotic ? warnings.join('；') : null,
  };
}