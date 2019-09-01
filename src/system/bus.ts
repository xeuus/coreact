import { Mutex } from './mutex';

type Packet = { type: string; data: any, callback?: (status: boolean, message?: any) => any };
type Listener<A = any> = (data: A) => any
type Queue = Packet[]

export class Bus {
	private events: any = {};
	private queue: Queue = [];
	private mutex = new Mutex();

	public listen<A = any>(type: string, listener: Listener<A>) {
		let found = this.events[type] = this.events[type] || [];
		if (found.indexOf(listener) < 0) {
			this.mutex.dispatch(async () => {
				found.push(listener);
			});
		}
		const index = found.length - 1;
		return () => {
			this.mutex.dispatch(async () => {
				found.splice(index, 1);
			});
		};
	}

	public dispatch<A = any>(type: string, data: A): Promise<any> {
		return new Promise((accepts, rejects) => {
			this.mutex.dispatch(async () => {
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
			});
			this.queueWorker();
		});
	}

	private queueWorker = () => {
		setTimeout(() => {
			this.mutex.lock().then((unlock) => {
				for (let event of this.queue) {
					const { type, data, callback } = event;
					const listeners = this.events[type];
					const index = this.queue.indexOf(event);
					if (!(!listeners || !listeners[0])) {
						listeners.map((a: Listener) => a(data));
						if (callback) {
							callback(true);
						}
					}
					if (index > -1) {
						this.queue.splice(index, 1);
					}
				}
				unlock();
			});
		}, 0);
	};
}
