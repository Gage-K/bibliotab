
export default function PageWrapper(props) {
  return (
    <div className="page-wrapper px-2 md:px-16 max-w-5xl mx-auto">
      {props.children}
    </div>
  );
}
