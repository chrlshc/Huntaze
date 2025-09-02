export class EventEmitter {
  private clients: Set<ReadableStreamDefaultController<Uint8Array>> = new Set();

  addClient(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.clients.add(controller);
  }

  removeClient(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.clients.delete(controller);
  }

  emit(event: any) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
    this.clients.forEach((controller) => {
      try {
        controller.enqueue(data);
      } catch {
        this.clients.delete(controller);
      }
    });
  }
}

export const eventEmitter = new EventEmitter();

