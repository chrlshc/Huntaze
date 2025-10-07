export default function LoadingOFAnalytics() {
  return (
    <div className="space-y-4">
      {[...Array(2)].map((_,i)=>(
        <div key={i} className="h-56 rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-full w-full bg-slate-200 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

