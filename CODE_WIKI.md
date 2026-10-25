# 词灵塔 WordSpire · 代码与模块说明

应用源代码位于 [wordspire-app](wordspire-app)。运行配置、命令和部署要求见 [应用说明](wordspire-app/README.md)，服务接口的业务约定见 [后端模块契约](wordspire-app/docs/backend.md)。

## 使用的技术

| 用途 | 组件 |
| --- | --- |
| 运行环境 | Node.js 24 |
| 应用框架 | Next.js 15.5.25、React 19、TypeScript |
| 页面样式 | Tailwind CSS、应用 CSS |
| 数据库 | PostgreSQL 16、pg、Drizzle ORM 0.45.2 |
| 数据库迁移 | Drizzle Kit 0.31.10、Drizzle 官方迁移器 |
| 账号认证 | Better Auth 1.7.7、Drizzle adapter、数据库会话 |
| 输入校验 | Zod 4 |
| 日志 | Pino |
| 资源存储接口 | Vercel Blob |
| 部署配置 | Vercel、Cron |

确切依赖版本由 [package.json](wordspire-app/package.json) 和 [package-lock.json](wordspire-app/package-lock.json) 管理。

## 主要目录

| 目录 | 职责 |
| --- | --- |
| [src/app/child](wordspire-app/src/app/child) | 儿童引导、首页、地图、答题、对战、收藏与报告页面 |
| [src/app/parent](wordspire-app/src/app/parent) | 家长登录、概况、报告、对战与设置页面 |
| [src/app/api](wordspire-app/src/app/api) | HTTP 接口、健康检查、OpenAPI 文档与定时任务入口 |
| [src/app/actions](wordspire-app/src/app/actions) | Server Actions |
| [src/components/child](wordspire-app/src/components/child) | 儿童页面公共组件与查询逻辑 |
| [src/lib](wordspire-app/src/lib) | 业务服务、认证、数据库、配置和 HTTP 公共逻辑 |
| [src/hooks](wordspire-app/src/hooks) | 游戏循环及离线同步 |
| [src/store](wordspire-app/src/store) | 本地学习数据与同步队列 |
| [drizzle](wordspire-app/drizzle) | SQL 迁移、快照与迁移登记信息 |
| [scripts](wordspire-app/scripts) | 应用启动、数据库迁移、课程初始化与集成验证 |
| [tests](wordspire-app/tests) | 单元测试、数据库及 HTTP 集成测试 |

## 服务模块

| 模块 | 入口 | 职责 |
| --- | --- | --- |
| 配置 | [config/env.ts](wordspire-app/src/lib/config/env.ts) | 校验 Node.js 版本、必需变量及数据库连接参数 |
| 认证 | [auth/auth.ts](wordspire-app/src/lib/auth/auth.ts) | 匿名儿童账号、家长邮箱密码、数据库会话与限流 |
| 身份 | [auth/identity.ts](wordspire-app/src/lib/auth/identity.ts) | 服务端身份、角色及主力设备检查 |
| 亲子绑定 | [binding/service.ts](wordspire-app/src/lib/binding/service.ts) | 八位好友码、申请、儿童确认、双方解除 |
| 课程内容 | [content/service.ts](wordspire-app/src/lib/content/service.ts) | 课程初始化、课程查询、关卡资源及上传接口 |
| 学习 | [learning/service.ts](wordspire-app/src/lib/learning/service.ts) | 服务端判题、掌握度、学习会话及通关结算 |
| 自适应学习 | [adaptive/engine.ts](wordspire-app/src/lib/adaptive/engine.ts) | BKT 掌握度及难度计算 |
| 奖励 | [rewards/service.ts](wordspire-app/src/lib/rewards/service.ts) | 事务内更新钱包与同步记录 |
| 收藏 | [collection/service.ts](wordspire-app/src/lib/collection/service.ts) | 余额检查、兑换与重复请求保护 |
| 对战 | [battle/service.ts](wordspire-app/src/lib/battle/service.ts) | AI 三回合对战、判题、胜负及奖励 |
| 报告 | [report/service.ts](wordspire-app/src/lib/report/service.ts) | 学习统计、规则摘要及外部摘要服务接口 |
| 通知 | [push/service.ts](wordspire-app/src/lib/push/service.ts) | 站内通知写入、查询和已读状态 |
| 同步 | [db/sync.ts](wordspire-app/src/lib/db/sync.ts) | 逐项确认、事务收据、实体版本与儿童下行游标 |
| 定时任务 | [cron/service.ts](wordspire-app/src/lib/cron/service.ts) | Bearer 鉴权、周期执行、失败与重试记录 |

## 数据与访问权限

数据库结构由 [schema.ts](wordspire-app/src/lib/db/schema.ts) 定义，数据库访问使用 `pg` 连接池和 Drizzle。数据库连接与时间字段采用 UTC。

儿童业务写入检查数据库会话、儿童档案和主力设备。家长读取儿童数据需要有效的亲子绑定。页面、HTTP 接口与 Server Actions 共用身份检查。

答题、掌握度、钱包、关卡和同步记录在同一个数据库事务中变更。通关结算、兑换及对战结算检查业务状态，避免重复发放奖励或扣除余额。同步请求按项目返回确认结果，客户端据此更新对应的队列项目。

数据库迁移命令检查迁移登记、结构与校验值，使用 PostgreSQL advisory lock 防止并发迁移。配置无效、迁移不匹配及未知服务错误保留真实原因并终止对应操作。

## HTTP 接口与健康检查

运行服务后，`/api/openapi` 提供 OpenAPI 3.1 文档，`/api/docs` 提供文档入口。接口包括账号、亲子绑定、课程、学习、收藏、对战、报告、通知和同步。

`/api/health/live` 检查进程存活，`/api/health/ready` 检查数据库就绪。业务响应包含请求标识，日志隐藏密码、Cookie、认证凭据、数据库连接地址及 SQL 参数。

## 内容及外部服务

课程初始化包含水果王国课程、4 个关卡和 9 道题目。教材词汇与题库文件另保存在 [materials/textbooks](materials/textbooks)。

完整课程生产、音频资源、离线题包学习体验、亲子异步对战和完整家长业务页面需要相应业务实现。亲子异步对战及设备推送发送器等未实现能力返回明确的状态；外部摘要或资源存储缺少配置时返回服务不可用错误。具体约定见 [后端模块契约](wordspire-app/docs/backend.md)。

## 开发验证

在 `wordspire-app` 中运行 `npm run typecheck`、`npm run lint`、`npm run test:unit` 和 `npm run build`。

数据库及 HTTP 集成验证使用 PostgreSQL 16、真实账号、Cookie 和 Next.js HTTP 服务。`TEST_DATABASE_URL` 指向具备创建数据库权限的独立测试环境，数据库名称以 `wordspire_test` 开头。执行命令为 `npm run test:integration`，生产构建完成后执行 `npm run test:integration:production`。

GitHub Actions 使用 [.github/workflows/backend.yml](.github/workflows/backend.yml) 执行依赖安装、检查、测试及生产构建。云端部署与外部服务的验证范围由对应环境决定。
