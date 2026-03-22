export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-wrapper px-2 md:px-16 max-w-5xl mx-auto">
      {children}
    </div>
  );
}
