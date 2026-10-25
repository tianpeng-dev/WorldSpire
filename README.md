# 词灵塔 WordSpire

面向 4–11 岁儿童的游戏化英语学习项目，包含儿童学习、AI 对战、收藏、家长账号、亲子绑定及学习报告。

| 目录 | 内容 |
| --- | --- |
| [wordspire-app](wordspire-app) | Next.js 应用、数据库迁移、自动化测试及 Vercel 配置 |
| [wordspire-prd](wordspire-prd) | 产品需求文档 |
| [wordspire-requirements-v2](wordspire-requirements-v2) | 需求文档 |
| [wordspire-child-ui-prototypes](wordspire-child-ui-prototypes) | 儿童端页面原型及设计源文件 |
| [wordspire-child-ui-prototypes-pc-draft](wordspire-child-ui-prototypes-pc-draft) | 电脑端页面原型及设计源文件 |
| [materials/textbooks](materials/textbooks) | 教材来源记录、词汇数据、题库及 SQL 文件 |

## 本地运行

运行环境为 Node.js 24 和 PostgreSQL 16。安装依赖、配置环境变量、迁移数据库及启动服务的完整步骤见 [应用说明](wordspire-app/README.md)。

## Vercel 部署配置

| 设置 | 配置 |
| --- | --- |
| Git 分支 | `main` |
| Root Directory | `wordspire-app` |
| Framework Preset | `Next.js` |
| Node.js Version | `24.x` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | 使用 Next.js 默认配置 |

在 Vercel 对应环境配置 `POSTGRES_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET` 和 `CRON_SECRET`。`BETTER_AUTH_URL` 使用实际访问域名；两个密钥分别使用独立的至少 32 个字符的随机值。环境变量说明见 [配置示例](wordspire-app/.env.example)。

发布前，在 `wordspire-app` 中针对目标数据库执行 `npm run db:migrate` 和 `npm run db:seed`。定时任务由 [vercel.json](wordspire-app/vercel.json) 定义，时间采用 UTC。

## 开发资料

- [代码与模块说明](CODE_WIKI.md)
- [后端模块契约](wordspire-app/docs/backend.md)
- [自动化验证说明](wordspire-app/README.md#自动化验证)
- [本机验证记录](wordspire-app/docs/verification.md)
