import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { useLanguage } from '@/contexts/LanguageContext';

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const sectionTitle = 'text-2xl md:text-3xl font-bold text-slate-900';
const subTitle = 'text-lg font-semibold text-slate-800';

function HallRates({
  title,
  capacity,
  rows,
}: {
  title: string;
  capacity: string;
  rows: Array<{ day: string; price: string }>;
}) {
  return (
    <div className={card}>
      <h3 className={subTitle}>{title}</h3>
      <p className="text-sm text-slate-500">{capacity}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-2 py-2">Siku</th>
              <th className="px-2 py-2">Bei</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.day}`} className="border-b border-slate-100">
                <td className="px-2 py-2 text-slate-700">{row.day}</td>
                <td className="px-2 py-2 font-semibold text-slate-900">{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={card}>
      <h3 className={subTitle}>{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={`${title}-${item}`}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Packages() {
  const { language } = useLanguage();
  const isSw = language === 'sw';

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <PublicNavbar />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{isSw ? 'Vifurushi' : 'Packages'}</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">{isSw ? 'Vifurushi vya Kuringe Halls' : 'Kuringe Halls Packages'}</h1>
          <p className="mt-3 max-w-4xl text-sm text-slate-600">
            {isSw
              ? 'Mpangilio huu umewekwa kwa sehemu tatu: Gharama za Ukumbi, Kifurushi cha Gala, na Kifurushi cha Wanafunzi.'
              : 'This page is organized into three sections: Hall Pricing, Gala Package, and Student Package.'}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-6 py-10">
        <section className="space-y-4">
          <h2 className={sectionTitle}>
            {isSw ? '1) Gharama za Ukumbi (Kifurushi na Bei)' : '1) Hall Package & Pricing'}
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <HallRates
              title={isSw ? 'Ukumbi wa Witness' : 'Witness Hall'}
              capacity={isSw ? 'Wageni 500-700' : 'PAX 500-700'}
              rows={[
                { day: 'Jumamosi', price: 'TSH 3,835,000/=' },
                { day: 'Jumatatu na Jumanne', price: 'TSH 1,534,000/=' },
                { day: 'Jumatano, Alhamisi, Ijumaa na Jumapili', price: 'TSH 2,301,000/=' },
              ]}
            />
            <HallRates
              title={isSw ? 'Ukumbi wa Kilimanjaro (Ukumbi B) na Garden' : 'Kilimanjaro Hall (Hall B) & Garden'}
              capacity={isSw ? 'Ukumbi 200-300 na Garden 300-400' : 'Hall 200-300 & Garden 300-400'}
              rows={[
                { day: 'Jumamosi', price: 'TSH 2,301,000/=' },
                { day: 'Jumatatu na Jumanne', price: 'TSH 1,227,000/=' },
                { day: 'Jumatano, Alhamisi, Ijumaa na Jumapili', price: 'TSH 1,534,000/=' },
              ]}
            />
            <HallRates
              title={isSw ? 'Ukumbi D' : 'Hall D'}
              capacity={isSw ? 'Uwezo 30-60' : 'Capacity 30-60'}
              rows={[
                { day: 'Jumatatu na Jumanne', price: 'TSH 177,000/=' },
                { day: 'Jumatano, Alhamisi, Ijumaa, Jumamosi na Jumapili', price: 'TSH 236,000/=' },
              ]}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ListBlock
              title="Taratibu za Ukumbi"
              items={[
                'Meza na viti vitatolewa kulingana na idadi ya watu waliolipwa chakula.',
                'Ukumbi una parking ya kutosha na ulinzi wa uhakika.',
                'Booking inakamilika pale tu malipo ya awali yanapofanyika nusu au malipo yote ya kukodi ukumbi.',
                'Standby generator ipo endapo umeme utakatika.',
                'Sherehe mwisho saa sita (00:00) kwa mujibu wa sheria, MC azingatie muda.',
                'Malipo ya mwisho yafanyike wiki moja kabla ya tarehe ya sherehe.',
                'Kuna waiting room ya maharusi.',
                'Mpambaji kutoka nje hulipia taa: ukumbi mkubwa 200,000/=, ukumbi mdogo 150,000/=.',
                'Mpishi kutoka nje hulipia jiko: ukumbi mkubwa 300,000/=, ukumbi mdogo/garden 200,000/=.',
              ]}
            />
            <ListBlock
              title="Muhimu"
              items={[
                'Sherehe isipofanyika: kurejeshwa 70% tu pale mteja mwingine akipatikana kwa tarehe hiyo; vinginevyo hakuna refund.',
                isSw ? 'Vinywaji vilivyobaki huchukuliwa kwa kuleta empty bottles ndani ya siku 3.' : 'Leftover drinks are collected with matching empty bottles within 3 days.',
                isSw ? 'Haturuhusu two in one.' : 'We do not allow two events in one session.',
                'Outcatering ni makubaliano na ofisi kuhusu gharama za uendeshaji.',
                'Gharama zote zilipwe VAT 18%.',
                'Mteja alipie kibali cha sherehe Manispaa (Ofisi ya Utamaduni).',
                'AC huwashwa saa 17:30.',
              ]}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ListBlock
              title="Keki (Ndafu)"
              items={[
                'Mbuzi akiletwa na mteja ataokwa kwa TSH 100,000/=.',
                'Ndafu kamili (mbuzi + kumuoka): TSH 350,000/= hadi TSH 400,000/=.',
                'Mteja anaruhusiwa kuleta ndafu; toroli hukodishwa TSH 20,000/=.',
              ]}
            />
            <ListBlock
              title="Malipo yafanyike kupitia"
              items={[
                'CRDB BANK: 0150005526600 (KURINGE REAL ESTATE)',
                'NMB BANK: 40310046818 (KURINGE REAL ESTATE)',
              ]}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ListBlock
              title="Vinywaji"
              items={[
                'Flying Fish & Kilimanjaro Lite - TSH 3,000/=',
                isSw ? 'Bia za Ndani - TSH 2,500/=' : 'Local Beer - TSH 2,500/=',
                isSw ? 'Bia za Nje - TSH 4,000/=' : 'Imported Beer - TSH 4,000/=',
                'Soda - TSH 1,000/=',
                'Azam Juice - TSH 4,000/=',
                'Maji Kili 0.5LT - TSH 1,000/=',
                'Malta - TSH 3,000/=',
                'Baltika - TSH 5,000/=',
                'Bavaria - TSH 3,500/=',
                'Savanna - TSH 5,000/=',
                'Ceres Juice - TSH 6,000/=',
                'Konyagi & K Vant - TSH 15,000/=',
                'Wine (5LTRS) - TSH 120,000/=',
                'NB: Gharama ya kuingiza cocktail ukumbini ni TSH 150,000/=.',
              ]}
            />
            <ListBlock
              title="Huduma nyingine nje ya ukumbi"
              items={[
                'Kukodisha magari',
                isSw ? 'Out catering' : 'Out catering',
                isSw ? 'Huduma ya vinywaji' : 'Beverage service',
                isSw ? 'Huduma ya mapambo' : 'Decoration service',
                isSw ? 'Huduma ya ukodishaji wa vifaa vya matukio' : 'Event rental service',
                isSw ? 'Sehemu za kufanyia mikutano mbalimbali' : 'Places for holding various meetings',
                'Mawasiliano: 0652199985',
              ]}
            />
          </div>

          <div className={card}>
            <h3 className={subTitle}>Gharama za Mapambo</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">{isSw ? 'KAWAIDA - TSH 2,000,000/=' : 'STANDARD - TSH 2,000,000/='}</p>
                <p>{isSw ? 'Stage decor, photobooth banner 3m, welcome board, fire walks 2, entrance decor, flowers, dancing floor sticker, lights, table decor.' : 'Stage decor, photobooth banner 3m, welcome board, fire walks 2, entrance decor, flowers, dancing floor sticker, lights, table decor.'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">V.I.P - TSH 5,000,000/=</p>
                <p>{isSw ? 'Stage decor, chrome chairs 400, walking way sticker, flowers, fog machine, moving head 2, table decor (candles, napkins, charger plates, glasses).' : 'Stage decor, chrome chairs 400, walking way sticker, flowers, fog machine, moving head 2, table decor (candles, napkins, charger plates, glasses).'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">EXECUTIVE - TSH 8,000,000/=</p>
                <p>{isSw ? 'LED stage, lazer first dance, chandelier 8, truss 8m x 10m, moving head 4, printed walking way, crystal table setup.' : 'LED stage, lazer first dance, chandelier 8, truss 8m x 10m, moving head 4, printed walking way, crystal table setup.'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">V.V.I.P - TSH 15,000,000/=</p>
                <p>{isSw ? 'A lot of flowers, truss 12m x 12m + LED + 10 chandeliers, full hall themes, fog machine 2, fire walks 6, lazer machine.' : 'A lot of flowers, truss 12m x 12m + LED + 10 chandeliers, full hall themes, fog machine 2, fire walks 6, lazer machine.'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">ROYAL - TSH 20,000,000/=</p>
                <p>{isSw ? 'A lot of flowers, truss 12m x 12m + LED + 15 chandeliers, full hall themes, fog machine 4, fire walks 8, lazer machine.' : 'A lot of flowers, truss 12m x 12m + LED + 15 chandeliers, full hall themes, fog machine 4, fire walks 8, lazer machine.'}</p>
              </div>
            </div>
          </div>

          <div className={card}>
            <h3 className={subTitle}>{isSw ? 'Kifurushi cha Mikutano' : 'Conference Package'}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="px-2 py-2">Kundi</th>
                    <th className="px-2 py-2">{isSw ? 'Chaguo 1' : 'Option 1'}</th>
                    <th className="px-2 py-2">{isSw ? 'Chaguo 2' : 'Option 2'}</th>
                    <th className="px-2 py-2">{isSw ? 'Chaguo 3' : 'Option 3'}</th>
                    <th className="px-2 py-2">Maelezo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-2 font-semibold text-slate-900">Watu 30-50</td>
                    <td className="px-2 py-2">@TSH 55,000/=</td>
                    <td className="px-2 py-2">@TSH 35,000/=</td>
                    <td className="px-2 py-2">@TSH 20,000/=</td>
                    <td className="px-2 py-2">{isSw ? 'Hall setup, breakfast, lunch, soft drinks, stationary, P.A (lipa ukumbi).' : 'Hall setup, breakfast, lunch, soft drinks, stationery, P.A (hall paid separately).'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-2 font-semibold text-slate-900">Watu 100-200</td>
                    <td className="px-2 py-2">@TSH 50,000/=</td>
                    <td className="px-2 py-2">@TSH 40,000/=</td>
                    <td className="px-2 py-2">@TSH 30,000/=</td>
                    <td className="px-2 py-2">{isSw ? 'Hall setup, breakfast, lunch, stationary, P.A, projector, soft drinks (lipa ukumbi).' : 'Hall setup, breakfast, lunch, stationery, P.A, projector, soft drinks (hall paid separately).'}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 font-semibold text-slate-900">Watu 300-500</td>
                    <td className="px-2 py-2">@TSH 45,000/=</td>
                    <td className="px-2 py-2">@TSH 40,000/=</td>
                    <td className="px-2 py-2">@TSH 35,000/=</td>
                    <td className="px-2 py-2">{isSw ? 'Hall setup, breakfast, lunch, evening tea, stationary, P.A, projector, soft drinks (lipa ukumbi).' : 'Hall setup, breakfast, lunch, evening tea, stationery, P.A, projector, soft drinks (hall paid separately).'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={sectionTitle}>{isSw ? '2) Kifurushi cha Gala Dinner' : '2) Gala Dinner Package'}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <HallRates
              title={isSw ? 'Ukumbi wa Witness' : 'Witness Hall'}
              capacity="500-700"
              rows={[
                { day: 'Jumamosi', price: 'TSH 2,500,000/=' },
                { day: 'Jumatatu na Jumanne', price: 'TSH 1,000,000/=' },
                { day: 'Jumatano, Alhamisi, Ijumaa na Jumapili', price: 'TSH 1,500,000/=' },
              ]}
            />
            <HallRates
              title={isSw ? 'Ukumbi wa Kilimanjaro na Garden' : 'Kilimanjaro Hall & Garden'}
              capacity="200-300 & 300-400"
              rows={[
                { day: 'Jumamosi', price: 'TSH 1,500,000/=' },
                { day: 'Jumatatu na Jumanne', price: 'TSH 800,000/=' },
                { day: 'Jumatano, Alhamisi, Ijumaa na Jumapili', price: 'TSH 1,000,000/=' },
              ]}
            />
            <HallRates
              title={isSw ? 'Ukumbi D' : 'Hall D'}
              capacity="30-60"
              rows={[
                { day: 'Jumatatu na Jumanne', price: 'TSH 150,000/=' },
                { day: 'Jumatano, Alhamisi, Ijumaa, Jumamosi na Jumapili', price: 'TSH 200,000/=' },
              ]}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ListBlock
              title="Taratibu (Gala)"
              items={[
                'Tutatoa meza na viti kulingana na idadi ya watu.',
                'Booking inakamilika pale malipo ya awali yanapofanyika nusu au yote.',
                'Standby generator ipo endapo umeme utakatika.',
                'Huduma zote zitoke hapa kwetu: chakula, vinywaji, mapambo, ukodishaji wa magari.',
                'Sherehe isipofanyika, refund ni 70% tu pale mteja mwingine akipatikana tarehe hiyo.',
                'Malipo ya mwisho yafanyike wiki moja kabla ya sherehe.',
                'Malipo kupitia CRDB 0150005526600 au NMB 40310046818 (Kuringe Real Estate).',
                'Mawasiliano: 0652199985.',
              ]}
            />
            <div className={card}>
              <h3 className={subTitle}>Mapambo ya Gala</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>- PAX 50-100: TSH 500,000/=</li>
                <li>- PAX 100-300: TSH 800,000/=</li>
                <li>- PAX 300-500: TSH 1,000,000/=</li>
                <li>- PAX 500-700: TSH 1,500,000/=</li>
              </ul>
              <h4 className="mt-5 text-base font-semibold text-slate-900">{isSw ? 'Menyu za Chakula' : 'Food Menus'}</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                <li>{isSw ? '- MENYU 13,000/= (vitafunwa + buffet)' : '- MENU 13,000/= (starter + buffet)'}</li>
                <li>{isSw ? '- MENYU 15,000/= (vitafunwa + buffet)' : '- MENU 15,000/= (starter + buffet)'}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={sectionTitle}>{isSw ? '3) Kifurushi cha Wanafunzi' : '3) Student Package'}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <HallRates
              title={isSw ? 'Ukumbi wa Witness (Ukumbi A)' : 'Witness Hall (Hall A)'}
              capacity="500-700"
              rows={[
                { day: 'Jumatatu na Jumanne', price: 'TSH 800,000/=' },
                { day: 'Jumatano, Alhamisi na Ijumaa', price: 'TSH 1,000,000/=' },
                { day: 'Jumamosi na Jumapili', price: 'TSH 2,000,000/=' },
              ]}
            />
            <HallRates
              title={isSw ? 'Ukumbi wa Kilimanjaro (Ukumbi B) na Garden' : 'Kilimanjaro Hall (Hall B) & Garden'}
              capacity="200-300 & 300-400"
              rows={[
                { day: 'Jumatatu na Jumanne', price: 'TSH 500,000/=' },
                { day: 'Jumatano, Alhamisi na Ijumaa', price: 'TSH 800,000/=' },
                { day: 'Jumamosi na Jumapili', price: 'TSH 1,000,000/=' },
              ]}
            />
            <HallRates
              title={isSw ? 'Ukumbi D' : 'Hall D'}
              capacity="30-60"
              rows={[
                { day: 'Jumatatu na Jumanne', price: 'TSH 100,000/=' },
                { day: 'Jumatano, Alhamisi, Ijumaa, Jumamosi na Jumapili', price: 'TSH 200,000/=' },
              ]}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ListBlock
              title="Taratibu (Student)"
              items={[
                'Tutatoa meza na viti kulingana na idadi ya watu.',
                'Booking inakamilika baada ya malipo ya awali nusu au yote.',
                'Standby generator ipo endapo umeme utakatika.',
                'Huduma zote zitoke hapa kwetu.',
                'Sherehe isipofanyika, refund ni 70% tu pale mteja mwingine akipatikana tarehe hiyo.',
                'Malipo ya mwisho yafanyike wiki moja kabla ya sherehe.',
                'Malipo kupitia CRDB 0150005526600 au NMB 40310046818 (Kuringe Real Estate).',
                'Mawasiliano: 0652199985.',
              ]}
            />
            <div className={card}>
              <h3 className={subTitle}>{isSw ? 'Mapambo na Menyu (Wanafunzi)' : 'Decoration and Menus (Student)'}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>- PAX 50-100: TSH 400,000/=</li>
                <li>- PAX 100-300: TSH 600,000/=</li>
                <li>- PAX 300-500: TSH 800,000/=</li>
                <li>- PAX 500-700: TSH 1,000,000/=</li>
                <li>{isSw ? '- MENYU 10,000/= (vitafunwa + buffet)' : '- MENU 10,000/= (starter + buffet)'}</li>
                <li>{isSw ? '- MENYU 13,000/= (vitafunwa + buffet)' : '- MENU 13,000/= (starter + buffet)'}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={card}>
          <h3 className={subTitle}>Uthibitisho wa Mteja</h3>
          <p className="mt-2 text-sm text-slate-700">
            MIMI __________________________ NIMESOMA NA KUKUBALIANA NA MIONGOZO YOTE HAPO JUU NA NITAFUATA YOTE YALIYOELEKEZWA HAPO.
          </p>
          <p className="mt-2 text-sm text-slate-700">SAINI __________________________ TAREHE __________________________</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/booking?package=Hall Package">
              <Button>{isSw ? 'Anza Uhifadhi' : 'Start Booking'}</Button>
            </Link>
            <Link to="/booking?package=Gala Package">
              <Button variant="outline">{isSw ? 'Hifadhi Kifurushi cha Gala' : 'Book Gala Package'}</Button>
            </Link>
            <Link to="/booking?package=Student Package">
              <Button variant="outline">{isSw ? 'Hifadhi Kifurushi cha Wanafunzi' : 'Book Student Package'}</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
