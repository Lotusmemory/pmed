# PubMed 文献检索与分析 Demo

全栈 Web 应用，用于 PubMed 文献检索、统计可视化与 AI 综述生成。

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS + Vite + ECharts
- **后端**: Python 3 + FastAPI
- **数据源**: NCBI PubMed eUtils API
- **AI 综述**: 兼容 OpenAI 接口的大模型

## 快速启动

### 1. 后端

```bash
cd backend
pip install -r requirements.txt

# 复制并配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 LLM_API_KEY（可选，不填则使用本地规则生成综述）

uvicorn main:app --reload --port 8000
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，已配置 API 代理到后端 8000 端口。

### 3. 生产部署

```bash
cd frontend && npm run build
cd ../backend && uvicorn main:app --port 8000
```

后端会自动挂载前端 `dist` 目录作为静态文件。

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PUBMED_API_KEY` | NCBI PubMed API Key | 内置 |
| `PUBMED_EMAIL` | PubMed 要求的邮箱 | demo@example.com |
| `LLM_API_BASE` | LLM API 地址 | https://api.openai.com/v1 |
| `LLM_API_KEY` | LLM API 密钥（可选） | 空 |
| `LLM_MODEL` | 模型名称 | gpt-4o-mini |

## 功能模块

1. **关键词检索**: 输入生物医学关键词，检索 PubMed 文献
2. **数据统计**: 总量、年份范围、平均影响因子、分区统计
3. **可视化**: 年度发文量柱状图、期刊分布饼图、分区分布、关键词词云
4. **文献列表**: 近 5 年高影响力文献 Top 100，支持排序和分页
5. **AI 综述**: 基于摘要自动生成中文分点综述

## 注意事项

- PubMed API 限制：有 API Key 最多 10 次/秒，代码中已实现速率控制
- 词云使用纯 Canvas 实现，无需额外 C++ 编译工具
- 未配置 LLM API Key 时，综述功能使用本地规则生成简单综述
