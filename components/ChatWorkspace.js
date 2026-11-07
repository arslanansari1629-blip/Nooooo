'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp, AtSign, BookOpen, Bot, Check, ChevronDown, Code2, Copy, Download,
  FileText, History, Lightbulb, Menu, MessageSquare, Mic, MoreHorizontal,
  Paperclip, Pencil, Pin, Plus, Search, Settings, Sparkles, Square, ThumbsDown,
  ThumbsUp, Trash2, X, Zap, BrainCircuit, PanelLeftClose, PanelLeftOpen,
  Sun, Moon, Monitor, Command, CornerDownLeft, ShieldCheck, CircleUserRound,
} from 'lucide-react';
import Markdown from './Markdown';
import { AUTO_MODEL, FALLBACK_MODELS, friendlyModelName, toModelInfo } from '@/lib/models';

const INITIAL_MODELS = [AUTO_MODEL, ...FALLBACK_MODELS.map(toModelInfo)];
const DEFAULT_SETTINGS = { model: 'auto', style: 'balanced', theme: 'dark', sendWithEnter: true };
const SUGGESTIONS = [
  { icon: Lightbulb, color: 'violet', eyebrow: 'BRAINSTORM', title: 'Turn a spark into something brilliant', prompt: 'Help me brainstorm five original ideas for a project that combines AI and everyday life. Make them practical but ambitious.', tag: 'Explore ideas' },
  { icon: Code2, color: 'blue', eyebrow: 'BUILD', title: 'Write, debug & understand code', prompt: 'Create a beautiful, responsive landing page for a fictional space travel company using HTML and CSS. Explain the key design choices.', tag: 'Start building' },
  { icon: BookOpen, color: 'amber', eyebrow: 'LEARN', title: 'Make complex ideas feel simple', prompt: 'Explain quantum computing to me using a simple analogy, then gradually add technical detail.', tag: 'Learn something' },
  { icon: Pencil, color: 'green', eyebrow: 'CREATE', title: 'Find the words you’re looking for', prompt: 'Write a short, evocative story opening about a city where memories can be traded like currency.', tag: 'Create together' },
];

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const formatDate = (timestamp) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(timestamp));

function NexoraMark({ size = 28, className = '' }) {
  return (
    <span className={`nexora-mark ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 2.5 19.3 12.7 29.5 16l-10.2 3.3L16 29.5l-3.3-10.2L2.5 16l10.2-3.3L16 2.5Z" fill="currentColor" />
        <circle cx="25" cy="6" r="2.2" fill="#D8F9B8" />
      </svg>
    </span>
  );
}

function TypingIndicator() {
  return <div className="typing-indicator" aria-label="Nexora is thinking"><i /><i /><i /></div>;
}

function ModelIcon({ model, size = 17 }) {
  if (model?.id === 'auto') return <Sparkles size={size} />;
  if (/8b|7b|mini|swift/i.test(model?.id || '')) return <Zap size={size} />;
  return <BrainCircuit size={size} />;
}

function IconButton({ label, children, className = '', ...props }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

export default function ChatWorkspace() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [models, setModels] = useState(INITIAL_MODELS);
  const [modelQuery, setModelQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState(null);
  const textareaRef = useRef(null);
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const toastTimer = useRef(null);

  const active = conversations.find((chat) => chat.id === activeId) || null;
  const messages = active?.messages || [];
  const selectedModel = models.find((model) => model.id === settings.model) || AUTO_MODEL;
  const filteredModels = models.filter((model) => `${model.name} ${model.provider} ${model.id}`.toLowerCase().includes(modelQuery.toLowerCase()));

  const notify = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    try {
      const savedChats = JSON.parse(localStorage.getItem('nexora-conversations') || '[]');
      const savedSettings = JSON.parse(localStorage.getItem('nexora-settings') || '{}');
      setConversations(Array.isArray(savedChats) ? savedChats : []);
      setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      const lastActive = localStorage.getItem('nexora-active');
      if (lastActive && savedChats.some((chat) => chat.id === lastActive)) setActiveId(lastActive);
    } catch { /* Start fresh if local storage is unavailable or malformed. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch('/api/models')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Catalog unavailable')))
      .then((data) => {
        if (Array.isArray(data.models) && data.models.length) setModels([AUTO_MODEL, ...data.models]);
      })
      .catch(() => { /* The built-in free model catalog remains available offline. */ });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('nexora-conversations', JSON.stringify(conversations));
  }, [conversations, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('nexora-settings', JSON.stringify(settings));
    const applyTheme = () => {
      const theme = settings.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : settings.theme;
      document.documentElement.dataset.theme = theme;
    };
    applyTheme();
    const media = window.matchMedia('(prefers-color-scheme: light)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings, hydrated]);

  useEffect(() => {
    if (activeId) localStorage.setItem('nexora-active', activeId);
    else localStorage.removeItem('nexora-active');
  }, [activeId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: generating ? 'auto' : 'smooth', block: 'end' });
  }, [messages, generating]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setGenerating(false);
    setActiveId(null);
    setInput('');
    setAttachments([]);
    setSidebarOpen(false);
    setMenuId(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const handleKeys = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
        event.preventDefault(); newChat();
      }
      if (event.key === 'Escape') {
        setSearchOpen(false); setSettingsOpen(false); setModelOpen(false); setProfileOpen(false); setMenuId(null);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [newChat]);

  const updateConversation = useCallback((id, updater) => {
    setConversations((current) => current.map((chat) => chat.id === id ? updater(chat) : chat));
  }, []);

  const generateReply = useCallback(async (conversationId, history) => {
    const assistantId = uid();
    updateConversation(conversationId, (chat) => ({
      ...chat,
      updatedAt: Date.now(),
      messages: [...chat.messages, { id: assistantId, role: 'assistant', content: '', createdAt: Date.now() }],
    }));
    setGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let received = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((message) => ({ role: message.role, content: message.apiContent || message.content })),
          model: settings.model,
          style: settings.style,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      const respondingModel = response.headers.get('X-Nexora-Model');
      if (respondingModel) {
        updateConversation(conversationId, (chat) => ({
          ...chat,
          messages: chat.messages.map((message) => message.id === assistantId ? { ...message, model: respondingModel } : message),
        }));
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += decoder.decode(value, { stream: true });
        updateConversation(conversationId, (chat) => ({
          ...chat,
          messages: chat.messages.map((message) => message.id === assistantId ? { ...message, content: received } : message),
        }));
      }
      if (!received.trim()) throw new Error('No response was received. Please try again.');
    } catch (error) {
      if (error.name === 'AbortError') {
        updateConversation(conversationId, (chat) => ({
          ...chat,
          messages: chat.messages.filter((message) => message.id !== assistantId || message.content),
        }));
      } else {
        updateConversation(conversationId, (chat) => ({
          ...chat,
          messages: chat.messages.map((message) => message.id === assistantId
            ? { ...message, content: error.message, isError: true }
            : message),
        }));
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [settings.model, settings.style, updateConversation]);

  const sendMessage = useCallback((preset) => {
    const text = (typeof preset === 'string' ? preset : input).trim();
    if ((!text && !attachments.length) || generating) return;
    const now = Date.now();
    const attachmentContext = attachments.length
      ? `\n\n${attachments.map((file) => `--- Attached file: ${file.name} ---\n${file.content}\n--- End of file ---`).join('\n\n')}`
      : '';
    const userMessage = {
      id: uid(), role: 'user', content: text || 'Please review the attached file(s).',
      apiContent: `${text}\n${attachmentContext}`, attachments: attachments.map(({ name, size }) => ({ name, size })), createdAt: now,
    };
    let conversationId = activeId;
    let history;
    if (active) {
      history = [...active.messages.filter((message) => !message.isError), userMessage];
      updateConversation(active.id, (chat) => ({ ...chat, updatedAt: now, messages: [...chat.messages, userMessage] }));
    } else {
      conversationId = uid();
      history = [userMessage];
      const title = userMessage.content.length > 44 ? `${userMessage.content.slice(0, 44)}…` : userMessage.content;
      const chat = { id: conversationId, title: title || 'New conversation', createdAt: now, updatedAt: now, pinned: false, messages: [userMessage] };
      setConversations((current) => [chat, ...current]);
      setActiveId(conversationId);
    }
    setInput('');
    setAttachments([]);
    if (listening) recognitionRef.current?.stop();
    generateReply(conversationId, history);
  }, [active, activeId, attachments, generateReply, generating, input, listening]);

  const regenerate = (assistantId) => {
    if (!active || generating) return;
    const index = active.messages.findIndex((message) => message.id === assistantId);
    if (index < 1) return;
    const history = active.messages.slice(0, index).filter((message) => !message.isError);
    updateConversation(active.id, (chat) => ({ ...chat, messages: history }));
    generateReply(active.id, history);
  };

  const deleteChat = (id) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    if (id === activeId) newChat();
    setConversations((current) => current.filter((chat) => chat.id !== id));
    setMenuId(null);
    notify('Conversation deleted');
  };

  const saveTitle = (id) => {
    const title = editingTitle.trim();
    if (title) updateConversation(id, (chat) => ({ ...chat, title: title.slice(0, 80) }));
    setEditingId(null);
  };

  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); notify('Copied to clipboard'); }
    catch { notify('Could not copy text', 'error'); }
  };

  const exportChat = () => {
    if (!active) return;
    const content = `# ${active.title}\n\n${active.messages.map((message) =>
      `## ${message.role === 'user' ? 'You' : 'Nexora'}\n\n${message.content}`
    ).join('\n\n---\n\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${active.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'nexora-chat'}.md`;
    anchor.click(); URL.revokeObjectURL(url);
    notify('Conversation exported');
  };

  const exportAll = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), conversations }, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'nexora-conversations.json'; anchor.click();
    URL.revokeObjectURL(url); setProfileOpen(false); notify('Your data has been exported');
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 3 - attachments.length);
    for (const file of files) {
      if (file.size > 100000) { notify(`${file.name} is over the 100 KB limit`, 'error'); continue; }
      try {
        const content = await file.text();
        setAttachments((current) => [...current, { id: uid(), name: file.name, size: file.size, content }].slice(0, 3));
      } catch { notify(`Could not read ${file.name}`, 'error'); }
    }
    event.target.value = '';
  };

  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { notify('Voice input is not supported in this browser', 'error'); return; }
    const recognition = new Recognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => { setListening(false); notify('Voice input could not start', 'error'); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition; recognition.start(); setListening(true);
  };

  const groupedChats = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const week = today - 6 * 86400000;
    return {
      Pinned: sorted.filter((chat) => chat.pinned),
      Today: sorted.filter((chat) => !chat.pinned && chat.updatedAt >= today),
      'Previous 7 days': sorted.filter((chat) => !chat.pinned && chat.updatedAt < today && chat.updatedAt >= week),
      Older: sorted.filter((chat) => !chat.pinned && chat.updatedAt < week),
    };
  }, [conversations]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations.slice(0, 6);
    return conversations.filter((chat) => chat.title.toLowerCase().includes(query) || chat.messages.some((message) => message.content.toLowerCase().includes(query)));
  }, [conversations, searchQuery]);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const renderChatItem = (chat) => (
    <div key={chat.id} className={`chat-history-item ${activeId === chat.id ? 'active' : ''}`}>
      {editingId === chat.id ? (
        <input className="rename-input" value={editingTitle} autoFocus onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={() => saveTitle(chat.id)} onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(chat.id); if (e.key === 'Escape') setEditingId(null); }} />
      ) : (
        <button className="history-main" onClick={() => { if (!generating) { setActiveId(chat.id); setSidebarOpen(false); } }}>
          {chat.pinned && <Pin size={11} className="pinned-icon" />}<span>{chat.title}</span>
        </button>
      )}
      <div className="history-menu-wrap">
        <IconButton label="Conversation options" className="history-more" onClick={() => setMenuId(menuId === chat.id ? null : chat.id)}><MoreHorizontal size={16} /></IconButton>
        {menuId === chat.id && (
          <div className="popover history-popover">
            <button onClick={() => { updateConversation(chat.id, (item) => ({ ...item, pinned: !item.pinned })); setMenuId(null); }}><Pin size={14} />{chat.pinned ? 'Unpin' : 'Pin'} chat</button>
            <button onClick={() => { setEditingId(chat.id); setEditingTitle(chat.title); setMenuId(null); }}><Pencil size={14} />Rename</button>
            <button className="danger" onClick={() => deleteChat(chat.id)}><Trash2 size={14} />Delete</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top">
          <button className="brand" onClick={newChat} aria-label="Nexora home"><NexoraMark size={31} /><span>nexora<span className="brand-dot">.</span></span></button>
          <IconButton label="Close sidebar" className="mobile-close" onClick={() => setSidebarOpen(false)}><X size={19} /></IconButton>
        </div>
        <button className="new-chat-button" onClick={newChat}><span><Plus size={17} />New conversation</span><kbd>⇧ ⌘ O</kbd></button>
        <button className="search-button" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search conversations</span><kbd>⌘ K</kbd></button>
        <div className="history-scroll">
          {!conversations.length && hydrated && (
            <div className="empty-history"><MessageSquare size={22} /><p>No conversations yet</p><span>Your ideas and answers will live here.</span></div>
          )}
          {Object.entries(groupedChats).map(([label, chats]) => chats.length > 0 && (
            <section className="history-group" key={label}><h3>{label}</h3>{chats.map(renderChatItem)}</section>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="engine-card"><div className="engine-icon"><Sparkles size={17} /></div><div><strong>Intelligence, amplified</strong><span>Powered by NVIDIA NIM</span></div><span className="status-dot" /></div>
          <div className="profile-wrap">
            <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)}><span className="avatar">Y</span><span className="profile-copy"><strong>Your workspace</strong><small>Local & private</small></span><MoreHorizontal size={17} /></button>
            {profileOpen && <div className="popover profile-popover"><button onClick={exportAll}><Download size={15} />Export all data</button><button onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}><Settings size={15} />Preferences</button><button className="danger" onClick={() => { if (window.confirm('Clear all conversations from this browser?')) { newChat(); setConversations([]); setProfileOpen(false); notify('Workspace cleared'); } }}><Trash2 size={15} />Clear workspace</button></div>}
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <IconButton label="Open sidebar" className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></IconButton>
            <IconButton label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="desktop-collapse" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</IconButton>
            <div className="conversation-heading"><strong>{active?.title || 'New conversation'}</strong><span><i /> Nexora is online</span></div>
          </div>
          <div className="topbar-actions">
            <div className="model-wrap">
              <button className="model-button" onClick={() => setModelOpen(!modelOpen)}><ModelIcon model={selectedModel} size={15} /><span>{selectedModel.name}</span><ChevronDown size={13} /></button>
              {modelOpen && <div className="popover model-popover">
                <div className="popover-label">ALL FREE NVIDIA MODELS <span>{models.length - 1}</span></div>
                <div className="model-search"><Search size={14} /><input autoFocus value={modelQuery} onChange={(event) => setModelQuery(event.target.value)} placeholder="Find a model…" /></div>
                <div className="model-list">{filteredModels.map((model) => <button key={model.id} className={`model-option ${settings.model === model.id ? 'selected' : ''}`} onClick={() => { setSettings((current) => ({ ...current, model: model.id })); setModelOpen(false); setModelQuery(''); }}><ModelIcon model={model} size={18} /><span><strong>{model.name}<em>{model.badge}</em></strong><small>{model.description}</small></span>{settings.model === model.id && <Check size={15} />}</button>)}{!filteredModels.length && <div className="model-no-results">No models match “{modelQuery}”</div>}</div>
              </div>}
            </div>
            {active && <IconButton label="Export conversation" onClick={exportChat}><Download size={17} /></IconButton>}
            <IconButton label="Settings" onClick={() => setSettingsOpen(true)}><Settings size={18} /></IconButton>
          </div>
        </header>

        <div className={`conversation-area ${!messages.length ? 'is-empty' : ''}`}>
          {!messages.length ? (
            <div className="welcome-screen">
              <div className="ambient-orb orb-one" /><div className="ambient-orb orb-two" />
              <div className="welcome-content">
                <div className="welcome-symbol"><NexoraMark size={43} /><span className="symbol-ring" /></div>
                <div className="welcome-kicker"><span /> YOUR AI THINKING PARTNER <span /></div>
                <h1>{greeting}.<br /><span>What will we discover?</span></h1>
                <p>From a fleeting thought to your next big breakthrough.<br />Ask anything — let’s make it happen.</p>
                <div className="suggestion-grid">
                  {SUGGESTIONS.map(({ icon: Icon, ...card }) => (
                    <button className={`suggestion-card ${card.color}`} key={card.eyebrow} onClick={() => { setInput(card.prompt); textareaRef.current?.focus(); }}>
                      <div className="suggestion-top"><span className="suggestion-icon"><Icon size={18} /></span><span className="suggestion-eyebrow">{card.eyebrow}</span><ArrowUp size={15} className="suggestion-arrow" /></div>
                      <strong>{card.title}</strong><span className="suggestion-tag">{card.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-scroll">
              <div className="messages-list">
                <div className="chat-date"><span>{formatDate(active.createdAt)}</span></div>
                {messages.map((message, index) => (
                  <article key={message.id} className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
                    {message.role === 'assistant' && <div className="assistant-avatar"><NexoraMark size={27} /></div>}
                    <div className="message-body">
                      <div className="message-meta"><strong>{message.role === 'user' ? 'You' : 'Nexora'}</strong>{message.role === 'assistant' && !message.isError && <span>{message.model ? friendlyModelName(message.model) : selectedModel.name}</span>}</div>
                      {message.role === 'user' ? (
                        <div className="user-bubble">
                          {message.attachments?.map((file) => <div className="message-attachment" key={file.name}><FileText size={15} /><span>{file.name}</span></div>)}
                          <p>{message.content}</p>
                        </div>
                      ) : (
                        <div className="assistant-content">{!message.content && generating && index === messages.length - 1 ? <TypingIndicator /> : message.isError ? <div className="error-message"><AtSign size={17} /><p>{message.content}</p><button onClick={() => regenerate(message.id)}>Try again</button></div> : <Markdown content={message.content} />}</div>
                      )}
                      {message.role === 'assistant' && message.content && !message.isError && (
                        <div className="message-actions">
                          <IconButton label="Copy response" onClick={() => copyText(message.content)}><Copy size={14} /></IconButton>
                          <IconButton label="Regenerate response" disabled={generating} onClick={() => regenerate(message.id)}><History size={14} /></IconButton>
                          <span className="action-divider" />
                          <IconButton label="Good response" className={message.feedback === 'up' ? 'selected' : ''} onClick={() => updateConversation(active.id, (chat) => ({ ...chat, messages: chat.messages.map((item) => item.id === message.id ? { ...item, feedback: item.feedback === 'up' ? null : 'up' } : item) }))}><ThumbsUp size={14} /></IconButton>
                          <IconButton label="Poor response" className={message.feedback === 'down' ? 'selected' : ''} onClick={() => updateConversation(active.id, (chat) => ({ ...chat, messages: chat.messages.map((item) => item.id === message.id ? { ...item, feedback: item.feedback === 'down' ? null : 'down' } : item) }))}><ThumbsDown size={14} /></IconButton>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                <div ref={endRef} className="scroll-anchor" />
              </div>
            </div>
          )}

          <div className="composer-area">
            <div className={`composer ${listening ? 'is-listening' : ''}`}>
              {attachments.length > 0 && <div className="attachment-list">{attachments.map((file) => <span className="attachment-chip" key={file.id}><FileText size={14} /><span>{file.name}</span><button aria-label={`Remove ${file.name}`} onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}><X size={13} /></button></span>)}</div>}
              <textarea ref={textareaRef} rows={1} maxLength={8000} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && settings.sendWithEnter && !event.nativeEvent.isComposing) { event.preventDefault(); sendMessage(); }
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); sendMessage(); }
              }} placeholder={listening ? 'Listening… speak naturally' : 'Ask Nexora anything…'} aria-label="Message Nexora" />
              <div className="composer-toolbar">
                <div className="composer-tools">
                  <input ref={fileRef} type="file" hidden multiple accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.css,.html,.csv" onChange={handleFiles} />
                  <IconButton label="Attach text or code files" disabled={attachments.length >= 3 || generating} onClick={() => fileRef.current?.click()}><Paperclip size={18} /></IconButton>
                  <IconButton label={listening ? 'Stop voice input' : 'Start voice input'} className={listening ? 'voice-active' : ''} onClick={toggleVoice}><Mic size={18} /></IconButton>
                  <span className="composer-hint">{listening ? 'Listening…' : 'Add context'}</span>
                </div>
                <div className="send-wrap"><span className="character-count">{input.length > 0 && `${input.length} / 8,000`}</span>{generating ? <button className="send-button stop" onClick={() => abortRef.current?.abort()} aria-label="Stop generating"><Square size={15} fill="currentColor" /></button> : <button className="send-button" disabled={!input.trim() && !attachments.length} onClick={() => sendMessage()} aria-label="Send message"><ArrowUp size={19} /></button>}</div>
              </div>
            </div>
            <div className="composer-footer"><span><ShieldCheck size={12} /> Your conversations stay on this device</span><p>Nexora can make mistakes. Check important information.</p></div>
          </div>
        </div>
      </main>

      {searchOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
          <div className="search-modal" role="dialog" aria-modal="true" aria-label="Search conversations">
            <div className="search-input-wrap"><Search size={20} /><input autoFocus placeholder="Search your conversations…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><kbd>ESC</kbd></div>
            <div className="search-results"><div className="search-results-label">{searchQuery ? `${searchResults.length} RESULTS` : 'RECENT CONVERSATIONS'}</div>{searchResults.length ? searchResults.map((chat) => <button key={chat.id} onClick={() => { setActiveId(chat.id); setSearchOpen(false); setSearchQuery(''); }}><span className="search-result-icon"><MessageSquare size={16} /></span><span><strong>{chat.title}</strong><small>{chat.messages.length} messages · {formatDate(chat.updatedAt)}</small></span><CornerDownLeft size={15} /></button>) : <div className="no-results"><Search size={26} /><strong>No conversations found</strong><span>Try a different word or phrase.</span></div>}</div>
            <div className="search-footer"><span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span><span><kbd>↵</kbd> to open</span></div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
          <div className="settings-modal" role="dialog" aria-modal="true" aria-label="Preferences">
            <div className="modal-header"><div><span className="modal-eyebrow">MAKE IT YOURS</span><h2>Preferences</h2></div><IconButton label="Close settings" onClick={() => setSettingsOpen(false)}><X size={20} /></IconButton></div>
            <div className="settings-content">
              <section className="settings-section"><label>Appearance</label><div className="theme-options">{[{ id: 'light', name: 'Light', icon: Sun }, { id: 'dark', name: 'Dark', icon: Moon }, { id: 'system', name: 'System', icon: Monitor }].map(({ id, name, icon: Icon }) => <button className={settings.theme === id ? 'selected' : ''} key={id} onClick={() => setSettings((current) => ({ ...current, theme: id }))}><Icon size={17} /><span>{name}</span>{settings.theme === id && <Check size={14} />}</button>)}</div></section>
              <section className="settings-section"><label>Response style</label><div className="style-options">{['balanced', 'precise', 'creative'].map((style) => <button className={settings.style === style ? 'selected' : ''} key={style} onClick={() => setSettings((current) => ({ ...current, style }))}><strong>{style.charAt(0).toUpperCase() + style.slice(1)}</strong><span>{style === 'balanced' ? 'Thoughtful and clear' : style === 'precise' ? 'Short and to the point' : 'Imaginative and original'}</span></button>)}</div></section>
              <section className="settings-section model-settings"><label>Default model <span className="setting-count">{models.length - 1} free models</span></label><div className="settings-model-list">{models.map((model) => <button key={model.id} className={settings.model === model.id ? 'selected' : ''} onClick={() => setSettings((current) => ({ ...current, model: model.id }))}><ModelIcon model={model} size={19} /><span><strong>{model.name}</strong><small>{model.description}</small></span><em>{model.badge}</em></button>)}</div></section>
              <section className="settings-section setting-row"><div><label htmlFor="enter-setting">Enter to send</label><p>Press Enter to send and Shift + Enter for a new line.</p></div><button id="enter-setting" role="switch" aria-checked={settings.sendWithEnter} className={`switch ${settings.sendWithEnter ? 'on' : ''}`} onClick={() => setSettings((current) => ({ ...current, sendWithEnter: !current.sendWithEnter }))}><span /></button></section>
              <div className="privacy-note"><ShieldCheck size={19} /><div><strong>Your data belongs to you</strong><p>Conversations are saved only in this browser. Your NVIDIA key is securely stored on the server and never exposed.</p></div></div>
            </div>
            <div className="settings-footer"><span>Nexora v1.0</span><button onClick={() => setSettingsOpen(false)}>Done</button></div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}><span>{toast.type === 'success' ? <Check size={15} /> : <X size={15} />}</span>{toast.message}</div>}
    </div>
  );
}
