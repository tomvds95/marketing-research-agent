'use client';

import { useState, useCallback, useRef } from 'react';

const AGENTS = {
  research: {
    name: 'Research Agent',
    role: 'Trend Scout & Document Analyst',
    icon: '🔍',
    color: '#2563eb',
    systemPrompt: `You are a Marketing Research Agent specializing in B2B technology marketing trends and document analysis.

Your capabilities:
1. WEB SEARCH: Search for trending marketing topics across the web
2. RESEARCH PAPERS: Search for academic papers, industry reports, and whitepapers
3. DOCUMENT ANALYSIS: Analyse uploaded documents provided by the user

Your task: Compile trending topics in marketing by:
- Searching the web for current trends
- Finding relevant research papers and industry reports
- Analysing any documents provided by the user
- Synthesising all sources into comprehensive findings

Focus areas:
- B2B demand generation
- Event marketing and experiential marketing
- AI/automation in marketing
- Account-based marketing (ABM)
- Marketing measurement and attribution

For each trend you identify, provide:
1. The trend name/topic
2. A brief description (2-3 sentences)
3. Why it's trending now
4. Source type (web, research paper, uploaded document, industry report)
5. Relevant citations or references

Find 5-7 significant trends. Be specific and cite real developments.

Format your output as structured JSON:
{
  "trends": [
    {
      "name": "Trend Name",
      "description": "Brief description",
      "why_trending": "Explanation of current relevance",
      "source_type": "web|research_paper|uploaded_document|industry_report",
      "sources": ["Source 1", "Source 2"]
    }
  ],
  "research_papers_found": [
    {
      "title": "Paper title",
      "authors": "Author names if available",
      "key_findings": "Brief summary"
    }
  ],
  "uploaded_documents_analysis": [
    {
      "filename": "Document name",
      "key_insights": ["Insight 1", "Insight 2"],
      "relevance_to_trends": "How this connects to identified trends"
    }
  ],
  "search_date": "Current date",
  "focus_areas": ["List of areas searched"]
}`
  },
  evaluator: {
    name: 'Evaluation Agent',
    role: 'Strategic Analyst',
    icon: '⚖️',
    color: '#7c3aed',
    systemPrompt: `You are a Marketing Strategy Evaluation Agent with deep expertise in B2B enterprise marketing.

Your task: Evaluate the research findings from the Research Agent, including:
- Web search results
- Research papers and academic findings
- Uploaded document analysis

For each trend, assess:

1. **Relevance Score (1-10)**: How relevant is this to B2B enterprise technology marketing?
2. **Actionability Score (1-10)**: How easily can marketing teams implement this?
3. **Timeliness Score (1-10)**: Is this truly current, or outdated/overhyped?
4. **Evidence Quality (1-10)**: How well-supported is this trend (research papers score higher)?
5. **Strategic Value**: Brief assessment of potential business impact
6. **Recommended Priority**: High/Medium/Low for immediate attention
7. **Potential Risks**: Any cautions or considerations

Also provide:
- An overall assessment of the trend landscape
- Top 3 trends to prioritize (with justification)
- Quality assessment of research papers cited
- How uploaded documents contributed to the analysis
- Any gaps in the research that should be addressed

Format your output as structured JSON:
{
  "evaluated_trends": [
    {
      "trend_name": "Name from research",
      "relevance_score": 8,
      "actionability_score": 7,
      "timeliness_score": 9,
      "evidence_quality_score": 8,
      "strategic_value": "Assessment text",
      "priority": "High/Medium/Low",
      "risks": "Any cautions",
      "key_supporting_sources": ["Source 1", "Source 2"]
    }
  ],
  "overall_assessment": "Summary of the trend landscape",
  "top_priorities": [
    {"trend": "Trend 1", "justification": "Why this is priority"}
  ],
  "research_quality_notes": "Assessment of academic/research sources",
  "uploaded_docs_value": "How user documents contributed",
  "research_gaps": ["Gap 1", "Gap 2"]
}`
  },
  reporter: {
    name: 'Report Writer Agent',
    role: 'Communications Lead',
    icon: '📝',
    color: '#059669',
    systemPrompt: `You are a Marketing Report Writer Agent specializing in executive-ready content.

Your task: Synthesize the research findings (including web, research papers, and uploaded documents) and evaluation into a comprehensive, actionable report.

Create a professional report with the following structure:

# Marketing Trends Intelligence Report

## Executive Summary
- 3-4 bullet points summarizing key findings
- Overall market direction
- Note on research sources used (web, academic, proprietary documents)

## Methodology
- Brief note on sources consulted
- Research papers and academic sources reviewed
- Uploaded documents analysed

## Priority Trends Analysis
For each high-priority trend, provide:
- What it is and why it matters
- Evidence base (citing research papers where applicable)
- Current adoption and momentum
- Specific opportunities for B2B marketers
- Recommended next steps

## Research Highlights
- Key findings from academic/research papers
- Insights from uploaded documents
- How these inform the recommendations

## Strategic Recommendations
- Immediate actions (next 30 days)
- Short-term initiatives (next quarter)
- Areas requiring further investigation

## Appendix: Full Trend Assessment
- Summary table of all trends with scores
- Full source list with citations

Write in a clear, professional tone suitable for senior marketing leadership. Be specific and actionable. Cite research papers properly where relevant.

Output as clean Markdown format.`
  }
};

const SUPPORTED_FILE_TYPES = {
  'application/pdf': { icon: '📄', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', label: 'DOCX' },
  'application/msword': { icon: '📝', label: 'DOC' },
  'text/plain': { icon: '📃', label: 'TXT' },
  'text/markdown': { icon: '📑', label: 'MD' },
  'image/png': { icon: '🖼️', label: 'PNG' },
  'image/jpeg': { icon: '🖼️', label: 'JPG' },
  'text/csv': { icon: '📊', label: 'CSV' }
};

function FileUploader({ files, setFiles, disabled }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (file) => {
    const fileType = file.type;
    let content = '';
    let base64 = '';

    try {
      if (fileType === 'application/pdf' || fileType.startsWith('image/')) {
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        content = `[${fileType.startsWith('image/') ? 'Image' : 'PDF'} file - will be processed by AI]`;
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        content = await file.text();
      }

      return {
        name: file.name,
        type: fileType,
        size: file.size,
        content: content.slice(0, 50000),
        base64: base64,
        processed: true
      };
    } catch (error) {
      return {
        name: file.name,
        type: fileType,
        size: file.size,
        content: '',
        error: error.message,
        processed: false
      };
    }
  };

  const handleFiles = async (fileList) => {
    const newFiles = [];
    for (const file of fileList) {
      if (Object.keys(SUPPORTED_FILE_TYPES).includes(file.type) || file.type === '') {
        const processed = await processFile(file);
        newFiles.push(processed);
      }
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: 600, 
        color: '#334155',
        fontSize: '14px'
      }}>
        📎 Upload Documents for Analysis
      </label>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
        Upload PDFs, Word docs, images, or text files. The Research Agent will analyse these alongside web results.
      </p>
      
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: dragOver ? '#eff6ff' : '#f8fafc',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.csv"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
        <p style={{ margin: 0, color: '#475569', fontWeight: 500 }}>
          Drop files here or click to browse
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
          PDF, DOCX, TXT, MD, PNG, JPG, CSV
        </p>
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: file.error ? '#fef2f2' : '#f0fdf4',
                borderRadius: '8px',
                marginBottom: '8px',
                border: `1px solid ${file.error ? '#fecaca' : '#bbf7d0'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>
                  {SUPPORTED_FILE_TYPES[file.type]?.icon || '📄'}
                </span>
                <div>
                  <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {(file.size / 1024).toFixed(1)} KB
                    {file.error && <span style={{ color: '#dc2626' }}> • Error: {file.error}</span>}
                    {file.processed && !file.error && <span style={{ color: '#16a34a' }}> • Ready</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                disabled={disabled}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: '#94a3b8',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchOptionsPanel({ searchOptions, setSearchOptions, disabled }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      border: '1px solid #e2e8f0'
    }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '12px', 
        fontWeight: 600, 
        color: '#334155',
        fontSize: '14px'
      }}>
        🔎 Research Sources
      </label>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {[
          { key: 'webSearch', label: 'Web Search', icon: '🌐', description: 'General web results' },
          { key: 'researchPapers', label: 'Research Papers', icon: '📚', description: 'Academic & whitepapers' },
          { key: 'industryReports', label: 'Industry Reports', icon: '📊', description: 'Analyst reports' },
          { key: 'newsArticles', label: 'News & Trade Pubs', icon: '📰', description: 'Recent news' }
        ].map(option => (
          <label
            key={option.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: `2px solid ${searchOptions[option.key] ? '#2563eb' : '#e2e8f0'}`,
              background: searchOptions[option.key] ? '#eff6ff' : '#fff',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="checkbox"
              checked={searchOptions[option.key]}
              onChange={(e) => setSearchOptions(prev => ({ ...prev, [option.key]: e.target.checked }))}
              disabled={disabled}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: '18px' }}>{option.icon}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b' }}>{option.label}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{option.description}</div>
            </div>
            {searchOptions[option.key] && (
              <span style={{ color: '#2563eb', fontWeight: 600 }}>✓</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, status, isActive, output }) {
  const statusColors = {
    pending: '#94a3b8',
    running: agent.color,
    complete: '#22c55e',
    error: '#ef4444'
  };

  return (
    <div style={{
      background: isActive ? `linear-gradient(135deg, ${agent.color}08, ${agent.color}15)` : '#fafafa',
      border: `2px solid ${isActive ? agent.color : '#e2e8f0'}`,
      borderRadius: '16px',
      padding: '24px',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {isActive && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${agent.color}, ${agent.color}66)`,
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '28px' }}>{agent.icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
            {agent.name}
          </h3>
          <span style={{ 
            fontSize: '12px', 
            color: agent.color, 
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {agent.role}
          </span>
        </div>
      </div>
      
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 500,
        background: `${statusColors[status]}15`,
        color: statusColors[status]
      }}>
        {status === 'running' && (
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: statusColors[status],
            animation: 'blink 1s ease-in-out infinite'
          }} />
        )}
        {status === 'complete' && '✓'}
        {status === 'error' && '✕'}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>

      {output && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          maxHeight: '150px',
          overflow: 'auto',
          fontSize: '12px',
          fontFamily: 'ui-monospace, monospace',
          color: '#475569',
          whiteSpace: 'pre-wrap'
        }}>
          {typeof output === 'string' ? output.slice(0, 500) + (output.length > 500 ? '...' : '') : JSON.stringify(output, null, 2).slice(0, 500)}
        </div>
      )}
    </div>
  );
}

function ReportViewer({ report }) {
  if (!report) return null;
  
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '32px',
      marginTop: '24px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #f1f5f9'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
          📊 Final Report
        </h2>
        <button
          onClick={() => {
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `marketing-trends-report-${new Date().toISOString().split('T')[0]}.md`;
            a.click();
          }}
          style={{
            padding: '10px 20px',
            background: '#059669',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ⬇️ Download Report
        </button>
      </div>
      
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        lineHeight: 1.8,
        color: '#334155',
        whiteSpace: 'pre-wrap'
      }}>
        {report}
      </div>
    </div>
  );
}

export default function Home() {
  const [agentStatuses, setAgentStatuses] = useState({
    research: 'pending',
    evaluator: 'pending',
    reporter: 'pending'
  });
  const [agentOutputs, setAgentOutputs] = useState({
    research: null,
    evaluator: null,
    reporter: null
  });
  const [finalReport, setFinalReport] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [error, setError] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [searchOptions, setSearchOptions] = useState({
    webSearch: true,
    researchPapers: true,
    industryReports: true,
    newsArticles: true
  });

  const buildResearchPrompt = () => {
    const topicFocus = customTopic || 'B2B marketing, demand generation, and marketing technology';
    
    let searchInstructions = [];
    if (searchOptions.webSearch) searchInstructions.push('general web search for current trends');
    if (searchOptions.researchPapers) searchInstructions.push('academic papers and research studies');
    if (searchOptions.industryReports) searchInstructions.push('industry analyst reports (Gartner, Forrester, McKinsey)');
    if (searchOptions.newsArticles) searchInstructions.push('recent news from marketing trade publications');

    let prompt = `Search for and compile the latest trending topics in marketing, with particular focus on: ${topicFocus}.

SEARCH STRATEGY:
Conduct multiple searches to cover: ${searchInstructions.join('; ')}.

Suggested search queries:
- "${topicFocus} trends 2024 2025"
- "B2B marketing research paper"
- "demand generation study report"
- "marketing technology trends Gartner Forrester"
`;

    if (uploadedFiles.length > 0) {
      prompt += `\n\nUPLOADED DOCUMENTS TO ANALYSE:\n`;
      prompt += `The user has provided ${uploadedFiles.length} document(s) for analysis. Please review these and incorporate relevant insights:\n\n`;
    }

    prompt += `\nCompile your findings in the specified JSON format.`;

    return prompt;
  };

  const buildMessagesWithFiles = (basePrompt) => {
    const content = [];
    
    for (const file of uploadedFiles) {
      if (file.base64 && file.type === 'application/pdf') {
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: file.base64 }
        });
        content.push({ type: 'text', text: `[Above is the uploaded PDF: "${file.name}"]` });
      } else if (file.base64 && file.type.startsWith('image/')) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: file.type, data: file.base64 }
        });
        content.push({ type: 'text', text: `[Above is the uploaded image: "${file.name}"]` });
      } else if (file.content) {
        content.push({ type: 'text', text: `--- UPLOADED: ${file.name} ---\n${file.content}\n--- END ---\n` });
      }
    }

    content.push({ type: 'text', text: basePrompt });
    return [{ role: 'user', content }];
  };

  const callAgent = async (agentKey, userMessage, tools = [], includeFiles = false) => {
    const agent = AGENTS[agentKey];
    setCurrentAgent(agentKey);
    setAgentStatuses(prev => ({ ...prev, [agentKey]: 'running' }));

    try {
      const messages = includeFiles && uploadedFiles.length > 0 
        ? buildMessagesWithFiles(userMessage)
        : [{ role: 'user', content: userMessage }];

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: agent.systemPrompt,
          messages,
          tools: tools.length > 0 ? tools : undefined
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      let currentData = data;
      let currentMessages = [...messages];
      let iterations = 0;

      while (currentData.stop_reason === 'tool_use' && iterations < 5) {
        iterations++;
        const toolUses = currentData.content.filter(c => c.type === 'tool_use');
        
        currentMessages.push({ role: 'assistant', content: currentData.content });
        
        const toolResults = toolUses.map(toolUse => ({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Search completed for: "${toolUse.input?.query || 'query'}". Please continue with your analysis.`
        }));
        
        currentMessages.push({ role: 'user', content: toolResults });

        const continueResponse = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            system: agent.systemPrompt,
            messages: currentMessages,
            tools
          })
        });
        
        currentData = await continueResponse.json();
      }

      const output = currentData.content?.map(c => c.text || '').join('\n') || '';
      setAgentOutputs(prev => ({ ...prev, [agentKey]: output }));
      setAgentStatuses(prev => ({ ...prev, [agentKey]: 'complete' }));
      return output;
    } catch (err) {
      setAgentStatuses(prev => ({ ...prev, [agentKey]: 'error' }));
      throw err;
    }
  };

  const runOrchestration = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setFinalReport(null);
    setAgentStatuses({ research: 'pending', evaluator: 'pending', reporter: 'pending' });
    setAgentOutputs({ research: null, evaluator: null, reporter: null });

    try {
      const researchPrompt = buildResearchPrompt();
      const researchOutput = await callAgent('research', researchPrompt, [
        { type: 'web_search_20250305', name: 'web_search' }
      ], true);

      const evalPrompt = `Here are the research findings:\n\n${researchOutput}\n\nPlease evaluate each trend according to your criteria.`;
      const evalOutput = await callAgent('evaluator', evalPrompt);

      const reportPrompt = `## RESEARCH FINDINGS:\n${researchOutput}\n\n## EVALUATION:\n${evalOutput}\n\nPlease create the executive report.`;
      const reportOutput = await callAgent('reporter', reportPrompt);
      setFinalReport(reportOutput);

    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsRunning(false);
      setCurrentAgent(null);
    }
  }, [customTopic, uploadedFiles, searchOptions]);

  const resetAll = () => {
    setAgentStatuses({ research: 'pending', evaluator: 'pending', reporter: 'pending' });
    setAgentOutputs({ research: null, evaluator: null, reporter: null });
    setFinalReport(null);
    setError(null);
    setCurrentAgent(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '36px' }}>🎼</span>
            <h1 style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e293b, #475569)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Marketing Agent Orchestra
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
            Three AI agents • Web Search • Research Papers • Document Analysis
          </p>
        </div>

        {/* Topic Input */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>
            🎯 Focus Area
          </label>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g., Event marketing ROI, AI in demand generation..."
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <SearchOptionsPanel searchOptions={searchOptions} setSearchOptions={setSearchOptions} disabled={isRunning} />

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <FileUploader files={uploadedFiles} setFiles={setUploadedFiles} disabled={isRunning} />
        </div>

        {/* Agent Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {Object.entries(AGENTS).map(([key, agent]) => (
            <AgentCard key={key} agent={agent} status={agentStatuses[key]} isActive={currentAgent === key} output={agentOutputs[key]} />
          ))}
        </div>

        {/* Flow */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <span style={{ color: agentStatuses.research === 'complete' ? '#22c55e' : '#94a3b8' }}>Research</span>
          <span style={{ color: '#cbd5e1' }}>→</span>
          <span style={{ color: agentStatuses.evaluator === 'complete' ? '#22c55e' : '#94a3b8' }}>Evaluate</span>
          <span style={{ color: '#cbd5e1' }}>→</span>
          <span style={{ color: agentStatuses.reporter === 'complete' ? '#22c55e' : '#94a3b8' }}>Report</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={runOrchestration}
            disabled={isRunning}
            style={{
              padding: '14px 32px',
              background: isRunning ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            {isRunning ? (
              <><span style={{ animation: 'blink 1s infinite' }}>●</span> Running...</>
            ) : (
              <>▶ Start Orchestration</>
            )}
          </button>
          
          {(finalReport || error) && (
            <button onClick={resetAll} style={{
              padding: '14px 24px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer'
            }}>
              Reset
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', marginBottom: '24px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <ReportViewer report={finalReport} />
      </div>
    </div>
  );
}
