import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type {
  CaseBasicInfo,
  CaseChiefComplaint,
  CaseClinicalSymptoms,
  CaseNecropsyLesions,
  CaseLabTests,
  CaseImmuneHistory,
  CaseMedicationHistory,
  CaseEnvironment,
  CaseEpidemiology,
} from '@qinkang/types';
import { vetDiagnosisApi } from '../../src/api/vet-diagnosis';
import { assetUrl } from '../../src/api/client';
import { useAuthStore } from '../../src/store/auth';
import { SYMPTOM_CATEGORIES, LESION_CATEGORIES } from '../../src/diagnosis/tags';
import { runDiagnosis, buildOfflineReport } from '../../src/diagnosis/rule-engine';

const SPECIES = ['鸡', '鸭', '鹅', '鸽', '其他'];
const FEEDING_MODES = ['笼养', '平养', '散养', '网养'];
const STAGES = ['育雏期', '育成期', '产蛋期', '肉鸡出栏期'];
const COURSES = ['急性(<3天)', '亚急性(3-7天)', '慢性(>7天)'];
const TRENDS = ['上升', '平稳', '下降'];
const SPREADS = ['全群同时', '逐栋传播', '零星散发'];
const REACTIONS = ['正常', '应激', '发病', '死亡'];
const EFFECTS = ['明显好转', '略有好转', '无变化', '加重'];

const BREED_OPTIONS = ['地方品种', '海兰褐', '三黄鸡', '白羽肉鸡', '罗曼蛋鸡', '海兰白', '青脚麻鸡', '乌鸡', '樱桃谷鸭', '狮头鹅', '信鸽', '其他'];
const AGE_OPTIONS = ['1', '7', '14', '21', '28', '35', '42', '60', '90', '120', '150', '180', '300', '500'];
const STOCK_OPTIONS = ['100', '500', '1000', '2000', '3000', '5000', '10000', '20000', '50000'];
const SICK_OPTIONS = ['1', '5', '10', '20', '50', '100', '200', '500', '1000', '2000'];
const DEATH_OPTIONS = ['0', '1', '5', '10', '20', '50', '100', '200', '500', '1000'];
const ONSET_OPTIONS = ['今日', '昨日', '2天前', '3天前', '1周前', '2周前', '1个月前'];
const VACCINE_OPTIONS = ['新城疫Ⅳ系', '禽流感H5+H7', '禽流感H9', '传染性支气管炎H120', '传支H52', '法氏囊', '鸡痘', '大肠杆菌', '支原体', '禽霍乱', '其他'];
const ANTIBODY_OPTIONS = ['未检测', '抗体合格', '抗体不合格', '抗体偏低', '需补免'];
const FAILURE_OPTIONS = ['无免疫失败史', '曾发生免疫失败', '疫苗应激大', '疑似野毒感染', '免疫程序不合理'];
const ALLERGY_OPTIONS = ['无', '有（不详）', '对磺胺类过敏', '对喹诺酮类过敏'];
const WITHDRAWAL_OPTIONS = ['在休药期内', '已过休药期', '未使用药物', '不清楚'];
const VENTILATION_OPTIONS = ['良好', '一般', '不良', '无通风'];
const LIGHT_OPTIONS = ['正常', '不足', '过长', '应激'];
const WEATHER_OPTIONS = ['无异常', '气温骤降', '气温骤升', '连续阴雨', '大风'];
const TRAFFIC_OPTIONS = ['少', '一般', '频繁'];
const EPIDEMIC_OPTIONS = ['无', '有同类病', '有禽流感疫情'];
const BIOSECURITY_OPTIONS = ['严格', '一般', '较差'];
const INTRO_OPTIONS = ['无引种', '近1月引种', '近3月引种', '近6月引种'];
const VACCINE_SRC_OPTIONS = ['正规厂家', '非正规渠道', '自配', '不清楚'];
const FLOCK_SRC_OPTIONS = ['自繁自养', '外购雏鸡', '外购青年鸡', '混合'];
const MIX_OPTIONS = ['单一种类', '鸡鸭混养', '鸡猪混养', '多种混养'];
const WILDBIRD_OPTIONS = ['无', '偶有', '频繁'];
const FARMS_OPTIONS = ['无', '周边有', '周边有疫情'];
const DISPOSAL_OPTIONS = ['无害化处理', '深埋', '焚烧', '随意丢弃'];

const PROGRESSION_TEMPLATE =
  '鸡群于数日前开始出现异常，初期表现轻微，随后逐渐加重并蔓延。发病以来采食量、饮水量及产蛋情况有所变化，已采取相应处理但效果有限。';

const MAX_CLINICAL_PHOTOS = 9;
const MAX_NECROPSY_PHOTOS = 20;

const STEPS = [
  '基本信息',
  '主诉与病史',
  '临床症状',
  '剖检病变',
  '实验室检测',
  '免疫史',
  '用药史',
  '环境与管理',
  '流行病学',
];

const WAIT_TIPS = [
  '保持鸡舍通风良好，可显著降低呼吸道疾病发生。',
  '疫苗免疫后 3-7 天应减少应激，避免转群与换料。',
  '病死鸡应深埋或无害化处理，严禁随意丢弃。',
  '发现疑似禽流感等烈性传染病，请立即上报当地疫控部门。',
  '球虫病高发于潮湿环境，保持垫料干燥是关键。',
  '产蛋鸡禁用磺胺类与氟苯尼考，需注意休药期。',
  '新引进鸡群应先隔离观察 2 周以上再合群。',
  '饲料与饮水霉变是多种消化道疾病的诱因。',
];

function getMime(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

async function uriToDataUri(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${getMime(uri)};base64,${base64}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------- 通用子组件 ----------------

function Chip(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, props.active && styles.chipActive]}
      onPress={props.onPress}
    >
      <Text style={[styles.chipText, props.active && styles.chipTextActive]}>{props.label}</Text>
    </TouchableOpacity>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  required?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {props.label}
        {props.required ? <Text style={styles.requiredStar}> *</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, props.multiline && styles.inputMulti]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#aaa"
        multiline={props.multiline}
        keyboardType={props.keyboardType}
      />
    </View>
  );
}

// 下拉选择框：既能点开快速选择，又能自由输入
function SelectField(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  options: string[];
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {props.label}
        {props.required ? <Text style={styles.requiredStar}> *</Text> : null}
      </Text>
      <View style={styles.selectBox}>
        <TextInput
          style={styles.selectInput}
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor="#aaa"
          keyboardType={props.keyboardType}
          onFocus={() => setOpen(true)}
        />
        <TouchableOpacity style={styles.selectArrow} onPress={() => setOpen((o) => !o)}>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      {open ? (
        <View style={styles.optionWrap}>
          {props.options.map((o) => (
            <TouchableOpacity
              key={o}
              style={styles.optionChip}
              onPress={() => {
                props.onChangeText(o);
                setOpen(false);
              }}
            >
              <Text style={styles.optionChipText}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function NumberSelectField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <SelectField
      label={props.label}
      value={props.value ? String(props.value) : ''}
      onChangeText={(v) => props.onChange(parseInt(v, 10) || 0)}
      options={props.options}
      keyboardType="numeric"
      required={props.required}
    />
  );
}

function PhotoRow(props: { uris: string[]; onAdd: (uris: string[]) => void; onRemove: (uri: string) => void; max: number; label: string }) {
  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相册以选择照片');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets?.length) {
      const next = [...props.uris];
      for (const asset of picked.assets) {
        if (next.length >= props.max) break;
        if (!next.includes(asset.uri)) next.push(asset.uri);
      }
      props.onAdd(next);
    }
  };

  return (
    <View style={styles.photoWrap}>
      <Text style={styles.fieldLabel}>
        {props.label}（最多 {props.max} 张）
      </Text>
      <View style={styles.photoGrid}>
        {props.uris.map((uri) => (
          <View key={uri} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
            <TouchableOpacity
              style={styles.thumbRemove}
              onPress={() => props.onRemove(uri)}
            >
              <Text style={styles.thumbRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {props.uris.length < props.max ? (
          <TouchableOpacity style={styles.addTile} onPress={pick}>
            <Text style={styles.addTilePlus}>＋</Text>
            <Text style={styles.addTileText}>上传</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// 可折叠症状/病变分类：被勾选才展开其下供选项
function CollapsibleTagPicker(props: {
  categories: { key: string; label: string; tags: string[] }[];
  selected: Record<string, string[]>;
  checked: Record<string, boolean>;
  onToggleChecked: (key: string) => void;
  onToggleTag: (key: string, tag: string) => void;
  alwaysOpenKeys?: string[];
}) {
  return (
    <View>
      {props.categories.map((cat) => {
        const alwaysOpen = props.alwaysOpenKeys?.includes(cat.key);
        const isChecked = alwaysOpen || !!props.checked[cat.key];
        return (
          <View key={cat.key} style={styles.tagCat}>
            {alwaysOpen ? (
              <Text style={styles.tagCatLabel}>{cat.label}</Text>
            ) : (
              <TouchableOpacity
                style={styles.tagCatHeader}
                onPress={() => props.onToggleChecked(cat.key)}
              >
                <Ionicons
                  name={isChecked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isChecked ? '#22C55E' : '#9ca3af'}
                />
                <Text style={styles.tagCatLabel}>{cat.label}</Text>
                <Ionicons name={isChecked ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
            {isChecked ? (
              <View style={styles.tagRow}>
                {cat.tags.map((tag) => {
                  const active = (props.selected[cat.key] ?? []).includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tag, active && styles.tagActive]}
                      onPress={() => props.onToggleTag(cat.key, tag)}
                    >
                      <Text style={[styles.tagText, active && styles.tagTextActive]}>
                        {active ? '✓ ' : ''}{tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// 带「拍照识别」的字段：拍照 → OCR 读取报告 → 填入文本，并保留上传的照片
function OcrField(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  photos: string[];
  onPhotos: (p: string[]) => void;
  multiline?: boolean;
  placeholder?: string;
  ocrHint: string;
}) {
  const [busy, setBusy] = useState(false);

  const pickAndOcr = async (source: 'camera' | 'library') => {
    try {
      let res;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('需要权限', '请允许使用相机');
          return;
        }
        res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('需要权限', '请允许访问相册');
          return;
        }
        res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      }
      if (res.canceled || !res.assets?.length) return;

      setBusy(true);
      const dataUri = await uriToDataUri(res.assets[0].uri);
      const up = await vetDiagnosisApi.upload([dataUri]);
      const url = up.urls[0];
      const ocr = await vetDiagnosisApi.ocr(url, props.ocrHint);
      const text = (ocr.text ?? '').trim();
      if (text) {
        props.onChangeText(props.value ? `${props.value}\n${text}` : text);
      } else {
        Alert.alert('未识别到内容', '图片中未识别到文字，请换一张更清晰的报告照片');
      }
      props.onPhotos([...props.photos, url]);
    } catch (e) {
      Alert.alert('识别失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setBusy(false);
    }
  };

  const choose = () => {
    Alert.alert('拍照识别', props.ocrHint, [
      { text: '拍照', onPress: () => pickAndOcr('camera') },
      { text: '从相册选择', onPress: () => pickAndOcr('library') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.fieldWrap}>
      <View style={styles.ocrFieldLabelRow}>
        <Text style={styles.fieldLabel}>{props.label}</Text>
        <TouchableOpacity style={styles.ocrBtn} onPress={choose} disabled={busy}>
          {busy ? (
            <ActivityIndicator size="small" color="#22C55E" />
          ) : (
            <Ionicons name="camera-outline" size={14} color="#22C55E" />
          )}
          <Text style={styles.ocrBtnText}>{busy ? '识别中…' : '拍照识别'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.input, props.multiline && styles.inputMulti]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#aaa"
        multiline={props.multiline}
        textAlignVertical={props.multiline ? 'top' : 'center'}
      />
      {props.photos.length ? (
        <View style={styles.ocrThumbRow}>
          {props.photos.map((u) => (
            <View key={u} style={styles.ocrThumbWrap}>
              <Image source={{ uri: assetUrl(u) }} style={styles.ocrThumb} />
              <TouchableOpacity
                style={styles.ocrThumbRemove}
                onPress={() => props.onPhotos(props.photos.filter((x) => x !== u))}
              >
                <Text style={styles.ocrThumbRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// 提交后的过渡页：等待提示 + 时间预估 + 随机小贴士
function WaitingView() {
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % WAIT_TIPS.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.waitWrap}>
      <ActivityIndicator size="large" color="#22C55E" />
      <Text style={styles.waitTitle}>AI 正在深度分析病例…</Text>
      <Text style={styles.waitSub}>综合 9 大维度信息进行鉴别诊断，预计 15–30 秒，请稍候</Text>
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
        <Text style={styles.tipText}>{WAIT_TIPS[tipIndex]}</Text>
      </View>
    </View>
  );
}

// ---------------- 主屏幕 ----------------

export default function DiagnoseScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isFarmer = user?.role === 'farmer';

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [basicInfo, setBasicInfo] = useState<CaseBasicInfo>({
    species: '鸡', breed: '', ageDays: 0, stock: 0, sickCount: 0, deathCount: 0,
    feedingMode: '笼养', productionStage: '育成期',
  });
  const [chiefComplaint, setChiefComplaint] = useState<CaseChiefComplaint>({
    mainProblem: '', onsetTime: '', course: '亚急性(3-7天)', progression: '',
    mortalityTrend: '平稳', transmissionSpeed: '零星散发', pastHistory: '',
  });
  const [clinicalSymptoms, setClinicalSymptoms] = useState<Record<string, string[]>>({});
  const [clinicalChecked, setClinicalChecked] = useState<Record<string, boolean>>({});
  const [clinicalNote, setClinicalNote] = useState('');
  const [showClinicalNote, setShowClinicalNote] = useState(false);
  const [clinicalPhotos, setClinicalPhotos] = useState<string[]>([]);
  const [necropsyLesions, setNecropsyLesions] = useState<Record<string, string[]>>({});
  const [necropsyChecked, setNecropsyChecked] = useState<Record<string, boolean>>({});
  const [necropsyNote, setNecropsyNote] = useState('');
  const [showNecropsyNote, setShowNecropsyNote] = useState(false);
  const [necropsyPhotos, setNecropsyPhotos] = useState<string[]>([]);
  const [labText, setLabText] = useState<Record<string, string>>({
    serology: '', pathogen: '', bacteriology: '', parasitology: '', biochemistry: '', cbc: '',
  });
  const [labPhotos, setLabPhotos] = useState<Record<string, string[]>>({});
  const [immuneHistory, setImmuneHistory] = useState<CaseImmuneHistory>({
    program: [], lastVaccine: '', postVaccineReaction: '正常', antibodyTest: '未检测', vaccineFailureHistory: '无免疫失败史',
  });
  const [programPhotos, setProgramPhotos] = useState<string[]>([]);
  const [medicationHistory, setMedicationHistory] = useState<CaseMedicationHistory>({
    recentDrugs: [], effect: '无变化', allergyHistory: '无', healthProducts: [], withdrawalPeriod: '不清楚',
  });
  const [drugPhotos, setDrugPhotos] = useState<string[]>([]);
  const [environment, setEnvironment] = useState<CaseEnvironment>({
    temperature: '', humidity: '', ventilation: '一般', density: '', feed: '', water: '', light: '正常',
    weatherChange: '无异常', humanTraffic: '一般', surroundingEpidemic: '无', biosecurity: '一般',
  });
  const [epidemiology, setEpidemiology] = useState<CaseEpidemiology>({
    introductionHistory: '无引种', vaccineSource: '正规厂家', flockSource: '自繁自养', mixedFarming: '单一种类',
    wildBirdContact: '无', similarFarms: '无', deadBirdDisposal: '无害化处理',
  });

  const toggleTag = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
    key: string,
    tag: string,
  ) => {
    setter((prev) => {
      const cur = prev[key] ?? [];
      const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
      return { ...prev, [key]: next };
    });
  };

  const toggleClinicalChecked = (key: string) => {
    setClinicalChecked((prev) => {
      const nextChecked = !prev[key];
      if (!nextChecked) {
        // 取消勾选时清空该分类已选标签
        setClinicalSymptoms((s) => ({ ...s, [key]: [] }));
      }
      return { ...prev, [key]: nextChecked };
    });
  };

  const toggleNecropsyChecked = (key: string) => {
    setNecropsyChecked((prev) => {
      const nextChecked = !prev[key];
      if (!nextChecked) {
        setNecropsyLesions((s) => ({ ...s, [key]: [] }));
      }
      return { ...prev, [key]: nextChecked };
    });
  };

  const splitList = (text: string) =>
    text.split(/[,，、;；\s]+/).map((s) => s.trim()).filter(Boolean);

  const allSymptoms = Object.values(clinicalSymptoms).flat();
  const allLesions = Object.values(necropsyLesions).flat();

  const validate = (): string | null => {
    if (!chiefComplaint.mainProblem.trim() && allSymptoms.length === 0 && allLesions.length === 0) {
      return '请至少填写主诉，或勾选临床症状/剖检病变（否则无法诊断）';
    }
    return null;
  };

  const buildCasePayload = (imageUrls: string[]) => {
    // 把所有症状/病变分类键补齐（未选则为空数组），后端据此生成「XX未见异常」提示
    const normalizedClinical: Record<string, string[]> = {};
    for (const c of SYMPTOM_CATEGORIES) normalizedClinical[c.key] = clinicalSymptoms[c.key] ?? [];
    const normalizedLesions: Record<string, string[]> = {};
    for (const c of LESION_CATEGORIES) normalizedLesions[c.key] = necropsyLesions[c.key] ?? [];

    const labTests: CaseLabTests = {
      serology: labText.serology ? [labText.serology] : [],
      pathogen: labText.pathogen ? [labText.pathogen] : [],
      bacteriology: labText.bacteriology ? [labText.bacteriology] : [],
      parasitology: labText.parasitology ? [labText.parasitology] : [],
      biochemistry: labText.biochemistry ? [labText.biochemistry] : [],
      cbc: labText.cbc ? [labText.cbc] : [],
    };

    return {
      species: basicInfo.species,
      basicInfo,
      chiefComplaint,
      clinicalSymptoms: { ...normalizedClinical, note: clinicalNote } as unknown as CaseClinicalSymptoms,
      necropsyLesions: { ...normalizedLesions, note: necropsyNote } as unknown as CaseNecropsyLesions,
      labTests,
      immuneHistory,
      medicationHistory,
      environment,
      epidemiology,
      imageUrls,
      role: user?.role,
      subRole: user?.subRole ?? undefined,
    };
  };

  const pollUntilDone = async (id: string) => {
    for (let i = 0; i < 30; i++) {
      await delay(2000);
      const latest = await vetDiagnosisApi.get(id);
      if (latest.status === 'completed' || latest.status === 'failed') return latest;
    }
    throw new Error('诊断超时');
  };

  const saveOffline = async () => {
    const results = runDiagnosis(allSymptoms, allLesions);
    const report = buildOfflineReport(results);
    const vc = await vetDiagnosisApi.saveOffline({
      ...buildCasePayload([]),
      diagnosisResult: report,
      confidence: report.confidence,
    });
    router.push(`/vet-diagnosis/${vc.id}`);
  };

  const submit = async () => {
    if (!token) {
      Alert.alert('未登录', '请先登录后再进行 AI 诊断', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => router.push('/login') },
      ]);
      return;
    }
    const vErr = validate();
    if (vErr) {
      setError(vErr);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 上传图片（临床 + 剖检 + 各 OCR 识别照片）
      const ocrPhotos = [
        ...Object.values(labPhotos).flat(),
        ...programPhotos,
        ...drugPhotos,
      ];
      const allPhotoUris = [...clinicalPhotos, ...necropsyPhotos];
      let urls: string[] = [];
      if (allPhotoUris.length) {
        const dataUris = await Promise.all(allPhotoUris.map(uriToDataUri));
        const uploaded = await vetDiagnosisApi.upload(dataUris);
        urls = uploaded.urls;
      }
      // OCR 照片已是 /uploads 相对路径，直接并入
      urls = [...urls, ...ocrPhotos];

      // 在线 AI 深度诊断
      let final;
      try {
        const created = await vetDiagnosisApi.createCase(buildCasePayload(urls));
        final = await pollUntilDone(created.id);
      } catch (e) {
        await saveOffline();
        return;
      }

      if (final?.status === 'completed') {
        router.push(`/vet-diagnosis/${final.id}`);
      } else {
        await saveOffline();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '诊断失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const morbidity = basicInfo.stock > 0 ? (basicInfo.sickCount / basicInfo.stock) * 100 : null;
  const mortality = basicInfo.stock > 0 ? (basicInfo.deathCount / basicInfo.stock) * 100 : null;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.stepTitle}>第 1 步 · 基本信息（必填）</Text>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <SelectField label="动物种类" value={basicInfo.species}
                  onChangeText={(v) => setBasicInfo({ ...basicInfo, species: v })} options={SPECIES} required />
              </View>
              <View style={styles.rowField}>
                <SelectField label="品种" value={basicInfo.breed}
                  onChangeText={(v) => setBasicInfo({ ...basicInfo, breed: v })} options={BREED_OPTIONS}
                  placeholder="可输入或选择" />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <NumberSelectField label="日龄(天)" value={basicInfo.ageDays}
                  onChange={(v) => setBasicInfo({ ...basicInfo, ageDays: v })} options={AGE_OPTIONS} />
              </View>
              <View style={styles.rowField}>
                <NumberSelectField label="存栏量(羽)" value={basicInfo.stock}
                  onChange={(v) => setBasicInfo({ ...basicInfo, stock: v })} options={STOCK_OPTIONS} />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <NumberSelectField label="发病数(羽)" value={basicInfo.sickCount}
                  onChange={(v) => setBasicInfo({ ...basicInfo, sickCount: v })} options={SICK_OPTIONS} />
              </View>
              <View style={styles.rowField}>
                <NumberSelectField label="死亡数(羽)" value={basicInfo.deathCount}
                  onChange={(v) => setBasicInfo({ ...basicInfo, deathCount: v })} options={DEATH_OPTIONS} />
              </View>
            </View>
            {(morbidity !== null || mortality !== null) ? (
              <View style={styles.rateRow}>
                {morbidity !== null ? (
                  <Text style={styles.rateText}>发病率 {morbidity.toFixed(1)}%</Text>
                ) : null}
                {mortality !== null ? (
                  <Text style={styles.rateText}>死亡率 {mortality.toFixed(1)}%</Text>
                ) : null}
              </View>
            ) : null}
            <Text style={styles.catLabel}>饲养方式</Text>
            <View style={styles.row}>
              {FEEDING_MODES.map((m) => (
                <Chip key={m} label={m} active={basicInfo.feedingMode === m}
                  onPress={() => setBasicInfo({ ...basicInfo, feedingMode: m })} />
              ))}
            </View>
            <Text style={styles.catLabel}>养殖阶段</Text>
            <View style={styles.row}>
              {STAGES.map((s) => (
                <Chip key={s} label={s} active={basicInfo.productionStage === s}
                  onPress={() => setBasicInfo({ ...basicInfo, productionStage: s })} />
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>第 2 步 · 主诉与病史（必填）</Text>
            <Field label="主诉" required value={chiefComplaint.mainProblem}
              onChangeText={(v) => setChiefComplaint({ ...chiefComplaint, mainProblem: v })}
              placeholder="例如：产蛋下降伴死亡" />
            <SelectField label="发病时间" value={chiefComplaint.onsetTime}
              onChangeText={(v) => setChiefComplaint({ ...chiefComplaint, onsetTime: v })} options={ONSET_OPTIONS}
              placeholder="选择或输入" />
            <Text style={styles.catLabel}>病程</Text>
            <View style={styles.row}>
              {COURSES.map((c) => (
                <Chip key={c} label={c} active={chiefComplaint.course === c}
                  onPress={() => setChiefComplaint({ ...chiefComplaint, course: c })} />
              ))}
            </View>
            <View style={styles.ocrFieldLabelRow}>
              <Text style={styles.fieldLabel}>发病经过</Text>
              <TouchableOpacity
                style={styles.ocrBtn}
                onPress={() => setChiefComplaint({ ...chiefComplaint, progression: PROGRESSION_TEMPLATE })}
              >
                <Ionicons name="create-outline" size={14} color="#22C55E" />
                <Text style={styles.ocrBtnText}>使用模板</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={chiefComplaint.progression}
              onChangeText={(v) => setChiefComplaint({ ...chiefComplaint, progression: v })}
              placeholder="先出现什么症状，后出现什么变化（可点「使用模板」快速填充后修改）"
              placeholderTextColor="#aaa"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.catLabel}>死亡率趋势 / 传播速度</Text>
            <View style={styles.row}>
              {TRENDS.map((t) => (
                <Chip key={t} label={t} active={chiefComplaint.mortalityTrend === t}
                  onPress={() => setChiefComplaint({ ...chiefComplaint, mortalityTrend: t })} />
              ))}
            </View>
            <View style={styles.row}>
              {SPREADS.map((s) => (
                <Chip key={s} label={s} active={chiefComplaint.transmissionSpeed === s}
                  onPress={() => setChiefComplaint({ ...chiefComplaint, transmissionSpeed: s })} />
              ))}
            </View>
            <Field label="既往病史" multiline value={chiefComplaint.pastHistory}
              onChangeText={(v) => setChiefComplaint({ ...chiefComplaint, pastHistory: v })}
              placeholder="过去半年内发生过什么病" />
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>第 3 步 · 临床症状（可勾选）</Text>
            <PhotoRow label="临床照片" uris={clinicalPhotos}
              onAdd={setClinicalPhotos} onRemove={(u) => setClinicalPhotos((p) => p.filter((x) => x !== u))}
              max={MAX_CLINICAL_PHOTOS} />
            <CollapsibleTagPicker
              categories={SYMPTOM_CATEGORIES}
              selected={clinicalSymptoms}
              checked={clinicalChecked}
              onToggleChecked={toggleClinicalChecked}
              onToggleTag={(key, tag) => {
                toggleTag(setClinicalSymptoms, key, tag);
                setClinicalChecked((prev) => ({ ...prev, [key]: true }));
              }}
              alwaysOpenKeys={['general']}
            />
            <TouchableOpacity
              style={styles.noteToggle}
              onPress={() => setShowClinicalNote((v) => !v)}
            >
              <Ionicons
                name={showClinicalNote ? 'checkbox' : 'square-outline'}
                size={20}
                color={showClinicalNote ? '#22C55E' : '#9ca3af'}
              />
              <Text style={styles.noteToggleText}>补充描述</Text>
            </TouchableOpacity>
            {showClinicalNote ? (
              <TextInput
                style={[styles.input, styles.inputMulti, styles.noteInput]}
                value={clinicalNote}
                onChangeText={setClinicalNote}
                placeholder="其他需要说明的症状"
                placeholderTextColor="#aaa"
                multiline
                textAlignVertical="top"
              />
            ) : null}
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>第 4 步 · 剖检病变（可选，强烈建议）</Text>
            <PhotoRow label="剖检照片" uris={necropsyPhotos}
              onAdd={setNecropsyPhotos} onRemove={(u) => setNecropsyPhotos((p) => p.filter((x) => x !== u))}
              max={MAX_NECROPSY_PHOTOS} />
            <CollapsibleTagPicker
              categories={LESION_CATEGORIES}
              selected={necropsyLesions}
              checked={necropsyChecked}
              onToggleChecked={toggleNecropsyChecked}
              onToggleTag={(key, tag) => {
                toggleTag(setNecropsyLesions, key, tag);
                setNecropsyChecked((prev) => ({ ...prev, [key]: true }));
              }}
            />
            <TouchableOpacity
              style={styles.noteToggle}
              onPress={() => setShowNecropsyNote((v) => !v)}
            >
              <Ionicons
                name={showNecropsyNote ? 'checkbox' : 'square-outline'}
                size={20}
                color={showNecropsyNote ? '#22C55E' : '#9ca3af'}
              />
              <Text style={styles.noteToggleText}>补充描述</Text>
            </TouchableOpacity>
            {showNecropsyNote ? (
              <TextInput
                style={[styles.input, styles.inputMulti, styles.noteInput]}
                value={necropsyNote}
                onChangeText={setNecropsyNote}
                placeholder="其他需要说明的剖检所见"
                placeholderTextColor="#aaa"
                multiline
                textAlignVertical="top"
              />
            ) : null}
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>第 5 步 · 实验室检测（可选，可拍照识别）</Text>
            {([
              ['serology', '血清学检测（如 HI 抗体滴度）'],
              ['pathogen', '病原学检测（如 PCR/病毒分离）'],
              ['bacteriology', '细菌学检测（细菌分离/药敏）'],
              ['parasitology', '寄生虫检测（粪便虫卵等）'],
              ['biochemistry', '血液生化'],
              ['cbc', '血常规'],
            ] as [string, string][]).map(([key, label]) => (
              <OcrField
                key={key}
                label={label}
                multiline
                value={labText[key]}
                onChangeText={(v) => setLabText((prev) => ({ ...prev, [key]: v }))}
                photos={labPhotos[key] ?? []}
                onPhotos={(p) => setLabPhotos((prev) => ({ ...prev, [key]: p }))}
                ocrHint={label}
                placeholder="可拍照识别检测报告，或手动输入结果"
              />
            ))}
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={styles.stepTitle}>第 6 步 · 免疫史</Text>
            <OcrField
              label="免疫程序表"
              multiline
              value={immuneHistory.program.join('\n')}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, program: v.split('\n').filter(Boolean) })}
              photos={programPhotos}
              onPhotos={setProgramPhotos}
              ocrHint="免疫程序表"
              placeholder="可拍照识别免疫程序表，或手动输入（每行一条）"
            />
            <SelectField label="最近一次免疫" value={immuneHistory.lastVaccine}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, lastVaccine: v })} options={VACCINE_OPTIONS}
              placeholder="选择或输入疫苗名称" />
            <Text style={styles.catLabel}>免疫后反应</Text>
            <View style={styles.row}>
              {REACTIONS.map((r) => (
                <Chip key={r} label={r} active={immuneHistory.postVaccineReaction === r}
                  onPress={() => setImmuneHistory({ ...immuneHistory, postVaccineReaction: r })} />
              ))}
            </View>
            <SelectField label="抗体检测" value={immuneHistory.antibodyTest}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, antibodyTest: v })} options={ANTIBODY_OPTIONS}
              placeholder="选择或输入" />
            <SelectField label="免疫失败史" value={immuneHistory.vaccineFailureHistory}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, vaccineFailureHistory: v })} options={FAILURE_OPTIONS}
              placeholder="选择或输入" />
          </View>
        );
      case 6:
        return (
          <View>
            <Text style={styles.stepTitle}>第 7 步 · 用药史</Text>
            <OcrField
              label="最近用药"
              multiline
              value={medicationHistory.recentDrugs.join('\n')}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, recentDrugs: v.split('\n').filter(Boolean) })}
              photos={drugPhotos}
              onPhotos={setDrugPhotos}
              ocrHint="用药记录"
              placeholder="可拍照识别用药记录，或手动输入（每行一条）"
            />
            <Text style={styles.catLabel}>用药效果</Text>
            <View style={styles.row}>
              {EFFECTS.map((e) => (
                <Chip key={e} label={e} active={medicationHistory.effect === e}
                  onPress={() => setMedicationHistory({ ...medicationHistory, effect: e })} />
              ))}
            </View>
            <SelectField label="药物过敏/不良反应史" value={medicationHistory.allergyHistory}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, allergyHistory: v })} options={ALLERGY_OPTIONS}
              placeholder="选择或输入" />
            <Field label="常用保健药物" multiline value={medicationHistory.healthProducts.join('、')}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, healthProducts: splitList(v) })} />
            <SelectField label="休药期情况" value={medicationHistory.withdrawalPeriod}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, withdrawalPeriod: v })} options={WITHDRAWAL_OPTIONS}
              placeholder="选择或输入" />
          </View>
        );
      case 7:
        return (
          <View>
            <Text style={styles.stepTitle}>第 8 步 · 环境与管理</Text>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <Field label="温度(℃)" keyboardType="numeric" value={environment.temperature}
                  onChangeText={(v) => setEnvironment({ ...environment, temperature: v })} />
              </View>
              <View style={styles.rowField}>
                <Field label="湿度(%)" keyboardType="numeric" value={environment.humidity}
                  onChangeText={(v) => setEnvironment({ ...environment, humidity: v })} />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <SelectField label="通风" value={environment.ventilation}
                  onChangeText={(v) => setEnvironment({ ...environment, ventilation: v })} options={VENTILATION_OPTIONS} />
              </View>
              <View style={styles.rowField}>
                <Field label="密度(只/㎡)" keyboardType="numeric" value={environment.density}
                  onChangeText={(v) => setEnvironment({ ...environment, density: v })} />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <Field label="饲料" value={environment.feed}
                  onChangeText={(v) => setEnvironment({ ...environment, feed: v })} placeholder="类型/是否霉变" />
              </View>
              <View style={styles.rowField}>
                <Field label="饮水" value={environment.water}
                  onChangeText={(v) => setEnvironment({ ...environment, water: v })} />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <SelectField label="光照" value={environment.light}
                  onChangeText={(v) => setEnvironment({ ...environment, light: v })} options={LIGHT_OPTIONS} />
              </View>
              <View style={styles.rowField}>
                <SelectField label="最近天气变化" value={environment.weatherChange}
                  onChangeText={(v) => setEnvironment({ ...environment, weatherChange: v })} options={WEATHER_OPTIONS} />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <SelectField label="人员流动" value={environment.humanTraffic}
                  onChangeText={(v) => setEnvironment({ ...environment, humanTraffic: v })} options={TRAFFIC_OPTIONS} />
              </View>
              <View style={styles.rowField}>
                <SelectField label="周边疫情" value={environment.surroundingEpidemic}
                  onChangeText={(v) => setEnvironment({ ...environment, surroundingEpidemic: v })} options={EPIDEMIC_OPTIONS} />
              </View>
            </View>
            <SelectField label="生物安全" value={environment.biosecurity}
              onChangeText={(v) => setEnvironment({ ...environment, biosecurity: v })} options={BIOSECURITY_OPTIONS} />
          </View>
        );
      case 8:
        return (
          <View>
            <Text style={styles.stepTitle}>第 9 步 · 流行病学</Text>
            <SelectField label="引种史（近6个月）" value={epidemiology.introductionHistory}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, introductionHistory: v })} options={INTRO_OPTIONS} />
            <SelectField label="疫苗来源" value={epidemiology.vaccineSource}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, vaccineSource: v })} options={VACCINE_SRC_OPTIONS} />
            <SelectField label="鸡群来源" value={epidemiology.flockSource}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, flockSource: v })} options={FLOCK_SRC_OPTIONS} />
            <SelectField label="混养情况" value={epidemiology.mixedFarming}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, mixedFarming: v })} options={MIX_OPTIONS} />
            <SelectField label="野鸟接触" value={epidemiology.wildBirdContact}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, wildBirdContact: v })} options={WILDBIRD_OPTIONS} />
            <SelectField label="同类养殖场（周边）" value={epidemiology.similarFarms}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, similarFarms: v })} options={FARMS_OPTIONS} />
            <SelectField label="病死鸡处理" value={epidemiology.deadBirdDisposal}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, deadBirdDisposal: v })} options={DISPOSAL_OPTIONS} />
          </View>
        );
      default:
        return null;
    }
  };

  const progress = `${step + 1}/${STEPS.length}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>AI兽医诊断</Text>
          <TouchableOpacity onPress={() => router.push('/vet-diagnosis/history')}>
            <Text style={styles.libraryLink}>{isFarmer ? '诊断历史' : '病例库'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>结构化 9 维信息采集 · 豆包深度诊断 · 离线兜底</Text>
      </View>

      {loading ? (
        <WaitingView />
      ) : (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress} · {STEPS[step]}
          </Text>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {renderStep()}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 ? (
              <TouchableOpacity style={[styles.footerBtn, styles.footerBtnGhost]} onPress={() => setStep((s) => s - 1)}>
                <Text style={styles.footerBtnGhostText}>上一步</Text>
              </TouchableOpacity>
            ) : null}
            {step < STEPS.length - 1 ? (
              <TouchableOpacity style={[styles.footerBtn, styles.footerBtnPrimary]} onPress={() => setStep((s) => s + 1)}>
                <Text style={styles.footerBtnText}>下一步</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.footerBtn, styles.footerBtnPrimary]}
                onPress={submit}
              >
                <Text style={styles.footerBtnText}>提交AI诊断</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  libraryLink: { fontSize: 14, color: '#22C55E', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 6 },
  progressBar: { height: 6, backgroundColor: '#f0f0f0', marginHorizontal: 20, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22C55E' },
  progressText: { textAlign: 'center', marginTop: 8, fontSize: 13, color: '#22C55E', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  stepTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  catLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowFields: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowField: { flex: 1 },
  fieldWrap: { marginTop: 12 },
  fieldLabel: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 6 },
  requiredStar: { color: '#EF4444' },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12,
    fontSize: 14, color: '#333',
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  selectBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 12, backgroundColor: '#fff',
  },
  selectInput: { flex: 1, padding: 12, fontSize: 14, color: '#333' },
  selectArrow: { paddingHorizontal: 12, paddingVertical: 12 },
  optionWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8,
    padding: 10, backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1, borderColor: '#eef0f2',
  },
  optionChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  optionChipText: { fontSize: 12, color: '#374151' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  photoWrap: { marginTop: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  thumbWrap: { width: 88, height: 88, borderRadius: 12, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%', backgroundColor: '#f5f5f5' },
  thumbRemove: {
    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  thumbRemoveText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  addTile: {
    width: 88, height: 88, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db',
    borderStyle: 'dashed', backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center',
  },
  addTilePlus: { fontSize: 26, color: '#22C55E', lineHeight: 28 },
  addTileText: { fontSize: 12, color: '#666', marginTop: 2 },
  tagCat: { marginTop: 14 },
  tagCatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagCatLabel: { fontSize: 14, fontWeight: '600', color: '#374151', flexShrink: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  tagActive: { backgroundColor: '#dcfce7', borderColor: '#22C55E' },
  tagText: { fontSize: 13, color: '#555' },
  tagTextActive: { color: '#166534', fontWeight: '600' },
  noteToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  noteToggleText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  noteInput: { marginTop: 10 },
  ocrFieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  ocrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0',
  },
  ocrBtnText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  ocrThumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  ocrThumbWrap: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden' },
  ocrThumb: { width: '100%', height: '100%', backgroundColor: '#f5f5f5' },
  ocrThumbRemove: {
    position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  ocrThumbRemoveText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  rateRow: {
    flexDirection: 'row', gap: 12, marginTop: 10, padding: 10, borderRadius: 10,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
  },
  rateText: { fontSize: 13, color: '#166534', fontWeight: '600' },
  waitWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  waitTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 20 },
  waitSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, padding: 14,
    borderRadius: 12, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
  },
  tipText: { fontSize: 13, color: '#92400e', flexShrink: 1, lineHeight: 20 },
  errorBox: { marginTop: 16, padding: 12, backgroundColor: '#fef2f2', borderRadius: 12 },
  errorText: { color: '#EF4444' },
  footer: {
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb',
  },
  footerBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footerBtnPrimary: { backgroundColor: '#22C55E' },
  footerBtnGhost: { backgroundColor: '#f5f5f5' },
  footerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerBtnGhostText: { color: '#666', fontSize: 16, fontWeight: '600' },
});
