# route-loader

Automatically traverse an Express project and load routes.

route-loader will recursively traverse the project directory
structure loading `routes.js` files from whitelisted directories.

Given some project with the following directory structure:

```
project/
  auth/routes.js
  account/routes.js
  feature1/routes.js
  feature2/routes.js
  ...
```

And given some example router file:

```
// project/auth/routes.js

module.exports = function (router, opts = {}) {
  const db = opts.db;

  router.post(
    '/authenticate',
    (req, res) => { ... }
  );

  router.get(
    '/logout',
    (req, res) => { ... }
  );
}
```

The following is an example of how to load all the routes in
that project.

```
// project/app.js

const express = require('express'),
  pgp = require('pg-promise')(),
  routeLoader = require('route-loader');

const routerFactoryFn = () =>
  express.Router({
    strict: true,
    mergeParams: true,
    caseSensitive: false
  });

const app = express();
const db = pgp(...);
const rootRouter = routerFactoryFn();
const loader = routeLoader(routerFactoryFn, {
  directoryWhiteList: [
    'auth', 'account', 'feature1', 'feature2'
  ],
  routerOptions: {db: db}
});

loader.loadRoutes(__dirname, rootRouter);

app.use('/api', rootRouter);
```

Routes will be created at the following paths:

```
/api
  auth/
    authenticate (POST)
    logout (GET)
  account
  feature1
  feature2
```

## Route Loader

Route Loader is configured with several options and returns a
loader object with one function `loadRoutes()`.

`routeLoader(routerFactoryFn, options)`

- routerFactoryFn: **required** a router factory function (see
  [Router Factory](#router-factory) below)
- options: **optional** an options object
  - directoryWhiteList: a list of directory basenames from
    which loading route files is permissible, empty by default
  - re: a regular expression against which to match route filenames,
    default is `/routes\.js/`
  - routerOptions: an arbitrary object to be passed on to the route
    files as they're loaded - e.g. a database connection object

## loadRoutes()

`loader.loadRoutes(<root path>, <root router>)`

- root path: the path from which to recursively descend and load
  route files. If loading routes from `app.js` in the project's
  root directory, use [\_\_dirname](https://nodejs.org/docs/latest/api/globals.html#globals_dirname)
- root router: the router to which all descendant routers attach,
  typically created with the previously defined
  [routerFactoryFn](#router-factory)

## Router Factory

A router factory function is necessary to create new routers for each
routes.js file using the same configuration. The factory function is
passed into a routeLoader.

```
const express = require('express')
  routeLoader = require('route-loader');

const routerFactoryFn = () =>
  express.Router({
    strict: true,
    mergeParams: true,
    caseSensitive: false
  });

const loader = routeLoader(routerFactoryFn);
```
