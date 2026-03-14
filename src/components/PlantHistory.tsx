import React, { useEffect, useState } from 'react';
import { db, collection, query, orderBy, onSnapshot, Timestamp } from '../firebase';
import { useAuth } from '../AuthContext';
import { PlantAnalysis } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronRight, Sprout, Trash2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';

interface HistoryItem {
  id: string;
  plantName: string;
  scientificName: string;
  timestamp: Timestamp;
  analysis: PlantAnalysis;
}

interface PlantHistoryProps {
  onSelect: (analysis: PlantAnalysis) => void;
}

export const PlantHistory: React.FC<PlantHistoryProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const historyRef = collection(db, 'users', user.uid, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryItem[];
      setHistory(items);
      setLoading(false);
    }, (error) => {
      console.error("History fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'history', id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-sage-100">
        <Sprout className="w-12 h-12 text-sage-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-sage-900 mb-2">Sign in to see your history</h3>
        <p className="text-sage-600">Your identified plants will be saved here for future reference.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-sage-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl border border-sage-100">
        <Search className="w-12 h-12 text-sage-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-sage-900 mb-2">No plants identified yet</h3>
        <p className="text-sage-600">Start identifying plants to build your digital garden!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-serif font-bold text-sage-900 mb-6">Your Digital Garden</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {history.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => onSelect(item.analysis)}
              className="group relative bg-white p-6 rounded-2xl border border-sage-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-sage-50 rounded-xl text-sage-600">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 text-sage-300 hover:text-earth-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h4 className="text-lg font-bold text-sage-900 line-clamp-1">{item.plantName}</h4>
                <p className="text-sm italic text-sage-500 mb-4 line-clamp-1">{item.scientificName}</p>
                
                <div className="mt-auto flex items-center justify-between text-xs text-sage-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.timestamp.toDate().toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-sage-600 font-medium">
                    View Details
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
              
              {/* Decorative background element */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-sage-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

import { Search } from 'lucide-react';
