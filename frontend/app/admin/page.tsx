import Link from "next/link";

const CARDS = [
  {
    href: "/admin/assets",
    title: "Tracked Assets",
    description: "Add or remove the ASX stocks, cryptocurrencies, and FX pairs the dashboard tracks.",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "View registered users and promote/demote admin access.",
  },
  {
    href: "/admin/jobs",
    title: "Scheduler Jobs",
    description: "Inspect snapshot pipeline run history and trigger a run manually.",
  },
];

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
