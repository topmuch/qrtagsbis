'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bot, X, Send, User, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

/** QRTags WhatsApp SAV */
const QRTAGS_WHATSAPP_URL = 'https://wa.me/221784858226';
const QRTAGS_WHATSAPP_URL_2 = 'https://wa.me/33745349339';

/** Regex to detect all URLs in messages */
const ALL_URLS_REGEX = /https?:\/\/[^\s)\]}>]+/gi;
const WHATSAPP_URL_REGEX = /https?:\/\/wa\.me\/\d+/gi;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function LandingChatbotWidget() {
  const { t, lang, dir } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Landing-specific suggestions
  const suggestions = lang === 'fr'
    ? ['Comment activer mon QR ?', 'Où est mon objet ?', 'Quels sont les tarifs ?', 'Comment ça marche ?']
    : lang === 'en'
    ? ['How to activate my QR?', 'Where is my bag?', 'What are the prices?', 'How does it work?']
    : ['كيف أفعّل رمز QR الخاص بي؟', 'أين حقيبتي؟', 'ما هي الأسعار؟', 'كيف يعمل؟'];

  const errorMessage = lang === 'fr'
    ? 'Je rencontre un problème technique. Contactez le SAV : info@qrtagss.com'
    : lang === 'en'
    ? 'I am experiencing a technical issue. Contact support: info@qrtagss.com'
    : 'أواجه مشكلة تقنية. تواصل مع الدعم: info@qrtagss.com';

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/landing/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text.trim(),
          locale: lang,
          history: messages.slice(-6),
        }),
      });

      const data = await response.json();

      if (data.success && data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else if (data.success && data.trackingLink) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.trackingLink,
        }]);
      } else if (data.success && data.askReference) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer || (lang === 'fr'
            ? 'Quelle est la référence de votre QR code ? (ex: VOL26-XXXX)'
            : lang === 'en'
            ? 'What is your QR code reference? (e.g. VOL26-XXXX)'
            : 'ما هو مرجع رمز QR الخاص بك؟ (مثال: VOL26-XXXX)'),
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  }, [lang, messages, isLoading, errorMessage]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  /** Render assistant message with ALL URLs as clickable links/buttons */
  const renderAssistantMessage = useCallback((content: string, index: number) => {
    // Detect all URLs in the message
    const urls = content.match(ALL_URLS_REGEX);
    if (!urls || urls.length === 0) {
      // No URLs — render plain text
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
    }

    const uniqueUrls = [...new Set(urls)];
    const isWhatsAppMessage = uniqueUrls.some(u => WHATSAPP_URL_REGEX.test(u));

    if (isWhatsAppMessage) {
      // WhatsApp message: render text + green WhatsApp buttons
      const waUrls = uniqueUrls.filter(u => WHATSAPP_URL_REGEX.test(u));
      const otherUrls = uniqueUrls.filter(u => !WHATSAPP_URL_REGEX.test(u));
      let textContent = content;

      // Remove wa.me URLs from text
      waUrls.forEach(link => {
        textContent = textContent
          .replace(new RegExp(`→?\\s*${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '')
          .replace(new RegExp(`${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '');
      });

      // Remove other URLs from text (they'll be rendered as buttons)
      otherUrls.forEach(link => {
        textContent = textContent.replace(link, '');
      });

      textContent = textContent.replace(/\s{2,}/g, ' ').replace(/[\s→|:,-]+$/, '').trim();

      return (
        <div key={index} className="space-y-2">
          {textContent && <p className="text-sm leading-relaxed whitespace-pre-wrap">{textContent}</p>}
          {waUrls.map((link, i) => (
            <a
              key={`wa-${i}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1fb855] active:bg-[#1a9e49] text-white rounded-xl text-sm font-semibold shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-[1.02] no-underline"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'fr' ? 'Contacter par WhatsApp' : lang === 'en' ? 'Contact via WhatsApp' : 'تواصل عبر واتساب'}</span>
            </a>
          ))}
          {otherUrls.map((link, i) => (
            <a
              key={`url-${i}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-xl text-sm font-medium border border-blue-500/30 transition-all duration-200 hover:scale-[1.02] no-underline"
            >
              <span>{link.replace(/^https?:\/\//, '')}</span>
              <span className="text-blue-600">↗</span>
            </a>
          ))}
        </div>
      );
    }

    // Standard URLs (qrtagss.com, etc.) — render text + clickable link buttons
    let textContent = content;
    uniqueUrls.forEach(link => {
      textContent = textContent.replace(link, '');
    });
    textContent = textContent.replace(/\s{2,}/g, ' ').replace(/[\s→|:,-]+$/, '').trim();

    return (
      <div key={index} className="space-y-2">
        {textContent && <p className="text-sm leading-relaxed whitespace-pre-wrap">{textContent}</p>}
        {uniqueUrls.map((link, i) => (
          <a
            key={`url-${i}`}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-xl text-sm font-medium border border-blue-500/30 transition-all duration-200 hover:scale-[1.02] no-underline"
          >
            <span>{link.replace(/^https?:\/\//, '')}</span>
            <span className="text-blue-600">↗</span>
          </a>
        ))}
      </div>
    );
  }, [lang]);

  if (!isLoaded) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le chatbot"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-500 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}

      {isOpen && (
        <div
          dir={dir}
          className="fixed bottom-0 right-0 z-50 w-full sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[520px] bg-[#1a1040] border-t border-white/20 sm:border sm:border-white/20 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
          style={{ maxHeight: 'min(85vh, 520px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#6613e3] to-[#4b0082] border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-300" />
              <span className="text-white font-semibold text-sm">QRTags Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-center text-white/60 text-sm py-6">
                <p className="text-lg mb-1">🤖</p>
                <p>{lang === 'fr' ? 'Bonjour ! Comment puis-je vous aider ?' : lang === 'en' ? 'Hello! How can I help you?' : 'مرحباً! كيف يمكنني مساعدتك؟'}</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-blue-300" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-md' : 'bg-white/10 text-white rounded-tl-md'}`}>
                  {msg.role === 'assistant'
                    ? renderAssistantMessage(msg.content, i)
                    : msg.content
                  }
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                  <Bot className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
                </div>
                <div className="bg-white/10 text-white/70 px-3 py-2 rounded-2xl rounded-tl-md text-sm">
                  {lang === 'fr' ? 'Réflexion...' : lang === 'en' ? 'Thinking...' : 'جاري التفكير...'}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 0 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs rounded-full border border-white/10 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-white/10 bg-[#0d0a2a]/50">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'fr' ? 'Posez votre question...' : lang === 'en' ? 'Ask your question...' : 'اطرح سؤالك...'}
              disabled={isLoading}
              maxLength={500}
              aria-label="Question"
              className="flex-1 bg-white/10 text-white placeholder:text-white/40 text-sm px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 min-h-[40px]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Envoyer"
              className="w-11 h-11 bg-blue-500 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
