export interface DecorationPackageVisual {
  tier: string;
  cardClass: string;
  badgeClass: string;
  iconWrapClass: string;
  buttonClass: string;
  checkClass: string;
  featured: boolean;
  featuredLabel?: string;
}

const PACKAGE_VISUALS: DecorationPackageVisual[] = [
  {
    tier: 'Bronze Plan',
    cardClass: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 text-amber-950',
    badgeClass: 'bg-gradient-to-r from-amber-700 to-orange-500 text-white',
    iconWrapClass: 'bg-amber-700 text-white',
    buttonClass: 'bg-amber-700 text-white hover:bg-amber-800',
    checkClass: 'text-amber-700',
    featured: false,
  },
  {
    tier: 'Silver Plan',
    cardClass: 'bg-gradient-to-br from-slate-100 to-zinc-100 border-slate-300 text-slate-950',
    badgeClass: 'bg-gradient-to-r from-slate-500 to-zinc-400 text-white',
    iconWrapClass: 'bg-slate-600 text-white',
    buttonClass: 'bg-slate-700 text-white hover:bg-slate-800',
    checkClass: 'text-slate-700',
    featured: false,
  },
  {
    tier: 'Gold Plan',
    cardClass: 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 border-yellow-400 text-amber-950 ring-2 ring-yellow-400/60 shadow-2xl shadow-yellow-500/20',
    badgeClass: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-amber-950',
    iconWrapClass: 'bg-yellow-500 text-amber-950',
    buttonClass: 'bg-yellow-500 text-amber-950 hover:bg-yellow-400',
    checkClass: 'text-amber-800',
    featured: true,
    featuredLabel: 'Featured Gold',
  },
  {
    tier: 'Platinum Plan',
    cardClass: 'bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-300 text-cyan-950',
    badgeClass: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
    iconWrapClass: 'bg-cyan-700 text-white',
    buttonClass: 'bg-cyan-700 text-white hover:bg-cyan-800',
    checkClass: 'text-cyan-700',
    featured: false,
  },
  {
    tier: 'Royal Plan',
    cardClass: 'bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-700 text-white',
    badgeClass: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
    iconWrapClass: 'bg-indigo-500 text-white',
    buttonClass: 'bg-white text-indigo-950 hover:bg-white/90',
    checkClass: 'text-indigo-300',
    featured: false,
  },
];

export const getDecorationPackageVisual = (index: number): DecorationPackageVisual =>
  PACKAGE_VISUALS[index] ?? PACKAGE_VISUALS[PACKAGE_VISUALS.length - 1];

export const getDecorationPackageName = (title: string): string => title.split(' - ')[0].trim();
