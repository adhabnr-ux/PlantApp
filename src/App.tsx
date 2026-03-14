import { useState } from 'react';
import { Leaf, Search, MessageSquare, Sprout, LogIn, LogOut, History, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageUpload } from './components/ImageUpload';
import { PlantInfo } from './components/PlantInfo';
import { ChatBot } from './components/ChatBot';
import { PlantHistory } from './components/PlantHistory';
import { geminiService, PlantAnalysis } from './services/geminiService';
import { useAuth } from './AuthContext';
import { auth, googleProvider, signInWithPopup, signOut, db, collection, addDoc, Timestamp } from './firebase';

type Tab = 'identify' | 'chat' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('identify');
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAnalysis(null);
      setActiveTab('identify');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleImageSelected = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await geminiService.identifyPlant(base64);
      setAnalysis(result);

      // Save to history if user is logged in
      if (user && result.name && result.name !== "Error") {
        await addDoc(collection(db, 'users', user.uid, 'history'), {
          uid: user.uid,
          plantName: result.name,
          scientificName: result.scientificName,
          analysis: result,
          timestamp: Timestamp.now()
        });
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze the plant. Please try a clearer photo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (selectedAnalysis: PlantAnalysis) => {
    setAnalysis(selectedAnalysis);
    setActiveTab('identify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-sage-50">
      {/* Header */}
      <header className="bg-white border-b border-sage-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sage-500 rounded-xl text-white">
              <Sprout className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-sage-900 tracking-tight">FloraGuide</h1>
          </div>

          <nav className="flex bg-sage-100 p-1 rounded-2xl overflow-x-auto max-w-[60%] sm:max-w-none">
            <button
              onClick={() => setActiveTab('identify')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'identify' 
                  ? 'bg-white text-sage-900 shadow-sm' 
                  : 'text-sage-500 hover:text-sage-700'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Identify</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'history' 
                  ? 'bg-white text-sage-900 shadow-sm' 
                  : 'text-sage-500 hover:text-sage-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'chat' 
                  ? 'bg-white text-sage-900 shadow-sm' 
                  : 'text-sage-500 hover:text-sage-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Assistant</span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-sage-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-medium text-sage-900">{user.displayName}</p>
                  <button onClick={handleLogout} className="text-[10px] text-sage-500 hover:text-earth-500 uppercase tracking-wider font-bold">Sign Out</button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-sage-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sage-200 flex items-center justify-center text-sage-600">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-sage-500 text-white rounded-xl font-medium hover:bg-sage-600 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'identify' ? (
            <motion.div
              key="identify-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl font-serif font-bold text-sage-900 mb-4">What's Growing in Your Garden?</h2>
                <p className="text-lg text-sage-600">Take a photo or upload an image to identify any plant and get expert care instructions instantly.</p>
              </div>

              <ImageUpload onImageSelected={handleImageSelected} isLoading={isLoading} />

              {error && (
                <div className="max-w-2xl mx-auto p-4 bg-earth-50 border border-earth-100 text-earth-700 rounded-2xl text-center">
                  {error}
                </div>
              )}

              {analysis && !isLoading && <PlantInfo analysis={analysis} />}
            </motion.div>
          ) : activeTab === 'history' ? (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PlantHistory onSelect={handleHistorySelect} />
            </motion.div>
          ) : (
            <motion.div
              key="chat-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl font-serif font-bold text-sage-900 mb-4">Your Personal Gardening Expert</h2>
                <p className="text-lg text-sage-600">Ask Flora anything about plant care, pest control, or landscaping advice.</p>
              </div>

              <ChatBot />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-sage-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-sage-400" />
            <span className="font-serif italic text-sage-400 text-lg">Nurturing your green thumb</span>
          </div>
          <p className="text-sm text-sage-400">Powered by Gemini AI • Built for Gardeners</p>
        </div>
      </footer>
    </div>
  );
}

