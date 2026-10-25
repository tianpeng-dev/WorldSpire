# 词灵塔 WordSpire

## 本地启动

以下命令均在 `wordspire-app` 目录中执行。

运行环境为 Node.js 24；`.nvmrc` 指定 24.21.0。数据库支持本机 PostgreSQL 与 Neon PostgreSQL，使用 `pg` 连接池和 Drizzle 交互式事务。Drizzle ORM 固定为 0.45.2、Drizzle Kit 固定为 0.31.10、Better Auth 和 Drizzle adapter 固定为 1.7.7。

生产构建关闭 Webpack 磁盘缓存，以限制本地和 CI 的中间文件占用；完整编译、类型检查和构建流程保持启用。

```bash
nvm use
npm ci
cp .env.example .env.local
```

在 PostgreSQL 中创建 `wordspire` 数据库，填写 `.env.local` 中的 `POSTGRES_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET` 和 `CRON_SECRET`。两个密钥分别使用独立的至少 32 个字符的随机值。环境变量示例中包含生成命令。Neon 连接地址保留其 TLS 参数。

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

儿童入口为 `/child/voice-guide`，家长注册及登录入口为 `/parent/sign-in`，退出入口为 `/parent/settings`。家长功能提供邮箱注册、登录和退出。家长通过八位好友码申请绑定，儿童确认后可以访问其数据；任一参与者可以解除绑定。

`npm run dev:ui` 启用现有设计示例预览，使用相同的环境变量校验。开发环境也支持 `?demo=1`。生产环境关闭设计示例预览。后端接口始终检查真实数据库会话与权限。

## 配置和数据库

应用启动、迁移、初始化和 Drizzle Kit 共用 `src/lib/config/env.ts`。缺少必需配置立即终止。连接池数量、连接超时、空闲超时与 SQL 超时均可配置。数据库连接统一使用 UTC，时间字段按 UTC 保存。进程和数据库检查分别位于 `/api/health/live`、`/api/health/ready`。

迁移文件和快照保存在 `drizzle/`，通过 Drizzle 官方迁移器写入 `drizzle.__drizzle_migrations`。迁移命令使用 PostgreSQL advisory lock 防止并发迁移，并检查已登记迁移的校验值。

对于使用既有 19 张业务表、尚未登记迁移的数据库，迁移命令会检查初始结构的字段、类型、非空条件、主键、外键和索引，然后登记基线并执行增量迁移。结构不匹配时立即停止。升级保留用户、儿童档案、学习会话和答题标识；为儿童补充匿名身份邮箱、好友码，并为已有同步记录建立独立游标。已有时间字段应遵循原 Drizzle 定义的 UTC 约定。

```bash
# 修改 schema 后生成增量迁移，并审阅生成的 SQL。
npm run db:generate
# 应用尚未执行的迁移。
npm run db:migrate
# 初始化课程内容，可以重复执行。
npm run db:seed
```

课程读取接口保持只读。儿童档案、钱包和初始进度由建档事务创建。保留原 `SESSION_SECRET` 后，有效的旧 `ws_session` 可通过 `POST /api/auth` 升级：先检查签名、有效期及数据库身份，再换发数据库会话。家长登录保留原有儿童账号及学习记录。已有儿童首次升级会话时登记主力设备。

## 接口与模块

OpenAPI 3.1 文档通过 `/api/openapi` 提供，包含认证、绑定、学习、收藏、对战、报告、通知、课程、同步、健康检查及 Cron。具体模块能力和边界见 [docs/backend.md](docs/backend.md)。

业务错误响应保留 `error`，同时返回 `requestId`；输入校验错误附带 `issues`。响应头包含 `X-Request-Id`。未知错误记录真实原因，响应为 500。日志隐藏密码、Cookie、认证凭据、数据库地址和 SQL 参数。

儿童写入接口需要 `X-WordSpire-Device-Id`，并检查请求设备、数据库会话设备和儿童主力设备一致。家长访问儿童概况、报告和对战详情需要 `active` 绑定。页面、API 和 Server Actions 共用身份检查。

## 自动化验证

```bash
npm run typecheck
npm run lint
npm run test:unit
TEST_DATABASE_URL=postgresql://localhost:5432/wordspire_test npm run test:integration
npm run build
npm run test:integration:production
npm run start
```

集成测试要求 PostgreSQL 16 和创建数据库的权限。`TEST_DATABASE_URL` 的数据库名称必须以 `wordspire_test` 开头。测试程序创建本次运行专用的两个数据库，分别验证空数据库和已有数据库升级；启动真实 Next.js HTTP 服务，使用真实 Cookie、账号、哈希密码和数据库查询进行验证。测试结束后删除本次运行创建的数据库。应用数据库连接地址不会被用作测试目标。

测试覆盖注册、登录、退出、错误密码、过期会话、角色篡改、绑定确认前后及解除后的权限、跨儿童访问、主力设备限制、事务失败恢复、并发重复请求、幂等结算、同步确认、Cron 鉴权和失败重试。`test:integration:production` 使用已经构建的生产服务执行相同验证，并启动实际无法连接数据库的服务实例，检查存活、就绪和错误响应；同样需要 `TEST_DATABASE_URL`。数据库触发器用于在独立测试数据库中制造真实写入失败。认证和数据库集成测试没有使用模拟依赖。本地队列确认逻辑另由单元测试验证，使用 Node.js 环境下的内存存储。

HTTP 服务日志和测试结果位于忽略提交的 `.work/`。GitHub Actions 配置位于项目根目录 `.github/workflows/backend.yml`，执行依赖安装、类型检查、ESLint、单元测试、PostgreSQL 16 集成测试和生产构建。

本机执行结果及验证范围见 [docs/verification.md](docs/verification.md)。

## Vercel 配置

Vercel 项目 Root Directory 设置为 `wordspire-app`，Node.js 版本使用 24。在对应环境中配置必需变量，`BETTER_AUTH_URL` 使用实际域名。发布前执行迁移与课程初始化。连接池在 Vercel 上接入 `attachDatabasePool`，以释放空闲连接。

运行版本由 `package.json` 和 Vercel 项目设置指定为 Node.js 24。`vercel.json` 配置每周周报和每日失活扫描，Cron 时间采用 UTC。两个接口检查 `Authorization: Bearer ${CRON_SECRET}`，以任务和周期避免重复执行，并保存每次执行状态及真实失败原因。

云端部署、Neon 远程连接、外部 LLM、Blob 上传和设备推送需要实际服务配置，目前不属于本机真实服务验证的范围。站内通知队列保存于数据库，设备推送发送器返回明确的未配置或未实现错误。
