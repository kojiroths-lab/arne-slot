import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Upload, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
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

// Import Google Generative AI
let GoogleGenerativeAI: any;
let GenerativeModel: any;

// Dynamic import for Google Generative AI
const loadGemini = async () => {
  if (!GoogleGenerativeAI) {
    const module = await import('@google/generative-ai');
    GoogleGenerativeAI = module.GoogleGenerativeAI;
    GenerativeModel = module.GenerativeModel;
  }
  return { GoogleGenerativeAI, GenerativeModel };
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

      // SOLUTION: First list available models, then use those
      // This ensures we only try models that actually exist for this API key
      let availableModels: string[] = [];
      const apiVersions = ['v1', 'v1beta'];
      
      // Try to list available models first
      console.log('[API] Attempting to list available models...');
      for (const apiVersion of apiVersions) {
        try {
          const listUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
          const listResponse = await fetch(listUrl);
          
          if (listResponse.ok) {
            const listData = await listResponse.json();
            if (listData.models && Array.isArray(listData.models)) {
              availableModels = listData.models
                .map((m: any) => m.name?.replace('models/', '') || m.name)
                .filter((name: string) => name && name.includes('gemini'))
                .filter((name: string) => {
                  // Only include models that support generateContent
                  const model = listData.models.find((m: any) => 
                    (m.name?.replace('models/', '') || m.name) === name
                  );
                  return model?.supportedGenerationMethods?.includes('generateContent');
                });
              
              console.log(`✓ [API] Found ${availableModels.length} available models in ${apiVersion}:`, availableModels);
              break; // Found models, exit
            }
          }
        } catch (listError) {
          console.log(`[API] Could not list models from ${apiVersion}:`, listError);
          continue;
        }
      }

      // If we couldn't list models, use a fallback list
      if (availableModels.length === 0) {
        console.log('[API] Could not list models, using fallback list');
        availableModels = [
          'gemini-1.5-flash',
          'gemini-1.5-flash-latest',
          'gemini-1.5-pro',
          'gemini-1.5-pro-latest',
          'gemini-pro-vision',
        ];
      }

      // Prioritize vision-capable models
      const visionModels = availableModels.filter(m => 
        m.includes('flash') || m.includes('vision') || m.includes('pro')
      );
      const modelsToTry = [...visionModels, ...availableModels.filter(m => !visionModels.includes(m))];

      let text = '';
      let lastError: any = null;
      let successfulModel = '';
      let successfulApiVersion = '';

      // Try REST API with available models
      for (const apiVersion of apiVersions) {
        for (const modelName of modelsToTry) {
          try {
            console.log(`[REST API] Trying ${apiVersion} with model: ${modelName}`);
            
            const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;
            
            const requestBody = {
              contents: [{
                parts: [
                  {
                    inlineData: {
                      data: base64Image,
                      mimeType: mimeType,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              }],
            };

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMsg = errorData.error?.message || response.statusText;
              throw new Error(`HTTP ${response.status}: ${errorMsg}`);
            }

            const data = await response.json();
            
            // Extract text from response
            if (data.candidates?.[0]?.content?.parts) {
              text = data.candidates[0].content.parts
                .map((part: any) => part.text || '')
                .join('')
                .trim();
            } else if (data.text) {
              text = data.text.trim();
            } else {
              throw new Error('Unexpected response format - no text found');
            }

            if (text) {
              successfulModel = modelName;
              successfulApiVersion = apiVersion;
              console.log(`✓ [REST API] Successfully used ${apiVersion} API with model: ${modelName}`);
              break; // Success, exit model loop
            }
          } catch (modelError: any) {
            lastError = modelError;
            console.log(`[REST API] Model ${modelName} with ${apiVersion} failed:`, modelError.message);
            continue;
          }
        }

        if (text) {
          break; // Success, exit API version loop
        }
      }

      // If REST API failed, try SDK as last resort
      if (!text) {
        console.log('[SDK] REST API failed, trying SDK as fallback...');
        try {
          const { GoogleGenerativeAI: GenAI } = await loadGemini();
          const genAI = new GenAI(apiKey);
          
          // SDK fallback - try legacy models that might work with v1beta
          const sdkModels = ['gemini-pro-vision', 'gemini-pro'];
          
          for (const modelName of sdkModels) {
            try {
              console.log(`[SDK] Trying model: ${modelName}`);
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent([
                {
                  inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                  },
                },
                prompt,
              ]);
              
              const response = await result.response;
              text = response.text();
              
              if (text) {
                successfulModel = modelName;
                successfulApiVersion = 'v1beta (via SDK)';
                console.log(`✓ [SDK] Successfully used model: ${modelName}`);
                break;
              }
            } catch (sdkError: any) {
              lastError = sdkError;
              console.log(`[SDK] Model ${modelName} failed:`, sdkError.message);
              continue;
            }
          }
        } catch (sdkInitError: any) {
          console.error('[SDK] SDK initialization failed:', sdkInitError);
          lastError = sdkInitError;
        }
      }

      if (!text) {
        const errorMsg = lastError?.message || 'Unknown error';
        console.error('All methods failed. Last error:', errorMsg);
        console.error('Available models found:', availableModels);
        console.error('Models tried:', modelsToTry);
        
        // Provide specific guidance based on error
        let guidance = '';
        if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          guidance = `No compatible models found. Your API key may not have access to Gemini models, or the Generative Language API may not be enabled. ` +
            `Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com and enable the API.`;
        } else if (errorMsg.includes('403') || errorMsg.includes('permission')) {
          guidance = `Permission denied. Check: 1) API key is valid, 2) Generative Language API is enabled, 3) API key has correct permissions.`;
        } else if (errorMsg.includes('401')) {
          guidance = `Invalid API key. Verify your API key at: https://aistudio.google.com/apikey`;
        } else if (errorMsg.includes('billing') || errorMsg.includes('quota')) {
          guidance = `Billing or quota issue. Enable billing at: https://console.cloud.google.com/billing`;
        } else {
          guidance = `Please verify: 1) API key is valid, 2) Generative Language API is enabled, 3) Billing is enabled, 4) Models are available in your region.`;
        }
        
        throw new Error(
          `All API methods failed. ${guidance} ` +
          `Last error: ${errorMsg}. ` +
          `Available models: ${availableModels.length > 0 ? availableModels.join(', ') : 'none found'}.`
        );
      }
      
      setAnalysisResult(text);
    } catch (error: any) {
      console.error('Analysis error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response,
      });
      
      let errorMessage = error.message || '';
      
      // Provide helpful error messages based on error type
      if (errorMessage.includes('404') || errorMessage.includes('not found') || error.status === 404) {
        errorMessage = language === 'en' 
          ? 'Model not found. Please check your API key has access to Gemini models. Make sure your API key is valid and has the necessary permissions.'
          : 'মডেল পাওয়া যায়নি। অনুগ্রহ করে আপনার API কী-তে Gemini মডেলগুলির অ্যাক্সেস আছে কিনা পরীক্ষা করুন।';
      } else if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403') || error.status === 401 || error.status === 403) {
        errorMessage = language === 'en'
          ? 'Invalid or unauthorized API key. Please verify your VITE_GEMINI_API_KEY in .env file and ensure billing is enabled on your Google Cloud project.'
          : 'অবৈধ বা অননুমোদিত API কী। অনুগ্রহ করে আপনার .env ফাইলে VITE_GEMINI_API_KEY যাচাই করুন এবং Google Cloud প্রকল্পে বিলিং সক্রিয় আছে কিনা নিশ্চিত করুন।';
      } else if (errorMessage.includes('quota') || errorMessage.includes('429') || error.status === 429) {
        errorMessage = language === 'en'
          ? 'API quota exceeded. Please check your usage limits or enable billing.'
          : 'API কোটা অতিক্রম করেছে। অনুগ্রহ করে আপনার ব্যবহারের সীমা পরীক্ষা করুন বা বিলিং সক্রিয় করুন।';
      } else if (errorMessage.includes('billing') || errorMessage.includes('payment')) {
        errorMessage = language === 'en'
          ? 'Billing not enabled. Please enable billing on your Google Cloud project to use the Gemini API.'
          : 'বিলিং সক্রিয় নেই। Gemini API ব্যবহার করতে অনুগ্রহ করে আপনার Google Cloud প্রকল্পে বিলিং সক্রিয় করুন।';
      } else if (!errorMessage || errorMessage === '') {
        errorMessage = language === 'en'
          ? `Failed to analyze the image. Error: ${error.status || 'Unknown'}. Please check your API key, network connection, and try again.`
          : `ছবি বিশ্লেষণ করতে ব্যর্থ। ত্রুটি: ${error.status || 'অজানা'}। অনুগ্রহ করে আপনার API কী, নেটওয়ার্ক সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।`;
      }
      
      toast({
        title: language === 'en' ? 'Analysis Failed' : 'বিশ্লেষণ ব্যর্থ',
        description: errorMessage,
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
