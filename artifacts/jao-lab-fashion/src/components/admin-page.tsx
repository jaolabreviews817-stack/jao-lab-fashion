import { useEffect, useMemo, useState } from 'react';
import { Check, ImagePlus, Loader2, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { useGetAdminSummary } from '@workspace/api-client-react';

type AdminTab = 'overview' | 'products' | 'orders' | 'customers' | 'payments' | 'settings';
type AdminProduct = Product & { categoryId?: string };

const emptyProduct = {
  id: '', name: '', description: '', categoryId: 'women', subcategory: '', price: 0, compareAtPrice: '',
  sizes: '', colors: '', stock: 0, tags: '', imageUrls: '', featured: false, newest: false,
  trending: false, installmentAvailable: false, installmentAmount: '',
};

function api<T>(path: string, options?: RequestInit) {
  return customFetch<T>(`/api${path}`, options);
}

function AccessDenied() {
  return <div className="mx-auto max-w-xl py-24 text-center"><ShieldAlert className="mx-auto text-accent" size={32} /><h1 className="mt-5 font-display text-5xl">Private studio.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your account is signed in, but it does not have an administrator role. Set <strong>profiles.role</strong> to <strong>admin</strong> for the studio operator in Supabase.</p></div>;
}

export function AdminPage() {
  const summary = useGetAdminSummary();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...emptyProduct });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (summary.isError) setError('ADMIN_ACCESS_DENIED');
  }, [summary.isError]);
  useEffect(() => {
    if (tab === 'products') void api<AdminProduct[]>('/admin/products').then(setProducts).catch(() => setError('Unable to load products.'));
    if (tab === 'orders') void api<any[]>('/admin/orders').then(setOrders).catch(() => setError('Unable to load orders.'));
    if (tab === 'customers') void api<any[]>('/admin/customers').then(setCustomers).catch(() => setError('Unable to load customers.'));
    if (tab === 'payments') void api<any[]>('/admin/payments').then(setPayments).catch(() => setError('Unable to load payments.'));
    if (tab === 'settings') void api<any[]>('/admin/payment-methods').then(setMethods).catch(() => setError('Unable to load payment methods.'));
  }, [tab]);

  const stats = summary.data ? [['Revenue', `₦${Math.round(summary.data.revenue).toLocaleString('en-NG')}`], ['Pending orders', summary.data.pendingOrders], ['Customers', summary.data.customers], ['Low stock', summary.data.lowStock]] : [];
  const productPayload = useMemo(() => ({
    ...form,
    price: Number(form.price),
    compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
    installmentAmount: form.installmentAmount ? Number(form.installmentAmount) : null,
    stock: Number(form.stock),
    sizes: form.sizes.split(',').map((value) => value.trim()).filter(Boolean),
    colors: form.colors.split(',').map((value) => value.trim()).filter(Boolean),
    tags: form.tags.split(',').map((value) => value.trim()).filter(Boolean),
    imageUrls: form.imageUrls.split('\n').map((value) => value.trim()).filter(Boolean),
  }), [form]);
  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api(`/admin/products${editing ? `/${form.id}` : ''}`, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(productPayload), headers: { 'content-type': 'application/json' } });
      setForm({ ...emptyProduct }); setEditing(false);
      setProducts(await api<AdminProduct[]>('/admin/products'));
    } catch { setError('Unable to save this product.'); }
  };
  const removeProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api(`/admin/products/${id}`, { method: 'DELETE' }); setProducts(products.filter((product) => product.id !== id)); } catch { setError('Unable to delete this product.'); }
  };
  const updateOrder = async (id: string, status: string) => {
    try { await api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }), headers: { 'content-type': 'application/json' } }); setOrders(orders.map((order) => order.id === id ? { ...order, status } : order)); } catch { setError('Unable to update order.'); }
  };
  const reviewPayment = async (id: string, status: 'approved' | 'rejected') => {
    try { await api(`/admin/payments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }), headers: { 'content-type': 'application/json' } }); setPayments(payments.map((payment) => payment.id === id ? { ...payment, status } : payment)); } catch { setError('Unable to review payment.'); }
  };
  if (summary.isLoading) return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin" /></div>;
  if (error === 'ADMIN_ACCESS_DENIED' || summary.error) return <AccessDenied />;
  return <div className="py-8 md:py-14"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-accent">Private / Studio operations</p><h1 className="mt-3 font-display text-6xl tracking-[-.07em] md:text-8xl">Control room.</h1></div><span className="rounded-full bg-secondary px-4 py-2 font-mono text-[10px] uppercase tracking-wider">Admin only</span></div><div className="mt-10 flex gap-2 overflow-x-auto border-b border-border pb-2">{(['overview','products','orders','customers','payments','settings'] as AdminTab[]).map((item) => <button key={item} onClick={() => { setTab(item); setError(''); }} className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${tab === item ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>{item}</button>)}</div>{error && error !== 'ADMIN_ACCESS_DENIED' && <p className="mt-5 rounded-lg bg-accent/10 p-3 text-xs text-accent">{error}</p>}{tab === 'overview' && <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-xl border border-border p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-7 font-display text-4xl">{value}</p></div>)}</div>}{tab === 'products' && <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_.9fr]"><div className="space-y-2">{products.map((product) => <div key={product.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><img src={product.image} alt="" className="h-16 w-12 object-cover" /><div className="min-w-0 flex-1"><p className="font-display text-xl">{product.name}</p><p className="text-xs text-muted-foreground">{product.category} · ₦{product.price.toLocaleString('en-NG')} · Stock {product.stock}</p></div><button onClick={() => { setEditing(true); setForm({ ...emptyProduct, id: product.id, name: product.name, description: product.description, subcategory: product.subcategory, price: product.price, compareAtPrice: product.compareAtPrice?.toString() || '', sizes: product.sizes.join(', '), colors: product.colors.join(', '), stock: product.stock, tags: product.tags.join(', '), imageUrls: product.images.join('\n'), featured: product.featured, newest: product.newest, trending: product.trending, installmentAvailable: product.installmentAvailable, installmentAmount: product.installmentAmount?.toString() || '' }); }} className="text-[10px] font-bold uppercase tracking-wider text-accent">Edit</button><button onClick={() => void removeProduct(product.id)} className="p-2 text-muted-foreground hover:text-accent"><Trash2 size={15} /></button></div>)}</div><form onSubmit={saveProduct} className="rounded-2xl bg-secondary/30 p-6"><div className="flex items-center justify-between"><h2 className="font-display text-3xl">{editing ? 'Edit product' : 'Add product'}</h2>{editing && <button type="button" onClick={() => { setEditing(false); setForm({ ...emptyProduct }); }} className="text-[10px] uppercase tracking-widest">New</button>}</div><div className="mt-5 grid gap-4 sm:grid-cols-2">{[['id','Product ID'],['name','Name'],['categoryId','Category ID'],['subcategory','Subcategory'],['price','Price'],['compareAtPrice','Discount price'],['stock','Stock'],['installmentAmount','Installment amount']].map(([key, label]) => <label key={key} className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span><input required={['id','name','categoryId','price'].includes(key)} disabled={editing && key === 'id'} value={String(form[key as keyof typeof form])} onChange={(e) => setForm({ ...form, [key]: e.target.value })} type={['price','compareAtPrice','stock','installmentAmount'].includes(key) ? 'number' : 'text'} className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm outline-none" /></label>)}</div><label className="mt-4 block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Description</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 min-h-20 w-full border-b border-border bg-transparent py-2 text-sm outline-none" /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Sizes, comma separated</span><input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm outline-none" /></label><label><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Colours, comma separated</span><input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm outline-none" /></label><label><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Tags, comma separated</span><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm outline-none" /></label><label><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Image URLs, one per line</span><textarea value={form.imageUrls} onChange={(e) => setForm({ ...form, imageUrls: e.target.value })} className="mt-2 min-h-20 w-full border-b border-border bg-transparent py-2 text-sm outline-none" /></label></div><div className="mt-5 flex flex-wrap gap-4 text-xs">{[['featured','Featured'],['newest','New'],['trending','Trending'],['installmentAvailable','Installments']].map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form[key as keyof typeof form])} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />{label}</label>)}</div><button className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground"><Save size={14} /> Save product</button></form></section>}{tab === 'orders' && <section className="mt-8 space-y-3">{orders.map((order) => <div key={order.id} className="rounded-xl border border-border p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{order.id}</p><h2 className="mt-1 font-display text-2xl">{order.customer?.full_name || order.full_name}</h2></div><p className="font-mono">₦{Number(order.total).toLocaleString('en-NG')} · paid ₦{Number(order.paid).toLocaleString('en-NG')}</p></div><div className="mt-4 flex flex-wrap items-center gap-3"><select value={order.status} onChange={(e) => void updateOrder(order.id, e.target.value)} className="rounded-full border border-border bg-transparent px-3 py-2 text-xs"><option value="pending">Pending</option><option value="payment-verification">Payment verification</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="out-for-delivery">Out for delivery</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select><span className="text-xs text-muted-foreground">Balance ₦{Number(order.remaining).toLocaleString('en-NG')} · {order.address}</span></div></div>)}</section>}{tab === 'customers' && <section className="mt-8 space-y-2">{customers.map((customer) => <div key={customer.id} className="rounded-xl border border-border p-5"><div className="flex justify-between gap-3"><div><h2 className="font-display text-2xl">{customer.full_name || 'Unnamed customer'}</h2><p className="text-xs text-muted-foreground">{customer.email} · {customer.phone || 'No phone saved'}</p></div><p className="font-mono text-sm">{customer.orderCount} orders</p></div><p className="mt-3 text-xs text-accent">Outstanding balance: ₦{Number(customer.outstanding).toLocaleString('en-NG')}</p></div>)}</section>}{tab === 'payments' && <section className="mt-8 space-y-3">{payments.map((payment) => <div key={payment.id} className="rounded-xl border border-border p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{payment.orders?.id} · {payment.method}</p><h2 className="font-display text-2xl">₦{Number(payment.amount).toLocaleString('en-NG')}</h2><p className="text-xs text-muted-foreground">{payment.status} · {payment.reference || 'No reference'}</p></div>{payment.status === 'pending' && <div className="flex gap-2"><button onClick={() => void reviewPayment(payment.id, 'approved')} className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground"><Check size={13} className="inline" /> Approve</button><button onClick={() => void reviewPayment(payment.id, 'rejected')} className="rounded-full border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Reject</button></div>}</div></div>)}</section>}{tab === 'settings' && <section className="mt-8 grid gap-3 md:grid-cols-2">{methods.map((method) => <div key={method.id} className="rounded-xl border border-border p-5"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">{method.name}</h2><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={method.enabled} onChange={async (e) => { const next = await api<any>(`/admin/payment-methods/${method.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: e.target.checked, name: method.name, instructions: method.instructions }), headers: { 'content-type': 'application/json' } }); setMethods(methods.map((item) => item.id === method.id ? next : item)); }} /> Enabled</label></div><textarea value={method.instructions || ''} onChange={(e) => setMethods(methods.map((item) => item.id === method.id ? { ...item, instructions: e.target.value } : item))} className="mt-4 min-h-20 w-full border-b border-border bg-transparent py-2 text-sm outline-none" /></div>)}</section>}</div>;
}