const s = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const range = (size: number) => Array.apply(null, Array(size)).map((a, i) => i);
export const step = (x: number) => x >= 0 ? 1 : 0;
export const ramp = (x: number) => +x * step(x);
export const xrange = (start: number, size: number) => Array.apply(null, Array(~~(size - start + 1))).map((_, j) => j + Math.floor(start));

export function optional<T>(fn: () => T, def?: T): T {
  try {
    const res = fn() as any;
    if (!res && res !== 0)
      return def;
    return res;
  } catch (e) {
    return def;
  }
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

export const randomString = (n: number) => Array(n).join().split(',').map(function () {
  return s.charAt(Math.floor(Math.random() * s.length));
}).join('');
