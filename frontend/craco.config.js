const path = require("path");
require("dotenv").config();

const enableHealthCheck = process.env.ENABLE_HEALTH_CHECK === "true";

let healthPluginInstance = null;
let setupHealthEndpoints = null;

if (enableHealthCheck) {
try {
const WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
healthPluginInstance = new WebpackHealthPlugin();
} catch (err) {
console.warn("[health-check] Health check plugin not available:", err.message);
}
}

module.exports = {
eslint: {
configure: {
extends: ["plugin:react-hooks/recommended"],
rules: {
"react-hooks/rules-of-hooks": "error",
"react-hooks/exhaustive-deps": "warn",
},
},
},

webpack: {
alias: {
"@": path.resolve(__dirname, "src"),
},

```
configure: (config) => {
  config.watchOptions = {
    ...config.watchOptions,
    ignored: [
      "**/node_modules/**",
      "**/.git/**",
      "**/build/**",
      "**/dist/**",
      "**/coverage/**",
    ],
  };

  if (enableHealthCheck && healthPluginInstance) {
    config.plugins.push(healthPluginInstance);
  }

  return config;
},
```

},

devServer: (devServerConfig) => {
if (
enableHealthCheck &&
setupHealthEndpoints &&
healthPluginInstance
) {
const originalSetupMiddlewares =
devServerConfig.setupMiddlewares;

```
  devServerConfig.setupMiddlewares = (
    middlewares,
    devServer
  ) => {
    if (originalSetupMiddlewares) {
      middlewares = originalSetupMiddlewares(
        middlewares,
        devServer
      );
    }

    setupHealthEndpoints(
      devServer,
      healthPluginInstance
    );

    return middlewares;
  };
}

return devServerConfig;
```

},
};
