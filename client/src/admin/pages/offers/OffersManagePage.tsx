import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  Package,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { offerDealsService, type OfferDealItem, type OfferDealInput } from '../../lib/services/offerDeals.service';
import { listProducts, type ProductListRow } from '../../lib/services/products.service';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { formatCurrency } from '../../lib/format';

const GRADIENT_PRESETS = [
  { label: 'Teal & Emerald', value: 'from-[#0F766E] via-[#059669] to-[#047857]' },
  { label: 'Deep Forest', value: 'from-emerald-700 via-emerald-800 to-green-950' },
  { label: 'Amber & Orange', value: 'from-amber-600 via-orange-600 to-red-700' },
  { label: 'Purple & Indigo', value: 'from-purple-700 via-indigo-700 to-blue-800' },
  { label: 'Rose & Pink', value: 'from-rose-600 via-pink-600 to-red-700' },
];

export default function OffersManagePage() {
  const toast = useToast();
  const confirm = useConfirm();

  const [deals, setDeals] = useState<OfferDealItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Available catalog products for picking
  const [allProducts, setAllProducts] = useState<ProductListRow[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('Flash Deal');
  const [discountLabel, setDiscountLabel] = useState('Up to 50% Off');
  const [bgGradient, setBgGradient] = useState(GRADIENT_PRESETS[0].value);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Product search
  const [productSearch, setProductSearch] = useState('');

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await offerDealsService.list({ pageSize: 50 });
      setDeals(res.rows);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await listProducts({ pageSize: 200, sortBy: 'name', sortDir: 'asc' });
      setAllProducts(res.rows);
    } catch (err) {
      console.error('Failed to load products for offer deals:', err);
    }
  };

  useEffect(() => {
    fetchDeals();
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setBadge('Flash Deal');
    setDiscountLabel('Up to 50% Off');
    setBgGradient(GRADIENT_PRESETS[0].value);
    setSelectedProductIds([]);
    setIsActive(true);
    setProductSearch('');
    setModalOpen(true);
  };

  const openEditModal = (d: OfferDealItem) => {
    setEditingId(d.id || d._id || '');
    setTitle(d.title || '');
    setSubtitle(d.subtitle || '');
    setBadge(d.badge || 'Flash Deal');
    setDiscountLabel(d.discount_label || '');
    setBgGradient(d.bg_gradient || GRADIENT_PRESETS[0].value);
    const pids = (d.product_ids || []).map((p: any) => (typeof p === 'object' ? p._id || p.id : p));
    setSelectedProductIds(pids);
    setIsActive(d.is_active ?? true);
    setProductSearch('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Deal title is required');
      return;
    }

    setModalLoading(true);
    try {
      const payload: OfferDealInput = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        badge: badge.trim() || 'Flash Deal',
        discount_label: discountLabel.trim() || null,
        bg_gradient: bgGradient,
        product_ids: selectedProductIds,
        is_active: isActive,
      };

      if (editingId) {
        await offerDealsService.update(editingId, payload);
        toast.success('Offer deal updated! 🚀');
      } else {
        await offerDealsService.create(payload);
        toast.success('New offer deal created! 🎉');
      }
      setModalOpen(false);
      fetchDeals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save offer deal');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (d: OfferDealItem) => {
    const id = d.id || d._id || '';
    const ok = await confirm({
      title: `Delete offer deal "${d.title}"?`,
      message: 'This campaign will be removed from the customer offers page.',
      confirmLabel: 'Delete Deal',
      danger: true,
    });
    if (!ok) return;

    try {
      await offerDealsService.delete(id);
      toast.success(`Offer deal "${d.title}" deleted`);
      fetchDeals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete offer deal');
    }
  };

  const handleToggleActive = async (d: OfferDealItem) => {
    const id = d.id || d._id || '';
    try {
      await offerDealsService.update(id, { is_active: !d.is_active });
      toast.success(`Deal ${!d.is_active ? 'activated' : 'deactivated'}`);
      fetchDeals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const toggleProduct = (pId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const filteredProducts = allProducts.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">Offers & Deals Corner</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              Frontend Offers Control
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Manage the promotional banners, flash sales, and products shown on the customer Offers page.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Create Offer Deal</span>
        </button>
      </div>

      {/* Deals List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-400">
          Loading offers...
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No offer deals active</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Click "Create Offer Deal" to publish deals to your customer storefront.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700"
          >
            Create Offer Deal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((d) => {
            const count = Array.isArray(d.product_ids) ? d.product_ids.length : 0;
            return (
              <div
                key={d.id || d._id}
                className={`bg-white rounded-3xl border overflow-hidden transition-all flex flex-col justify-between ${
                  d.is_active ? 'border-neutral-200 shadow-xs' : 'border-neutral-200/60 opacity-60'
                }`}
              >
                {/* Banner Preview */}
                <div className={`p-4 sm:p-5 bg-gradient-to-r ${d.bg_gradient || 'from-[#0F766E] to-[#047857]'} text-white relative`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider">
                      {d.badge || 'Flash Deal'}
                    </span>
                    {d.discount_label && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-[10px] font-black uppercase tracking-wider">
                        {d.discount_label}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">{d.title}</h3>
                  {d.subtitle && <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{d.subtitle}</p>}
                </div>

                {/* Footer Controls */}
                <div className="p-4 flex items-center justify-between gap-3 bg-white">
                  <div className="text-xs text-neutral-500">
                    <span className="font-bold text-neutral-800">{count}</span> products assigned
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(d)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        d.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                      }`}
                    >
                      {d.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{d.is_active ? 'Active' : 'Hidden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(d)}
                      className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT OFFER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto flex flex-col border border-neutral-200 animate-in fade-in zoom-in duration-200 max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-neutral-900">
                  {editingId ? 'Edit Offer Deal' : 'Create Offer Deal'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure promotion banner & select products for customer Offers Page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Deal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mega Grocery Bash, Weekend Flash Sale"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Save big on daily essentials with handpicked flash deals"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Flash Deal, Limited Time"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Discount Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Up to 50% Off, Buy 1 Get 1"
                    value={discountLabel}
                    onChange={(e) => setDiscountLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Gradient Presets */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Banner Background</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setBgGradient(g.value)}
                      className={`p-2 rounded-xl border text-xs font-semibold text-white flex items-center justify-between bg-gradient-to-r ${g.value} ${
                        bgGradient === g.value ? 'ring-2 ring-primary-600 ring-offset-1' : ''
                      }`}
                    >
                      <span className="truncate">{g.label}</span>
                      {bgGradient === g.value && <Check size={14} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700">
                    Select Products for this Deal ({selectedProductIds.length} chosen)
                  </label>
                  {selectedProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search products to add to deal..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="border border-neutral-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-neutral-100 p-1">
                  {filteredProducts.map((p) => {
                    const isChosen = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${
                          isChosen ? 'bg-primary-50/70 font-semibold' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={p.image || '/placeholder.png'}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-contain bg-white border border-neutral-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-neutral-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-neutral-400">
                              {p.min_price != null ? formatCurrency(p.min_price) : 'No pack priced yet'}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                            isChosen ? 'bg-primary-600 border-primary-600 text-white' : 'border-neutral-300'
                          }`}
                        >
                          {isChosen && <Check size={13} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <div>
                  <div className="text-xs font-bold text-neutral-800">Active Campaign</div>
                  <div className="text-[11px] text-neutral-500">Show this deal on the customer offers page</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-emerald-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  {modalLoading ? 'Saving...' : editingId ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
