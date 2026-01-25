import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage, convertToBanglaDigits } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Plus, Minus, ShoppingCart, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { products, Product } from '@/data/mockData';
import { supabase } from '@/lib/supabaseClient';

const productTextsBn: Record<
  number,
  {
    name: string;
    size: string;
    tag: string;
    description: string;
    benefits: string[];
    howToUse: string[];
  }
> = {
  1: {
    name: 'কেরা-এন বায়ো-লিকুইড (স্ট্যান্ডার্ড)',
    size: '১ লিটার বোতল',
    tag: 'বেস্ট সেলার',
    description:
      'প্রতিদিনের সবজি ফসলের জন্য নাইট্রোজেন ও অ্যামিনো এসিডের সঠিক সমন্বয়। আপনার সবজির আকার দ্বিগুণ করে।',
    benefits: [
      '২ সপ্তাহে সবজির আকার দ্বিগুণ হয়',
      'জৈব নাইট্রোজেন (১৬%) সমৃদ্ধ',
      'সব ধরনের ঘরের বাগানের ফসলে নিরাপদ',
      'মাটির পানি ধারণ ক্ষমতা বৃদ্ধি করে',
    ],
    howToUse: [
      '১ লিটার পানিতে ৫ মি.লি. (১ ঢাকনা) মিশিয়ে নিন।',
      'সকালে পাতার উপর ভালোভাবে স্প্রে করুন।',
      'প্রতি ৭ দিনে একবার ব্যবহার করুন।',
    ],
  },
  2: {
    name: 'ফসুল গোল্ড (এগ্রো প্যাক)',
    size: '৫ লিটার জেরি ক্যান',
    tag: 'ভ্যালু',
    description:
      'বড় জমির জন্য উচ্চ কার্যকারিতা সম্পন্ন বাল্ক প্যাক। ইউরিয়ার খরচ প্রায় ৩০% পর্যন্ত কমায়। ধান ও গমের জন্য উপযোগী।',
    benefits: [
      'রাসায়নিক ইউরিয়ার খরচ প্রায় ৩০% কমায়',
      'ধানের ফলন উল্লেখযোগ্যভাবে বৃদ্ধি করে',
      'মাটির পিএইচ ভারসাম্য ফিরিয়ে আনে',
      'বড় জমির জন্য সাশ্রয়ী সমাধান',
    ],
    howToUse: [
      '১০ লিটার পানিতে ১০০ মি.লি. মিশিয়ে নিন।',
      'ন্যাপকস্যাক স্প্রেয়ারের মাধ্যমে প্রয়োগ করুন।',
      'গাছের বৃদ্ধির সময় (ভেজিটেটিভ স্টেজ) ব্যবহার করুন।',
    ],
  },
  3: {
    name: 'রুফটপ ব্লুম (আরবান এডিশন)',
    size: '২৫০ মি.লি. স্প্রে বোতল',
    tag: 'প্রিমিয়াম',
    description:
      'ফুল ও ইনডোর গাছের জন্য গন্ধহীন সহজ স্প্রে ফর্মুলা। আপনার ছাদবাগানকে সবসময় টাটকা সবুজ রাখে।',
    benefits: [
      '১০০% গন্ধহীন (ইনডোরে ব্যবহার উপযোগী)',
      'ব্যবহারের জন্য প্রস্তুত, আলাদা মেশানোর দরকার নেই',
      'পাতায় চকচকে ভাব আনে এবং ধুলো দূর করে',
      'ফুলের সংখ্য ও রঙ উজ্জ্বল করে',
    ],
    howToUse: [
      'ব্যবহারের আগে ভালোভাবে ঝাঁকিয়ে নিন।',
      'পাতা ও মাটির উপর সরাসরি স্প্রে করুন।',
      'সপ্তাহে ২ বার ব্যবহার করুন।',
    ],
  },
  4: {
    name: 'টি এস্টেট প্রো (ড্রাম)',
    size: '২০ লিটার ইন্ডাস্ট্রিয়াল ড্রাম',
    tag: 'বি-টু-বি',
    description:
      'চা বাগানের জন্য ইন্ডাস্ট্রিয়াল গ্রেড গ্রোথ বুস্টার। সর্বোচ্চ নাইট্রোজেন গ্রহণ নিশ্চিত করে।',
    benefits: [
      'পাতার আয়তন সর্বোচ্চ পরিমাণে বৃদ্ধি করে',
      'নতুন কুশি গজানো দ্রুত করে',
      'ড্রিপ সেচ ব্যবস্থার সাথে ব্যবহার উপযোগী',
      'বাণিজ্যিক এস্টেটের জন্য বাল্ক দামে পাওয়া যায়',
    ],
    howToUse: [
      'সেচের ট্যাঙ্কে ১:২০০ অনুপাতে মিশিয়ে নিন।',
      'পাতা তোলার পর দ্রুত পুনরুদ্ধারের জন্য ব্যবহার করুন।',
      'হেক্টর প্রতি ডোজের জন্য কৃষিবিদের পরামর্শ নিন।',
    ],
  },
  5: {
    name: 'কেরা-মিনি (ট্রায়াল স্যাশে)',
    size: '১০০ মি.লি. স্যাশে',
    tag: 'ট্রায়াল',
    description:
      'একটি সারির ফসলে ব্যবহার করে নিজেই পার্থক্য দেখুন। অল্প টাকায় দ্রুত ফলাফল।',
    benefits: [
      'কম খরচে ঝুঁকিহীন পরীক্ষামূলক ব্যবহার',
      'প্রায় ১ কাঠা জমির জন্য যথেষ্ট',
      '৭ দিনের মধ্যে সবুজ হয়ে ওঠে',
      'সহজে বহনযোগ্য ছোট প্যাক',
    ],
    howToUse: [
      'স্যাশেট কেটে সম্পূর্ণ তরল বের করুন।',
      '২০ লিটার পানিতে সবটুকু মিশিয়ে নিন।',
      'তৎক্ষণাৎ স্প্রে করে ফেলুন।',
    ],
  },
  6: {
    name: 'স্পাইসি-গ্রো (মরিচ স্পেশাল)',
    size: '৫০০ মি.লি. বোতল',
    tag: 'স্পেশালিটি',
    description:
      'পাতা কুড়িয়ে যাওয়া (কুকড়া রোগ) বন্ধ করে এবং মরিচের ঝাল বাড়ায়। বিশেষ করে শীতকালীন ফসলের জন্য জরুরি।',
    benefits: [
      'পাতা কুড়িয়ে যাওয়া (কুকড়া রোগ) প্রতিরোধ করে',
      'মরিচের ঝাল ও স্বাদ বৃদ্ধি করে',
      'শীতে ফুল ফোটানো বাড়ায়',
      'গাছের শিকড় মজবুত করে',
    ],
    howToUse: [
      '১ লিটার পানিতে ৩ মি.লি. মিশিয়ে নিন।',
      'ফুল আসার শুরুর সময়ে স্প্রে করুন।',
      'পাতার নিচের অংশে বেশি করে স্প্রে করুন।',
    ],
  },
  7: {
    name: 'ব্লুম রিফিল পাউচ',
    size: '৫০০ মি.লি. পাউচ',
    tag: 'ইকো-ফ্রেন্ডলি',
    description:
      'আপনার রুফটপ ব্লুম স্প্রে বোতল আবার ভরতে ব্যবহার করুন। প্লাস্টিক বাঁচান, টাকা বাঁচান।',
    benefits: [
      '৮০% পর্যন্ত কম প্লাস্টিক ব্যবহার হয়',
      'নতুন বোতলের চেয়ে দামে সাশ্রয়ী',
      'সহজে ঢালার জন্য বিশেষ মুখ',
      'একই প্রিমিয়াম ফর্মুলা বজায় থাকে',
    ],
    howToUse: [
      'ব্যবহৃত স্প্রে বোতলের ঢাকনা খুলুন।',
      'পাউচ থেকে ধীরে ধীরে তরল ঢেলে নিন।',
      'অতিরিক্ত পানি মেশানোর প্রয়োজন নেই।',
    ],
  },
  8: {
    name: 'অরচার্ড মাস্টার (ফ্রুট বুস্ট)',
    size: '২ লিটার জার',
    tag: 'ফল কেয়ার',
    description:
      'ঝড়-বৃষ্টিতে ফল ঝরে পড়া কমায়। ফলকে করে আরও মিষ্টি ও চকচকে।',
    benefits: [
      'অকাল ফল ঝরা প্রতিরোধ করে',
      'ফলের মিষ্টত্ব (ব্রিক্স) বৃদ্ধি করে',
      'ফলের ডাঁটি মজবুত করে',
      'ফলের খোসার ফিনিশ উন্নত করে',
    ],
    howToUse: [
      '১০ লিটার পানিতে ৫০ মি.লি. মিশিয়ে নিন।',
      'গাছের গোড়ার চারপাশে মাটিতে ঢেলে দিন (রুট ড্রেঞ্চিং)।',
      'ফল মটর দানার মত আকার ধারণ করলে ব্যবহার করুন।',
    ],
  },
  9: {
    name: 'নার্সারি গ্রিন (প্রো প্যাক)',
    size: '১০ লিটার ক্যান',
    tag: 'প্রো',
    description:
      '২৪ ঘন্টার মধ্যেই চারায় গাঢ় সবুজ রং আনে। দ্রুত বিক্রির জন্য আদর্শ।',
    benefits: [
      '২৪ ঘন্টার মধ্যে তাত্ক্ষণিক সবুজ রঙ আনে',
      'চারা গাছের রোগ প্রতিরোধ ক্ষমতা বাড়ায়',
      'গাছ বিক্রেতাদের জন্য উচ্চ মুনাফা দেয়',
      'স্থানান্তরের ধাক্কা কমায়',
    ],
    howToUse: [
      '১ লিটার পানিতে ২০ মি.লি. মিশিয়ে নিন।',
      'পাতায় ভালোভাবে স্প্রে করুন।',
      'হাটে নেওয়ার ২ দিন আগে ব্যবহার করুন।',
    ],
  },
  10: {
    name: 'লিফি-লাইফ (শাক/পালং)',
    size: '১ লিটার বোতল',
    tag: 'দ্রুত বৃদ্ধি',
    description:
      'পাতাওয়ালা শাকের দ্রুত বৃদ্ধি ও গাঢ় সবুজের জন্য উচ্চ নাইট্রোজেন ফর্মুলা। প্রায় ৫ দিন আগে ফসল তুলতে পারবেন।',
    benefits: [
      'পাতার পরিমাণ ও আকার সর্বোচ্চ করে',
      '৫–৭ দিন আগে ফসল তোলা যায়',
      'পাতা হয় কচি ও সুস্বাদু',
      'হলদে হয়ে যাওয়া প্রতিরোধ করে',
    ],
    howToUse: [
      '১ লিটার পানিতে ৫ মি.লি. মিশিয়ে নিন।',
      'প্রতি ৩ দিনে একবার স্প্রে করুন।',
      'ফসল তোলার ২ দিন আগে স্প্রে বন্ধ করুন।',
    ],
  },
};

const FarmerStore = () => {
  const { t, language } = useLanguage();
  const { items, addToCart, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  const handleCheckout = async () => {
    if (!user?.id || items.length === 0) return;

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        total_amount: totalPrice,
        currency: 'BDT',
      })
      .select('id, total_amount, purchased_at')
      .single();

    if (purchaseError || !purchase) return;

    const itemsPayload = items.map(({ product, quantity }) => ({
      purchase_id: purchase.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
    }));

    const { error: itemsError } = await supabase.from('purchase_items').insert(itemsPayload);
    if (itemsError) return;

    setShowCheckoutSuccess(true);
    clearCart();
    setIsCartOpen(false);
    setTimeout(() => setShowCheckoutSuccess(false), 3000);
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('fertilizerStore')}</h1>
          <p className="text-muted-foreground">
            {language === 'en' ? '100% organic products' : '১০০% জৈব পণ্য'}
          </p>
        </div>
        
        {/* Cart Button */}
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {language === 'en'
                    ? totalItems
                    : convertToBanglaDigits(totalItems)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t('cart')}
              </SheetTitle>
              <SheetDescription>
                {language === 'en' ? 'Your selected items' : 'আপনার নির্বাচিত আইটেম'}
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 overflow-auto py-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {language === 'en' ? 'Your cart is empty' : 'আপনার কার্ট খালি'}
                </div>
              ) : (
                items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-primary font-semibold">
                        {t('bdt')}{' '}
                        {language === 'en'
                          ? product.price.toLocaleString()
                          : convertToBanglaDigits(product.price.toLocaleString())}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-medium">
                        {language === 'en'
                          ? quantity
                          : convertToBanglaDigits(quantity)}
                      </span>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {items.length > 0 && (
              <SheetFooter className="border-t pt-4">
                <div className="w-full space-y-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('total')}</span>
                    <span className="text-primary">
                      {t('bdt')}{' '}
                      {language === 'en'
                        ? totalPrice.toLocaleString()
                        : convertToBanglaDigits(totalPrice.toLocaleString())}
                    </span>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCheckout}>
                    {t('checkout')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card 
              className="shadow-card cursor-pointer hover:shadow-elevated transition-all group overflow-hidden"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {language === 'en'
                    ? product.name
                    : productTextsBn[product.id]?.name || product.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {language === 'en'
                    ? product.size
                    : productTextsBn[product.id]?.size || product.size}{' '}
                  •{' '}
                  {language === 'en'
                    ? product.tag
                    : productTextsBn[product.id]?.tag || product.tag}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">
                    {t('bdt')}{' '}
                    {language === 'en'
                      ? product.price.toLocaleString()
                      : convertToBanglaDigits(product.price.toLocaleString())}
                  </span>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-muted">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <DialogTitle className="text-xl">
                  {language === 'en'
                    ? selectedProduct.name
                    : productTextsBn[selectedProduct.id]?.name || selectedProduct.name}
                </DialogTitle>
                <DialogDescription>
                  {language === 'en'
                    ? selectedProduct.description
                    : productTextsBn[selectedProduct.id]?.description ||
                      selectedProduct.description}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 my-2">
                <span className="text-sm px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {language === 'en'
                    ? selectedProduct.size
                    : productTextsBn[selectedProduct.id]?.size || selectedProduct.size}{' '}
                  •{' '}
                  {language === 'en'
                    ? selectedProduct.tag
                    : productTextsBn[selectedProduct.id]?.tag || selectedProduct.tag}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {t('bdt')} {selectedProduct.price}
                </span>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  {t('benefits')}
                </h4>
                <ul className="space-y-2">
                  {(language === 'en'
                    ? selectedProduct.benefits
                    : productTextsBn[selectedProduct.id]?.benefits ||
                      selectedProduct.benefits
                  ).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to Use */}
              <div>
                <h4 className="font-semibold mb-2">{t('howToUse')}</h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {(language === 'en'
                    ? selectedProduct.howToUse
                    : productTextsBn[selectedProduct.id]?.howToUse ||
                      selectedProduct.howToUse
                  ).map((step, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t('addToCart')}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Success Toast */}
      {showCheckoutSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 bg-success text-white p-4 rounded-xl shadow-elevated flex items-center gap-3 z-50"
        >
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">
              {language === 'en' ? 'Order Placed!' : 'অর্ডার সম্পন্ন!'}
            </p>
            <p className="text-sm text-white/80">
              {language === 'en' ? 'Your order is being processed' : 'আপনার অর্ডার প্রক্রিয়াকরণ করা হচ্ছে'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FarmerStore;
