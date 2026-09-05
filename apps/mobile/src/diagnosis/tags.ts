// AI兽医诊断：结构化症状/病变标签目录（对齐《AI兽医诊断功能开发文档_v2.md》2.1）
// 标签值尽量贴近规则引擎的症状/病变名，保证离线匹配命中。

export interface TagCategory {
  key: string;
  label: string;
  tags: string[];
}

export const SYMPTOM_CATEGORIES: TagCategory[] = [
  {
    key: 'general',
    label: '一般状态',
    tags: ['精神沉郁', '采食量下降', '羽毛蓬松', '消瘦', '畏寒扎堆', '体温升高', '脱水', '生长迟缓'],
  },
  {
    key: 'digestive',
    label: '消化道症状',
    tags: [
      '排绿色稀便',
      '排白色水样稀便',
      '排血便',
      '排西红柿样便',
      '排硫磺色稀便',
      '排黑色或血样稀便',
      '排黄绿色稀便',
      '排灰白色稀便',
      '嗉囊积液',
      '啄肛',
    ],
  },
  {
    key: 'respiratory',
    label: '呼吸道症状',
    tags: ['呼吸困难', '伸颈张口呼吸', '咳嗽', '打喷嚏', '气管啰音', '喘鸣', '流鼻涕', '眼鼻分泌物增多'],
  },
  {
    key: 'reproductive',
    label: '生殖道症状',
    tags: ['产蛋量下降', '产蛋量骤降', '软壳蛋增多', '薄壳蛋', '畸形蛋', '蛋壳颜色变浅', '蛋白稀薄'],
  },
  {
    key: 'nervous',
    label: '神经症状',
    tags: [
      '神经症状(扭颈观星状)',
      '角弓反张',
      '翅腿麻痹',
      '震颤',
      '共济失调',
      '劈叉姿势',
      '抽搐',
      '侧卧两腿痉挛',
    ],
  },
  {
    key: 'skinMucosa',
    label: '皮肤黏膜',
    tags: [
      '鸡冠苍白',
      '冠髯发黑发紫',
      '头颈部水肿',
      '面部水肿',
      '结膜炎',
      '皮肤痘疹',
      '脚鳞出血',
      '虹膜褪色(灰眼)',
      '翅膀皮炎(蓝翅病)',
      '口流涎',
    ],
  },
  {
    key: 'motor',
    label: '运动症状',
    tags: ['跛行', '关节肿大', '瘫痪', '站立困难', '脚软行走困难', '翅下垂'],
  },
  {
    key: 'other',
    label: '其他症状',
    tags: ['突然死亡', '咯血', '鼻腔分泌物', '血细胞比容降低'],
  },
];

export const LESION_CATEGORIES: TagCategory[] = [
  {
    key: 'subcutaneousMuscle',
    label: '皮下与肌肉',
    tags: ['肌肉出血', '胸肌腿肌出血', '肌肉白色小结节', '皮下肌肉出血'],
  },
  {
    key: 'digestive',
    label: '消化系统',
    tags: [
      '腺胃乳头出血',
      '肌胃角质层下出血',
      '肠道枣核状溃疡',
      '盲肠扁桃体出血坏死',
      '肝针尖大灰白色坏死点',
      '肝古铜色',
      '肝表面圆形凹陷坏死灶',
      '肝周炎',
      '气囊炎(气囊增厚浑浊)',
      '小肠黏膜坏死',
      '肠腔内灰黄色假膜',
      '肠壁增厚',
      '盲肠内暗红血液',
      '盲肠同心层干酪样栓子',
    ],
  },
  {
    key: 'respiratory',
    label: '呼吸系统',
    tags: ['气管出血', '气管内黏液', '喉头干酪样凝栓', '气管内血性渗出物', '肺灰白色坏死结节', '气囊浑浊'],
  },
  {
    key: 'circulatory',
    label: '循环系统',
    tags: ['心包积液', '心肌出血', '心冠脂肪出血', '心包炎(心包膜增厚浑浊)'],
  },
  {
    key: 'urinaryReproductive',
    label: '泌尿生殖',
    tags: ['肾肿大', '花斑肾', '输尿管扩张', '输卵管炎', '卵泡充血出血', '卵黄性腹膜炎', '内脏尿酸盐沉积'],
  },
  {
    key: 'immuneOrgans',
    label: '免疫器官',
    tags: ['法氏囊肿大出血', '法氏囊萎缩', '胸腺萎缩', '脾脏肿大'],
  },
  {
    key: 'nervous',
    label: '神经系统',
    tags: ['脑膜出血', '脑软化', '坐骨神经单侧肿大'],
  },
  {
    key: 'other',
    label: '其他病变',
    tags: ['胰腺坏死出血', '肝肿大发黄质脆', '腹水', '霉菌结节', '肿瘤结节'],
  },
];

export function isEmptyTags(categories: TagCategory[], selected: Record<string, string[]>): boolean {
  return Object.values(selected).every((arr) => !arr || arr.length === 0);
}