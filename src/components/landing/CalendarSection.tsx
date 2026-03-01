import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

const CalendarSection = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { language } = useLanguage();
  const isSw = language === 'sw';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const bookedDates: Date[] = useMemo(() => [], []);
  const tentativeDates: Date[] = useMemo(() => [], []);

  const isBooked = (date: Date) => bookedDates.some((d) => isSameDay(d, date));
  const isTentative = (date: Date) => tentativeDates.some((d) => isSameDay(d, date));

  return (
    <section id="calendar" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Info */}
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              {isSw ? 'Upatikanaji' : 'Availability'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-blue-950">
              {isSw ? 'Kagua Upatikanaji wa Ukumbi Moja kwa Moja' : 'Check Real-Time Venue Availability'}
            </h2>
            <p className="text-lg text-blue-900/60 leading-relaxed">
              {isSw
                ? 'Panga tukio lako kwa uhakika. Upatikanaji unathibitishwa moja kwa moja na dawati la booking baada ya ombi lako kutumwa.'
                : 'Plan your event with confidence. Availability is confirmed directly from the booking desk after your request is submitted.'}
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-blue-900/70">{isSw ? 'Unapatikana kwa booking' : 'Available for booking'}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-blue-900/70">{isSw ? 'Umehifadhiwa kwa muda' : 'Tentatively reserved'}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-blue-900/70">{isSw ? 'Umeshahifadhiwa' : 'Already booked'}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-6 text-lg rounded-xl">
                <CalendarIcon className="w-5 h-5 mr-2" />
                {isSw ? 'Omba Tarehe' : 'Request a Date'}
              </Button>
            </div>
          </div>

          {/* Right - Calendar */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-3xl p-8 shadow-2xl shadow-blue-900/30">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {(isSw ? ['Jpl', 'Jtt', 'Jnn', 'Jtn', 'Alh', 'Ijm', 'Jms'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day) => (
                <div key={day} className="text-center text-sm font-medium text-white/50 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const booked = isBooked(day);
                const tentative = isTentative(day);
                const today = isToday(day);

                return (
                  <button
                    key={day.toString()}
                    className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                      ${booked 
                        ? 'bg-red-500/20 text-red-400 cursor-not-allowed' 
                        : tentative 
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                          : 'bg-white/5 text-white hover:bg-white/15'
                      }
                      ${today ? 'ring-2 ring-primary ring-offset-2 ring-offset-blue-950' : ''}
                    `}
                    disabled={booked}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <span>{isSw ? 'Inapatikana' : 'Available'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <span>{isSw ? 'Ya muda' : 'Tentative'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <span>{isSw ? 'Imehifadhiwa' : 'Booked'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarSection;
