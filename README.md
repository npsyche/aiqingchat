# AI卿 (AI Qing) - 星夜绮梦 · 沉浸之恋

**AI卿** 是一款基于 Google Gemini 2.5 打造的沉浸式 AI 角色扮演应用。它融合了精美的视觉设计、情感化的记忆系统以及高度自由的角色定制功能，旨在为用户提供超越单纯问答的情感陪伴体验。

---

## ✨ 功能特性 (Features)

### 🎭 深度角色扮演
*   **沉浸式聊天**：支持流式响应、打字机效果、自动总结记忆。
*   **情感化交互**：角色支持立绘切换、长按消息编辑、重新生成回复。
*   **多模态体验**：支持文字聊天，并集成了 AI 绘图功能（基于 Gemini Imagen）。

### 🛠 高度自由定制
*   **角色创造**：内置多种人设模板（霸道总裁、傲娇青梅、病娇等），支持自定义头像、多张背景立绘。
*   **人设调优**：支持详细的 System Instruction（系统指令）、开场白设置、标签管理。
*   **AI 辅助创作**：内置 AI 绘图助手，可根据描述自动生成角色立绘。

### 📱 沉浸式 UI/UX
*   **响应式设计**：完美适配移动端与桌面端，类似原生 App 的交互体验。
*   **视觉效果**：玻璃拟态 (Glassmorphism) 风格，动态背景，平滑的转场动画。
*   **角色主页**：独立的“角色卡”页面，包含记忆碎片、悄悄话（Mock）、动态墙等功能。

### ⚙️ 灵活配置
*   **多模型支持**：默认支持 Google Gemini 系列，并兼容 OpenRouter 协议（可连接 OpenAI, Claude 等）。
*   **数据本地化**：聊天记录、角色数据、设置均存储于浏览器 LocalStorage，保护隐私。

---

## 🚀 快速开始 (Getting Started)

### 依赖环境
*   Node.js (推荐 v18+)
*   npm 或 yarn

### 1. 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/ai-qing.git

# 进入目录
cd ai-qing

# 安装依赖 (推荐使用 npm 或 pnpm)
npm install
```

### 2. 本地开发

```bash
# 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173` (具体端口视构建工具而定) 即可看到应用。

### 3. 配置 API Key

首次进入应用后：
1.  点击“我的” -> “设置”。
2.  在 **API Key** 输入框中填入您的 Google Gemini API Key。
3.  (可选) 如果需要使用 OpenRouter，请在服务提供商中切换并在 Base URL 填入 `https://openrouter.ai/api/v1`。

> **注意**：本项目是一个纯前端应用，API Key 仅保存在您本地浏览器的 LocalStorage 中，不会发送到任何第三方服务器。

---

## 📦 部署指南 (Deployment)

本项目为纯静态 SPA (Single Page Application)，可以轻松部署到任何静态托管服务。

### Vercel 部署 (推荐)

1.  将代码推送到 GitHub。
2.  登录 [Vercel](https://vercel.com/) 并导入该仓库。
3.  Framework Preset 选择 `Vite` (或者 Create React App，取决于您的构建配置)。
4.  点击 **Deploy**。

### Nginx / 静态服务器部署

1.  执行构建命令：
    ```bash
    npm run build
    ```
2.  构建产物将生成在 `dist/` 目录下。
3.  将 `dist/` 目录下的所有文件上传至您的 Web 服务器根目录即可。

---

## 📝 待完善列表 (Roadmap & Todo)

虽然核心功能已完成，但为了打造极致体验，以下功能计划在未来版本中迭代：

- [ ] **后端服务集成**：
    - [ ] 实现用户云端账号系统，支持多端数据同步。
    - [ ] 接入向量数据库 (RAG)，实现角色的长期记忆检索。
- [ ] **多模态增强**：
    - [ ] **TTS 语音合成**：让角色能够发出声音（接入 Gemini Live Audio 或 ElevenLabs）。
    - [ ] **STT 语音输入**：支持用户语音对话。
- [ ] **社交功能**：
    - [ ] 角色市场/广场：允许用户分享并下载他人的角色预设。
    - [ ] 评论与点赞系统实装。
- [ ] **功能优化**：
    - [ ] 导出聊天记录为长图分享。
    - [ ] 引入更多样化的 AI 绘画模型支持。

---

## 🤝 贡献 (Contribution)

欢迎提交 Issue 或 Pull Request！

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request

---

## 📄 开源协议 (License)

MIT License
