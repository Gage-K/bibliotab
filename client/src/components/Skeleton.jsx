export function SkeletonLine({ size }) {
  const elementSize = `max-w-lg h-${size} my-4 bg-neutral-300 dark:bg-neutral-700 animate-pulse rounded-sm`;
  return <div className={elementSize}></div>;
}

export function SkeletonText({ size }) {
  const elements = Array.from({ length: Math.floor(Math.random() * 3) + 3 });
  console.log(elements);
  return (
    <div className="animate-pulse">
      {elements.map((element, index) => (
        <div
          key={index}
          className={`max-w-full h-${size} my-4 bg-neutral-300 dark:bg-neutral-700  rounded-sm`}></div>
      ))}
    </div>
  );
}
