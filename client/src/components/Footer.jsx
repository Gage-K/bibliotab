import PageWrapper from "../layouts/PageWrapper";

export default function Footer() {
  const date = new Date().getFullYear();
  return (
    <footer className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-16 mt-8 text-neutral-600 dark:text-neutral-400 text-sm">
      <PageWrapper>
        <p className="font-semibold">tablab</p>
        <p>Powered by React and Vercel</p>
        <p>&copy; Gage Krause {date}</p>
      </PageWrapper>
    </footer>
  );
}
