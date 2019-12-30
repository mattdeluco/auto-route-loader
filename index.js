const fs = require('fs');

const requiredParameter = message => {
  throw new Error(message);
};

module.exports = function(routerFactoryFn, options = {}) {
  const routerFactory = routerFactoryFn || requiredParameter('Must provide router factory');
  const directoryWhiteList = options.directoryWhiteList || [];
  const re = options.routesFileNameRegEx || /routes\.js/;
  const routeOptions = options.routeOptions || {};

  const loadRoutes = function(rootPath, router) {
    router = router || requiredParameter('Must provide router');
    let hasRoutes = false;
    fs.readdirSync(rootPath).forEach(filename => {
      let newPath = `${rootPath}/${filename}`;
      let fstat = fs.statSync(newPath);
      if (fstat.isDirectory() && directoryWhiteList.includes(filename)) {
        let subRouter = routerFactory();
        if (loadRoutes(newPath, subRouter)) {
          router.use(`/${filename}`, subRouter);
          hasRoutes = true;
        }
      } else if (fstat.isFile() && re.test(filename)) {
        require(newPath)(router, routeOptions);
        hasRoutes = true;
      }
    });
    return hasRoutes;
  };

  return {
    loadRoutes: loadRoutes
  };
};
