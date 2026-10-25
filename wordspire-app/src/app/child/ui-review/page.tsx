import Link from "next/link";
import { notFound } from "next/navigation";
import { ChildShell, PageHeader, WSCard } from "@/components/child/ChildShell";
import { ResetPreviewButton } from "@/components/child/ResetPreviewButton";

const SCREENS = [
  { title: "语音引导页", href: "/child/voice-guide?demo=1" },
  { title: "塔 · 首页", href: "/child?demo=1", note: "桌面布局：视口宽度至少 768px" },
  { title: "塔 · 首页 · 行动版", href: "/child?demo=1", note: "移动布局：视口宽度至多 639px" },
  { title: "学习报告", href: "/child/report?demo=1" },
  { title: "闯关地图", href: "/child/map?demo=1" },
  { title: "闯关游戏 · 答题中", href: "/child/play?index=0&demo=1" },
  { title: "闯关游戏 · 答对反馈", href: "/child/play/correct?index=1&word=Apple&translation=苹果&demo=1" },
  { title: "闯关游戏 · 答错鼓励", href: "/child/play/wrong?index=0&word=Apple&translation=苹果&demo=1" },
  { title: "闯关游戏 · 关卡结算", href: "/child/play/complete?demo=1" },
  { title: "对战大厅", href: "/child/battle?demo=1" },
  { title: "对战进行", href: "/child/battle/play?battleId=demo-battle&demo=1" },
  { title: "对战结算", href: "/child/battle/result?battleId=demo-battle&demo=1" },
  { title: "收藏图鉴 · 角色", href: "/child/collection?demo=1" },
  { title: "收藏图鉴 · 徽章", href: "/child/collection/badges?demo=1" },
  { title: "收藏图鉴 · 解锁弹窗", href: "/child/collection/unlock?itemKey=strawberry&demo=1" },
];

export default function UiReviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <ChildShell showNav={false}>
      <PageHeader title="前端页面审查" subtitle="15 个设计稿入口" />
      <WSCard>
        <p>当前使用设计示例数据，供审查页面样式和交互。学习记录、对战结果和星星数值属于本地预览数据。</p>
        <p>两个首页入口使用同一路由，根据浏览器视口宽度显示对应布局。</p>
        <ResetPreviewButton />
        <ol className="grid gap-3 mt-6" aria-label="设计稿页面入口">
          {SCREENS.map((screen, index) => (
            <li key={screen.title}>
              <Link className="ws-button ws-button-secondary" href={screen.href}>{index + 1}. {screen.title}</Link>
              {screen.note ? <p className="ws-subtitle mt-2">{screen.note}</p> : null}
            </li>
          ))}
        </ol>
      </WSCard>
    </ChildShell>
  );
}
