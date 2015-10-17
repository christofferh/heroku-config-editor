'use strict';

let cli = require('heroku-cli-util');
let os = require('os');
let fs = require('fs');
let spawn = require('child_process').spawn;
let tmp = require('tmp');

let deletedConfigs = (oldConfig, newConfig) => {
  return Object.keys(oldConfig).filter((key) => {
    return !(key in newConfig);
  });
};

let readConfig = (filename) => {
  return new Promise(
    (resolve, reject) => {
      var file = {};
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) { reject(err); }

        var rows = data.toString().split('\n');
        rows.forEach((value) => {
          if (value === '') { return; }
          var config = value.split(/=(.+)?/);
          file[config[0]] = config[1];
        });

        resolve(file);
    });
  });
};

let writeConfig = (config) => {
  return tempFile().then((filename) => {
    return new Promise(
      (resolve, reject) => {
        fs.writeFile(filename, formatConfig(config), (err) => {
          if (err) { reject(err); }
          resolve(filename);
        });
      }
    );
  });
};

let formatConfig = (config) => {
  let configVars = [];
  for (var key in config) {
    configVars.push(key + '=' + config[key]);
  }

  return configVars.join('\n');
};

let tempFile = () => {
  return new Promise(
    (resolve, reject) => {
      tmp.file((err, path, fd, cleanupCallback) => {
        resolve(path);
      });
    }
  );
};

let openEditor = (filename) => {
  // NOTE: This will break for whitespaced paths
  let editorWithArgs = process.env.EDITOR.split(/ (.+)?/);
  let editorPath = editorWithArgs[0]
  let editorArgs = editorWithArgs.slice(1)

  return new Promise(
    (resolve, reject) => {
      let editor = spawn(editorPath, [filename].concat(editorArgs), { stdio: 'inherit' });

      editor.on('error', (error) => {
        reject(error);
      });

      editor.on('exit', () => {
        resolve(filename);
      });
    }
  );
};

let updateConfig = (oldConfig, updatedConfig) => {
  return new Promise(
    (resolve, reject) => {
      let deletedKeys = deletedConfigs(oldConfig, updatedConfig);

      deletedKeys.forEach((key) => {
        updatedConfig[key] = null;
      });
      resolve(updatedConfig);
    }
  );
};

module.exports = {
  topic: 'config',
  command: 'editor',
  description: 'opens an editor for updating an app\'s config vars',
  needsApp: true,
  needsAuth: true,
  run: cli.command((context, heroku) => {
    if (process.env.EDITOR === undefined) { cli.error("Environment variable 'EDITOR' not set."); return; }
    return heroku.apps(context.app).configVars().info()
    .then((config) => {
      writeConfig(config)
        .then(openEditor)
        .then(readConfig)
        .then((updatedConfig) => {
          return updateConfig(config, updatedConfig);
        })
        .then((data) => {
          //cli.debug(data)
          return heroku.apps(context.app).configVars().update(data);
        })
        .catch((error) => {
          cli.error(error)
        });
    });
  })
};