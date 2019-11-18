export function RequireMiddleware(root: string, baseUrl: string){
  const path = require('path');
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function (p: string) {
    if (['sass', 'scss'].includes(p.substr(-4)) || p.substr(-3) == 'css') {
      try {
        return originalRequire.call(this, p) as any;
      } catch (e) {
        return
      }
    } else if (['jpg', 'gif', 'bmp', 'png', 'svg'].indexOf(p.substr(-3)) > -1) {
      const pth = this.filename.toString().split('/');
      pth.pop();
      return baseUrl + path.resolve(pth.join('/'), p).substr(root.length);
    }
    return originalRequire.call(this, p);
  };
}