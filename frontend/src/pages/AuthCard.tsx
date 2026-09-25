import { MessageSquare, ShieldCheck, SquareCheckBig } from 'lucide-react'
import type { ReactNode } from 'react'
import Logo from '../components/ui/Logo'

const POINTS = [
  { icon: MessageSquare, title: 'Ask about policies', text: 'Leave, benefits and the handbook, with the source named in every answer.' },
  { icon: SquareCheckBig, title: 'Track your onboarding', text: 'Tick off your Day-1 and Week-1 checklist as you go.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'You only see documents your role is allowed to read.' },
]

/**
 * Split sign-in layout: the form on the left, a navy panel explaining the app on the right (hidden on small screens).
 */
export default function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string
  subtitle: string
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      <section className="flex w-full flex-col justify-center gap-7 px-6 py-12 sm:px-16 lg:w-[560px] lg:shrink-0 lg:px-[72px]">
        <span className="flex items-center gap-2.5 text-[15px] font-semibold">
          <Logo large />
          Onboarding Assistant
        </span>
        <div>
          <h1 className="text-[28px] font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
        <p className="border-t border-line pt-5 text-sm text-muted">{footer}</p>
      </section>

      <section className="hidden flex-1 flex-col justify-center gap-8 bg-navy px-20 py-16 text-white lg:flex">
        <span className="text-xs font-semibold tracking-[.12em] text-navy-muted uppercase">Employee support</span>
        <h2 className="max-w-[520px] text-4xl leading-tight font-semibold text-balance">
          Answers from company documents, for your role only.
        </h2>
        <ul>
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 border-t border-white/15 py-[18px]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded bg-tab/20 text-[#7fb6ff]">
                <Icon size={16} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-navy-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
