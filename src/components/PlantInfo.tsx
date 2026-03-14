import React from 'react';
import { Droplets, Sun, Thermometer, Sprout, Scissors, Info, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { PlantAnalysis } from '../services/geminiService';

interface PlantInfoProps {
  analysis: PlantAnalysis;
}

export const PlantInfo: React.FC<PlantInfoProps> = ({ analysis }) => {
  const careItems = [
    { icon: Droplets, label: 'Watering', value: analysis.careInstructions.watering, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Sun, label: 'Sunlight', value: analysis.careInstructions.sunlight, color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Sprout, label: 'Soil', value: analysis.careInstructions.soil, color: 'text-earth-600', bg: 'bg-earth-50' },
    { icon: Thermometer, label: 'Temperature', value: analysis.careInstructions.temperature, color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Sparkles, label: 'Fertilizing', value: analysis.careInstructions.fertilizing, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Scissors, label: 'Pruning', value: analysis.careInstructions.pruning, color: 'text-sage-600', bg: 'bg-sage-50' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto mt-8 space-y-8 pb-12"
    >
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-serif font-bold text-sage-900">{analysis.name}</h2>
        <p className="text-xl italic text-sage-600 font-serif">{analysis.scientificName}</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sage-100 rounded-2xl">
            <Info className="w-6 h-6 text-sage-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-sage-900 mb-2">Description</h3>
            <p className="text-sage-700 leading-relaxed">{analysis.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {careItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-sage-100 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sage-900">{item.label}</h4>
              <p className="text-sm text-sage-600 mt-1">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-earth-50 rounded-3xl p-8 border border-earth-100">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-earth-600" />
            <h3 className="text-xl font-bold text-earth-900">Common Issues</h3>
          </div>
          <ul className="space-y-2">
            {analysis.commonIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-earth-800">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-earth-400 flex-shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-sage-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-sage-300" />
              <h3 className="text-xl font-bold">Fun Fact</h3>
            </div>
            <p className="text-sage-100 italic leading-relaxed">"{analysis.funFact}"</p>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-sage-800 rounded-full opacity-50 blur-3xl" />
        </div>
      </div>
    </motion.div>
  );
};
