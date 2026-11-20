import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusTracker from '../components/StatusTracker';
import { homeFor } from '../lib';

const MENU = [
  ['Routine care', 'General servicing and engine oil replacement.'],
  ['Core repairs', 'Brake, battery, tyre, chain and puncture support.'],
  ['Electrical help', 'Minor electrical repairs at your location.'],
  ['Urgent response', 'Roadside assistance when the ride cannot continue.'],
];
const JOURNEY = ['Open the app', 'Pick bike and service', 'Share location', 'Choose a time',
  'Nearby mechanic accepts', 'Mechanic reaches you', 'Service is completed', 'Pay and rate'];

export default function Home() {
  const { user } = useAuth();
  const cta = user ? { to: homeFor(user), text: user.role === 'customer' ? 'Book a service' : 'Open dashboard' }
    : { to: '/signup', text: 'Book your first service' };

  return (
    <main>
      <section className="bg-forest text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">Your bike, our responsibility.</h1>
            <p className="mt-5 max-w-md text-lg text-paper/80">
              Trained mechanics come to your home, workplace or breakdown spot. Book in a minute, track the mechanic, pay online.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={cta.to} className="btn-primary">{cta.text}</Link>
              {!user && <Link to="/signup?role=mechanic" className="btn border border-paper/30 text-paper hover:bg-paper/10">Join as a mechanic</Link>}
            </div>
          </div>
          <div className="rounded-2xl bg-paper p-6 text-ink shadow-xl">
            <p className="mb-4 text-sm font-semibold text-ink/60">Honda Shine · UP32 AB 1234</p>
            <StatusTracker status="reached" history={[]} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">One platform for routine care and urgent repairs</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENU.map(([t, d]) => (
            <div key={t} className="card"><h3 className="font-bold">{t}</h3><p className="mt-2 text-sm text-ink/70">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold">From booking to feedback in eight steps</h2>
          <ol className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span>
                <span className="text-sm">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-sm text-ink/60">
        MotoDoor · S R Institute of Management and Technology, Lucknow · Electrical and Electronics Engineering
      </footer>
    </main>
  );
}
