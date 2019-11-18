/* tslint:disable:no-increment-decrement */

// tslint:disable-next-line:max-line-length
const PATH_REGEXP = new RegExp(['(\\\\.)', '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'].join('|'), 'g');

const DEFAULT_DELIMITER = '/';
const DEFAULT_DELIMITERS = './';

const cache: any = {};
const cacheLimit = 10000;
let cacheCount = 0;

function parse(str: any, options: any) {
  const tokens = [];
  let key = 0;
  let index = 0;
  let path = '';
  const defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
  const delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
  let pathEscaped = false;
  let res;

  while ((res = PATH_REGEXP.exec(str)) !== null) {
    const m = res[0];
    const escaped = res[1];
    const offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;
    if (escaped) {
      path += escaped[1];
      pathEscaped = true;
      continue;
    }
    let prev = '';
    const next = str[index];
    const name = res[2];
    const capture = res[3];
    const group = res[4];
    const modifier = res[5];

    if (!pathEscaped && path.length) {
      const k = path.length - 1;

      if (delimiters.indexOf(path[k]) > -1) {
        prev = path[k];
        path = path.slice(0, k);
      }
    }
    if (path) {
      tokens.push(path);
      path = '';
      pathEscaped = false;
    }
    const partial = prev !== '' && next !== undefined && next !== prev;
    const repeat = modifier === '+' || modifier === '*';
    const optional = modifier === '?' || modifier === '*';
    const delimiter = prev || defaultDelimiter;
    const pattern = capture || group;

    tokens.push({
      delimiter,
      optional,
      repeat,
      partial,
      name: name || key++,
      prefix: prev,
      pattern: pattern ? escapeGroup(pattern) : `[^${escapeString(delimiter)}]+?`,
    });
  }
  if (path || index < str.length) {
    tokens.push(path + str.substr(index));
  }

  return tokens;
}

function escapeString(str: any) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
}

function escapeGroup(group: any) {
  return group.replace(/([=!:$/()])/g, '\\$1');
}

function flags(options: any) {
  return options && options.sensitive ? '' : 'i';
}

function regexpToRegexp(path: any, keys: any) {
  if (!keys) return path;

  // Use a negative lookahead to match only capturing groups.
  const groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (let i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        pattern: null,
      });
    }
  }

  return path;
}

function arrayToRegexp(path: any, keys: any, options: any): RegExp {
  const parts = [];

  for (let i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  return new RegExp(`(?:${parts.join('|')})`, flags(options));
}

function stringToRegexp(path: any, keys: any, options: any) {
  return tokensToRegExp(parse(path, options), keys, options);
}

function tokensToRegExp(tokens: any, keys: any, options: any = {}) {

  const strict = options.strict;
  const start = options.start !== false;
  const end = options.end !== false;
  const delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
  const delimiters = options.delimiters || DEFAULT_DELIMITERS;
  const endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
  let route = start ? '^' : '';
  let isEndDelimited = tokens.length === 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
      isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
    } else {
      const capture = token.repeat
        ? `(?:${token.pattern})(?:${escapeString(token.delimiter)}(?:${token.pattern}))*`
        : token.pattern;

      if (keys) keys.push(token);

      if (token.optional) {
        if (token.partial) {
          route += `${escapeString(token.prefix)}(${capture})?`;
        } else {
          route += `(?:${escapeString(token.prefix)}(${capture}))?`;
        }
      } else {
        route += `${escapeString(token.prefix)}(${capture})`;
      }
    }
  }

  if (end) {
    if (!strict) route += `(?:${delimiter})?`;
    route += endsWith === '$' ? '$' : `(?=${endsWith})`;
  } else {
    if (!strict) route += `(?:${delimiter}(?=${endsWith}))?`;
    if (!isEndDelimited) route += `(?=${delimiter}|${endsWith})`;
  }

  return new RegExp(route, flags(options));
}

function pathToRegexp(path: any, keys: any, options: any) {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys);
  }

  if (Array.isArray(path)) {
    return arrayToRegexp(path, keys, options);
  }

  return stringToRegexp(path, keys, options);
}

function compilePath(path: any, options: any) {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  const keys: any = [];
  const regexp = pathToRegexp(path, keys, options);
  const result = {regexp, keys};

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
}

export interface RoutePattern {
  path: string;
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
}

export interface MatchResult {
  path: string;
  url: string;
  isExact: boolean;
  params: { [key: string]: string };
}

export function MatchRoute(uri: string, pattern: RoutePattern): MatchResult {
  const {path, exact = false, strict = false, sensitive = false} = pattern;

  const paths = [].concat(path);

  return paths.reduce((matched, path) => {
    if (matched) return matched;
    const {regexp, keys} = compilePath(path, {
      strict,
      sensitive,
      end: exact,
    });
    const match = regexp.exec(uri);

    if (!match) return null;

    const [url, ...values] = match;
    const isExact = uri === url;

    if (exact && !isExact) return null;

    return {
      isExact,
      path,
      url: path === '/' && url === '' ? '/' : url,
      params: keys.reduce((memo: any, key: any, index: string) => {
        memo[key.name] = values[index];
        return memo;
      }, {}),
    };
  }, null);
}
