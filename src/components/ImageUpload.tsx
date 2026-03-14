import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploadProps {
  onImageSelected: (base64: string) => void;
  isLoading: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, isLoading }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageSelected(base64.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      // Try to get environment camera first (back camera on mobile)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (e) {
        console.log("Environment camera not found, falling back to default camera");
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure you have a camera connected and have granted permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg');
        setPreview(base64);
        onImageSelected(base64.split(',')[1]);
        stopCamera();
      }
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-earth-50 border border-earth-100 text-earth-700 rounded-2xl text-center flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-earth-100 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {!preview && !isCameraActive ? (
          <motion.div
            key="upload-options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-sage-300 rounded-2xl bg-white hover:bg-sage-50 transition-colors group"
            >
              <div className="p-4 bg-sage-100 rounded-full mb-4 group-hover:bg-sage-200 transition-colors">
                <Upload className="w-8 h-8 text-sage-600" />
              </div>
              <span className="font-medium text-sage-800">Upload Photo</span>
              <span className="text-sm text-sage-500 mt-1">Select from gallery</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </button>

            <button
              onClick={startCamera}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-sage-300 rounded-2xl bg-white hover:bg-sage-50 transition-colors group"
            >
              <div className="p-4 bg-sage-100 rounded-full mb-4 group-hover:bg-sage-200 transition-colors">
                <Camera className="w-8 h-8 text-sage-600" />
              </div>
              <span className="font-medium text-sage-800">Take Photo</span>
              <span className="text-sm text-sage-500 mt-1">Use your camera</span>
            </button>
          </motion.div>
        ) : isCameraActive ? (
          <motion.div
            key="camera-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-2xl overflow-hidden bg-black aspect-square sm:aspect-video"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={capturePhoto}
                className="p-6 bg-sage-500 rounded-full text-white hover:bg-sage-600 shadow-xl transition-transform active:scale-95"
              >
                <Camera className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl bg-white"
          >
            <img src={preview!} alt="Plant preview" className="w-full h-auto max-h-[500px] object-contain" />
            
            {isLoading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-medium text-lg">Analyzing your plant...</p>
              </div>
            )}

            {!isLoading && (
              <button
                onClick={clearImage}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
