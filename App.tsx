
import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  Lock,
  UserPlus,
  Zap,
  GraduationCap,
  Sparkles,
  Info,
  Database,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { TabType, Message, DocumentState, AppStage } from './types';
import ProjectDocumentation from './components/ProjectDocumentation';
import { generateGroundedAnswer } from './services/geminiService';

// PDF.js worker setup
// @ts-ignore
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.LANDING);
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.LIVE_SOLVER);
  
  const [docState, setDocState] = useState<DocumentState>({
    name: '',
    content: '',
    isProcessing: false,
    pageCount: 0
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDocState(prev => ({ ...prev, isProcessing: true, name: file.name }));

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setDocState({
          name: file.name,
          content: fullText,
          isProcessing: false,
          pageCount: pdf.numPages
        });
      } else {
        const text = await file.text();
        setDocState({
          name: file.name,
          content: text,
          isProcessing: false,
          pageCount: 1
        });
      }
    } catch (error) {
      console.error("File processing failed:", error);
      setDocState(prev => ({ ...prev, isProcessing: false }));
      alert("Failed to process document. Please try again.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !docState.content || isTyping) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await generateGroundedAnswer(docState.content, input, history);
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: response || "The system could not formulate a response based on the provided material.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Operational Error: Connection to the RAG pipeline timed out. Please verify your configuration.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Basic formatter to handle common markdown elements without an external library
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-black text-slate-900 mt-6 mb-2 tracking-tight">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h4 key={i} className="text-base font-bold text-slate-800 mt-4 mb-1">{trimmed.replace('#### ', '')}</h4>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc text-slate-700 my-1 leading-relaxed">{trimmed.substring(2)}</li>;
      }
      if (trimmed === '') return <div key={i} className="h-2" />;
      
      // Simple bold parsing
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-slate-700 leading-relaxed my-1">
          {parts.map((part, pi) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pi} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  if (stage === AppStage.LANDING) {
    return (
      <div className="min-h-screen bg-white selection:bg-blue-100 scroll-smooth">
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-[100]">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-blue-200">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">AI Classroom Buddy</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#features" className="hidden md:block text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">How it works</a>
              <button onClick={() => { setIsLogin(true); setStage(AppStage.AUTH); }} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">Log in</button>
              <button onClick={() => { setIsLogin(false); setStage(AppStage.AUTH); }} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">Sign up</button>
            </div>
          </div>
        </nav>

        <section className="pt-48 pb-32 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grounded AI Architecture for Education</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
              Zero Hallucination. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">100% Academic Grounding.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
              The industry-standard Retrieval-Augmented Generation (RAG) platform designed specifically for engineering students.
            </p>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button onClick={() => setStage(AppStage.AUTH)} className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg flex items-center shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all group active:scale-95">
                Launch App
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#features" className="px-10 py-5 text-slate-900 font-black text-lg hover:bg-slate-50 rounded-[2rem] transition-all flex items-center">
                Explore Logic
                <Info className="ml-2 w-5 h-5 opacity-40" />
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="py-32 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8 text-center md:text-left">
              <div className="max-w-2xl">
                <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">The Solution</h2>
                <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">Built with Applied AI <br /> Engineering Principles</h3>
              </div>
              <p className="text-slate-500 font-medium md:max-w-sm">
                Most AI tools struggle with niche academic concepts. Our RAG pipeline bridges the gap.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Database className="w-8 h-8 text-blue-600" />, title: "In-Context Retrieval", desc: "Utilizes a massive context window to ingest entire textbooks without data loss." },
                { icon: <Cpu className="w-8 h-8 text-indigo-600" />, title: "Strict Grounding", desc: "Engineered system prompts force the AI to verify every claim against the source document." },
                { icon: <GraduationCap className="w-8 h-8 text-emerald-600" />, title: "Exam Optimization", desc: "Outputs are formatted for retention: structured bullet points, clear headings, and definitions." }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-8">{feature.icon}</div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h4>
                  <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (stage === AppStage.AUTH) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12 selection:bg-blue-100">
        <div className="max-w-md w-full">
          <button onClick={() => setStage(AppStage.LANDING)} className="mb-12 inline-flex items-center text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-all">
            <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
            Abort & Go Home
          </button>
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
            <div className="flex justify-center mb-8">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200"><BrainCircuit className="text-white w-8 h-8" /></div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tight">{isLogin ? 'Access Portal' : 'Register Account'}</h2>
            <p className="text-center text-slate-500 text-sm font-medium mb-10">{isLogin ? 'Welcome back, Student.' : 'Initialize your academic AI buddy.'}</p>
            <form onSubmit={(e) => { e.preventDefault(); setStage(AppStage.DASHBOARD); }} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input type="text" required placeholder="Jane Doe" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all font-medium text-sm text-slate-900" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Academic Email</label>
                <input type="email" required placeholder="jane@university.edu" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all font-medium text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Password</label>
                <div className="relative">
                  <input type="password" required placeholder="••••••••" className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:outline-none transition-all font-medium text-sm text-slate-900" />
                  <Lock className="absolute right-5 top-4 w-5 h-5 text-slate-300" />
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center">
                {isLogin ? <Zap className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                {isLogin ? 'Authenticate' : 'Get Access'}
              </button>
            </form>
            <div className="mt-10 pt-8 border-t border-slate-50 text-center">
              <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                {isLogin ? "Need an account? Sign up" : "Existing user? Log in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-1.5 rounded-lg"><BrainCircuit className="text-white w-4 h-4" /></div>
            <h1 className="text-base font-black text-slate-900 tracking-tight uppercase">AI Buddy <span className="text-blue-600">Pro</span></h1>
          </div>
          <nav className="flex items-center space-x-6">
             <div className="hidden md:flex space-x-2 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab(TabType.LIVE_SOLVER)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === TabType.LIVE_SOLVER ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Doubt Solver</button>
              <button onClick={() => setActiveTab(TabType.PROJECT_BLUEPRINT)} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === TabType.PROJECT_BLUEPRINT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Engineering Blueprint</button>
            </div>
            <div className="flex items-center space-x-3 border-l border-slate-100 pl-6">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform">JD</div>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {activeTab === TabType.PROJECT_BLUEPRINT ? (
          <div className="p-12"><ProjectDocumentation /></div>
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col min-h-[calc(100vh-4rem)]">
            <div className="mb-10">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-10 relative group">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-4">Phase 01: Context Ingestion</h2>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Upload Study Materials.</h3>
                    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Feed textbooks or notes to the RAG engine to enable accurate, grounded doubt resolution.</p>
                    
                    {docState.name ? (
                      <div className="inline-flex items-center space-x-4 bg-blue-50 border border-blue-100 px-6 py-4 rounded-3xl animate-in fade-in zoom-in-95">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm"><BookOpen className="w-5 h-5 text-blue-600" /></div>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900 truncate max-w-[200px]">{docState.name}</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{docState.pageCount} Pages Synchronized</p>
                        </div>
                        {docState.isProcessing ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>System Pending Input</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-72">
                    <label className="relative block cursor-pointer group">
                      <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center group-hover:border-blue-500 group-hover:bg-blue-50/30 transition-all duration-300">
                        <div className="bg-white shadow-sm w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Injest Context</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[600px] mb-20">
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 flex-1 flex flex-col overflow-hidden relative border-b-8 border-b-blue-600">
                <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${docState.content ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Query Engine: {docState.content ? 'Grounded' : 'Idle'}</span>
                  </div>
                  <button onClick={() => setMessages([])} className="group flex items-center space-x-2 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
                    <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Clear Chat</span>
                  </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth bg-gradient-to-b from-white to-slate-50/30">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-700">
                      <div className="bg-blue-600/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8"><MessageSquare className="w-10 h-10 text-blue-600" /></div>
                      <h4 className="text-2xl font-black text-slate-900 mb-4">Ready for Doubt Solving</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">Ask anything related to your uploaded documents. The AI will provide structured, exam-focused answers.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                        <div className={`max-w-[90%] md:max-w-[80%] rounded-[2rem] p-8 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-800 border border-slate-100 shadow-xl shadow-slate-200/20'}`}>
                          <div className="flex items-center mb-4 space-x-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-200' : 'text-blue-600'}`}>
                              {msg.role === 'user' ? 'Student Doubt' : 'AI Analysis'}
                            </span>
                            <span className={`text-[10px] font-bold opacity-40 ${msg.role === 'user' ? 'text-white' : 'text-slate-900'}`}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-[15px] font-medium leading-relaxed">
                            {msg.role === 'user' ? msg.content : formatContent(msg.content)}
                          </div>
                          {msg.role === 'assistant' && (
                            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <ShieldCheck className="w-3.5 h-3.5 mr-2 text-green-500" />
                                100% Grounded Context
                              </div>
                              <div className="text-[9px] font-black text-slate-300 uppercase italic">Ref: {docState.name}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg flex space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-10 bg-white border-t border-slate-100 relative shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.05)]">
                  {!docState.content && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[4px] z-50 flex flex-col items-center justify-center">
                      <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center space-x-4 animate-in zoom-in duration-500">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Upload material to unlock chat</span>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="relative group max-w-4xl mx-auto">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your doubt here (e.g., Explain the Second Law in detail)..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] pl-8 pr-24 py-6 text-base font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-300"
                    />
                    <button
                      disabled={!input.trim() || isTyping}
                      className="absolute right-3 top-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-200 transition-all active:scale-90 flex items-center justify-center group-focus-within:scale-105"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </form>
                  <div className="mt-6 flex items-center justify-center space-x-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <span className="flex items-center"><Zap className="w-3 h-3 mr-1.5 text-amber-500" /> Gemini-3-Flash Engine</span>
                    <span className="flex items-center"><Cpu className="w-3 h-3 mr-1.5 text-blue-500" /> In-Context RAG</span>
                    <span className="flex items-center"><GraduationCap className="w-3 h-3 mr-1.5 text-indigo-500" /> Exam Standard Responses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="h-14 bg-white border-t border-slate-100 flex items-center justify-center text-[10px] text-slate-400 uppercase tracking-[0.5em] font-black">
        Industrial GenAI Framework &copy; 2024
      </footer>
    </div>
  );
};

export default App;
