export default function FilterBar({ children }) {
  return (
    <div className="filter-bar">
      <div className="min-w-0 flex items-center gap-2 w-full">{children}</div>
    </div>
  );
}
