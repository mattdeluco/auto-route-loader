const _ = require('lodash'),
  assert = require('assert'),
  listEndpoints = require('express-list-endpoints'),
  mockRequire = require('mock-require'),
  mockFS = require('mock-fs'),
  routeLoader = require('../index.js'),
  { Router } = require('express');

const { after, before, beforeEach, describe, it } = require('mocha');

describe('Test Suite', () => {
  const routerFactoryFn = () =>
    Router({
      strict: true,
      mergeParams: true,
      caseSensitive: false
    });

  let routes_loaded = {
    auth: false,
    account: false,
    bar: false
  };

  before(() => {
    mockRequire('root/auth/routes.js', (router, opts) => {
      routes_loaded.auth = true;
      router.get('', () => {});
    });

    mockRequire('root/account/routes.js', (router, opts) => {
      routes_loaded.account = true;
      router.get('', () => {});
    });

    mockRequire('root/bar/api.js', (router, opts) => {
      routes_loaded.bar = true;
      router.get('', () => {});
    });

    mockFS({
      root: {
        auth: {
          'routes.js': ''
        },
        account: {
          'routes.js': ''
        },
        foo: {},
        bar: {
          baz: '',
          quux: '',
          'api.js': ''
        }
      }
    });
  });

  after(() => {
    mockFS.restore();
    mockRequire.stopAll();
  });

  beforeEach(() => {
    Object.keys(routes_loaded).forEach(r => {
      routes_loaded[r] = false;
    });
  });

  it('requires a router factory parameter', () => {
    assert.throws(routeLoader, {
      name: 'Error',
      message: 'Must provide router factory'
    });
  });

  it('requires a router parameter', () => {
    let loader = routeLoader(routerFactoryFn);
    assert.throws(() => loader.loadRoutes(''), {
      name: 'Error',
      message: 'Must provide router'
    });
  });

  it('should not load any routes', () => {
    let loader = routeLoader(routerFactoryFn);
    loader.loadRoutes('root', routerFactoryFn());
    assert(Object.values(routes_loaded).every(v => !v));
  });

  it('should load only the auth route', () => {
    let loader = routeLoader(routerFactoryFn, { directoryWhiteList: ['auth'] });
    let router = routerFactoryFn();
    loader.loadRoutes('root', router);
    assert(routes_loaded.auth);
    assert(!routes_loaded.account);

    let endpoints = listEndpoints(router);
    assert(endpoints[0].path === '/auth');
  });

  it('should load all whitelisted routes', () => {
    let loader = routeLoader(routerFactoryFn, { directoryWhiteList: ['auth', 'account'] });
    let router = routerFactoryFn();
    loader.loadRoutes('root', router);
    let endpoints = listEndpoints(router);
    let paths = endpoints.map(ep => ep.path.substr(1));

    assert(_.difference(paths, Object.keys(routes_loaded)).length === 0);
    assert(routes_loaded.auth);
    assert(routes_loaded.account);
    assert(!routes_loaded.bar);
  });

  it('should load routes from files with matching pattern', () => {
    let loader = routeLoader(routerFactoryFn, {
      directoryWhiteList: ['auth', 'account', 'bar'],
      routesFileNameRegEx: /api\.js/
    });
    let router = routerFactoryFn();
    loader.loadRoutes('root', router);
    
    let endpoints = listEndpoints(router);
    let paths = endpoints.map(ep => ep.path.substr(1));

    assert(_.difference(paths, Object.keys(routes_loaded)).length === 0);
    assert(routes_loaded.bar);
    assert(!routes_loaded.auth);
    assert(!routes_loaded.account);
  });
});
