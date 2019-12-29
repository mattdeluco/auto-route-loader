const fs = require('fs');

const requiredParameter = (message) => {
  throw new Error(message);
};

function loader(routerFactoryFn, options = {}) {
  const routerFactory = routerFactoryFn || requiredParameter('Must provide router factory');
  const directoryWhiteList = options.directoryWhiteList || [];
  const re = options.routesFileNameRegEx || /routes\.js/;
  const routeOptions = options.routeOptions || {};

  const loadRoutes = function(rootPath, router) {
    router = router || requiredParameter('Must provide router');
    let hasRoutes = false;
    fs.readdirSync(rootPath).forEach(f => {
      let newPath = `${rootPath}/${f}`;
      let fstat = fs.statSync(newPath);
      if (fstat.isDirectory() && directoryWhiteList.includes(f)) {
        let subRouter = routerFactory();
        if (loadRoutes(newPath, subRouter)) {
          router.use(`/${f}`, subRouter);
          hasRoutes = true;
        }
      } else if (fstat.isFile() && re.test(f)) {
        require(newPath)(router, routeOptions);
        hasRoutes = true;
      }
    });
    return hasRoutes;
  };

  return {
    loadRoutes: loadRoutes
  };
}

module.exports = loader;
