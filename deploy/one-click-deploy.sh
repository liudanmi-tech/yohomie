#!/usr/bin/env bash
set -euo pipefail
export COPYFILE_DISABLE=1

# 用法:
# bash deploy/one-click-deploy.sh
#
# 可选环境变量:
# SERVER_USER (默认 root)
# SERVER_HOST (默认 47.93.239.154)
# REMOTE_APP_DIR (默认 /var/www/yohomie-app)
# REMOTE_STATIC_DIR (默认 /var/www/yohomie)

SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-47.93.239.154}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/var/www/yohomie-app}"
REMOTE_STATIC_DIR="${REMOTE_STATIC_DIR:-/var/www/yohomie}"
REMOTE_TMP_TGZ="/tmp/yohomie-app.tar.gz"

echo "==> 1/6 本地构建检查"
npm install
npm run build

echo "==> 2/6 打包项目"
tar --exclude=".git" \
    --exclude="node_modules" \
    --exclude=".next/cache" \
    --exclude="dist" \
    -czf /tmp/yohomie-app.tar.gz .

echo "==> 3/6 上传到服务器 ${SERVER_USER}@${SERVER_HOST}"
scp /tmp/yohomie-app.tar.gz "${SERVER_USER}@${SERVER_HOST}:${REMOTE_TMP_TGZ}"

echo "==> 4/6 远程部署"
ssh "${SERVER_USER}@${SERVER_HOST}" "bash -s" <<EOF
set -euo pipefail

# 兼容不同服务器 Node/NPM 安装方式
if [ -f "\$HOME/.nvm/nvm.sh" ]; then
  . "\$HOME/.nvm/nvm.sh"
  nvm use --lts >/dev/null 2>&1 || true
fi

NPM_BIN="\$(command -v npm || true)"
if [ -z "\$NPM_BIN" ]; then
  for p in /usr/bin/npm /usr/local/bin/npm; do
    if [ -x "\$p" ]; then
      NPM_BIN="\$p"
      break
    fi
  done
fi

if [ -z "\$NPM_BIN" ]; then
  echo "错误: 服务器未找到 npm，请先安装 Node.js 20+"
  exit 1
fi

BACKUP_NAME="yohomie_static_backup_\$(date +%Y%m%d_%H%M%S)"
if [ -d "${REMOTE_STATIC_DIR}" ]; then
  cp -a "${REMOTE_STATIC_DIR}" "/var/www/\${BACKUP_NAME}"
  echo "旧静态站点已备份: /var/www/\${BACKUP_NAME}"
fi

mkdir -p "${REMOTE_APP_DIR}"
tar -xzf "${REMOTE_TMP_TGZ}" -C "${REMOTE_APP_DIR}"
rm -f "${REMOTE_TMP_TGZ}"

cd "${REMOTE_APP_DIR}"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "已创建 .env，请检查配置后再次执行脚本。"
  exit 1
fi

"\$NPM_BIN" install
"\$NPM_BIN" run prisma:generate
"\$NPM_BIN" run prisma:push
"\$NPM_BIN" run build

cp deploy/systemd-yohomie-next.service /etc/systemd/system/yohomie-next.service
systemctl daemon-reload
systemctl enable yohomie-next.service
systemctl restart yohomie-next.service

cp deploy/nginx-yohomie-next.conf /etc/nginx/sites-available/yohomie
ln -sf /etc/nginx/sites-available/yohomie /etc/nginx/sites-enabled/yohomie
nginx -t
systemctl reload nginx

echo "部署完成"
echo "服务状态:"
systemctl --no-pager --full status yohomie-next.service | sed -n '1,20p'
EOF

echo "==> 5/6 清理本地临时包"
rm -f /tmp/yohomie-app.tar.gz

echo "==> 6/6 完成"
echo "请访问: https://${SERVER_HOST} 或 https://yohomie.cn"
