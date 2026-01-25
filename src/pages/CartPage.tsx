import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage, convertToBanglaDigits } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Package, CheckCircle, Trash2, Plus, Minus, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabaseClient';

interface PurchaseHistory {
  id: string;
  date: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
  total: number;
}

const CartPage = () => {
  const { language } = useLanguage();
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [activeTab, setActiveTab] = useState('cart');

  // Load purchase history from Supabase for the logged-in user
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('purchases')
        .select('id, total_amount, purchased_at, purchase_items (product_name, quantity, unit_price)')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error || !data) return;

      const mapped: PurchaseHistory[] = data.map((purchase: any) => ({
        id: purchase.id,
        date: purchase.purchased_at ? new Date(purchase.purchased_at).toISOString().split('T')[0] : '',
        items: (purchase.purchase_items || []).map((item: any) => ({
          productName: item.product_name,
          quantity: item.quantity,
          price: Number(item.unit_price) || 0,
        })),
        total: Number(purchase.total_amount) || 0,
      }));

      setPurchaseHistory(mapped);
    };

    fetchHistory();
  }, [user?.id, language]);

  const handleCheckout = async () => {
    if (!user?.id || items.length === 0) return;

    // Create purchase record
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

    // Create purchase items
    const itemsPayload = items.map(item => ({
      purchase_id: purchase.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
    }));

    const { error: itemsError } = await supabase.from('purchase_items').insert(itemsPayload);
    if (itemsError) return;

    // Map to local history format and update state
    const newHistoryEntry: PurchaseHistory = {
      id: purchase.id,
      date: purchase.purchased_at ? new Date(purchase.purchased_at).toISOString().split('T')[0] : '',
      items: itemsPayload.map(item => ({
        productName: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      total: Number(purchase.total_amount) || 0,
    };

    setPurchaseHistory(current => [newHistoryEntry, ...current]);
    clearCart();
    setActiveTab('history');
  };

  const totalSpent = purchaseHistory.reduce((sum, purchase) => sum + purchase.total, 0);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'en' ? 'Cart' : 'কার্ট'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'en' ? 'Manage your cart and view purchase history' : 'আপনার কার্ট পরিচালনা করুন এবং ক্রয় ইতিহাস দেখুন'}
        </p>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Total Spent' : 'মোট খরচ'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ৳
                    {language === 'en'
                      ? totalSpent.toLocaleString()
                      : convertToBanglaDigits(totalSpent.toLocaleString())}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Total Orders' : 'মোট অর্ডার'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {language === 'en'
                    ? purchaseHistory.length
                    : convertToBanglaDigits(purchaseHistory.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="cart" className="flex-1">
            {language === 'en' ? 'Cart' : 'কার্ট'} (
            {language === 'en'
              ? items.length
              : convertToBanglaDigits(items.length)}
            )
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            {language === 'en' ? 'Purchase History' : 'ক্রয় ইতিহাস'} (
            {language === 'en'
              ? purchaseHistory.length
              : convertToBanglaDigits(purchaseHistory.length)}
            )
          </TabsTrigger>
        </TabsList>

        {/* Cart Tab */}
        <TabsContent value="cart" className="space-y-4 mt-4">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {language === 'en' ? 'Your cart is empty' : 'আপনার কার্ট খালি'}
              </p>
            </motion.div>
          ) : (
            <>
              {items.map((item, index) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-primary font-semibold">
                            ৳
                            {language === 'en'
                              ? item.product.price.toLocaleString()
                              : convertToBanglaDigits(item.product.price.toLocaleString())}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 border rounded-lg">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {language === 'en'
                                ? item.quantity
                                : convertToBanglaDigits(item.quantity)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Checkout Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * items.length }}
              >
                <Card className="shadow-elevated">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">
                        {language === 'en' ? 'Total' : 'মোট'}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        ৳
                        {language === 'en'
                          ? totalPrice.toLocaleString()
                          : convertToBanglaDigits(totalPrice.toLocaleString())}
                      </span>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleCheckout}>
                      {language === 'en' ? 'Checkout' : 'চেকআউট'}
                      <CheckCircle className="ml-2 h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </TabsContent>

        {/* Purchase History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {purchaseHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {language === 'en' ? 'No purchase history yet' : 'এখনো কোনো ক্রয় ইতিহাস নেই'}
              </p>
            </motion.div>
          ) : (
            purchaseHistory.map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="font-semibold">
                            {language === 'en' ? 'Order Completed' : 'অর্ডার সম্পন্ন'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en'
                            ? purchase.date
                            : convertToBanglaDigits(purchase.date)}
                        </p>
                      </div>
                      <Badge className="bg-success/10 text-success">
                        ৳
                        {language === 'en'
                          ? purchase.total.toLocaleString()
                          : convertToBanglaDigits(purchase.total.toLocaleString())}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {purchase.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.productName} ×{' '}
                            {language === 'en'
                              ? item.quantity
                              : convertToBanglaDigits(item.quantity)}
                          </span>
                          <span className="font-medium">
                            ৳
                            {language === 'en'
                              ? (item.price * item.quantity).toLocaleString()
                              : convertToBanglaDigits(
                                  (item.price * item.quantity).toLocaleString(),
                                )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CartPage;

