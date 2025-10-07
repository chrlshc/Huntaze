export default function LoadingOFInbox() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_,i)=>(
        <div key={i} className="h-12 rounded-lg bg-slate-200 animate-pulse" />
      ))}
    </div>
  );
}

