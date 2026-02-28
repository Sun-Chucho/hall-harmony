import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clientDeclaration, taratibuChecklist } from '@/lib/landingData';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';

const Taratibu = () => {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <PublicNavbar />

      <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl border border-black/10 bg-white p-6 shadow-sm md:p-10">
          <header className="border-b border-black/10 pb-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#6c6c6c]">Kuringe Halls</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#181818] md:text-4xl">
              {isSw ? 'Sera na Taratibu' : 'Policies and Procedures'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4d4d4d]">
              {isSw
                ? 'Hati hii inaeleza kanuni za uendeshaji wa uhifadhi na matukio katika Kuringe Halls. Wateja wote wanatakiwa kusoma, kuelewa, na kuzingatia masharti kabla ya kuthibitisha uhifadhi.'
                : 'This document outlines the operational rules for bookings and events at Kuringe Halls. All clients are required to read, understand, and comply before confirming a reservation.'}
            </p>
          </header>

          <section className="pt-8">
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c6c6c]">
              {isSw ? 'Vipengele vya Sera' : 'Policy Clauses'}
            </h2>
            <ol className="mt-5 space-y-4">
              {taratibuChecklist.map((item, index) => (
                <li key={item} className="border-l-2 border-[#d8d8d8] pl-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#777777]">
                    {isSw ? `Kipengele ${index + 1}` : `Clause ${index + 1}`}
                  </p>
                  <p className="mt-1 text-[15px] leading-7 text-[#1f1f1f]">{item}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10 border-t border-black/10 pt-8">
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c6c6c]">
              {isSw ? 'Tamko la Mteja' : 'Client Declaration'}
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-[#1f1f1f]">{clientDeclaration}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="border border-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6c6c6c]">
                  {isSw ? 'Jina la Mteja na Sahihi' : 'Client Name and Signature'}
                </p>
                <div className="mt-10 border-b border-black/30" />
              </div>
              <div className="border border-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6c6c6c]">{isSw ? 'Tarehe' : 'Date'}</p>
                <div className="mt-10 border-b border-black/30" />
              </div>
            </div>
          </section>

          <section className="mt-10 border-t border-black/10 pt-6">
            <p className="text-xs leading-6 text-[#666666]">
              {isSw
                ? 'Kuzingatia sera hizi ni lazima. Kutokuzingatia kunaweza kusababisha kuwekewa vikwazo vya huduma, kusitishwa kwa uhifadhi, au kufutwa kwa uhifadhi kulingana na tathmini ya usimamizi.'
                : 'Compliance with these policies is mandatory. Non-compliance may result in service limitations, booking suspension, or cancellation based on management review.'}
            </p>
          </section>
        </article>

        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
          <Link to="/venues">
            <Button variant="outline" className="rounded-none border-black/25 px-6">
              {isSw ? 'Tazama Kumbi' : 'View Venues'}
            </Button>
          </Link>
          <Link to="/booking">
            <Button className="rounded-none bg-[#121212] px-7 text-white hover:bg-[#222222]">
              {isSw ? 'Endelea na Uhifadhi' : 'Proceed to Booking'}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Taratibu;
