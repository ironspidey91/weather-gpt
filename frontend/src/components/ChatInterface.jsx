import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Volume2, Copy, Check, RefreshCw, CloudRain, ShieldAlert, Wheat, LineChart, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processWeatherGPTQuery, speakText, stopSpeech } from '../services/aiService';

const SUGGESTION_PILLS = [
  { label: "Will it rain today?",              icon: CloudRain,   accent: '#06b6d4' },
  { label: "Severe weather alerts",            icon: ShieldAlert, accent: '#f43f5e' },
  { label: "Air Quality Index",                icon: Sparkles,    accent: '#f59e0b' },
  { label: "Farming advisory",                 icon: Wheat,       accent: '#10b981' },
  { label: "Climate trends",                   icon: LineChart,   accent: '#a78bfa' },
  { label: "5-day forecast",                   icon: Thermometer, accent: '#3b82f6' },
];

const TYPE_BADGE_MAP = {
  alert:     'badge-red',
  advisory:  'badge-cyan',
  aqi:       'badge-amber',
  agromet:   'badge-emerald',
  climate:   'badge-purple',
  lifestyle: 'badge-blue',
  info:      'badge-cyan',
  general:   'badge-cyan',
};

export default function ChatInterface({ weatherData, speechEnabled }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize welcome message when weather data changes
  useEffect(() => {
    if (weatherData) {
      setMessages([{
        id: 1,
        sender: 'ai',
        text: `**Welcome to WeatherGPT!** Your AI weather intelligence assistant.\n\nCurrently observing **${weatherData.city}** — **${weatherData.condition}** at **${weatherData.temperature}°C** (feels like ${weatherData.feelsLike}°C).\n\nAsk me about rain forecasts, severe alerts, air quality, farming advisories, climate trends, or travel weather!`,
        badges: ['AI Online', 'MoES Synced'],
        type: 'general',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [weatherData?.city]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  const handleSend = async (queryText) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Simulate processing delay for UX
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      const response = await processWeatherGPTQuery(text, weatherData);

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.text,
        type: response.type,
        badges: response.badges || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);

      if (speechEnabled) speakText(response.text);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "**Unable to process your request.** Please try again or rephrase your question.",
        type: 'error',
        badges: ['Error'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API - Voice Input
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
    setListening(true);
  };

  // Copy text
  const copyText = (id, text) => {
    const clean = text.replace(/[*#_`]/g, '');
    navigator.clipboard?.writeText(clean);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const badgeClass = (type) => TYPE_BADGE_MAP[type] || 'badge-cyan';

  return (
    <div className="glass-card flex flex-col overflow-hidden shadow-2xl relative" style={{ height: '640px', borderColor: 'var(--border-glass)' }}>

      {/* Chat Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-elevated)' }}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--accent-emerald)', border: '2px solid var(--bg-elevated)' }}></span>
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>WeatherGPT</h2>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {weatherData?.city} Station • NLP Engine
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            stopSpeech();
            setMessages([{
              id: Date.now(),
              sender: 'ai',
              text: `Chat reset. WeatherGPT active for **${weatherData.city}**. How can I help?`,
              badges: ['Reset'],
              type: 'general',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          }}
          className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)' }}
          id="reset-chat-btn"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)' }}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[82%] rounded-2xl p-3.5 text-[13px] leading-relaxed ${
                msg.sender === 'user'
                  ? 'rounded-br-sm shadow-lg'
                  : 'rounded-bl-sm'
              }`}
              style={msg.sender === 'user'
                ? { background: 'linear-gradient(135deg, #2563eb, #6366f1)', color: '#fff' }
                : { background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }
              }>
                {/* Badges */}
                {msg.badges && msg.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {msg.badges.map((b, i) => (
                      <span key={i} className={`badge ${badgeClass(msg.type)} text-[9px] py-0`}>{b}</span>
                    ))}
                  </div>
                )}

                {/* Message content */}
                {msg.sender === 'ai' ? (
                  <div className="chat-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div>{msg.text}</div>
                )}

                {/* AI message footer */}
                {msg.sender === 'ai' && (
                  <div className="mt-2.5 pt-2 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                    <span>{msg.timestamp}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => speakText(msg.text)} className="flex items-center gap-1 transition-colors hover:opacity-80" title="Read aloud">
                        <Volume2 className="w-3 h-3" /> Listen
                      </button>
                      <button onClick={() => copyText(msg.id, msg.text)} className="flex items-center gap-1 transition-colors hover:opacity-80" title="Copy">
                        {copiedId === msg.id ? <><Check className="w-3 h-3" style={{ color: 'var(--accent-emerald)' }} /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 justify-start"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)' }}>
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="glass-panel p-3 rounded-2xl rounded-bl-sm flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--accent-cyan)', border: '1px solid var(--border-glass)' }}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Analyzing weather data...
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Pills */}
      <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar" style={{ borderTop: '1px solid var(--border-glass)', background: 'var(--bg-elevated)' }}>
        {SUGGESTION_PILLS.map((pill, i) => {
          const Icon = pill.icon;
          return (
            <button
              key={i}
              onClick={() => handleSend(pill.label)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
              style={{
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-glass)',
                color: pill.accent,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = pill.accent + '60'; e.currentTarget.style.background = pill.accent + '10'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.background = 'var(--bg-glass)'; }}
            >
              <Icon className="w-3 h-3" /> {pill.label}
            </button>
          );
        })}
      </div>

      {/* Input Bar */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border-glass)', background: 'var(--bg-elevated)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="input-glass pr-10 py-2.5 rounded-xl text-sm"
              placeholder={`Ask about ${weatherData?.city || ''} weather...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              id="chat-input"
              aria-label="Chat input"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: listening ? 'var(--accent-rose)' : 'var(--text-muted)' }}
              title={listening ? "Listening..." : "Voice input"}
              id="voice-input-btn"
              aria-label="Voice input"
            >
              {listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary py-2.5 px-4 rounded-xl"
            id="send-btn"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
