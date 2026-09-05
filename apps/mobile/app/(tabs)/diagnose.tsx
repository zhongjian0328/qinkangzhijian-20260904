import { useState } from 'react';
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

const MAX_CLINICAL_PHOTOS = 6;
const MAX_NECROPSY_PHOTOS = 9;

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
        {props.label}（最多 {props.max} 张，可显著提高准确率）
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

function TagPicker(props: {
  categories: { key: string; label: string; tags: string[] }[];
  selected: Record<string, string[]>;
  onToggle: (key: string, tag: string) => void;
}) {
  return (
    <View>
      {props.categories.map((cat) => (
        <View key={cat.key} style={styles.tagCat}>
          <Text style={styles.tagCatLabel}>{cat.label}</Text>
          <View style={styles.tagRow}>
            {cat.tags.map((tag) => {
              const active = (props.selected[cat.key] ?? []).includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => props.onToggle(cat.key, tag)}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {active ? '✓ ' : ''}{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------- 主屏幕 ----------------

export default function DiagnoseScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

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
  const [clinicalNote, setClinicalNote] = useState('');
  const [clinicalPhotos, setClinicalPhotos] = useState<string[]>([]);
  const [necropsyLesions, setNecropsyLesions] = useState<Record<string, string[]>>({});
  const [necropsyPhotos, setNecropsyPhotos] = useState<string[]>([]);
  const [labTests, setLabTests] = useState<CaseLabTests>({
    serology: [], pathogen: [], bacteriology: [], parasitology: [], biochemistry: [], cbc: [],
  });
  const [immuneHistory, setImmuneHistory] = useState<CaseImmuneHistory>({
    program: [], lastVaccine: '', postVaccineReaction: '正常', antibodyTest: '', vaccineFailureHistory: '',
  });
  const [medicationHistory, setMedicationHistory] = useState<CaseMedicationHistory>({
    recentDrugs: [], effect: '无变化', allergyHistory: '', healthProducts: [], withdrawalPeriod: '',
  });
  const [environment, setEnvironment] = useState<CaseEnvironment>({
    temperature: '', humidity: '', ventilation: '', density: '', feed: '', water: '', light: '',
    weatherChange: '', humanTraffic: '', surroundingEpidemic: '', biosecurity: '',
  });
  const [epidemiology, setEpidemiology] = useState<CaseEpidemiology>({
    introductionHistory: '', vaccineSource: '', flockSource: '', mixedFarming: '',
    wildBirdContact: '', similarFarms: '', deadBirdDisposal: '',
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

  const buildCasePayload = (imageUrls: string[]) => ({
    species: basicInfo.species,
    basicInfo,
    chiefComplaint,
    clinicalSymptoms: { ...clinicalSymptoms, note: clinicalNote } as unknown as CaseClinicalSymptoms,
    necropsyLesions: necropsyLesions as unknown as CaseNecropsyLesions,
    labTests,
    immuneHistory,
    medicationHistory,
    environment,
    epidemiology,
    imageUrls,
    role: user?.role,
    subRole: user?.subRole ?? undefined,
  });

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
      // 上传图片（临床 + 剖检）
      const allPhotoUris = [...clinicalPhotos, ...necropsyPhotos];
      let urls: string[] = [];
      if (allPhotoUris.length) {
        const dataUris = await Promise.all(allPhotoUris.map(uriToDataUri));
        const uploaded = await vetDiagnosisApi.upload(dataUris);
        urls = uploaded.urls;
      }

      // 在线 AI 深度诊断
      let final;
      try {
        const created = await vetDiagnosisApi.createCase(buildCasePayload(urls));
        final = await pollUntilDone(created.id);
      } catch (e) {
        // 网络/AI 不可用 → 离线规则引擎兜底
        await saveOffline();
        return;
      }

      if (final?.status === 'completed') {
        router.push(`/vet-diagnosis/${final.id}`);
      } else {
        // AI 诊断失败 → 离线兜底
        await saveOffline();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '诊断失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.stepTitle}>第 1 步 · 基本信息（必填）</Text>
            <Text style={styles.catLabel}>动物种类</Text>
            <View style={styles.row}>
              {SPECIES.map((s) => (
                <Chip key={s} label={s} active={basicInfo.species === s}
                  onPress={() => setBasicInfo({ ...basicInfo, species: s })} />
              ))}
            </View>
            <Field label="品种" value={basicInfo.breed}
              onChangeText={(v) => setBasicInfo({ ...basicInfo, breed: v })} placeholder="如：海兰褐 / 三黄鸡" />
            <Field label="日龄(天)" value={basicInfo.ageDays ? String(basicInfo.ageDays) : ''}
              keyboardType="numeric"
              onChangeText={(v) => setBasicInfo({ ...basicInfo, ageDays: parseInt(v, 10) || 0 })} />
            <View style={styles.rowFields}>
              <View style={styles.rowField}>
                <Field label="存栏量(羽)" value={basicInfo.stock ? String(basicInfo.stock) : ''}
                  keyboardType="numeric"
                  onChangeText={(v) => setBasicInfo({ ...basicInfo, stock: parseInt(v, 10) || 0 })} />
              </View>
              <View style={styles.rowField}>
                <Field label="发病数(羽)" value={basicInfo.sickCount ? String(basicInfo.sickCount) : ''}
                  keyboardType="numeric"
                  onChangeText={(v) => setBasicInfo({ ...basicInfo, sickCount: parseInt(v, 10) || 0 })} />
              </View>
            </View>
            <Field label="死亡数(羽)" value={basicInfo.deathCount ? String(basicInfo.deathCount) : ''}
              keyboardType="numeric"
              onChangeText={(v) => setBasicInfo({ ...basicInfo, deathCount: parseInt(v, 10) || 0 })} />
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
            <Field label="发病时间" value={chiefComplaint.onsetTime}
              onChangeText={(v) => setChiefComplaint({ ...chiefComplaint, onsetTime: v })}
              placeholder="例如：3天前" />
            <Text style={styles.catLabel}>病程</Text>
            <View style={styles.row}>
              {COURSES.map((c) => (
                <Chip key={c} label={c} active={chiefComplaint.course === c}
                  onPress={() => setChiefComplaint({ ...chiefComplaint, course: c })} />
              ))}
            </View>
            <Field label="发病经过" multiline value={chiefComplaint.progression}
              onChangeText={(v) => setChiefComplaint({ ...chiefComplaint, progression: v })}
              placeholder="先出现什么症状，后出现什么变化" />
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
            <TagPicker categories={SYMPTOM_CATEGORIES} selected={clinicalSymptoms}
              onToggle={(key, tag) => toggleTag(setClinicalSymptoms, key, tag)} />
            <Field label="补充描述（可选）" multiline value={clinicalNote} onChangeText={setClinicalNote}
              placeholder="其他需要说明的症状" />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>第 4 步 · 剖检病变（可选，强烈建议）</Text>
            <PhotoRow label="剖检照片" uris={necropsyPhotos}
              onAdd={setNecropsyPhotos} onRemove={(u) => setNecropsyPhotos((p) => p.filter((x) => x !== u))}
              max={MAX_NECROPSY_PHOTOS} />
            <TagPicker categories={LESION_CATEGORIES} selected={necropsyLesions}
              onToggle={(key, tag) => toggleTag(setNecropsyLesions, key, tag)} />
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>第 5 步 · 实验室检测（可选）</Text>
            {([
              ['serology', '血清学检测（如 HI 抗体滴度）'],
              ['pathogen', '病原学检测（如 PCR/病毒分离）'],
              ['bacteriology', '细菌学检测（细菌分离/药敏）'],
              ['parasitology', '寄生虫检测（粪便虫卵等）'],
              ['biochemistry', '血液生化'],
              ['cbc', '血常规'],
            ] as [keyof CaseLabTests, string][]).map(([key, label]) => (
              <Field key={key} label={label} multiline
                value={labTests[key].join('、')}
                onChangeText={(v) => setLabTests({ ...labTests, [key]: splitList(v) })} />
            ))}
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={styles.stepTitle}>第 6 步 · 免疫史</Text>
            <Field label="免疫程序表" multiline value={immuneHistory.program.join('\n')}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, program: v.split('\n').filter(Boolean) })}
              placeholder="疫苗名称+接种日龄+途径，每行一条" />
            <Field label="最近一次免疫" value={immuneHistory.lastVaccine}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, lastVaccine: v })} />
            <Text style={styles.catLabel}>免疫后反应</Text>
            <View style={styles.row}>
              {REACTIONS.map((r) => (
                <Chip key={r} label={r} active={immuneHistory.postVaccineReaction === r}
                  onPress={() => setImmuneHistory({ ...immuneHistory, postVaccineReaction: r })} />
              ))}
            </View>
            <Field label="抗体检测" value={immuneHistory.antibodyTest}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, antibodyTest: v })} />
            <Field label="免疫失败史" multiline value={immuneHistory.vaccineFailureHistory}
              onChangeText={(v) => setImmuneHistory({ ...immuneHistory, vaccineFailureHistory: v })} />
          </View>
        );
      case 6:
        return (
          <View>
            <Text style={styles.stepTitle}>第 7 步 · 用药史</Text>
            <Field label="最近用药" multiline value={medicationHistory.recentDrugs.join('\n')}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, recentDrugs: v.split('\n').filter(Boolean) })}
              placeholder="药品名称+剂量+途径+疗程，每行一条" />
            <Text style={styles.catLabel}>用药效果</Text>
            <View style={styles.row}>
              {EFFECTS.map((e) => (
                <Chip key={e} label={e} active={medicationHistory.effect === e}
                  onPress={() => setMedicationHistory({ ...medicationHistory, effect: e })} />
              ))}
            </View>
            <Field label="药物过敏/不良反应史" value={medicationHistory.allergyHistory}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, allergyHistory: v })} />
            <Field label="常用保健药物" multiline value={medicationHistory.healthProducts.join('、')}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, healthProducts: splitList(v) })} />
            <Field label="休药期情况" value={medicationHistory.withdrawalPeriod}
              onChangeText={(v) => setMedicationHistory({ ...medicationHistory, withdrawalPeriod: v })} />
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
            <Field label="通风" value={environment.ventilation}
              onChangeText={(v) => setEnvironment({ ...environment, ventilation: v })} />
            <Field label="密度(只/㎡)" keyboardType="numeric" value={environment.density}
              onChangeText={(v) => setEnvironment({ ...environment, density: v })} />
            <Field label="饲料" value={environment.feed}
              onChangeText={(v) => setEnvironment({ ...environment, feed: v })} placeholder="类型/品牌/是否霉变" />
            <Field label="饮水" value={environment.water}
              onChangeText={(v) => setEnvironment({ ...environment, water: v })} />
            <Field label="光照" value={environment.light}
              onChangeText={(v) => setEnvironment({ ...environment, light: v })} />
            <Field label="最近天气变化" value={environment.weatherChange}
              onChangeText={(v) => setEnvironment({ ...environment, weatherChange: v })} />
            <Field label="人员流动" value={environment.humanTraffic}
              onChangeText={(v) => setEnvironment({ ...environment, humanTraffic: v })} />
            <Field label="周边疫情" value={environment.surroundingEpidemic}
              onChangeText={(v) => setEnvironment({ ...environment, surroundingEpidemic: v })} />
            <Field label="生物安全" value={environment.biosecurity}
              onChangeText={(v) => setEnvironment({ ...environment, biosecurity: v })} />
          </View>
        );
      case 8:
        return (
          <View>
            <Text style={styles.stepTitle}>第 9 步 · 流行病学</Text>
            <Field label="引种史（近6个月）" multiline value={epidemiology.introductionHistory}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, introductionHistory: v })} />
            <Field label="疫苗来源（厂家/批次/运输）" value={epidemiology.vaccineSource}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, vaccineSource: v })} />
            <Field label="鸡群来源" value={epidemiology.flockSource}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, flockSource: v })} placeholder="自繁自养/外购雏鸡" />
            <Field label="混养情况" value={epidemiology.mixedFarming}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, mixedFarming: v })} />
            <Field label="野鸟接触" value={epidemiology.wildBirdContact}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, wildBirdContact: v })} />
            <Field label="同类养殖场（周边）" value={epidemiology.similarFarms}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, similarFarms: v })} />
            <Field label="病死鸡处理" value={epidemiology.deadBirdDisposal}
              onChangeText={(v) => setEpidemiology({ ...epidemiology, deadBirdDisposal: v })} />
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
          <Text style={styles.title}>🔬 AI兽医诊断</Text>
          <TouchableOpacity onPress={() => router.push('/vet-diagnosis/history')}>
            <Text style={styles.libraryLink}>📚 病例库</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>结构化 9 维信息采集 · 豆包深度诊断 · 离线兜底</Text>
      </View>

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
            style={[styles.footerBtn, styles.footerBtnPrimary, loading && styles.disabled]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.submitInner}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.footerBtnText}>诊断中…（约15秒）</Text>
              </View>
            ) : (
              <Text style={styles.footerBtnText}>🚀 提交AI诊断</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  rowFields: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },
  fieldWrap: { marginTop: 12 },
  fieldLabel: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 6 },
  requiredStar: { color: '#EF4444' },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12,
    fontSize: 14, color: '#333',
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
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
  tagCatLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  tagActive: { backgroundColor: '#dcfce7', borderColor: '#22C55E' },
  tagText: { fontSize: 13, color: '#555' },
  tagTextActive: { color: '#166534', fontWeight: '600' },
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
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.7 },
});