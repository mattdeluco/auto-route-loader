const assert = require('assert'),
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
    account: false
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
          quux: ''
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
});
