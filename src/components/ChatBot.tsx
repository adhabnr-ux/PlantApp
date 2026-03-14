import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: "Hi! I'm Flora, your AI gardening assistant. Ask me anything about plants, care tips, or troubleshooting gardening problems!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.chat(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response || "I'm sorry, I couldn't process that request."
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having a bit of trouble connecting right now. Please try again later!"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ id: '1', role: 'model', text: "Hi! I'm Flora, your AI gardening assistant. Ask me anything about plants, care tips, or troubleshooting gardening problems!" }]);
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-sage-100 overflow-hidden">
      <div className="p-4 bg-sage-50 border-bottom border-sage-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-bold text-sage-900">Chat with Flora</span>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-sage-400 hover:text-earth-500 transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-earth-500 text-white' : 'bg-sage-100 text-sage-600'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-earth-500 text-white rounded-tr-none' 
                  : 'bg-sage-50 text-sage-800 rounded-tl-none'
              }`}>
                <div className="markdown-body text-sm">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center bg-sage-50 p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-sage-500" />
              <span className="text-sm text-sage-500 italic">Flora is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-sage-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your plants..."
            className="w-full p-4 pr-12 bg-sage-50 border-none rounded-2xl focus:ring-2 focus:ring-sage-500 transition-all outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-sage-500 text-white rounded-xl hover:bg-sage-600 disabled:opacity-50 disabled:hover:bg-sage-500 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
