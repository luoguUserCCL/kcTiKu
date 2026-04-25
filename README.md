# 题目管理系统

一个支持导入题目、做题练习、管理题目的 Web 应用。

## 功能特性

- **导入题目**：支持 Markdown 和 KaTeX 语法，可自定义选项数量（2-8个），支持插入图片
- **做题练习**：从其他题目池随机抽取题目，支持跳题，显示正确率
- **做题权限**：可设置公众可做题或做题需要密码
- **管理界面**：输入管理秘钥后可删改题目、移动题目、管理题目池

## 本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm start
```

浏览器访问 http://localhost:3000

## 部署到 Railway

### 方式一：通过 GitHub

1. 将此项目上传到 GitHub 仓库
2. 登录 [Railway](https://railway.app)
3. 创建新项目 → "Deploy from GitHub repo"
4. 选择你的仓库
5. **重要**：部署成功后，进入项目设置添加 Volume：
   - Mount Path: `/app/data`
   - Size: 1GB（根据需要调整）
6. 重新部署

### 方式二：通过 CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 部署
railway up

# 添加 Volume（重要！）
railway volume create --mount /app/data
```

## 密码说明

| 密码类型 | 默认值 | 说明 |
|---------|--------|------|
| 管理密码 | `admin123` | 进入管理界面需要 |
| 做题密码 | 无（默认公开） | 可在管理界面设置 |

建议部署后修改 `src/app/page.tsx` 中的 `ADMIN_PASSWORD` 常量。

## 数据存储

题目数据存储在 `data/` 目录下的 JSON 文件中：

```
data/
├── pools.json          # 题目池配置
├── settings.json       # 系统设置（做题权限等）
└── pools/
    ├── 1/              # 题目池1
    │   ├── 001.json    # 第1题
    │   └── ...
    ├── 2/              # 题目池2
    └── ...
```

## API 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/pools` | GET | 获取所有题目池 |
| `/api/pools` | POST | 创建新题目池 |
| `/api/pools/[id]` | GET | 获取题目池详情和题目列表 |
| `/api/questions` | GET | 获取题目列表 |
| `/api/questions` | POST | 创建新题目 |
| `/api/questions/[id]` | PUT | 更新题目 |
| `/api/questions/[id]` | DELETE | 删除题目 |
| `/api/questions/move` | POST | 移动题目到其他题目池 |
| `/api/settings` | GET | 获取系统设置 |
| `/api/settings` | PUT | 更新系统设置 |
| `/api/settings` | POST | 验证做题密码 |

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- React Markdown + KaTeX
# kcOldTiKu
