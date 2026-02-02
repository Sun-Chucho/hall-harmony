import { Link } from 'react-router-dom';

const menuCategories = [
  {
    title: 'Signature starters',
    description: 'Aromatic bites that awaken the table.',
    items: ['Coastal ceviche cups', 'Kahawa infused chicken skewers', 'Plantain crop salad'],
  },
  {
    title: 'Main spectacles',
    description: 'Hearty, layered plates that fuel the celebration.',
    items: ['Charcoal grilled wagyu', 'Madras coconut seafood stew', 'Tuscan vegetable mosaic'],
  },
  {
    title: 'Dessert finale',
    description: 'Sweet chapters with tropical fruit and burnt caramel.',
    items: ['Mango pavlova slices', 'Rosewater panna cotta', 'Espresso chili chocolate'],
  },
];

const Foods = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Culinary artistry</p>
            <h1 className="text-3xl font-bold text-slate-900">Food, beverage, and sensory experiences</h1>
          </div>
          <Link
            to="/bookings"
            className="rounded-full border border-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-slate-900 hover:text-white"
          >
            Plan an event
          </Link>
        </div>
      </div>

      <main className="space-y-12 px-6 py-12">
        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Inspired kitchen</p>
            <p className="text-2xl font-semibold text-slate-900">
              Our chefs blend East African techniques with coastal and global accents to keep every event memorable.
            </p>
            <p className="text-sm text-slate-600">
              Customized tasting menus are available for sit-down dinners, buffets, and plated gala evenings. Every service
              includes beverage pairings, crew support, and logistics management.
            </p>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Chef notes</p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                <li>Seasonal produce sourced from Tanzanian farms.</li>
                <li>Dietary menus for vegetarian, halal, and allergen-aware plans.</li>
                <li>Pastry labs craft desserts and custom cakes on-site.</li>
              </ul>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tasting suite</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Private culinary preview</p>
            <p className="mt-3 text-sm text-slate-600">
              Book a tasting with our chefs to pair food & beverages, finalize plating, and lock your décor palette.
            </p>
            <Link
              to="/bookings"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-red-600"
            >
              Schedule a tasting →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {menuCategories.map((category) => (
              <div key={category.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{category.title}</p>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">{category.description}</h2>
                <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-slate-600">
                  {category.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-blue-200">Beverage partners</p>
              <p className="text-2xl font-bold">Signature drinks for every toast.</p>
            </div>
            <Link
              to="/bookings"
              className="rounded-full border border-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-slate-900"
            >
              Reserve a tasting
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {['Sparkling', 'Cocktails', 'Mocktails', 'Wine'].map((section) => (
              <div key={section} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{section}</p>
                <p className="text-lg font-semibold text-slate-900">Curated selection</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Foods;
