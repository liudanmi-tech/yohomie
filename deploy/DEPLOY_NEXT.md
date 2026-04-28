# YoHomie Next.js 运行时部署说明

## 1. 服务器准备
- 安装 Node.js 20+
- 安装 nginx
- 放行 80/443/22 端口

## 2. 上传项目
将项目上传到服务器目录，例如：`/var/www/yohomie-app`

## 3. 安装依赖与构建
```bash
cd /var/www/yohomie-app
cp .env.example .env
# 编辑 .env 填写数据库、短信、邮件配置
npm install
npm run prisma:generate
npm run prisma:push
npm run build
```

## 4. systemd 启动 Next
```bash
cp deploy/systemd-yohomie-next.service /etc/systemd/system/yohomie-next.service
systemctl daemon-reload
systemctl enable --now yohomie-next.service
systemctl status yohomie-next.service --no-pager
```

## 5. Nginx 反向代理
```bash
cp deploy/nginx-yohomie-next.conf /etc/nginx/sites-available/yohomie
ln -sf /etc/nginx/sites-available/yohomie /etc/nginx/sites-enabled/yohomie
nginx -t
systemctl reload nginx
```

## 6. HTTPS
继续使用现有 certbot：
```bash
certbot --nginx -d yohomie.cn -d www.yohomie.cn
```

## 7. 验证
- https://yohomie.cn/
- https://yohomie.cn/login
- https://yohomie.cn/register
- 订阅按钮未登录会跳登录页，登录后可拉起支付弹窗
