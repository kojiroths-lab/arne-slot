import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Truck, Droplets, FlaskConical, Scale, Sprout } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';

interface ProcessStep {
  icon: typeof Truck;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  color: string;
}

const ProcessPage = () => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const steps: ProcessStep[] = [
    {
      icon: Truck,
      titleEn: 'Logistics',
      titleBn: 'লজিস্টিক',
      subtitleEn: 'Segregated Collection',
      subtitleBn: 'বিভক্ত সংগ্রহ',
      descriptionEn: 'Collecting pure human hair waste, separating it from trash at the salon source to ensure 99% keratin purity.',
      descriptionBn: 'খাঁটি মানব চুল বর্জ্য সংগ্রহ করা, সেলুন উৎসে আবর্জনা থেকে আলাদা করে ৯৯% কেরাটিন বিশুদ্ধতা নিশ্চিত করা।',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Droplets,
      titleEn: 'Purification',
      titleBn: 'পরিশোধন',
      subtitleEn: 'Decontamination',
      subtitleBn: 'অপবিত্রতা দূরীকরণ',
      descriptionEn: 'Hair is washed to remove oils and dust, preparing the protein structure for reaction.',
      descriptionBn: 'চুল ধোয়া হয় তেল এবং ধুলো অপসারণের জন্য, প্রতিক্রিয়ার জন্য প্রোটিন কাঠামো প্রস্তুত করা।',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      icon: FlaskConical,
      titleEn: 'The Breakdown',
      titleBn: 'বিভাজন',
      subtitleEn: 'Alkaline Hydrolysis',
      subtitleBn: 'ক্ষারীয় হাইড্রোলাইসিস',
      descriptionEn: 'Using Sodium Hydroxide (NaOH) and heat, we break the tough Keratin peptide bonds into liquid Amino Acids in just 6 hours.',
      descriptionBn: 'সোডিয়াম হাইড্রক্সাইড (NaOH) এবং তাপ ব্যবহার করে, আমরা কঠিন কেরাটিন পেপটাইড বন্ধনকে তরল অ্যামিনো অ্যাসিডে ভেঙে ফেলি মাত্র ৬ ঘন্টায়।',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Scale,
      titleEn: 'Bio-Correction',
      titleBn: 'জৈব সংশোধন',
      subtitleEn: 'Phosphoric Neutralization',
      subtitleBn: 'ফসফরিক নিরপেক্ষকরণ',
      descriptionEn: 'We neutralize the high pH using Phosphoric Acid. This stabilizes the liquid and adds essential Phosphorus (P) to the Nitrogen (N).',
      descriptionBn: 'আমরা ফসফরিক অ্যাসিড ব্যবহার করে উচ্চ pH নিরপেক্ষ করি। এটি তরলকে স্থিতিশীল করে এবং নাইট্রোজেন (N) এর সাথে প্রয়োজনীয় ফসফরাস (P) যোগ করে।',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Sprout,
      titleEn: 'The Final Product',
      titleBn: 'চূড়ান্ত পণ্য',
      subtitleEn: 'Chelation & Bottling',
      subtitleBn: 'চিলেশন এবং বোতলজাতকরণ',
      descriptionEn: 'The result is a pH-neutral, amino-acid-rich bio-stimulant that plants can absorb instantly.',
      descriptionBn: 'ফলাফল হল একটি pH-নিরপেক্ষ, অ্যামিনো অ্যাসিড সমৃদ্ধ জৈব উদ্দীপক যা গাছগুলি তাত্ক্ষণিকভাবে শোষণ করতে পারে।',
      color: 'from-green-500 to-green-600',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const scrollTop = window.scrollY;
      const containerTop = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;
      
      const start = containerTop - windowHeight;
      const end = containerTop + containerHeight - windowHeight;
      const progress = Math.max(0, Math.min(1, (scrollTop - start) / (end - start)));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lineHeight = scrollProgress * 100;

  return (
    <div className="min-h-screen bg-white py-12 px-4" ref={containerRef}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {language === 'en' ? 'The Science' : 'বিজ্ঞান'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {language === 'en' 
              ? 'From Hair Waste to Plant Nutrition' 
              : 'চুল বর্জ্য থেকে উদ্ভিদ পুষ্টি'}
          </p>
        </motion.div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-muted -translate-x-1/2">
            {/* Animated Fill */}
            <motion.div
              className="absolute top-0 left-0 w-full bg-primary origin-top"
              style={{ height: `${lineHeight}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-24">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative flex items-center gap-8 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Icon Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>

                  {/* Content Card */}
                  <motion.div
                    className={`flex-1 ${isEven ? 'md:text-left' : 'md:text-right'} text-left`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Card className="shadow-elevated border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Special animation for Flask */}
                          {step.icon === FlaskConical && (
                            <motion.div
                              animate={{
                                y: [0, -5, 0],
                                rotate: [0, 2, -2, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                              className="flex-shrink-0"
                            >
                              <div className="relative">
                                <FlaskConical className={`h-12 w-12 text-purple-600`} />
                                {/* Bubbles */}
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-purple-400 rounded-full"
                                    style={{
                                      left: `${20 + i * 10}%`,
                                      bottom: `${30 + i * 15}%`,
                                    }}
                                    animate={{
                                      y: [0, -20, -40],
                                      opacity: [0.8, 0.5, 0],
                                    }}
                                    transition={{
                                      duration: 1.5,
                                      repeat: Infinity,
                                      delay: i * 0.3,
                                      ease: 'easeOut',
                                    }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                          
                          {step.icon !== FlaskConical && (
                            <div className={`flex-shrink-0 ${isEven ? '' : 'md:order-2'}`}>
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          )}

                          <div className={`flex-1 ${isEven ? '' : 'md:text-right'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                {index + 1}
                              </span>
                              <h3 className="text-lg font-bold text-foreground">
                                {language === 'en' ? step.titleEn : step.titleBn}
                              </h3>
                            </div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                              {language === 'en' ? step.subtitleEn : step.subtitleBn}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {language === 'en' ? step.descriptionEn : step.descriptionBn}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-24 text-center"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
            <CardContent className="p-8">
              <Sprout className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {language === 'en' ? 'Sustainable Innovation' : 'টেকসই উদ্ভাবন'}
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {language === 'en'
                  ? 'Our scientific process transforms waste into valuable nutrients, creating a circular economy that benefits both salons and farmers while protecting the environment.'
                  : 'আমাদের বৈজ্ঞানিক প্রক্রিয়া বর্জ্যকে মূল্যবান পুষ্টিতে রূপান্তর করে, একটি চক্রাকার অর্থনীতি তৈরি করে যা সেলুন এবং কৃষক উভয়কেই উপকৃত করে এবং পরিবেশ রক্ষা করে।'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProcessPage;

