import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Search,
  Check,
  X,
  Package,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { homeSectionsService, type HomeSectionItem, type HomeSectionInput } from '../../lib/services/homeSections.service';
import { catalogService, type CategoryItem } from '../../lib/services/catalog.service';
import { productsService, type ProductItem } from '../../lib/services/products.service';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';

export default function HomeSectionsPage() {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();

  const [sections, setSections] = useState<HomeSectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Available catalog data for selection
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [sectionType, setSectionType] = useState<'custom_products' | 'category'>('custom_products');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Product Picker Filter
  const [productSearch, setProductSearch] = useState('');

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await homeSectionsService.list({ pageSize: 50 });
      setSections(res.items || []);
    } catch (err: any) {
      showError(err.message || 'Failed to load home sections');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        productsService.list({ pageSize: 200 }),
        catalogService.listCategories(),
      ]);
      setAllProducts(pRes.items || []);
      setAllCategories(cRes || []);
    } catch (err) {
      console.error('Failed to load catalog for section builder:', err);
    }
  };

  useEffect(() => {
    fetchSections();
    loadCatalogData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setBadge('');
    setSectionType('custom_products');
    setCategoryId(allCategories[0]?._id || '');
    setSelectedProductIds([]);
    setIsActive(true);
    setProductSearch('');
    setModalOpen(true);
  };

  const openEditModal = (s: HomeSectionItem) => {
    setEditingId(s.id || s._id || '');
    setTitle(s.title || '');
    setSubtitle(s.subtitle || '');
    setBadge(s.badge || '');
    setSectionType(s.section_type || 'custom_products');
    setCategoryId(typeof s.category_id === 'object' ? s.category_id?._id || '' : s.category_id || '');
    const pids = (s.product_ids || []).map((p: any) => (typeof p === 'object' ? p._id || p.id : p));
    setSelectedProductIds(pids);
    setIsActive(s.is_active ?? true);
    setProductSearch('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showError('Section title is required');
      return;
    }

    if (sectionType === 'custom_products' && selectedProductIds.length === 0) {
      showError('Please select at least 1 product for this section');
      return;
    }

    setModalLoading(true);
    try {
      const payload: HomeSectionInput = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        badge: badge.trim() || null,
        section_type: sectionType,
        category_id: sectionType === 'category' ? categoryId : null,
        product_ids: sectionType === 'custom_products' ? selectedProductIds : [],
        is_active: isActive,
      };

      if (editingId) {
        await homeSectionsService.update(editingId, payload);
        showSuccess('Home section updated successfully! 🚀');
      } else {
        await homeSectionsService.create(payload);
        showSuccess('New home section created! 🎉');
      }
      setModalOpen(false);
      fetchSections();
    } catch (err: any) {
      showError(err.message || 'Failed to save home section');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (s: HomeSectionItem) => {
    const id = s.id || s._id || '';
    const ok = await confirm({
      title: `Delete section "${s.title}"?`,
      message: 'This section will be immediately removed from the storefront home page.',
      confirmLabel: 'Delete Section',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await homeSectionsService.delete(id);
      showSuccess(`Section "${s.title}" deleted`);
      fetchSections();
    } catch (err: any) {
      showError(err.message || 'Failed to delete section');
    }
  };

  const handleToggleActive = async (s: HomeSectionItem) => {
    const id = s.id || s._id || '';
    try {
      await homeSectionsService.update(id, { is_active: !s.is_active });
      showSuccess(`Section ${!s.is_active ? 'enabled' : 'hidden'} on storefront`);
      fetchSections();
    } catch (err: any) {
      showError(err.message || 'Failed to update status');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    setSections(newSections);

    const ids = newSections.map((s) => s.id || s._id || '');
    try {
      await homeSectionsService.reorder(ids);
      showSuccess('Display order updated');
    } catch (err: any) {
      showError(err.message || 'Failed to reorder');
      fetchSections();
    }
  };

  const toggleProductSelection = (pId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const filteredProducts = allProducts.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900">Home Page Sections</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Dynamic Storefront
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Create and organize custom shelves (e.g. "Trending Now", "Daily Essentials", "Snacks") that appear directly on your customer Home Page.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Add New Section</span>
        </button>
      </div>

      {/* Sections List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-400">
          Loading home sections...
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
            <Layers size={24} />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No home sections yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Click "Add New Section" to create your first dynamic shelf for the customer storefront.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700"
          >
            Create First Shelf
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, idx) => {
            const productCount = Array.isArray(s.product_ids) ? s.product_ids.length : 0;
            const categoryName = typeof s.category_id === 'object' ? s.category_id?.name : 'Category';

            return (
              <div
                key={s.id || s._id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  s.is_active ? 'border-neutral-200 shadow-2xs' : 'border-neutral-200/60 opacity-60 bg-neutral-50/50'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Reorder controls */}
                  <div className="flex sm:flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Layers size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-neutral-900 truncate">{s.title}</h3>
                      {s.badge && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide">
                          {s.badge}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {s.is_active ? 'Live on Store' : 'Hidden'}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {s.subtitle || 'Custom home shelf'} •{' '}
                      <span className="font-semibold text-neutral-700">
                        {s.section_type === 'category' ? `Category: ${categoryName}` : `${productCount} Products`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      s.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                    }`}
                  >
                    {s.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{s.is_active ? 'Active' : 'Show'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(s)}
                    className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                    title="Edit Section"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT SECTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto flex flex-col border border-neutral-200 animate-in fade-in zoom-in duration-200 max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-neutral-900">
                  {editingId ? 'Edit Home Section' : 'Create New Home Section'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Configure title and select products to show on the customer home page.
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

            <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Section Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trending Now, Daily Essentials, Snacks"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hot Deal, Best Value, Trending"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Subtitle / Tagline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handpicked daily household items at best price"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              {/* Section Source Type */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                  Products Selection Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSectionType('custom_products')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                      sectionType === 'custom_products'
                        ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Package size={18} className={sectionType === 'custom_products' ? 'text-primary-600' : 'text-neutral-400'} />
                    <div>
                      <div className="text-xs font-bold">Pick Specific Products</div>
                      <div className="text-[11px] text-neutral-500 font-normal">Choose exact items from catalog</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSectionType('category')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                      sectionType === 'category'
                        ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Layers size={18} className={sectionType === 'category' ? 'text-primary-600' : 'text-neutral-400'} />
                    <div>
                      <div className="text-xs font-bold">Entire Category</div>
                      <div className="text-[11px] text-neutral-500 font-normal">Auto-load all items in category</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* If Category Selected */}
              {sectionType === 'category' && (
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Select Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    {allCategories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If Specific Products Selected */}
              {sectionType === 'custom_products' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-700">
                      Select Products ({selectedProductIds.length} chosen)
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

                  {/* Search filter */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search by product name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  {/* Product items scroll area */}
                  <div className="border border-neutral-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-neutral-100 p-1">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-400">No products match search.</div>
                    ) : (
                      filteredProducts.map((p) => {
                        const isChosen = selectedProductIds.includes(p._id);
                        return (
                          <div
                            key={p._id}
                            onClick={() => toggleProductSelection(p._id)}
                            className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${
                              isChosen ? 'bg-primary-50/70 font-semibold' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={p.image || '/placeholder.png'}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-contain bg-white border border-neutral-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs text-neutral-800 truncate">{p.name}</p>
                                <p className="text-[10px] text-neutral-400">₹{p.price}</p>
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
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <div>
                  <div className="text-xs font-bold text-neutral-800">Active on Storefront</div>
                  <div className="text-[11px] text-neutral-500">Enable or disable this shelf without deleting it</div>
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

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
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
                  {modalLoading ? 'Saving...' : editingId ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
