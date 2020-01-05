/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

const _ = require('lodash');
const assert = require('assert');
const listEndpoints = require('express-list-endpoints');
const { after, before, beforeEach, describe, it } = require('mocha');
const mockRequire = require('mock-require');
const mockFS = require('mock-fs');
const { Router } = require('express');
const routeLoader = require('../index.js');

describe('Test Suite', () => {
  const routerFactoryFn = () =>
    Router({
      strict: true,
      mergeParams: true,
      caseSensitive: false
    });

  const routesLoaded = {
    auth: false,
    account: false,
    bar: false,
    blackList: false
  };

  before(() => {
    mockRequire('root/auth/routes.js', (router, _opts) => {
      routesLoaded.auth = true;
      router.get('', () => {});
    });

    mockRequire('root/account/routes.js', (router, _opts) => {
      routesLoaded.account = true;
      router.get('', () => {});
    });

    mockRequire('root/blackList/routes.js', (router, _opts) => {
      routesLoaded.account = true;
      router.get('', () => {});
    });

    mockRequire('root/bar/api.js', (router, _opts) => {
      routesLoaded.bar = true;
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
        blackList: {
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
    Object.keys(routesLoaded).forEach(r => {
      routesLoaded[r] = false;
    });
  });

  it('requires a router factory parameter', () => {
    assert.throws(routeLoader, {
      name: 'Error',
      message: 'Must provide router factory'
    });
  });

  it('requires a router parameter', () => {
    const loader = routeLoader(routerFactoryFn);
    assert.throws(() => loader.loadRoutes(''), {
      name: 'Error',
      message: 'Must provide router'
    });
  });

  it('should not load any routes', () => {
    const loader = routeLoader(routerFactoryFn);
    loader.loadRoutes('root', routerFactoryFn());
    assert(Object.values(routesLoaded).every(v => !v));
  });

  it('should load only the auth route', () => {
    const loader = routeLoader(routerFactoryFn, { directoryWhiteList: ['auth'] });
    const router = routerFactoryFn();
    loader.loadRoutes('root', router);
    assert(routesLoaded.auth);
    assert(!routesLoaded.account);

    const endpoints = listEndpoints(router);
    assert(endpoints[0].path === '/auth');
  });

  it('should load all whitelisted routes', () => {
    const loader = routeLoader(routerFactoryFn, { directoryWhiteList: ['auth', 'account'] });
    const router = routerFactoryFn();
    loader.loadRoutes('root', router);
    const endpoints = listEndpoints(router);
    const paths = endpoints.map(ep => ep.path.substr(1));

    assert(_.difference(paths, Object.keys(routesLoaded)).length === 0);
    assert(routesLoaded.auth);
    assert(routesLoaded.account);
    assert(!routesLoaded.bar);
  });

  it('should load routes from files with matching pattern', () => {
    const loader = routeLoader(routerFactoryFn, {
      directoryWhiteList: ['auth', 'account', 'bar'],
      routesFileNameRegEx: /api\.js/
    });
    const router = routerFactoryFn();
    loader.loadRoutes('root', router);

    const endpoints = listEndpoints(router);
    const paths = endpoints.map(ep => ep.path.substr(1));

    assert(_.difference(paths, Object.keys(routesLoaded)).length === 0);
    assert(routesLoaded.bar);
    assert(!routesLoaded.auth);
    assert(!routesLoaded.account);
  });

  it('should skip blacklisted directories', () => {
    const loader = routeLoader(routerFactoryFn, {
      directoryWhiteList: ['auth', 'blackList'],
      directoryBlackList: ['blackList']
    });
    const router = routerFactoryFn();
    loader.loadRoutes('root', router);

    const endpoints = listEndpoints(router);
    assert(endpoints.length === 1);
    assert(routesLoaded.auth);
    assert(!routesLoaded.blackList);
  });
});
