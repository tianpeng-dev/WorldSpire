import { route } from "@/lib/http/route";
export const runtime = "nodejs";

// 交互式接口文档（Swagger UI），读取 /api/openapi 的 OpenAPI 文档
const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14";

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WordSpire API 文档</title>
<link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="${SWAGGER_UI}/swagger-ui-bundle.js"></script>
<script>
SwaggerUIBundle({ url: "/api/openapi", dom_id: "#swagger-ui", deepLinking: true, withCredentials: true });
</script>
</body>
</html>`;

export const GET = route(async () => new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
