import { DollarSign, Car, TrendingUp, Calculator, Bus, Clock, LucideIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { DetailType } from './SummaryDetailModal';

interface SummaryData {
  totalTrips: number;
  totalTripMoney: number;
  totalExpenses: number;
  totalProfit: number;
  totalOutsideVehicleTrips?: number;
  totalOutsideVehicleMoney?: number;
  pendingOutsideVehicleMoney?: number;
}

interface DashboardSummaryProps {
  data: SummaryData;
  onCardClick?: (type: DetailType) => void;
}

type Accent = 'indigo' | 'sky' | 'amber' | 'emerald' | 'violet' | 'rose';

interface CardDef {
  title: string;
  value: string;
  icon: LucideIcon;
  accent: Accent;
  type: DetailType;
  decoration?: 'progress' | 'bars' | 'dots';
  progress?: number; // 0..100
}

const accentMap: Record<Accent, { bg: string; border: string; text: string; glow: string; bar: string; gradient: string }> = {
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  text: 'text-indigo-400',  glow: 'shadow-[0_0_8px_rgba(99,102,241,0.6)]',  bar: 'bg-indigo-500',  gradient: 'from-indigo-500/20' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     text: 'text-sky-400',     glow: 'shadow-[0_0_8px_rgba(14,165,233,0.5)]',  bar: 'bg-sky-500',     gradient: 'from-sky-500/20' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',  bar: 'bg-amber-500',   gradient: 'from-amber-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',  bar: 'bg-emerald-500', gradient: 'from-emerald-500/20' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400',  glow: 'shadow-[0_0_8px_rgba(139,92,246,0.5)]',  bar: 'bg-violet-500',  gradient: 'from-violet-500/20' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    glow: 'shadow-[0_0_8px_rgba(244,63,94,0.5)]',   bar: 'bg-rose-500',    gradient: 'from-rose-500/20' },
};

const GlassCard = ({ card, onClick }: { card: CardDef; onClick?: () => void }) => {
  const a = accentMap[card.accent];
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl bg-slate-900/50 p-px transition-all duration-500 hover:scale-[1.02] cursor-pointer"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative flex flex-col h-full bg-slate-950 rounded-[23px] p-5 border border-white/5">
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2.5 ${a.bg} rounded-2xl border ${a.border}`}>
            <card.icon className={`w-5 h-5 ${a.text}`} strokeWidth={1.75} />
          </div>
        </div>
        <h3 className="text-slate-400 text-[11px] font-medium tracking-wide uppercase">{card.title}</h3>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
        </div>
        {card.decoration === 'progress' && (
          <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${a.bar} ${a.glow}`}
              style={{ width: `${Math.min(100, Math.max(5, card.progress ?? 60))}%` }}
            />
          </div>
        )}
        {card.decoration === 'bars' && (
          <div className="mt-4 flex gap-1 items-end h-5">
            {[40, 60, 50, 80, 100].map((h, i, arr) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${i === arr.length - 1 ? `${a.bar} ${a.glow}` : `${a.bar}/30`}`}
                style={{ height: `${h}%`, opacity: i === arr.length - 1 ? 1 : 0.35 }}
              />
            ))}
          </div>
        )}
        {card.decoration === 'dots' && (
          <div className="mt-4 flex gap-1.5">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < (card.progress ?? 3) ? `${a.bar} ${a.glow}` : 'bg-slate-700'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardSummaryComponent = ({ data, onCardClick }: DashboardSummaryProps) => {
  const formatCurrency = useMemo(() =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), []
  );

  const profitRatio = data.totalTripMoney > 0 ? (data.totalProfit / data.totalTripMoney) * 100 : 0;
  const expenseRatio = data.totalTripMoney > 0 ? (data.totalExpenses / data.totalTripMoney) * 100 : 0;

  const mainCards: CardDef[] = useMemo(() => [
    { title: 'Total Trips',       value: data.totalTrips.toString(),                   icon: Car,        accent: 'indigo',  type: 'trips',     decoration: 'bars' },
    { title: 'Total Trip Money',  value: formatCurrency.format(data.totalTripMoney),    icon: DollarSign, accent: 'sky',     type: 'tripMoney', decoration: 'progress', progress: 100 },
    { title: 'Total Expenses',    value: formatCurrency.format(data.totalExpenses),     icon: Calculator, accent: 'amber',   type: 'expenses',  decoration: 'progress', progress: expenseRatio },
    { title: 'Total Profit',      value: formatCurrency.format(data.totalProfit),       icon: TrendingUp, accent: 'emerald', type: 'profit',    decoration: 'progress', progress: profitRatio },
  ], [data, formatCurrency, profitRatio, expenseRatio]);

  const outsideCards: CardDef[] = useMemo(() => [
    { title: 'Outside Vehicle Trips',  value: (data.totalOutsideVehicleTrips ?? 0).toString(),               icon: Bus,        accent: 'violet', type: 'outsideTrips',   decoration: 'dots', progress: Math.min(5, data.totalOutsideVehicleTrips ?? 0) },
    { title: 'Outside Vehicle Amount', value: formatCurrency.format(data.totalOutsideVehicleMoney ?? 0),     icon: DollarSign, accent: 'violet', type: 'outsideAmount',  decoration: 'progress', progress: 100 },
    { title: 'Outside Pending',        value: formatCurrency.format(data.pendingOutsideVehicleMoney ?? 0),   icon: Clock,      accent: 'rose',   type: 'outsidePending', decoration: 'progress', progress: data.totalOutsideVehicleMoney ? ((data.pendingOutsideVehicleMoney ?? 0) / data.totalOutsideVehicleMoney) * 100 : 0 },
  ], [data, formatCurrency]);

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCards.map((c, i) => (
          <GlassCard key={i} card={c} onClick={() => onCardClick?.(c.type)} />
        ))}
      </div>

      {(data.totalOutsideVehicleTrips !== undefined && data.totalOutsideVehicleTrips > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {outsideCards.map((c, i) => (
            <GlassCard key={i} card={c} onClick={() => onCardClick?.(c.type)} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DashboardSummary = memo(DashboardSummaryComponent);
