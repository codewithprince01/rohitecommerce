import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import FormField, { Input, Textarea, Select, Switch } from '../../components/ui/FormField';
import ImageUrlInput from '../../components/ui/ImageUrlInput';
import { useToast } from '../../hooks/useToast';
import {
  allCategories,
  allSubcategories,
  allBrands,
} from '../../lib/services/catalog.service';
import {
  createProduct,
  updateProduct,
  getProduct,
  type ProductListRow,
  type ProductVariant,
} from '../../lib/services/products.service';
import type { Category, Subcategory, Brand } from '../../lib/services/catalog.service';

interface ProductFormProps {
  open: boolean;
  product: ProductListRow | null;
  onClose: () => void;
  onSaved: () => void;
}

type VariantDraft = Partial<ProductVariant> & { _key: string };

const blankVariant = (): VariantDraft => ({
  _key: Math.random().toString(36).slice(2),
  quantity: '',
  price: 0,
  original_price: 0,
  discount: 0,
  stock: 0,
  is_available: true,
});

export default function ProductForm({ open, product, onClose, onSaved }: ProductFormProps) {
  const toast = useToast();
  const isEdit = !!product;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [variants, setVariants] = useState<VariantDraft[]>([blankVariant()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Load categories once when opened.
  useEffect(() => {
    if (!open) return;
    allCategories().then(setCategories).catch(() => undefined);
  }, [open]);

  // Hydrate form for edit / reset for create.
  useEffect(() => {
    if (!open) return;
    if (product) {
      getProduct(product.id).then((full) => {
        const p = full ?? product;
        setName(p.name);
        setDescription(p.description ?? '');
        setImage(p.image ?? '');
        setTags((p.tags ?? []).join(', '));
        setCategoryId(p.category_id);
        setSubcategoryId(p.subcategory_id);
        setBrandId(p.brand_id);
        setIsAvailable(p.is_available);
        setVariants(
          (p.variants ?? []).length
            ? (p.variants ?? []).map((v) => ({ ...v, _key: v.id }))
            : [blankVariant()]
        );
      });
    } else {
      setName('');
      setDescription('');
      setImage('');
      setTags('');
      setCategoryId('');
      setSubcategoryId('');
      setBrandId('');
      setIsAvailable(true);
      setVariants([blankVariant()]);
    }
    setErrors({});
  }, [open, product]);

  // Cascade: load subcategories when category changes.
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    allSubcategories(categoryId).then(setSubcategories).catch(() => undefined);
  }, [categoryId]);

  // Cascade: load brands when subcategory changes.
  useEffect(() => {
    if (!subcategoryId) {
      setBrands([]);
      return;
    }
    allBrands(subcategoryId).then(setBrands).catch(() => undefined);
  }, [subcategoryId]);

  const updateVariant = useCallback((key: string, patch: Partial<VariantDraft>) => {
    setVariants((vs) => vs.map((v) => (v._key === key ? { ...v, ...patch } : v)));
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!categoryId) e.categoryId = 'Select a category';
    if (!subcategoryId) e.subcategoryId = 'Select a subcategory';
    if (!brandId) e.brandId = 'Select a brand';
    if (!variants.length) e.variants = 'Add at least one variant';
    variants.forEach((v) => {
      if (!v.quantity?.toString().trim() || Number(v.price) <= 0) {
        e.variants = 'Each variant needs a quantity label and a price';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        image: image.trim() || null,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        brand_id: brandId,
        is_available: isAvailable,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const variantPayload = variants.map((v) => ({
        id: v.id,
        quantity: v.quantity,
        price: Number(v.price),
        original_price: Number(v.original_price || v.price),
        discount: Number(v.discount || 0),
        stock: Number(v.stock || 0),
        is_available: v.is_available ?? true,
      }));

      if (isEdit && product) {
        await updateProduct(product.id, input, variantPayload);
        toast.success('Product updated');
      } else {
        await createProduct(input, variantPayload);
        toast.success('Product created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'New Product'}
      subtitle={isEdit ? product?.name : 'Add a product with one or more pack sizes'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Product name" required error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic Salted Chips" />
        </FormField>

        <FormField label="Image URL">
          <ImageUrlInput value={image} onChange={setImage} />
        </FormField>

        <FormField label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description…" />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Category" required error={errors.categoryId}>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId('');
                setBrandId('');
              }}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Subcategory" required error={errors.subcategoryId}>
            <Select
              value={subcategoryId}
              onChange={(e) => {
                setSubcategoryId(e.target.value);
                setBrandId('');
              }}
              disabled={!categoryId}
            >
              <option value="">Select…</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Brand" required error={errors.brandId}>
            <Select value={brandId} onChange={(e) => setBrandId(e.target.value)} disabled={!subcategoryId}>
              <option value="">Select…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Tags" hint="Comma separated, e.g. bestseller, new">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="bestseller, organic" />
        </FormField>

        <div className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-neutral-700">Available for sale</p>
            <p className="text-xs text-neutral-400">Hidden products won't show on the storefront</p>
          </div>
          <Switch checked={isAvailable} onChange={setIsAvailable} />
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-neutral-700">Variants (pack sizes)</label>
            <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setVariants((v) => [...v, blankVariant()])}>
              Add
            </Button>
          </div>
          {errors.variants && <p className="text-xs text-rose-500 mb-2">{errors.variants}</p>}

          <div className="space-y-3">
            {variants.map((v) => (
              <div key={v._key} className="border border-neutral-200 rounded-xl p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <FormField label="Qty label">
                    <Input value={v.quantity ?? ''} onChange={(e) => updateVariant(v._key, { quantity: e.target.value })} placeholder="500g" />
                  </FormField>
                  <FormField label="Price ₹">
                    <Input type="number" value={v.price ?? 0} onChange={(e) => updateVariant(v._key, { price: Number(e.target.value) })} />
                  </FormField>
                  <FormField label="MRP ₹">
                    <Input type="number" value={v.original_price ?? 0} onChange={(e) => updateVariant(v._key, { original_price: Number(e.target.value) })} />
                  </FormField>
                  <FormField label="Discount %">
                    <Input type="number" value={v.discount ?? 0} onChange={(e) => updateVariant(v._key, { discount: Number(e.target.value) })} />
                  </FormField>
                  <FormField label="Stock">
                    <Input type="number" value={v.stock ?? 0} onChange={(e) => updateVariant(v._key, { stock: Number(e.target.value) })} />
                  </FormField>
                  <div className="flex items-end justify-between pb-2">
                    <Switch checked={v.is_available ?? true} onChange={(c) => updateVariant(v._key, { is_available: c })} label="On" />
                    <button
                      onClick={() => setVariants((vs) => (vs.length > 1 ? vs.filter((x) => x._key !== v._key) : vs))}
                      className="text-rose-500 hover:text-rose-600 p-1"
                      aria-label="Remove variant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
