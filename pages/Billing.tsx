
import React, { useState, useEffect } from 'react';
import { Check, Star, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { db } from '../lib/supabase';
import { Subscription, SubscriptionPlan } from '../types';

const Billing: React.FC<{ user: any }> = ({ user }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    db.subscriptions.get().then(s => {
      setSubscription(s);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await db.subscriptions.upgrade();
      const s = await db.subscriptions.get();
      setSubscription(s);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const plans = [
    { name: 'Starter', price: '$0', features: ['20 interactions / mo', 'Basic Projects', 'Gemini 3 Flash'], current: subscription?.plan === 'free', plan: 'free' },
    { name: 'Nexus Pro', price: '$29', features: ['Unlimited AI', 'Priority Processing', 'Advanced Settings', 'Email Support'], current: subscription?.plan === 'pro', highlight: true, plan: 'pro' }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4"><h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Flexible Plans</h1><p className="text-lg text-slate-500">Scale your productivity with NexusAI.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((p, i) => (
          <div key={i} className={`relative p-8 rounded-2xl border-2 transition-all ${p.highlight ? 'border-indigo-600 bg-white shadow-xl scale-105' : 'border-slate-200 bg-slate-50/50'}`}>
            {p.highlight && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase">Most Popular</div>}
            <div className="mb-8"><h3 className="text-xl font-bold flex items-center gap-2">{p.name} {p.highlight && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}</h3><div className="mt-6 flex items-baseline gap-1"><span className="text-4xl font-extrabold text-slate-900">{p.price}</span><span className="text-slate-500 font-medium">/mo</span></div></div>
            <ul className="space-y-4 mb-10">
              {p.features.map((f, j) => (
                <li key={j} className="flex items-start gap-3 text-sm text-slate-600"><div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600"><Check className="w-3.5 h-3.5" /></div>{f}</li>
              ))}
            </ul>
            <button onClick={() => !p.current && p.plan === 'pro' && handleUpgrade()} disabled={p.current || isUpgrading} className={`w-full py-3.5 rounded-xl font-bold transition-all ${p.current ? 'bg-slate-100 text-slate-400' : p.highlight ? 'bg-indigo-600 text-white' : 'border border-slate-200'}`}>
              {isUpgrading && !p.current ? <Loader2 className="animate-spin mx-auto" /> : p.current ? 'Current Plan' : 'Upgrade Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Billing;
