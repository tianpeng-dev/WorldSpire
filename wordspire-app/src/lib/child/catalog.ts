import type {
  BattleDTO,
  BattleLobbyDTO,
  ChildOverviewDTO,
  CollectionDTO,
  CollectionEntryDTO,
  QuestionDTO,
  ReportDTO,
  StageSummaryDTO,
} from "@/types";

export const DEMO_OVERVIEW: ChildOverviewDTO = {
  child: {
    id: "demo-child",
    nickname: "小芳",
    level: 2,
    wordCount: 24,
    streak: 5,
    status: "active",
  },
  wallet: { balance: 128, totalEarned: 178 },
  today: { completed: 3, total: 5 },
  weekly: { newWords: 14, accuracy: 0.74 },
  currentStageId: "stage-fruit-2",
};

export const DEMO_STAGES: StageSummaryDTO[] = [
  {
    id: "stage-fruit-1",
    title: "苹果与香蕉",
    order: 1,
    pointsReward: 5,
    status: "completed",
    completedStars: 5,
    description: "已完成 · 获得 5 星",
  },
  {
    id: "stage-fruit-2",
    title: "葡萄与橙子",
    order: 2,
    pointsReward: 5,
    status: "in_progress",
    completedStars: 0,
    description: "进行中 · 点击继续",
  },
  {
    id: "stage-fruit-3",
    title: "西瓜与草莓",
    order: 3,
    pointsReward: 5,
    status: "locked",
    completedStars: 0,
    description: "未解锁 · 通关第 2 关开启",
  },
  {
    id: "stage-fruit-4",
    title: "水果大挑战",
    order: 4,
    pointsReward: 10,
    status: "locked",
    completedStars: 0,
    description: "未解锁 · 通关第 3 关开启",
  },
];

const FRUIT_OPTIONS = [
  { id: "apple", visual: "🍎", label: "苹果" },
  { id: "banana", visual: "🍌", label: "香蕉" },
  { id: "grape", visual: "🍇", label: "葡萄" },
  { id: "orange", visual: "🍊", label: "橙子" },
];

export const DEMO_QUESTIONS: QuestionDTO[] = [
  {
    id: "question-apple",
    stageId: "stage-fruit-2",
    targetWord: "Apple",
    translation: "苹果",
    promptAudioUrl: null,
    options: FRUIT_OPTIONS,
  },
  {
    id: "question-banana",
    stageId: "stage-fruit-2",
    targetWord: "Banana",
    translation: "香蕉",
    promptAudioUrl: null,
    options: FRUIT_OPTIONS,
  },
  {
    id: "question-grape",
    stageId: "stage-fruit-2",
    targetWord: "Grape",
    translation: "葡萄",
    promptAudioUrl: null,
    options: FRUIT_OPTIONS,
  },
  {
    id: "question-orange",
    stageId: "stage-fruit-2",
    targetWord: "Orange",
    translation: "橙子",
    promptAudioUrl: null,
    options: FRUIT_OPTIONS,
  },
  {
    id: "question-apple-2",
    stageId: "stage-fruit-2",
    targetWord: "Apple",
    translation: "苹果",
    promptAudioUrl: null,
    options: FRUIT_OPTIONS,
  },
];

export const DEMO_REPORT: ReportDTO = {
  status: "ready",
  summary: "本周学习 135 分钟，新增 14 个词，答题准确率 74%，连续学习 5 天。继续加油！",
  overview: { newWords: 14, accuracy: 0.74, streak: 5, stars: 128 },
  abilities: [
    { key: "listening", label: "听力", value: 0.78 },
    { key: "speaking", label: "口语", value: 0.65 },
    { key: "spelling", label: "拼读", value: 0.74 },
    { key: "vocabulary", label: "词汇", value: 0.82 },
  ],
  achievements: [
    { key: "streak", label: "连胜 3 天", visual: "🔥" },
    { key: "levels", label: "闯关 10 关", visual: "🏆" },
    { key: "pronunciation", label: "发音小达人", visual: "🎙️" },
  ],
  totalTimeMin: 135,
};

const CHARACTER_CATALOG: CollectionEntryDTO[] = [
  { itemKey: "apple", itemName: "小苹果", kind: "character", visual: "🍎", unlocked: true, unlockCost: 0, description: "水果王国的第一位朋友" },
  { itemKey: "banana", itemName: "香蕉仔", kind: "character", visual: "🍌", unlocked: true, unlockCost: 0, description: "会唱歌的香蕉仔" },
  { itemKey: "grape", itemName: "葡萄精灵", kind: "character", visual: "🍇", unlocked: true, unlockCost: 0, description: "住在葡萄藤上的小精灵" },
  { itemKey: "orange", itemName: "橙子骑士", kind: "character", visual: "🍊", unlocked: true, unlockCost: 0, description: "守护果园的勇敢骑士" },
  { itemKey: "watermelon", itemName: "西瓜博士", kind: "character", visual: "🍉", unlocked: true, unlockCost: 0, description: "最爱研究新单词" },
  { itemKey: "strawberry", itemName: "草莓公主", kind: "character", visual: "🍓", unlocked: false, unlockCost: 50, description: "集齐 50 颗星星即可解锁" },
  { itemKey: "lemon", itemName: "柠檬侦探", kind: "character", visual: "🍋", unlocked: false, unlockCost: 80, description: "发现隐藏单词的侦探" },
  { itemKey: "peach", itemName: "桃子画家", kind: "character", visual: "🍑", unlocked: false, unlockCost: 100, description: "把单词画进故事里" },
  { itemKey: "pear", itemName: "梨子船长", kind: "character", visual: "🍐", unlocked: false, unlockCost: 120, description: "带你驶向词汇海洋" },
  { itemKey: "cherry", itemName: "樱桃双子", kind: "character", visual: "🍒", unlocked: false, unlockCost: 140, description: "一起完成每日任务" },
  { itemKey: "pineapple", itemName: "菠萝国王", kind: "character", visual: "🍍", unlocked: false, unlockCost: 180, description: "水果王国的最终奖励" },
  { itemKey: "kiwi", itemName: "奇异果学者", kind: "character", visual: "🥝", unlocked: false, unlockCost: 220, description: "掌握更多拼读规则后解锁" },
];

const BADGE_CATALOG: CollectionEntryDTO[] = [
  { itemKey: "streak-5", itemName: "连胜 5 天", kind: "badge", visual: "🔥", unlocked: true, unlockCost: 0, description: "连续学习 5 天" },
  { itemKey: "stars-100", itemName: "100 星达成", kind: "badge", visual: "⭐", unlocked: true, unlockCost: 0, description: "累计获得 100 颗星星" },
  { itemKey: "battle-first", itemName: "对战首胜", kind: "badge", visual: "🏆", unlocked: true, unlockCost: 0, description: "赢得第一场对战" },
  { itemKey: "words-10", itemName: "解锁 10 词", kind: "badge", visual: "🔒", unlocked: false, unlockCost: 0, description: "掌握 10 个新单词" },
  { itemKey: "words-50", itemName: "词汇小达人", kind: "badge", visual: "📚", unlocked: false, unlockCost: 0, description: "掌握 50 个新单词" },
  { itemKey: "pronunciation", itemName: "发音小达人", kind: "badge", visual: "🎙️", unlocked: false, unlockCost: 0, description: "完成 20 次口语练习" },
  { itemKey: "map-master", itemName: "地图探险家", kind: "badge", visual: "🗺️", unlocked: false, unlockCost: 0, description: "完成水果王国全部关卡" },
  { itemKey: "parent-pk", itemName: "亲子默契", kind: "badge", visual: "💛", unlocked: false, unlockCost: 0, description: "完成 3 场亲子对战" },
];

export const DEMO_COLLECTION: CollectionDTO = {
  balance: DEMO_OVERVIEW.wallet.balance,
  characters: CHARACTER_CATALOG,
  badges: BADGE_CATALOG,
};

export const DEMO_BATTLE_LOBBY: BattleLobbyDTO = {
  childAccuracy: 0.74,
  aiStageId: "stage-fruit-2",
  parentChallenge: {
    battleId: "demo-parent-battle",
    stageTitle: "水果王国 · 第 2 关",
    message: "周末一起比一比？",
    expiresAt: null,
  },
};

export const DEMO_BATTLE: BattleDTO = {
  id: "demo-battle",
  mode: "ai",
  status: "in_progress",
  roundIndex: 1,
  totalRounds: 3,
  childScore: 2,
  opponentScore: 1,
  childName: "小芳",
  opponentName: "小塔",
  question: { ...DEMO_QUESTIONS[1] },
  winnerId: null,
  rank: null,
};

export const DEMO_BATTLE_RESULT: BattleDTO = {
  ...DEMO_BATTLE,
  status: "resolved",
  roundIndex: 3,
  childScore: 3,
  opponentScore: 1,
  question: null,
  winnerId: "demo-child",
  rank: 3,
};

export function getDemoQuestion(index: number): QuestionDTO {
  return DEMO_QUESTIONS[Math.max(0, Math.min(index, DEMO_QUESTIONS.length - 1))];
}

export function getDemoCollectionEntry(itemKey: string): CollectionEntryDTO | null {
  return [...CHARACTER_CATALOG, ...BADGE_CATALOG].find((item) => item.itemKey === itemKey) ?? null;
}
