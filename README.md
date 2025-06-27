# Realtime AI Chat

一个基于 React + FastAPI 的实时 AI 聊天应用，使用 Turborepo 进行 monorepo 管理。

## 🚀 项目特性

- 🔥 **现代化技术栈**: React 18 + TypeScript + FastAPI
- 🎨 **精美 UI**: 使用 HeroUI 组件库和 Tailwind CSS
- ⚡ **高性能**: Vite 构建工具，极速开发体验
- 🏗️ **Monorepo 架构**: Turborepo 管理多个应用
- 🔧 **开发工具**: ESLint + Prettier + TypeScript 配置
- 📦 **包管理**: pnpm 工作空间

## 📁 项目结构

```
realtime-ai-chat/
├── apps/
│   ├── web/                    # React 前端应用
│   │   ├── src/
│   │   │   ├── components/     # React 组件
│   │   │   └── styles/         # 样式文件
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── server/                 # FastAPI 后端服务
│       ├── main.py             # FastAPI 应用入口
│       ├── pyproject.toml      # Poetry 配置
│       └── poetry.lock
├── packages/
│   ├── ui/                     # 共享 UI 组件库
│   ├── eslint-config/          # ESLint 配置
│   └── typescript-config/      # TypeScript 配置
├── package.json
├── turbo.json                  # Turborepo 配置
└── pnpm-workspace.yaml
```

## 🛠️ 技术栈

### 前端

- **React 18** - 现代化 React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速构建工具
- **HeroUI** - 现代化 UI 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Framer Motion** - 流畅的动画库

### 后端

- **FastAPI** - 高性能 Python Web 框架
- **Uvicorn** - ASGI 服务器
- **Poetry** - Python 依赖管理

### 开发工具

- **Turborepo** - 高性能构建系统
- **pnpm** - 快速、节省磁盘空间的包管理器
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Python 3.8+
- pnpm 8+
- Poetry

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装后端依赖
cd apps/server
poetry install
```

### 开发模式

```bash
# 启动所有应用（前端 + 后端）
pnpm dev

# 或者分别启动
# 启动前端
pnpm --filter web dev

# 启动后端
cd apps/server
poetry run dev
```

### 构建

```bash
# 构建所有应用
pnpm build

# 构建前端
pnpm --filter web build
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 格式化代码
pnpm format
```

## 🌐 访问地址

- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## 📚 API 接口

### 后端接口

- `GET /api/hello` - 测试接口

## 🎯 开发计划

- [ ] 实现实时聊天功能
- [ ] 集成 AI 对话能力
- [ ] 添加用户认证
- [ ] 实现消息历史记录
- [ ] 添加多语言支持
- [ ] 部署到云服务

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 作者

- [@zmmzmmz](https://github.com/zmmzmmz)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！
