export default function LoadingMessages() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_,i)=>(
        <div key={i} className="h-14 rounded-lg bg-slate-200 animate-pulse" />
      ))}
    </div>
  );
}

