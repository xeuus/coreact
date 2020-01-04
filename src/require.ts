export function RequireMiddleware(baseUrl: string, bundleUri: string, rootPath: string, srcPath: string, distPath: string) {
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

      const base = bundleUri + srcPath.substr(rootPath.length);
      return base + path.resolve(pth.join('/'), p).substr(distPath.length);
    }
    return originalRequire.call(this, p);
  };
}
