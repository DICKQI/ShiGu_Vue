# 部署说明

本文档说明 Web 静态部署、后端地址配置、Nginx 示例、移动端构建衔接和 `deploy.cjs` 脚本注意事项。

## 构建生产版本

```bash
pnpm install
pnpm build
```

构建产物输出到 `dist/`。

如只想执行 Vite 构建，不做类型检查：

```bash
pnpm build-only
```

本地预览：

```bash
pnpm preview
```

## 后端地址配置

前端所有 API 路径都写成 `/api/...`，Axios 的 `baseURL` 只需要配置到后端服务的 origin。

地址优先级：

1. 设置页保存的 `localStorage.pickgoods_api_base_url`
2. 兼容旧键 `localStorage.shigu_api_base_url`
3. 构建时 `VITE_API_BASE_URL`
4. 默认 `当前协议://当前主机名:8000`

### 独立 API 域名

```bash
VITE_API_BASE_URL=https://api.example.com pnpm build
```

实际请求会变成：

```text
https://api.example.com/api/goods/
```

### 同源 Nginx 反代 `/api`

如果前端站点和 API 走同一个域名：

```bash
VITE_API_BASE_URL=https://app.example.com pnpm build
```

实际请求会变成：

```text
https://app.example.com/api/goods/
```

也可以先构建，再在设置页把后端地址改成 `https://app.example.com`。

## 静态服务器部署

将 `dist/` 目录部署到 Nginx、Apache、Vercel、Netlify、OSS/COS/S3 等静态托管服务。

SPA 路由需要 history fallback，所有非静态资源路径回退到 `index.html`。

## Nginx 示例

```nginx
server {
    listen 80;
    server_name app.example.com;

    root /path/to/PickGoods_Frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

对应前端构建地址：

```bash
VITE_API_BASE_URL=http://app.example.com pnpm build
```

如果使用 HTTPS，请把地址改为 `https://app.example.com`。

## SFTP 部署脚本

项目提供 `deploy.cjs`：

```bash
pnpm deploy
```

该命令会：

1. 执行 `pnpm build`
2. 将 `dist/` 压缩为 `dist.zip`
3. 通过 SFTP 上传到 `deploy.cjs` 中配置的服务器目录
4. 在远端解压
5. 删除本地临时压缩包

注意：

- `deploy.cjs` 当前包含服务器地址、账号、密码和远端路径配置
- 使用前务必替换为自己的部署目标
- 不建议把真实密码提交到公开仓库；生产环境建议改为 SSH Key 或环境变量
- 该脚本依赖 `archiver` 与 `ssh2-sftp-client`

## CDN / 对象存储

对象存储部署时常见步骤：

1. `pnpm build`
2. 上传 `dist/` 中所有文件
3. 配置默认首页 `index.html`
4. 配置 404/路由回退到 `index.html`
5. 配置后端地址为真实 API origin

如果 CDN 域名和 API 域名不同，后端需要配置 CORS。

## Docker 示例

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建镜像前先执行：

```bash
VITE_API_BASE_URL=https://api.example.com pnpm build
```

## 移动端部署衔接

Capacitor 使用 `dist/` 作为 Web 资源目录：

```bash
pnpm build
pnpm exec cap sync android
```

移动端真机不要配置 `localhost` 或 `127.0.0.1` 作为后端地址。应使用：

- 局域网 IP，如 `http://192.168.1.10:8000`
- 测试环境域名
- 生产环境 HTTPS 域名

更多内容见 [移动端开发文档](MOBILE_DEVELOPMENT.md)。

## 部署检查清单

- `pnpm build` 成功
- `dist/` 已上传完整
- SPA history fallback 已配置
- `VITE_API_BASE_URL` 或设置页后端地址正确
- 后端 CORS / 反代配置正确
- 登录后 API 请求带有 `Authorization` 请求头
- 图片上传的请求体为 multipart/form-data
- 生产环境不要使用本机 `localhost` 地址
- 不要泄露 `deploy.cjs` 中的真实服务器密码
