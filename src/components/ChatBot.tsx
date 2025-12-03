import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import { useThemeStyles } from '../context/useThemeStyles';
import { useRestaurant } from '../context/useRestaurant';
import { hexToRgba, getTemplateComponentStyles, getIconSize } from '../utils/themeUtils';

interface Message {
  from: "user" | "bot";
  text: string;
  id: string;
}

interface ChatBotProps {
  menuSections: any[];
  todaysSpecial: any;
  events: any[];
}

const SUGGESTION_PROMPTS = [
  "What's today's special?",
  "Recommend a vegetarian dish.",
  "Show me desserts.",
  "Any ongoing events?",
  "Most popular item?"
];

const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const CACHE_DURATION = 300000; // 5 minutes

export default function ChatBot({ menuSections, todaysSpecial, events }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestCacheRef = useRef<Map<string, { response: string; timestamp: number }>>(new Map());
  const themeStyles = useThemeStyles();
  const { theme } = useRestaurant();
  const templateStyles = getTemplateComponentStyles(theme || null);
  const chatIcon = templateStyles.icons.chat;
  
  const iconSize = getIconSize('lg');
  const borderRadiusClass = chatIcon?.shape === 'circle' ? 'rounded-full' : chatIcon?.shape === 'rounded-square' ? 'rounded-lg' : 'rounded-none';
  const shadowClass = chatIcon?.shadow || 'shadow-lg';
  const animationClass = chatIcon?.animated ? 'hover:scale-110 transition-transform' : '';

  const [showPrompts, setShowPrompts] = useState(true);

  // Memoize menu data to prevent unnecessary re-renders
  const menuData = useMemo(() => {
    // Detect primary currency from menu sections
    let primaryCurrency = 'INR'; // Default
    
    if (menuSections && menuSections.length > 0) {
      for (const section of menuSections) {
        if (section.items && section.items.length > 0) {
          const itemCurrency = (section.items[0].currency || 'INR').toUpperCase();
          if (itemCurrency !== 'INR') {
            primaryCurrency = itemCurrency;
            break;
          }
        }
      }
    }

    return {
      sections: menuSections,
      special: todaysSpecial,
      events: events,
      currency: primaryCurrency
    };
  }, [menuSections, todaysSpecial, events]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Manage body overflow
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [open]);

  // Check and clear expired cache
  const getCachedResponse = useCallback((key: string): string | null => {
    const cached = requestCacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.response;
    }
    requestCacheRef.current.delete(key);
    return null;
  }, []);

  const setCachedResponse = useCallback((key: string, response: string) => {
    requestCacheRef.current.set(key, { response, timestamp: Date.now() });
  }, []);

  // Optimized message sending with retry logic and timeout
  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    if (loading) return; // Prevent duplicate submissions

    const userMsg = input.trim();
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    
    // Check cache first
    const cachedResponse = getCachedResponse(userMsg);
    if (cachedResponse) {
      setMessages(prev => [
        ...prev,
        { from: "user", text: userMsg, id: messageId },
        { from: "bot", text: cachedResponse, id: `bot-${messageId}` }
      ]);
      setInput("");
      setShowPrompts(false);
      return;
    }

    // Hide prompts after first message
    if (showPrompts) setShowPrompts(false);

    const userMessageId = `user-${messageId}`;
    const botMessageId = `bot-${messageId}`;

    // Add user message immediately for instant feedback
    setMessages(prev => [...prev, { from: "user", text: userMsg, id: userMessageId }]);
    setInput("");
    setLoading(true);
    setError("");

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    setAbortController(controller);

    try {
      const apiUrl = import.meta.env.PROD ? "/api/chat" : "http://localhost:3001/api/chat";
      
      let response = null;
      let lastError: Error | null = null;

      // Retry logic with exponential backoff
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const backoffDelay = attempt > 0 ? Math.min(1000 * Math.pow(2, attempt - 1), 5000) : 0;
          if (backoffDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }

          response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMsg,
              menuSections: menuData.sections,
              todaysSpecial: menuData.special,
              events: menuData.events,
              currency: menuData.currency
            }),
            signal: controller.signal,
          });

          if (response.ok) {
            break; // Success, exit retry loop
          } else {
            lastError = new Error(`API error: ${response.status}`);
            if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
              continue; // Retry on server errors
            }
            throw lastError;
          }
        } catch (err) {
          lastError = err as Error;
          if (attempt === MAX_RETRIES - 1) throw err;
        }
      }

      if (!response?.ok) {
        throw lastError || new Error("Request failed");
      }

      const data = await response.json();
      const botReply = data.reply || "Sorry, I couldn't generate a response. Please try again.";

      // Cache the response
      setCachedResponse(userMsg, botReply);

      // Add bot message
      setMessages(prev => [
        ...prev,
        { from: "bot", text: botReply, id: botMessageId }
      ]);

    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.name === "AbortError" 
          ? "Request timed out. Please try again."
          : err.message 
        : "Something went wrong. Please try again.";
      
      setError(errorMessage);
      setMessages(prev => [
        ...prev,
        { from: "bot", text: `⚠️ ${errorMessage}`, id: botMessageId }
      ]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setAbortController(null);
    }
  }, [input, loading, showPrompts, menuData, getCachedResponse, setCachedResponse]);

  // Cancel request
  const cancelRequest = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setAbortController(null);
    }
  }, [abortController]);

  // Handle Enter key with Shift for new line (if needed)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);



  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className={`fixed bottom-20 right-4 text-white ${borderRadiusClass} ${shadowClass} ${animationClass} z-50 disabled:opacity-50`}
        style={{ 
          backgroundColor: hexToRgba(themeStyles.primaryButtonBg, 0.9),
          padding: `${iconSize / 8}px`
        }}
        aria-label="Open chat"
        title="Chat with AI"
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 3.8.9 8.5 8.5 0 0 1 4.7 7.6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Chat Popup */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-end z-50 animate-in">
          <div className="w-full sm:w-96 h-[70vh] rounded-t-2xl shadow-xl flex flex-col" style={{ backgroundColor: themeStyles.backgroundColor }}>

            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: hexToRgba(themeStyles.accentBg, 0.2), borderBottomColor: themeStyles.borderColor }}>
              <h2 className="text-lg font-semibold" style={{ color: themeStyles.primaryButtonBg }}>🤖 AI Assistant</h2>
              <button 
                onClick={() => setOpen(false)} 
                className="text-gray-600 text-xl hover:text-gray-800 transition-colors"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Chat messages - with better scrolling */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.length === 0 && !loading && (
                <div className="flex items-center justify-center h-full text-gray-500 text-center">
                  <p className="text-sm">👋 Start a conversation about our menu!</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg max-w-[85%] break-words animate-in fade-in-50 ${
                    msg.from === "user" ? "ml-auto" : ""
                  }`}
                  style={{
                    backgroundColor: msg.from === "user" ? hexToRgba(themeStyles.primaryButtonBg, 0.2) : '#f3f4f6',
                    marginLeft: msg.from === "user" ? 'auto' : '0',
                    color: msg.from === "user" ? themeStyles.primaryButtonBg : 'inherit'
                  }}
                >
                  <div className="text-xs opacity-60 mb-1">
                    {msg.from === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="p-3 rounded-lg bg-gray-100 animate-pulse">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Buttons */}
            {showPrompts && messages.length === 0 && (
              <div className="flex flex-wrap gap-2 p-3 border-t shrink-0" style={{ backgroundColor: hexToRgba(themeStyles.accentBg, 0.1), borderTopColor: themeStyles.borderColor }}>
                {SUGGESTION_PROMPTS.map((prompt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt);
                      setTimeout(() => {
                        const event = new KeyboardEvent('keydown', { key: 'Enter' });
                        document.activeElement?.dispatchEvent(event);
                      }, 0);
                    }}
                    className="text-xs px-2 py-1 rounded-full transition-all hover:scale-105"
                    style={{
                      backgroundColor: hexToRgba(themeStyles.primaryButtonBg, 0.15),
                      color: themeStyles.primaryButtonBg,
                      border: `1px solid ${themeStyles.primaryButtonBg}40`
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t flex gap-2 shrink-0" style={{ backgroundColor: hexToRgba(themeStyles.accentBg, 0.1), borderTopColor: themeStyles.borderColor }}>
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                placeholder="Ask about dishes, prices, events..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ 
                  borderColor: themeStyles.borderColor
                }}
              />
              {loading ? (
                <button
                  onClick={cancelRequest}
                  className="px-3 py-2 rounded-lg font-semibold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                  title="Cancel request"
                >
                  ⏹
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="px-4 py-2 rounded-lg font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: themeStyles.primaryButtonBg }}
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

