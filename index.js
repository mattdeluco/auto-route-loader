const fs = require('fs');

const requiredParameter = message => {
  throw new Error(message);
};

module.exports = (routerFactoryFn, options = {}) => {
  const routerFactory = routerFactoryFn || requiredParameter('Must provide router factory');
  const directoryWhiteList = options.directoryWhiteList || [];
  const re = options.routesFileNameRegEx || /routes\.js/;
  const routerOptions = options.routerOptions || {};

  const loadRoutes = (rootPath, rootRouter) => {
    const router = rootRouter || requiredParameter('Must provide router');
    let hasRoutes = false;
    fs.readdirSync(rootPath).forEach(filename => {
      const newPath = `${rootPath}/${filename}`;
      const fstat = fs.statSync(newPath);
      if (fstat.isDirectory() && directoryWhiteList.includes(filename)) {
        const subRouter = routerFactory();
        if (loadRoutes(newPath, subRouter)) {
          router.use(`/${filename}`, subRouter);
          hasRoutes = true;
        }
      } else if (fstat.isFile() && re.test(filename)) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        require(newPath)(router, routerOptions);
        hasRoutes = true;
      }
    });
    return hasRoutes;
  };

  return {
    loadRoutes
  };
};
