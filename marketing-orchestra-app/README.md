# 🎼 Marketing Agent Orchestra

Three AI agents working in harmony to research, evaluate, and report on marketing trends.

## Features

- **Research Agent** - Searches web, research papers, and analyses uploaded documents
- **Evaluation Agent** - Scores trends on relevance, actionability, and timeliness
- **Report Writer Agent** - Creates executive-ready marketing intelligence reports

## Quick Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/marketing-agent-orchestra)

### Option 2: Manual Deploy

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/marketing-agent-orchestra.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Add environment variable: `ANTHROPIC_API_KEY`
   - Click "Deploy"

3. **Get your Anthropic API Key**
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Create an API key
   - Add it to Vercel's Environment Variables

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your ANTHROPIC_API_KEY
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com |

## Usage

1. Enter a focus area (e.g., "Event marketing ROI")
2. Select research sources to search
3. Optionally upload documents for analysis
4. Click "Start Orchestration"
5. Download the final report

## Supported File Types

- PDF documents
- Word documents (.docx)
- Text files (.txt, .md)
- Images (.png, .jpg)
- CSV files

---

Built with Next.js and Claude AI
