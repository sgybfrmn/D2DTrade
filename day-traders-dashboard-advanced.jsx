import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Zap, DollarSign, MessageCircle, Settings, AlertCircle, Clock, Brain, BarChart3, Loader, Send, Copy, CheckCircle } from 'lucide-react';

const DayTradersDashboardAdvanced = () => {
  // ============ API CONFIGURATION ============
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // ============ STATE MANAGEMENT ============
  const [activePanel, setActivePanel] = useState('overview');
  const [userIdle, setUserIdle] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  const [isAIRunning, setIsAIRunning] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isScanningOpportunities, setIsScanningOpportunities] = useState(false);
  const [copiedText, setCopiedText] = useState(null);
  
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', text: 'Day Traders AI Ready. I\'m monitoring 5 income streams in the background.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  const [aiMemory, setAiMemory] = useState({
    tasksCompleted: 0,
    opportunitiesFound: 0,
    earnings: 0,
    learnings: [],
    activeStreams: ['Free Stocks', 'Cashback', 'Trading Alerts', 'Content Gen', 'Ad Network'],
    lastUpdated: new Date().toLocaleTimeString()
  });

  const [generatedContent, setGeneratedContent] = useState({
    reddit: [],
    twitter: [],
    tiktok: [],
    email: []
  });

  const [opportunities, setOpportunities] = useState([]);

  const [dashboardData, setDashboardData] = useState({
    freeStockOffers: [
      { name: 'Robinhood', value: '$5-200', commission: '$2-5', status: 'active', urgency: 'high' },
      { name: 'Public.com', value: '$5-50', commission: '$1-2', status: 'active', urgency: 'high' },
      { name: 'Moomoo', value: '$5-100', commission: '$1-3', status: 'active', urgency: 'high' },
      { name: 'Webull', value: '$0-100', commission: '$0-2', status: 'active', urgency: 'medium' },
    ],
    cashbackOps: [
      { name: 'Rakuten', commission: '2-40%', status: 'active', traffic: 'high' },
      { name: 'Honey', commission: '0.5-5%', status: 'active', traffic: 'high' },
      { name: 'Bank Bonuses', commission: '$25-300', status: 'active', traffic: 'medium' },
    ],
    revenueTodayEstimate: 42.50,
    weeklyProjection: 297.50,
    monthlyTarget: 1200,
  });

  const idleTimerRef = useRef(null);
  const aiTaskRef = useRef(null);

  // ============ FETCH AI MEMORY FROM BACKEND ============
  useEffect(() => {
    fetchAiMemory();
  }, []);

  const fetchAiMemory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai-memory`);
      if (response.ok) {
        const data = await response.json();
        setAiMemory(data);
      }
    } catch (error) {
      console.error('Error fetching AI memory:', error);
    }
  };

  const updateAiMemory = async (updates) => {
    try {
      const response = await fetch(`${API_URL}/api/ai-memory`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const data = await response.json();
        setAiMemory(data.data);
      }
    } catch (error) {
      console.error('Error updating AI memory:', error);
    }
  };

  // ============ CONTENT GENERATION ============
  const generateContent = async (type, topic) => {
    setIsGeneratingContent(true);
    try {
      const response = await fetch(`${API_URL}/api/generate-content`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({type, topic})
      });

      if (response.ok) {
        const data = await response.json();
        
        setGeneratedContent(prev => ({
          ...prev,
          [type]: [...(prev[type] || []), data.content]
        }));

        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: `✅ Generated ${type} content about "${topic}". Check the Content panel to view.`
        }]);

        await updateAiMemory({
          tasksCompleted: aiMemory.tasksCompleted + 1
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: '❌ Error generating content. Make sure the backend is running.'
      }]);
    }
    setIsGeneratingContent(false);
  };

  // ============ OPPORTUNITY SCANNING ============
  const scanOpportunities = async () => {
    setIsScanningOpportunities(true);
    try {
      const response = await fetch(`${API_URL}/api/find-opportunities`);

      if (response.ok) {
        const data = await response.json();
        
        if (data.opportunities) {
          setOpportunities(prev => [data.opportunities, ...prev]);
          
          setChatMessages(prev => [...prev, {
            role: 'ai',
            text: `🔍 Found new opportunities: ${data.opportunities.freeStocks?.length || 0} stock offers, ${data.opportunities.bankBonuses?.length || 0} bank bonuses, ${data.opportunities.cashbackDeals?.length || 0} cashback deals.`
          }]);
        }
      }
    } catch (error) {
      console.error('Error scanning opportunities:', error);
    }
    setIsScanningOpportunities(false);
  };

  // ============ IDLE DETECTION ============
  useEffect(() => {
    const handleActivity = () => {
      setUserIdle(false);
      setIdleTime(0);
      clearTimeout(idleTimerRef.current);
      
      idleTimerRef.current = setTimeout(() => {
        setUserIdle(true);
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: '💤 Idle detected. Switching to autonomous mode. Scanning for opportunities...'
        }]);
      }, 60000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (userIdle) {
      const interval = setInterval(() => {
        setIdleTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userIdle]);

  // ============ AUTONOMOUS MODE ============
  useEffect(() => {
    if (userIdle && !isAIRunning) {
      setIsAIRunning(true);
      
      aiTaskRef.current = setInterval(async () => {
        const tasks = ['Generate reddit content about free stocks', 'Scan opportunities', 'Generate twitter thread'];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: `🤖 Autonomous: ${randomTask}...`
        }]);

        if (randomTask.includes('reddit')) {
          await generateContent('reddit', 'free stock offers for beginners');
        } else if (randomTask.includes('Scan')) {
          await scanOpportunities();
        }
      }, 10000);
    }

    return () => {
      if (aiTaskRef.current) clearInterval(aiTaskRef.current);
    };
  }, [userIdle, isAIRunning, aiMemory]);

  // ============ CHAT HANDLER ============
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, {
      role: 'user',
      text: userMessage
    }]);

    setUserIdle(false);
    setIdleTime(0);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: userMessage})
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: data.reply
        }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: 'Backend not responding. Run: node backend-server.js'
      }]);
    }

    setChatInput('');
  };

  // ============ COPY TO CLIPBOARD ============
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ============ PANEL COMPONENTS ============
  const OverviewPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-700/50 rounded-lg p-6 backdrop-blur">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-emerald-300/70 text-sm font-medium tracking-wide">TODAY'S REVENUE</p>
            <p className="text-4xl font-bold text-emerald-300 mt-2">${dashboardData.revenueTodayEstimate}</p>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-500 opacity-30" />
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <p className="text-emerald-400/50">This Week</p>
            <p className="text-emerald-300 font-semibold">${dashboardData.weeklyProjection}</p>
          </div>
          <div>
            <p className="text-emerald-400/50">Monthly Target</p>
            <p className="text-emerald-300 font-semibold">${dashboardData.monthlyTarget}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border border-blue-700/50 rounded-lg p-6 backdrop-blur">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-300/70 text-sm font-medium tracking-wide">AI STATUS</p>
            <p className="text-3xl font-bold text-blue-300 mt-2 flex items-center gap-2">
              {isAIRunning ? <Loader className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
              {isAIRunning ? 'AUTONOMOUS' : 'READY'}
            </p>
          </div>
          <Brain className="w-8 h-8 text-blue-500 opacity-30" />
        </div>
        <p className="text-blue-400/70 text-xs">
          {userIdle ? `🔄 Idle for ${idleTime}s • Finding opportunities` : '👁️ Monitoring • Ready for commands'}
        </p>
      </div>

      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        <button
          onClick={() => generateContent('reddit', 'free stock offers for beginners')}
          disabled={isGeneratingContent}
          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-3 rounded font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          {isGeneratingContent ? <Loader className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          Generate Reddit Post
        </button>
        <button
          onClick={() => generateContent('twitter', 'free stock trading tips')}
          disabled={isGeneratingContent}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          {isGeneratingContent ? <Loader className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          Generate Twitter Thread
        </button>
        <button
          onClick={scanOpportunities}
          disabled={isScanningOpportunities}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-3 rounded font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          {isScanningOpportunities ? <Loader className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
          Scan Opportunities
        </button>
        <button
          onClick={() => generateContent('email', 'weekly newsletter')}
          disabled={isGeneratingContent}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded font-semibold text-sm transition flex items-center justify-center gap-2"
        >
          {isGeneratingContent ? <Loader className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Generate Newsletter
        </button>
      </div>
    </div>
  );

  const ContentPanel = () => (
    <div className="space-y-6">
      {Object.entries(generatedContent).map(([type, contents]) => (
        <div key={type} className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
          <h3 className="text-slate-200 font-bold mb-4 text-sm tracking-wide uppercase">{type} Content ({contents.length})</h3>
          {contents.length === 0 ? (
            <p className="text-slate-400 text-sm">No content generated yet. Click a button to start.</p>
          ) : (
            contents.slice(-3).map((content, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/30 rounded p-4 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-slate-300 text-xs font-semibold">Generated {new Date().toLocaleString()}</p>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(content), type)}
                    className="text-slate-400 hover:text-slate-200 transition"
                  >
                    {copiedText === type ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-slate-300 text-xs max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );

  const FreeStocksPanel = () => (
    <div className="space-y-4">
      <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
        <h3 className="text-slate-200 font-bold mb-4 text-sm tracking-wide">FREE STOCK OFFERS</h3>
        <div className="space-y-3">
          {dashboardData.freeStockOffers.map((offer, i) => (
            <div key={i} className={`border rounded-lg p-4 ${offer.urgency === 'high' ? 'border-orange-600/50 bg-orange-900/20' : 'border-slate-700/50 bg-slate-800/30'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-slate-200 font-semibold">{offer.name}</p>
                  <p className="text-slate-400 text-xs mt-1">Stock value: {offer.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold text-sm">+{offer.commission}</p>
                  <p className="text-slate-400 text-xs">per signup</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const platforms = {
                    'Robinhood': 'https://robinhood.com/referral',
                    'Public.com': 'https://public.com/referral',
                    'Moomoo': 'https://moomoo.com/referral',
                    'Webull': 'https://webull.com/referral',
                  };
                  window.open(platforms[offer.name], '_blank');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded mt-3 transition"
              >
                GET REFERRAL LINK
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AIMemoryPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
        <h3 className="text-slate-200 font-bold mb-4 text-sm tracking-wide">AI PERFORMANCE</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
            <p className="text-slate-400 text-sm">Tasks Completed</p>
            <p className="text-emerald-400 font-bold">{aiMemory.tasksCompleted}</p>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
            <p className="text-slate-400 text-sm">Opportunities Found</p>
            <p className="text-emerald-400 font-bold">{aiMemory.opportunitiesFound}</p>
          </div>
          <div className="flex justify-between items-center py-2">
            <p className="text-slate-400 text-sm">Earnings Generated</p>
            <p className="text-emerald-400 font-bold">${aiMemory.earnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
        <h3 className="text-slate-200 font-bold mb-4 text-sm tracking-wide">LEARNINGS</h3>
        <div className="space-y-2">
          {(aiMemory.learnings && aiMemory.learnings.length > 0 ? aiMemory.learnings : ['No learnings yet']).slice(-5).map((learning, i) => (
            <div key={i} className="flex gap-2 text-xs text-slate-300">
              <span className="text-emerald-400 mt-1">✓</span>
              <span>{learning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">DAY TRADERS DASHBOARD</h1>
                <p className="text-xs text-slate-400">AI-Powered Passive Income System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userIdle && <Clock className="w-4 h-4 text-orange-400 animate-pulse" />}
              {isAIRunning && <Loader className="w-4 h-4 text-emerald-400 animate-spin" />}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'stocks', label: 'Free Stocks', icon: TrendingUp },
            { id: 'content', label: 'Content', icon: MessageCircle },
            { id: 'memory', label: 'AI Memory', icon: Brain },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition ${
                  activePanel === tab.id
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-8">
          {activePanel === 'overview' && <OverviewPanel />}
          {activePanel === 'stocks' && <FreeStocksPanel />}
          {activePanel === 'content' && <ContentPanel />}
          {activePanel === 'memory' && <AIMemoryPanel />}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mb-4 max-h-32 overflow-y-auto">
            {chatMessages.slice(-3).map((msg, i) => (
              <div key={i} className={`mb-2 text-xs ${msg.role === 'ai' ? 'text-emerald-400' : msg.role === 'system' ? 'text-blue-400' : 'text-blue-400'}`}>
                <span className="font-bold">{msg.role === 'ai' ? '🤖 AI:' : msg.role === 'system' ? '⚙️ System:' : '👤 You:'}</span> {msg.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="Chat with AI... (Type 'help' for commands)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={handleChatSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-semibold text-sm transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            {userIdle ? '💤 IDLE MODE: AI is working autonomously...' : '👁️ ACTIVE: Ready for commands'}
          </p>
        </div>
      </div>

      <div className="h-32"></div>
    </div>
  );
};

export default DayTradersDashboardAdvanced;
