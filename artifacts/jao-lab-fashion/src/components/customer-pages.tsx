import { useState } from 'react';
import { ArrowRight, Check, LogIn, Mail, MapPin, Phone, Save, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useGetProfile, useUpdateProfile } from '@workspace/api-client-react';
import type { ProfileInput } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { contactConfig } from '@/config/contact';

function moneyHint() {
  return 'Your profile is used for delivery and order updates.';
}

export function LoginPage({ signup = false }: { signup?: boolean }) {
  const [, navigate] = useLocation();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (signup) {
        await signUp(email, password, name);
        setSent(true);
      } else {
        await signIn(email, password);
        navigate('/account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    }
  };
  return <div className="mx-auto grid max-w-5xl gap-10 py-10 md:grid-cols-2 md:py-20">
    <div className="bg-primary p-8 text-primary-foreground md:p-12"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-secondary">JAO LAB / Member space</p><h1 className="mt-10 font-display text-6xl leading-[.87] tracking-[-.06em]">Your style,<br /><i>remembered.</i></h1><p className="mt-8 max-w-xs text-sm leading-6 text-primary-foreground/65">Keep your edit close. Save pieces, follow orders, and move through checkout with less repetition.</p></div>
    <div className="py-4 md:py-10"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-accent">{signup ? 'Create your space' : 'Welcome back'}</p><h2 className="mt-3 font-display text-5xl tracking-[-.06em]">{signup ? 'Join the edit.' : 'Good to see you.'}</h2>{sent ? <div className="mt-10 rounded-xl bg-secondary/30 p-6 text-sm leading-6">Your account was created. Check your email if confirmation is enabled, then <Link href="/login" className="font-bold text-accent">sign in</Link>.</div> : <form onSubmit={submit} className="mt-10 space-y-6">{signup && <label className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Full name</span><input data-testid="input-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full border-b border-border bg-transparent py-3 text-sm outline-none focus:border-accent" /></label>}<label className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Email address</span><input data-testid="input-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border-b border-border bg-transparent py-3 text-sm outline-none focus:border-accent" /></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Password</span><input data-testid="input-password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border-b border-border bg-transparent py-3 text-sm outline-none focus:border-accent" /></label>{error && <p className="rounded-lg bg-accent/10 p-3 text-xs text-accent">{error}</p>}<button data-testid="button-auth-submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-xs font-bold uppercase tracking-widest text-primary-foreground">{signup ? 'Create account' : 'Sign in'} <ArrowRight size={14} /></button></form>}<p className="mt-7 text-center text-xs text-muted-foreground">{signup ? 'Already have an account? ' : 'New to JAO LAB? '}<Link href={signup ? '/login' : '/signup'} data-testid="link-switch-auth" className="font-bold text-accent">{signup ? 'Sign in' : 'Create an account'}</Link></p></div>
  </div>;
}

export function AccountPage() {
  const { user, signOut } = useAuth();
  const profile = useGetProfile();
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ProfileInput>({
    fullName: '', phone: '', state: 'Lagos', city: 'Lagos', address: '',
  });
  const [loaded, setLoaded] = useState('');
  if (profile.data && loaded !== profile.data.id) {
    setLoaded(profile.data.id);
    setForm({ fullName: profile.data.fullName, phone: profile.data.phone, state: profile.data.state, city: profile.data.city, address: profile.data.address });
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    update.mutate({ data: form }, { onSuccess: () => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); } });
  };
  return <div className="py-10 md:py-16"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl bg-primary p-7 text-primary-foreground md:p-10"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary font-display text-2xl text-secondary-foreground">{(form.fullName || user?.email || 'A').slice(0, 1).toUpperCase()}</div><p className="mt-8 font-mono text-[10px] uppercase tracking-[.2em] text-secondary">Your account</p><h1 className="mt-3 font-display text-5xl leading-[.9]">Make it<br /><i>personal.</i></h1><p className="mt-6 text-sm leading-6 text-primary-foreground/65">{user?.email}</p><button onClick={() => void signOut()} className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-5 py-3 text-xs font-bold uppercase tracking-widest">Sign out <LogIn size={14} /></button></div><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-accent">Account surface</p><h2 className="mt-3 font-display text-5xl tracking-[-.06em] md:text-7xl">Everything<br />in its place.</h2><form onSubmit={submit} className="mt-10 rounded-2xl border border-border p-6"><div className="flex items-center justify-between"><h3 className="font-display text-3xl">Delivery profile</h3>{saved && <span className="flex items-center gap-1 text-xs text-accent"><Check size={14} /> Saved</span>}</div><p className="mt-2 text-xs text-muted-foreground">{moneyHint()}</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[['fullName','Full name'],['phone','Phone number'],['state','State'],['city','City']].map(([key, label]) => <label key={key} className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span><input value={form[key as keyof ProfileInput]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm outline-none focus:border-accent" /></label>)}</div><label className="mt-4 block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Address</span><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-2 min-h-20 w-full border-b border-border bg-transparent py-2 text-sm outline-none focus:border-accent" /></label><button disabled={update.isPending} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground"><Save size={14} /> {update.isPending ? 'Saving' : 'Save details'}</button></form><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Wishlist','Saved pieces','/wishlist',UserRound],['Orders','Follow deliveries','/orders',MapPin],['Need a hand?','Talk to the studio','/contact',Mail]].map(([label, copy, href, Icon]) => <Link href={href as string} key={label as string} className="rounded-xl border border-border p-4 transition hover:border-accent"><Icon size={17} className="text-accent" /><p className="mt-6 font-display text-xl">{label as string}</p><p className="mt-1 text-xs text-muted-foreground">{copy as string}</p></Link>)}</div></div></div></div>;
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const configured = Boolean(contactConfig.whatsappUrl || contactConfig.phone || contactConfig.email || contactConfig.location);
  return <div className="py-10 md:py-16"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-accent">The studio / Talk to us</p><h1 className="mt-4 font-display text-7xl leading-[.85] tracking-[-.08em]">Come<br /><i>through.</i></h1><p className="mt-8 max-w-xs text-sm leading-7 text-muted-foreground">Questions about fit, delivery, or a piece you cannot stop thinking about? We are listening.</p><div className="mt-10 space-y-4 text-sm">{contactConfig.whatsappUrl && <a href={contactConfig.whatsappUrl} className="flex items-center gap-3 hover:text-accent">WhatsApp</a>}{contactConfig.phone && <a href={`tel:${contactConfig.phone}`} className="flex items-center gap-3 hover:text-accent"><Phone size={16} /> {contactConfig.phone}</a>}{contactConfig.email && <a href={`mailto:${contactConfig.email}`} className="flex items-center gap-3 hover:text-accent"><Mail size={16} /> {contactConfig.email}</a>}{contactConfig.location && <p className="flex items-center gap-3"><MapPin size={16} /> {contactConfig.location}</p>}{!configured && <p className="rounded-xl border border-dashed border-accent/50 p-4 text-xs leading-5">Contact details are ready to be configured in <strong>src/config/contact.ts</strong>.</p>}</div></div><div className="rounded-2xl bg-secondary/35 p-6 md:p-10">{sent ? <div className="flex min-h-80 flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check size={22} /></div><h2 className="mt-6 font-display text-4xl">Message received.</h2><p className="mt-2 text-sm text-muted-foreground">The studio will be in touch shortly.</p></div> : <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-6"><h2 className="font-display text-4xl">Leave a note.</h2><label className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Your name</span><input required data-testid="input-contact-name" className="mt-2 w-full border-b border-border bg-transparent py-3 outline-none focus:border-accent" /></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Email address</span><input type="email" required data-testid="input-contact-email" className="mt-2 w-full border-b border-border bg-transparent py-3 outline-none focus:border-accent" /></label><label className="block"><span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">How can we help?</span><textarea required data-testid="input-contact-message" className="mt-2 min-h-28 w-full resize-none border-b border-border bg-transparent py-3 outline-none focus:border-accent" /></label><button data-testid="button-contact-submit" className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground">Send note <ArrowRight size={14} /></button></form>}</div></div></div>;
}