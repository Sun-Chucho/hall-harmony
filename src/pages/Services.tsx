import { ManagementPageTemplate } from '@/components/management/ManagementPageTemplate';
import {
  beverageList,
  beverageNotes,
  cakeOptions,
  conferencePackages,
  decorationPackages,
  externalServices,
  hallCatalog,
} from '@/lib/landingData';
import { getDecorationPackageVisual } from '@/lib/packageStyles';

const formatTZS = (value: number) =>
  new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function Services() {
  const stats = [
    { title: 'Hall Options', value: String(hallCatalog.length), description: 'official hall rate groups' },
    { title: 'Decoration Packages', value: String(decorationPackages.length), description: 'standard to royal' },
    { title: 'Beverage Items', value: String(beverageList.length), description: 'current unit prices' },
    { title: 'Conference Tiers', value: String(conferencePackages.length), description: '30 to 500 attendees' },
  ];

  const sections = [
    {
      title: 'Staff usage',
      bullets: [
        'Use these prices as the operational reference when preparing quotations.',
        'Confirm VAT application (18%) and any extra service charges with customers.',
        'Escalate price-change requests before editing any customer commitment.',
      ],
    },
  ];

  return (
    <ManagementPageTemplate
      pageTitle="Services & Pricing"
      subtitle="Official rates and service options for bookings, events, and customer quotations."
      stats={stats}
      sections={sections}
      action={
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Hall Rental Rates</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {hallCatalog.map((hall) => (
                <div key={hall.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{hall.alias}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{hall.name}</h3>
                  <p className="text-xs text-slate-600">{hall.capacity}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {hall.rates.map((rate) => (
                      <div key={rate.label} className="flex items-center justify-between">
                        <span>{rate.label}</span>
                        <span className="font-semibold">{formatTZS(rate.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Keki (Ndafu) Charges</p>
              <div className="mt-3 space-y-2 text-sm">
                {cakeOptions.map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span>{item.title}</span>
                    <span className="font-semibold">{item.pricePoint}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Huduma Nyingine</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                {externalServices.map((service) => (
                  <div key={service} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {service}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Beverage Price List</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3 text-sm">
              {beverageList.map((drink) => (
                <div key={drink.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span>{drink.name}</span>
                  <span className="font-semibold">{formatTZS(drink.price)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-1">
              {beverageNotes.map((note) => (
                <p key={note}>- {note}</p>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Decoration Packages</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2 text-sm">
              {decorationPackages.map((pkg, index) => {
                const style = getDecorationPackageVisual(index);
                return (
                <div key={pkg.title} className={`rounded-2xl border p-3 ${style.cardClass}`}>
                  <p className={`text-[10px] uppercase tracking-[0.2em] inline-flex rounded-full px-2 py-1 ${style.badgeClass}`}>
                    {style.tier}
                  </p>
                  <p className="font-semibold">{pkg.title}</p>
                  <ul className="mt-2 space-y-1 opacity-85">
                    {pkg.highlights.map((highlight) => (
                      <li key={highlight}>- {highlight}</li>
                    ))}
                  </ul>
                </div>
              )})}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Conference Packages</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
              {conferencePackages.map((pkg) => (
                <div key={pkg.attendees} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{pkg.attendees}</p>
                  <p className="text-xs font-semibold text-[#a80c10]">{pkg.pricePoint}</p>
                  <ul className="mt-2 space-y-1 text-slate-700">
                    {pkg.amenities.map((amenity) => (
                      <li key={amenity}>- {amenity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
