type Sink = (data: any) => void;

class SseRegistry {
  private byModel = new Map<string, Set<Sink>>();

  subscribe(modelId: string, sink: Sink) {
    const set = this.byModel.get(modelId) ?? new Set<Sink>();
    set.add(sink);
    this.byModel.set(modelId, set);
    return () => {
      const s = this.byModel.get(modelId);
      if (!s) return;
      s.delete(sink);
      if (s.size === 0) this.byModel.delete(modelId);
    };
  }

  emit(modelId: string, data: any) {
    const set = this.byModel.get(modelId);
    if (!set || set.size === 0) return;
    for (const sink of set) {
      try { sink(data); } catch { /* drop failing sink */ }
    }
  }
}

export const sseRegistry = new SseRegistry();

