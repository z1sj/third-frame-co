#!/bin/bash
# 一键部署到 GitHub Pages
# 用法：cd 到项目根目录，执行 ./deploy.sh
# 首次使用前：npm install gh-pages --save-dev （package.json 已包含，npm install 后即有）

set -e

echo "🔨 开始构建生产版本..."
npm run build

echo "📦 正在发布到 gh-pages 分支..."
npx gh-pages -d dist -m "deploy: $(date +'%Y-%m-%d %H:%M:%S')"

echo ""
echo "✅ 发布成功！"
echo "访问地址："
echo "   个人仓库：https://<你的用户名>.github.io/<仓库名>/"
echo "   组织仓库：https://<组织名>.github.io/<仓库名>/"
echo ""
echo "💡 首次发布后，如果打开是 404，到仓库 Settings → Pages 确认 Source = gh-pages 分支。"
