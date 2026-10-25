import type { QuestionType } from "@/types";

export const FRUIT_OPTIONS = [
  { id: "apple", visual: "🍎", label: "苹果" },
  { id: "banana", visual: "🍌", label: "香蕉" },
  { id: "grape", visual: "🍇", label: "葡萄" },
  { id: "orange", visual: "🍊", label: "橙子" },
  { id: "watermelon", visual: "🍉", label: "西瓜" },
  { id: "strawberry", visual: "🍓", label: "草莓" },
];

export const FRUIT_TRANSLATIONS: Record<string, { translation: string; visual: string }> = Object.fromEntries(
  FRUIT_OPTIONS.map((option) => [option.id, { translation: option.label, visual: option.visual }]),
);

export const COURSE_SEED = {
  id: "course-fruit-kingdom",
  kind: "vocab" as const,
  title: "水果王国",
  unitId: "unit-fruit-kingdom",
};

export const STAGE_SEED = [
  { id: "stage-fruit-1", title: "苹果与香蕉", order: 1, pointsReward: 5 },
  { id: "stage-fruit-2", title: "葡萄与橙子", order: 2, pointsReward: 5 },
  { id: "stage-fruit-3", title: "西瓜与草莓", order: 3, pointsReward: 5 },
  { id: "stage-fruit-4", title: "水果大挑战", order: 4, pointsReward: 10 },
];

type QuestionSeed = {
  id: string;
  stageId: string;
  targetWord: string;
  type: QuestionType;
  correctOptionId: string;
};

export const QUESTION_SEED: QuestionSeed[] = [
  { id: "question-apple", stageId: "stage-fruit-2", targetWord: "Apple", type: "picture_pick", correctOptionId: "apple" },
  { id: "question-banana", stageId: "stage-fruit-2", targetWord: "Banana", type: "picture_pick", correctOptionId: "banana" },
  { id: "question-grape", stageId: "stage-fruit-2", targetWord: "Grape", type: "picture_pick", correctOptionId: "grape" },
  { id: "question-orange", stageId: "stage-fruit-2", targetWord: "Orange", type: "picture_pick", correctOptionId: "orange" },
  { id: "question-watermelon", stageId: "stage-fruit-3", targetWord: "Watermelon", type: "picture_pick", correctOptionId: "watermelon" },
  { id: "question-strawberry-2", stageId: "stage-fruit-3", targetWord: "Strawberry", type: "picture_pick", correctOptionId: "strawberry" },
  { id: "question-apple-2", stageId: "stage-fruit-1", targetWord: "Apple", type: "picture_pick", correctOptionId: "apple" },
  { id: "question-banana-2", stageId: "stage-fruit-1", targetWord: "Banana", type: "picture_pick", correctOptionId: "banana" },
  { id: "question-orange-2", stageId: "stage-fruit-4", targetWord: "Orange", type: "picture_pick", correctOptionId: "orange" },
];

export const COLLECTION_SEED = [
  { itemKey: "apple", itemName: "小苹果", kind: "character" as const, visual: "🍎", unlockCost: 0, description: "水果王国的第一位朋友" },
  { itemKey: "banana", itemName: "香蕉仔", kind: "character" as const, visual: "🍌", unlockCost: 0, description: "会唱歌的香蕉仔" },
  { itemKey: "grape", itemName: "葡萄精灵", kind: "character" as const, visual: "🍇", unlockCost: 0, description: "住在葡萄藤上的小精灵" },
  { itemKey: "orange", itemName: "橙子骑士", kind: "character" as const, visual: "🍊", unlockCost: 0, description: "守护果园的勇敢骑士" },
  { itemKey: "watermelon", itemName: "西瓜博士", kind: "character" as const, visual: "🍉", unlockCost: 0, description: "最爱研究新单词" },
  { itemKey: "strawberry", itemName: "草莓公主", kind: "character" as const, visual: "🍓", unlockCost: 50, description: "集齐 50 颗星星即可解锁" },
  { itemKey: "lemon", itemName: "柠檬侦探", kind: "character" as const, visual: "🍋", unlockCost: 80, description: "发现隐藏单词的侦探" },
  { itemKey: "peach", itemName: "桃子画家", kind: "character" as const, visual: "🍑", unlockCost: 100, description: "把单词画进故事里" },
  { itemKey: "pear", itemName: "梨子船长", kind: "character" as const, visual: "🍐", unlockCost: 120, description: "带你驶向词汇海洋" },
  { itemKey: "cherry", itemName: "樱桃双子", kind: "character" as const, visual: "🍒", unlockCost: 140, description: "一起完成每日任务" },
  { itemKey: "pineapple", itemName: "菠萝国王", kind: "character" as const, visual: "🍍", unlockCost: 180, description: "水果王国的最终奖励" },
  { itemKey: "kiwi", itemName: "奇异果学者", kind: "character" as const, visual: "🥝", unlockCost: 220, description: "掌握更多拼读规则后解锁" },
  { itemKey: "streak-5", itemName: "连胜 5 天", kind: "badge" as const, visual: "🔥", unlockCost: 0, description: "连续学习 5 天" },
  { itemKey: "stars-100", itemName: "100 星达成", kind: "badge" as const, visual: "⭐", unlockCost: 0, description: "累计获得 100 颗星星" },
  { itemKey: "battle-first", itemName: "对战首胜", kind: "badge" as const, visual: "🏆", unlockCost: 0, description: "赢得第一场对战" },
  { itemKey: "words-10", itemName: "解锁 10 词", kind: "badge" as const, visual: "🔒", unlockCost: 0, description: "掌握 10 个新单词" },
  { itemKey: "words-50", itemName: "词汇小达人", kind: "badge" as const, visual: "📚", unlockCost: 0, description: "掌握 50 个新单词" },
  { itemKey: "pronunciation", itemName: "发音小达人", kind: "badge" as const, visual: "🎙️", unlockCost: 0, description: "完成 20 次口语练习" },
  { itemKey: "map-master", itemName: "地图探险家", kind: "badge" as const, visual: "🗺️", unlockCost: 0, description: "完成水果王国全部关卡" },
  { itemKey: "parent-pk", itemName: "亲子默契", kind: "badge" as const, visual: "💛", unlockCost: 0, description: "完成 3 场亲子对战" },
];

export function getOptionsForQuestion(question: QuestionSeed) {
  const selected = question.stageId === "stage-fruit-3"
    ? ["watermelon", "strawberry", "apple", "banana"]
    : question.stageId === "stage-fruit-4"
      ? FRUIT_OPTIONS.map((option) => option.id)
      : ["apple", "banana", "grape", "orange"];
  return selected.map((id) => FRUIT_OPTIONS.find((option) => option.id === id)).filter((option): option is typeof FRUIT_OPTIONS[number] => Boolean(option));
}

export function getCorrectIndex(question: QuestionSeed): number {
  return getOptionsForQuestion(question).findIndex((option) => option.id === question.correctOptionId);
}
