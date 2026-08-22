export default function Loading() {
  return (
    <div className="grid cols-2">
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 180 }} />
      <div className="skeleton" style={{ height: 180 }} />
    </div>
  );
}
