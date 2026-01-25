import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useLanguage, convertToBanglaDigits } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { products } from '@/data/mockData';

type CropType =
  | 'rice'
  | 'vegetables'
  | 'fruits'
  | 'flowers'
  | 'tea'
  | 'spices'
  | 'leafy';

type LandUnit = 'decimal' | 'kathaa' | 'bigha' | 'acre' | 'hectare';

interface CropConfig {
  ratePerDecimal: number; // ml per decimal
  nameEn: string;
  nameBn: string;
  productId: number;
}

const cropConfigs: Record<CropType, CropConfig> = {
  rice: {
    ratePerDecimal: 50,
    nameEn: 'Rice (Paddy)',
    nameBn: 'ধান',
    productId: 2, // Foshul Gold (Agro Pack)
  },
  vegetables: {
    ratePerDecimal: 60,
    nameEn: 'Vegetables',
    nameBn: 'শাকসবজি',
    productId: 1, // Kera-N Bio-Liquid
  },
  fruits: {
    ratePerDecimal: 120,
    nameEn: 'Fruits',
    nameBn: 'ফল',
    productId: 8, // Orchard Master
  },
  flowers: {
    ratePerDecimal: 30,
    nameEn: 'Flowers',
    nameBn: 'ফুল',
    productId: 3, // Rooftop Bloom
  },
  tea: {
    ratePerDecimal: 200,
    nameEn: 'Tea',
    nameBn: 'চা',
    productId: 4, // Tea Estate Pro
  },
  spices: {
    ratePerDecimal: 50,
    nameEn: 'Chili / Spices',
    nameBn: 'মরিচ / মসলা',
    productId: 6, // Spicy-Gro
  },
  leafy: {
    ratePerDecimal: 40,
    nameEn: 'Leafy Greens',
    nameBn: 'পাতাওয়ালা শাক',
    productId: 10, // Leafy-Life
  },
};

const unitConversions: Record<LandUnit, number> = {
  decimal: 1,
  kathaa: 1.65,
  bigha: 33,
  acre: 100,
  hectare: 247,
};

const CropCalculator = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [cropType, setCropType] = useState<CropType>('rice');
  const [landUnit, setLandUnit] = useState<LandUnit>('decimal');
  const [landSize, setLandSize] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [recommendedProductId, setRecommendedProductId] = useState<number | null>(null);

  const calculateDosage = () => {
    const size = parseFloat(landSize);
    if (!size || size <= 0) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description: language === 'en' ? 'Please enter a valid land size' : 'অনুগ্রহ করে একটি বৈধ জমির আকার লিখুন',
        variant: 'destructive',
      });
      return;
    }

    const crop = cropConfigs[cropType];
    const conversionFactor = unitConversions[landUnit];
    
    // Convert land size to decimals
    const sizeInDecimals = size * conversionFactor;

    // Calculate dosage in ml (per-decimal rate)
    const dosageInMl = sizeInDecimals * crop.ratePerDecimal;

    // Convert to liters (1 liter = 1000 ml)
    const dosageInLiters = dosageInMl / 1000;

    setResult(dosageInLiters);
    setRecommendedProductId(crop.productId);
    setShowResult(true);
  };

  const handleAddToCart = () => {
    if (!result || !recommendedProductId) return;

    const product = products.find(p => p.id === recommendedProductId);
    if (!product) {
      toast({
        title: language === 'en' ? 'Error' : 'ত্রুটি',
        description:
          language === 'en'
            ? 'Recommended product not found in store.'
            : 'স্টোরে প্রস্তাবিত পণ্যটি পাওয়া যায়নি।',
        variant: 'destructive',
      });
      return;
    }

    addToCart(product);

    toast({
      title: language === 'en' ? 'Added to cart' : 'কার্টে যোগ হয়েছে',
      description:
        language === 'en'
          ? `${product.name} added to cart (approx. ${result.toFixed(2)} L required).`
          : `${product.name} কার্টে যোগ হয়েছে (প্রায় ${result.toFixed(2)} লিটার প্রয়োজন)।`,
    });
  };

  const cropOptions = [
    { value: 'rice', labelEn: 'Rice (Paddy)', labelBn: 'ধান' },
    { value: 'vegetables', labelEn: 'Vegetables', labelBn: 'শাকসবজি' },
    { value: 'fruits', labelEn: 'Fruits', labelBn: 'ফল' },
    { value: 'flowers', labelEn: 'Flowers', labelBn: 'ফুল' },
    { value: 'tea', labelEn: 'Tea', labelBn: 'চা' },
    { value: 'spices', labelEn: 'Chili / Spices', labelBn: 'মরিচ / মসলা' },
    { value: 'leafy', labelEn: 'Leafy Greens', labelBn: 'পাতাওয়ালা শাক' },
  ] as const;

  const unitOptions = [
    { value: 'decimal', labelEn: 'Decimal', labelBn: 'ডেসিমাল' },
    { value: 'kathaa', labelEn: 'Kathaa', labelBn: 'কাঠা' },
    { value: 'bigha', labelEn: 'Bigha', labelBn: 'বিঘা' },
    { value: 'acre', labelEn: 'Acre', labelBn: 'একর' },
    { value: 'hectare', labelEn: 'Hectare', labelBn: 'হেক্টর' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex h-16 w-16 rounded-2xl gradient-primary items-center justify-center mb-4 shadow-glow">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {language === 'en' ? 'Crop Calculator' : 'ফসল ক্যালকুলেটর'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'Calculate the exact fertilizer dosage for your crops' 
              : 'আপনার ফসলের জন্য সঠিক সারের মাত্রা গণনা করুন'}
          </p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Enter Your Details' : 'আপনার বিবরণ লিখুন'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Crop Type */}
              <div className="space-y-2">
                <Label htmlFor="cropType">
                  {language === 'en' ? 'Crop Type' : 'ফসলের ধরন'}
                </Label>
                <Select value={cropType} onValueChange={(value) => setCropType(value as CropType)}>
                  <SelectTrigger id="cropType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cropOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {language === 'en' ? option.labelEn : option.labelBn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Land Unit */}
              <div className="space-y-2">
                <Label htmlFor="landUnit">
                  {language === 'en' ? 'Land Unit' : 'জমির একক'}
                </Label>
                <Select value={landUnit} onValueChange={(value) => setLandUnit(value as LandUnit)}>
                  <SelectTrigger id="landUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {language === 'en' ? option.labelEn : option.labelBn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Land Size */}
              <div className="space-y-2">
                <Label htmlFor="landSize">
                  {language === 'en' ? 'Land Size' : 'জমির আকার'}
                </Label>
                <Input
                  id="landSize"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={language === 'en' ? 'Enter land size' : 'জমির আকার লিখুন'}
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                />
              </div>

              {/* Calculate Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={calculateDosage}
              >
                <Calculator className="mr-2 h-5 w-5" />
                {language === 'en' ? 'Calculate Dosage' : 'মাত্রা গণনা করুন'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Result Card */}
        {showResult && result !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card className="shadow-elevated bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="inline-flex h-16 w-16 rounded-full bg-primary/20 items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {language === 'en' ? 'You need' : 'আপনার প্রয়োজন'}
                </h2>
                <div className="text-5xl font-bold text-primary mb-4">
                  {language === 'en'
                    ? result.toFixed(2)
                    : convertToBanglaDigits(result.toFixed(2))}{' '}
                  {language === 'en' ? 'Liters' : 'লিটার'}
                </div>

                {/* Recommended Product */}
                {recommendedProductId && (
                  (() => {
                    const product = products.find(p => p.id === recommendedProductId);
                    if (!product) return null;

                    const crop = cropConfigs[cropType];

                    return (
                      <div className="mb-6 p-4 rounded-xl bg-white/70 flex items-center gap-4 text-left">
                        <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">
                            {language === 'en'
                              ? `Recommended for ${crop.nameEn}`
                              : `${crop.nameBn} এর জন্য প্রয়োজনীয়`}
                          </p>
                          <p className="font-semibold text-foreground">{product.name}</p>
                          <p className="text-sm text-primary font-bold mt-1">
                            BDT{' '}
                            {language === 'en'
                              ? product.price.toLocaleString()
                              : convertToBanglaDigits(product.price.toLocaleString())}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {language === 'en' 
                    ? 'Add recommended product to cart' 
                    : 'প্রস্তাবিত পণ্যটি কার্টে যোগ করুন'}
                </Button>
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
                  ? '💡 Tip: This calculator provides recommended dosages. Adjust based on soil conditions and crop requirements.'
                  : '💡 টিপ: এই ক্যালকুলেটর সুপারিশকৃত মাত্রা প্রদান করে। মাটির অবস্থা এবং ফসলের প্রয়োজন অনুযায়ী সামঞ্জস্য করুন।'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CropCalculator;

