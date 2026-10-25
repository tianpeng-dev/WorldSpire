import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { startSchema, attemptSchema, battleSchema, unlockSchema, notifySchema, bindingSchema, changeBindingSchema } from "./contracts";
import { guestSchema } from "../auth/auth";
import { syncSchema, syncResponseSchema } from "./sync-contracts";

extendZodWithOpenApi(z);
export function openApiDocument() {
  const registry = new OpenAPIRegistry();
  registry.registerComponent("securitySchemes", "session", { type: "apiKey", in: "cookie", name: "wordspire.session_token",
    description: "HTTPS 环境 Cookie 名称带 __Secure- 前缀。角色和身份由数据库会话确定。" });
  registry.registerComponent("securitySchemes", "cron", { type: "http", scheme: "bearer" });
  const error = registry.register("Error", z.object({ error: z.string(), requestId: z.string().uuid(), message: z.string().optional(), issues: z.array(z.unknown()).optional() }));
  const json = (schema: z.ZodType) => ({ "application/json": { schema } });
  const success = z.object({}).passthrough();
  const errors = Object.fromEntries([400, 401, 403, 404, 409, 413, 429, 500, 501, 503].map(status => [status, { description: "业务错误或服务错误", content: json(error) }]));
  function path(method: "get" | "post", url: string, summary: string, body?: z.ZodType, options: { public?: boolean; cron?: boolean; id?: boolean; childQuery?: boolean; write?: boolean; response?: z.ZodType; created?: boolean; optionalBody?: boolean } = {}) {
    registry.registerPath({ method, path: url, summary, security: options.public ? [] : options.cron ? [{ cron: [] }] : [{ session: [] }],
      request: { ...(body ? { body: { required: !options.optionalBody, content: json(body) } } : {}),
        ...(options.id ? { params: z.object({ id: z.string().min(1).max(21) }) } : {}),
        ...(options.childQuery ? { query: z.object({ childProfileId: z.string().min(1).max(21).optional() }) } : {}),
        ...(options.write ? { headers: z.object({ "X-WordSpire-Device-Id": z.string().uuid().describe("儿童主力设备标识，必须与会话和档案一致") }) } : {}) },
      responses: { [options.created ? 201 : 200]: { description: "请求成功", content: json(options.response ?? success) }, ...errors } });
  }
  path("get", "/api/health/live", "进程存活检查", undefined, { public: true });
  path("get", "/api/health/ready", "真实数据库连接就绪检查", undefined, { public: true });
  path("post", "/api/auth", "匿名儿童建档或旧会话升级；已有会话重复调用返回原档案", guestSchema, { public: true });
  path("post", "/api/auth/guest", "Better Auth 匿名儿童建档", guestSchema, { public: true });
  const credentials = z.object({ email: z.email().max(254), password: z.string().min(8).max(128) });
  path("post", "/api/auth/sign-up/email", "家长邮箱注册", credentials.extend({ name: z.string().min(1).max(64) }), { public: true });
  path("post", "/api/auth/sign-in/email", "家长邮箱登录", credentials, { public: true });
  path("post", "/api/auth/sign-out", "注销当前数据库会话", z.object({}), { optionalBody: true });
  path("get", "/api/auth/get-session", "查询 Better Auth 当前会话；未登录返回 null", undefined, { public: true, response: z.object({}).passthrough().nullable() });
  path("get", "/api/child/friend-code", "查询儿童唯一八位好友码");
  path("get", "/api/bindings", "查询当前儿童或家长的绑定关系");
  path("post", "/api/bindings", "家长通过好友码提交绑定申请", bindingSchema);
  path("post", "/api/bindings/{id}", "儿童确认绑定或任一参与者解除绑定", changeBindingSchema, { id: true });
  path("get", "/api/parent/children", "家长查询 active 绑定的儿童列表");
  path("get", "/api/child/overview", "儿童概况；家长需要 active 绑定", undefined, { childQuery: true });
  path("get", "/api/child/stages", "儿童关卡进度");
  path("post", "/api/learning/sessions", "创建或继续关卡会话", startSchema, { write: true, created: true });
  path("get", "/api/learning/sessions/{id}", "当前儿童学习会话", undefined, { id: true });
  path("post", "/api/learning/sessions/{id}/attempts", "服务端判题并更新掌握度和奖励；idempotencyKey 防止重复写入", attemptSchema, { id: true, write: true });
  path("post", "/api/learning/sessions/{id}/complete", "幂等通关结算", undefined, { id: true, write: true });
  path("get", "/api/collection", "当前儿童收藏");
  path("post", "/api/collection", "幂等兑换收藏", unlockSchema, { write: true });
  path("get", "/api/battle", "对战大厅；缺少历史答题时 childAccuracy 为 null");
  path("post", "/api/battle", "AI 对战、提交回合和结算；亲子异步对战返回 501", battleSchema, { write: true });
  path("get", "/api/battle/{id}", "对战详情；家长需要 active 绑定", undefined, { id: true });
  path("get", "/api/report", "真实学习统计；无依据的能力和成就列表为空", undefined, { childQuery: true });
  path("get", "/api/notify", "当前账号的站内通知");
  path("post", "/api/notify", "将当前账号通知标记已读", notifySchema);
  path("get", "/api/content/courses", "查询已初始化课程");
  path("post", "/api/sync", "同步队列；lastSyncVersion/serverVersion 为儿童下行游标，独立于实体 version", syncSchema, { write: true,
    response: syncResponseSchema });
  path("get", "/api/cron/weekly-report", "按周幂等生成周报并写入站内通知队列", undefined, { cron: true });
  path("get", "/api/cron/risk-scan", "每日幂等执行五天失活扫描", undefined, { cron: true });
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({ openapi: "3.1.0", info: { title: "WordSpire Backend", version: "0.1.0" },
    servers: [{ url: "/" }] });
}
