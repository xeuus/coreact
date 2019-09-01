type Packet = { type: string; data: any, callback?: (status: boolean, message?: any) => any };
type Listener<A = any> = (data: A) => any
type BulkListener = (data: { [key: string]: any }) => any
type Queue = Packet[]

export class Bus {
	private events: any = {};
	private queue: Queue = [];

	public listen<A = any>(type: string, listener: Listener<A>) {
		let found = this.events[type] = this.events[type] || [];
		if (found.indexOf(listener) < 0) {
			found.push(listener);
		}
		const index = found.length - 1;
		return () => {
			found.splice(index, 1);
		}
	}

	public dispatch<A = any>(type: string, data: A): Promise<any> {
		return new Promise((accepts, rejects) => {
			const list = this.events[type];
			this.queue.push({
				type,
				data,
				callback: (status, message) => {
					if (status) {
						accepts(data);
					} else {
						rejects(message);
					}
				},
			});
			this.queueWorker();
		});
	}

	private queueWorker = () => {
			for (let event of this.queue) {
				const { type, data, callback } = event;
				const listeners = this.events[type];
				const index = this.queue.indexOf(event);
				if (!(!listeners || !listeners[0])) {
					listeners.map((a: Listener) => a(data));
					if (callback) {
						callback(true);
					}
				} else {
					if (callback) {
						//callback(false, `Listener not found for ${type}`);
					}
				}
				if (index > -1) {
					this.queue.splice(index, 1);
				}
			}
	};
}
