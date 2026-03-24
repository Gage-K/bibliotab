export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t py-8 text-center text-sm text-muted-foreground mt-auto">
      <p>
        Built by{" "}
        <a
          href="https://gagekrause.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Gage Krause
        </a>
      </p>
      <p className="mt-1">&copy; {year}</p>
    </footer>
  );
}
