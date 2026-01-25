import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={language === 'en' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
        EN
      </span>
      <Switch
        checked={language === 'bn'}
        onCheckedChange={(checked) => setLanguage(checked ? 'bn' : 'en')}
        className="data-[state=checked]:bg-primary"
      />
      <span className={language === 'bn' ? 'font-semibold text-foreground font-bengali' : 'text-muted-foreground'}>
        বাংলা
      </span>
    </div>
  );
};
