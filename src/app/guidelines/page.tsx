import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Community Guidelines",
  description: "How to post honest, useful and safe reviews, tips and warnings on InfoBrokerBD — and how reports and moderation work.",
  path: "/guidelines",
});

const DO = [
  ["Share real, first-hand experience", "Write about shops, services, people and places you actually used or visited."],
  ["Be specific", "Price, what happened, how long it took, would you go again — details help the next person most."],
  ["Be fair", "Criticise the service, not the person. Stick to facts you experienced."],
  ["Pin the right spot", "Put the map pin on the actual shop or place so others can find it."],
];

const DONT = [
  ["No fake reviews or self-promotion", "Don't review your own business or post for a competitor."],
  ["No private information", "Don't post someone's private phone number, home address or photos without consent. Business contact numbers are fine."],
  ["No hate, threats or abuse", "Posts and comments that insult or threaten people are removed."],
  ["No spam or scams", "Advertising, links to scams and repeated posts are removed and the account may be banned."],
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Community guidelines</h1>
      <p className="bn mt-2 text-stone-600">সৎ থাকুন, নির্দিষ্ট করে লিখুন, অন্যকে সম্মান করুন।</p>
      <p className="mt-2 text-stone-600">
        InfoBrokerBD works because people share honestly. Everything posted here is public, and anyone can report a post or comment.
        Admins review reports and can remove content or ban accounts at any time.
      </p>

      <h2 className="mt-8 text-lg font-extrabold text-brand-700">✅ Please do</h2>
      <ul className="mt-3 space-y-2">
        {DO.map(([t, d]) => (
          <li key={t} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="font-bold">{t}</div>
            <div className="text-sm text-stone-600">{d}</div>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-extrabold text-accent-600">🚫 Please don&apos;t</h2>
      <ul className="mt-3 space-y-2">
        {DONT.map(([t, d]) => (
          <li key={t} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="font-bold">{t}</div>
            <div className="text-sm text-stone-600">{d}</div>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl bg-brand-50 p-5 text-sm text-brand-900 ring-1 ring-brand-200">
        <div className="font-bold">How moderation works</div>
        <p className="mt-1">
          When several different people report the same post or comment, it is hidden automatically until an admin reviews it. Admins
          can then remove it or restore it. Points earned from removed content are taken back.
        </p>
      </div>

      <div className="mt-8 text-center">
        <ButtonLink href="/new" size="lg">
          Share a finding
        </ButtonLink>
      </div>
    </div>
  );
}
