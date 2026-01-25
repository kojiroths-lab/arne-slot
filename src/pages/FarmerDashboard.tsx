import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingBag, Package, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FarmerDashboard = () => {
  const { language } = useLanguage();

  const orders = [
    { id: 1, product: 'Organic Hair Fertilizer 1L', status: 'delivered', date: '2024-01-18' },
    { id: 2, product: 'Compost Power Pack', status: 'in_transit', date: '2024-01-20' },
  ];

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'en' ? 'Your Orders' : 'আপনার অর্ডার'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Track your fertilizer orders' : 'আপনার সার অর্ডার ট্র্যাক করুন'}
        </p>
      </motion.div>

      <div className="space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{order.product}</h3>
                    <p className="text-sm text-muted-foreground">{order.date}</p>
                  </div>
                  <Badge 
                    variant={order.status === 'delivered' ? 'default' : 'secondary'}
                    className={order.status === 'delivered' ? 'bg-success' : ''}
                  >
                    {order.status === 'delivered' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {order.status === 'delivered' 
                      ? (language === 'en' ? 'Delivered' : 'বিতরণ করা হয়েছে')
                      : (language === 'en' ? 'In Transit' : 'ট্রানজিটে')
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'No orders yet' : 'এখনো কোনো অর্ডার নেই'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
