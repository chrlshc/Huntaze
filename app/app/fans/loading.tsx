export default function LoadingFans() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(9)].map((_,i)=>(
        <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-6 w-1/2 bg-slate-200 animate-pulse rounded" />
          <div className="mt-3 h-4 w-2/3 bg-slate-200 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

