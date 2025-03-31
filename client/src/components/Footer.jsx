import PageWrapper from "../layouts/PageWrapper";

export default function Footer() {
  const date = new Date().getFullYear();
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 py-16 mt-8 text-neutral-500 text-sm">
      <PageWrapper>
        <p className="font-semibold">tablab</p>
        <p>Powered by React, React Router, Tailwind, and Vercel</p>
        <p>&copy; Gage Krause {date}</p>
      </PageWrapper>
    </footer>
  );
}
