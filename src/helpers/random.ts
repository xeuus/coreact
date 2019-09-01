const s = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const randomString = (n: number) => Array(n).join().split(',').map(function () {
	return s.charAt(Math.floor(Math.random() * s.length));
}).join('');
