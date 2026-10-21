import { ButtonLink, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-12">
      <EmptyState icon="🧭" title="This page doesn't exist" action={<ButtonLink href="/">Back to home</ButtonLink>}>
        The link may be broken, or the page was moved.
      </EmptyState>
    </div>
  );
}
