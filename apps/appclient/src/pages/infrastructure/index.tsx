import { useState, useEffect } from 'react';
import { HardHat, Box, Plus, ShoppingCart, CheckCircle, Trash2, ArrowRight, Loader2, AlertCircle, Send, Filter } from 'lucide-react';
import { infraService, InfraItem, CartItem } from '@/lib/services/infraService';
import { useSearchParams } from 'react-router-dom';

export default function InfraCatalog() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') || 'default-project';

  const [items, setItems] = useState<InfraItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await infraService.getCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  // Fetch catalog
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        setError(null);
        const data = await infraService.getCatalog({ category: selectedCategory });
        setItems(data);
      } catch (err: any) {
        console.error('Failed to fetch catalog:', err);
        setError(err.message || 'Gagal memuat katalog');
      } finally {
        setIsLoadingCatalog(false);
      }
    };

    fetchCatalog();
  }, [selectedCategory]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = infraService.getCart(projectId);
    setCart(savedCart);
  }, [projectId]);

  const handleAddToCart = (item: InfraItem) => {
    const cartItem: CartItem = {
      item_id: item.id,
      quantity: 1,
      unit_price: item.price,
      subtotal: item.price,
    };

    const updatedCart = infraService.addToCart(projectId, cartItem);
    setCart(updatedCart);
  };

  const handleRemoveFromCart = (itemId: string) => {
    const updatedCart = infraService.removeFromCart(projectId, itemId);
    setCart(updatedCart);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
    } else {
      const updatedCart = infraService.updateCartItem(projectId, itemId, quantity);
      setCart(updatedCart);
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    try {
      setIsSubmittingOrder(true);
      setError(null);

      const response = await infraService.createOrder(
        projectId,
        cart,
        `Infra order untuk project ${projectId}`
      );

      if (response.status === 'success') {
        infraService.clearCart(projectId);
        setCart([]);
        setShowCart(false);
        alert('✅ Order berhasil dikirim! Tim Orland akan menghubungi Anda segera.');
      } else {
        setError(response.error || 'Gagal submit order');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal submit order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleClearCart = () => {
    if (confirm('Yakin ingin clear cart?')) {
      infraService.clearCart(projectId);
      setCart([]);
    }
  };

  const cartTotal = infraService.getCartTotal(projectId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      {/* Header with Cart Button */}
      <div className="flex justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HardHat className="text-amber-500" size={24} /> Logistics & Infra
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">Pengadaan kebutuhan fisik event langsung dari vendor mitra Orland.</p>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative p-3 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl shadow-lg transition-all"
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-rose-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-rose-900 dark:text-rose-400">Error</h4>
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        </div>
      )}

      {showCart ? (
        /* Cart View */
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Keranjang Order ({cart.length} item)</h2>

          {cart.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShoppingCart className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500 dark:text-slate-400">Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((cartItem) => {
                const item = items.find((i) => i.id === cartItem.item_id);
                return (
                  <div
                    key={cartItem.item_id}
                    className="p-4 bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">{item?.name || cartItem.item_id}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Rp {cartItem.unit_price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.item_id, cartItem.quantity - 1)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-bold text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={cartItem.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(cartItem.item_id, parseInt(e.target.value) || 0)
                        }
                        className="w-12 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold"
                      />
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.item_id, cartItem.quantity + 1)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Rp {cartItem.subtotal.toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleRemoveFromCart(cartItem.item_id)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 mt-1 ml-auto"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {cart.length > 0 && (
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white">
                <span>Total:</span>
                <span className="text-amber-600 dark:text-amber-400">Rp {cartTotal.toLocaleString()}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCart(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Lanjut Belanja
                </button>
                <button
                  onClick={handleClearCart}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} /> Clear
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmittingOrder}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit Order
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Catalog View */
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === undefined
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300'
              }`}
            >
              <Filter size={14} /> Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          {isLoadingCatalog ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin text-amber-500 mr-2" size={32} />
              <p className="text-slate-500 dark:text-slate-400 font-bold">Memuat katalog...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Box className="mb-4 opacity-20" size={64} />
              <p className="font-bold">Tidak ada item</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-dark-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group flex flex-col"
                >
                  {/* Image */}
                  <div className="h-48 overflow-hidden relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <Box className="text-slate-300 dark:text-slate-600" size={64} />
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md">
                      Rp {item.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">{item.description}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mb-4">
                      {item.vendor_name} • {item.unit}
                    </p>

                    {/* Availability Badge */}
                    <div className="mb-4">
                      {item.availability > 5 ? (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded font-bold">
                          ✓ Tersedia ({item.availability})
                        </span>
                      ) : item.availability > 0 ? (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded font-bold">
                          ⚠ Terbatas ({item.availability})
                        </span>
                      ) : (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 px-2 py-1 rounded font-bold">
                          ✗ Habis
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.availability === 0}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 mt-auto"
                    >
                      <Plus size={14} /> Tambah ke Keranjang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
