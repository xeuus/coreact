export function Observable<T>() {
	return function (target: any, key: string) {
		Object.defineProperty(target, '__observable__' + key, {
			writable: false,
			value: null,
			configurable: false,
			enumerable: false
		})
	}
}