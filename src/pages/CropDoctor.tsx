import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Upload, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Simple markdown to HTML converter (no external dependencies)
const markdownToHtml = (text: string): string => {
  if (!text) return '';
  
  let html = text;
  
  // Headers (must be done first, before other replacements)
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-foreground">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-foreground">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-foreground">$1</strong>');
  
  // Italic (but not if it's part of bold)
  html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/gim, '<em class="italic">$1</em>');
  
  // Numbered lists
  html = html.replace(/^(\d+)\.\s+(.*)$/gim, '<li class="ml-4 mb-1">$2</li>');
  
  // Bullet lists
  html = html.replace(/^[-*]\s+(.*)$/gim, '<li class="ml-4 mb-1">$1</li>');
  
  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => {
    if (match.trim()) {
      return `<ul class="list-disc ml-6 my-3 space-y-1">${match}</ul>`;
    }
    return match;
  });
  
  // Paragraphs (split by double newlines, but preserve lists and headers)
  const lines = html.split('\n');
  const processed: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (!inList) processed.push('');
      continue;
    }
    
    if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('</ul')) {
      if (line.startsWith('<ul')) inList = true;
      if (line.startsWith('</ul')) inList = false;
      processed.push(line);
    } else if (!line.match(/^<[^>]+>/) && !inList) {
      // Regular text line - wrap in paragraph
      processed.push(`<p class="mb-3 text-muted-foreground">${line}</p>`);
    } else {
      processed.push(line);
    }
  }
  
  html = processed.join('\n');
  
  // Line breaks within paragraphs
  html = html.replace(/(<p[^>]*>)(.*?)(<\/p>)/g, (match, open, content, close) => {
    const withBreaks = content.replace(/\n/g, '<br />');
    return `${open}${withBreaks}${close}`;
  });
  
  return html;
};

const CropDoctor = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description: language === 'en' ? 'Please select an image file' : 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setAnalysisResult(''); // Clear previous result
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalysis = async () => {
    if (!selectedImage) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description: language === 'en' ? 'Please upload an image first' : 'অনুগ্রহ করে প্রথমে একটি ছবি আপলোড করুন',
        variant: 'destructive',
      });
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('VITE_GEMINI_API_KEY is not set. Available env vars:', Object.keys(import.meta.env));
      toast({
        title: language === 'en' ? 'Configuration Error' : 'কনফিগারেশন ত্রুটি',
        description: language === 'en' 
          ? 'Gemini API key not found. Please check your .env file and ensure VITE_GEMINI_API_KEY is set.' 
          : 'Gemini API কী পাওয়া যায়নি। অনুগ্রহ করে আপনার .env ফাইল পরীক্ষা করুন এবং VITE_GEMINI_API_KEY সেট আছে কিনা নিশ্চিত করুন।',
        variant: 'destructive',
      });
      return;
    }

    // Log API key status (first 10 chars only for security)
    console.log('API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(selectedImage);

      // Ensure MIME type is valid (fallback to image/jpeg if not specified)
      let mimeType = selectedImage.type || 'image/jpeg';
      if (!mimeType.startsWith('image/')) {
        mimeType = 'image/jpeg';
      }

      // Create prompt
      const prompt = `You are an agricultural expert. Analyze this image of a plant leaf. 

1. Identify the disease or nutrient deficiency.
2. Explain the cause briefly.
3. Recommend 'Kera-N Organic Fertilizer' as the solution if it involves Nitrogen deficiency or general growth issues.

Keep it short and helpful for a farmer. Format your response in clear sections with markdown.`;

      // Initialize Gemini client once
      const genAI = new GoogleGenerativeAI(apiKey);

      // Helper: robust model fallback strategy
      const generateWithFallback = async (imageBase64: string): Promise<string> => {
        // Attempt 1: gemini-1.5-flash-latest
        try {
          const primaryModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
          const primaryResult = await primaryModel.generateContent([
            prompt,
            {
              inlineData: {
                data: imageBase64,
                mimeType,
              },
            },
          ]);
          const primaryResponse = await primaryResult.response;
          const primaryText = primaryResponse.text();
          if (primaryText && primaryText.trim()) {
            return primaryText.trim();
          }
          throw new Error('Empty response from gemini-1.5-flash-latest');
        } catch (err1) {
          console.warn('Primary model gemini-1.5-flash-latest failed, trying backup gemini-1.5-pro', err1);
          console.log('Switched to backup model: gemini-1.5-pro');

          // Attempt 2: gemini-1.5-pro
          try {
            const backupModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            const backupResult = await backupModel.generateContent([
              prompt,
              {
                inlineData: {
                  data: imageBase64,
                  mimeType,
                },
              },
            ]);
            const backupResponse = await backupResult.response;
            const backupText = backupResponse.text();
            if (backupText && backupText.trim()) {
              return backupText.trim();
            }
            throw new Error('Empty response from gemini-1.5-pro');
          } catch (err2) {
            console.warn('Backup model gemini-1.5-pro failed, trying legacy gemini-pro-vision', err2);
            console.log('Switched to backup model: gemini-pro-vision');

            // Attempt 3: gemini-pro-vision (legacy)
            try {
              const legacyModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
              const legacyResult = await legacyModel.generateContent([
                prompt,
                {
                  inlineData: {
                    data: imageBase64,
                    mimeType,
                  },
                },
              ]);
              const legacyResponse = await legacyResult.response;
              const legacyText = legacyResponse.text();
              if (legacyText && legacyText.trim()) {
                return legacyText.trim();
              }
              throw new Error('Empty response from gemini-pro-vision');
            } catch (err3) {
              console.error('All Gemini models failed in generateWithFallback', {
                primaryError: err1,
                backupError: err2,
                legacyError: err3,
              });
              throw err3;
            }
          }
        }
      };

      const text = await generateWithFallback(base64Image);
      setAnalysisResult(text);
    } catch (error: any) {
      console.error('CropDoctor analysis error after all fallbacks:', error);

      toast({
        title: language === 'en' ? 'Analysis Failed' : 'বিশ্লেষণ ব্যর্থ',
        description:
          language === 'en'
            ? 'Could not analyze the image right now. Please check your API key, model access, and try again in a moment.'
            : 'এই মুহূর্তে ছবিটি বিশ্লেষণ করা সম্ভব হয়নি। অনুগ্রহ করে আপনার API কী ও মডেল অ্যাক্সেস পরীক্ষা করুন এবং কিছুক্ষণ পরে আবার চেষ্টা করুন।',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex h-16 w-16 rounded-2xl gradient-primary items-center justify-center mb-4 shadow-glow">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {language === 'en' ? 'AI Plant Diagnosis' : 'AI উদ্ভিদ রোগ নির্ণয়'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'Upload a leaf image and get instant AI-powered diagnosis' 
              : 'একটি পাতার ছবি আপলোড করুন এবং তাত্ক্ষণিক AI-চালিত রোগ নির্ণয় পান'}
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Upload Plant Image' : 'উদ্ভিদের ছবি আপলোড করুন'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  imagePreview
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 rounded-lg shadow-lg mx-auto"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(null);
                          setImagePreview(null);
                          setAnalysisResult('');
                        }}
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'Click to change image' : 'ছবি পরিবর্তন করতে ক্লিক করুন'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground mb-2">
                        {language === 'en' ? 'Drag & Drop or Click to Upload' : 'টেনে আনুন বা আপলোড করতে ক্লিক করুন'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'en' 
                          ? 'Supported formats: JPG, PNG, WEBP' 
                          : 'সমর্থিত ফরম্যাট: JPG, PNG, WEBP'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              {selectedImage && (
                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === 'en' ? 'Consulting AI Expert...' : 'AI বিশেষজ্ঞের সাথে পরামর্শ করা হচ্ছে...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {language === 'en' ? 'Analyze Plant' : 'উদ্ভিদ বিশ্লেষণ করুন'}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Result Area */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  {language === 'en' ? 'AI Diagnosis' : 'AI রোগ নির্ণয়'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(analysisResult) }}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                {language === 'en' 
                  ? '💡 Tip: For best results, upload a clear image of the affected leaf in good lighting.'
                  : '💡 টিপ: সেরা ফলাফলের জন্য, ভাল আলোতে আক্রান্ত পাতার একটি পরিষ্কার ছবি আপলোড করুন।'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CropDoctor;
