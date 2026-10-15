# 末日生存身份测试

## Deployment

- `index.html`: 用户测评
- `admin.html`: 管理员后台
- `supabase/schema.sql`: Supabase 数据库表结构

正式部署前需要将 Supabase URL、anon key 和管理员鉴权接入前端，并将密码校验、次数扣减和结果保存改为 Supabase RPC/Edge Function，避免浏览器本地数据被篡改。
