export function SkeletonLine() {
  return (
    <div className="max-w-lg h-16 my-8 bg-muted animate-pulse rounded-sm"></div>
  );
}

export function SkeletonText() {
  const elements = Array.from({ length: Math.floor(Math.random() * 3) + 3 });

  return (
    <div className="animate-pulse">
      {elements.map((_element, index) => (
        <div
          key={index}
          className="max-w-full h-8 my-4 bg-muted rounded-sm"></div>
      ))}
    </div>
  );
}
