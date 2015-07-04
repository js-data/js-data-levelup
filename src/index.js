let JSData = require('js-data');
let levelup = require('levelup');
let guid = require('mout/random/guid');

let emptyStore = new JSData.DS();
let { DSUtils } = JSData;
let { keys, omit, makePath, deepMixIn, forEach, removeCircular } = DSUtils;
let filter = emptyStore.defaults.defaultFilter;

class Defaults {
  constructor() {
    this.basePath = './db';
    this.valueEncoding = 'json';
  }
}

let queue = [];
let taskInProcess = false;

function enqueue(task) {
  queue.push(task);
}

function dequeue() {
  if (queue.length && !taskInProcess) {
    taskInProcess = true;
    queue[0]();
  }
}

function queueTask(task) {
  if (!queue.length) {
    enqueue(task);
    dequeue();
  } else {
    enqueue(task);
  }
}

function createTask(fn) {
  return new DSUtils.Promise(fn).then(result => {
    taskInProcess = false;
    queue.shift();
    setTimeout(dequeue, 0);
    return result;
  }, err => {
    taskInProcess = false;
    queue.shift();
    setTimeout(dequeue, 0);
    return DSUtils.Promise.reject(err);
  });
}

class DSLevelUpAdapter {
  constructor(options) {
    if (DSUtils.isString(options)) {
      options = {
        basePath: options
      };
    }
    this.defaults = new Defaults();
    deepMixIn(this.defaults, options);
    this.db = levelup(this.defaults.basePath, this.defaults);
  }

  getPath(resourceConfig, options) {
    return makePath(options.basePath || this.defaults.basePath || resourceConfig.basePath, resourceConfig.name);
  }

  getIdPath(resourceConfig, options, id) {
    return makePath(options.basePath || this.defaults.basePath || resourceConfig.basePath, resourceConfig.endpoint, id);
  }

  getIds(resourceConfig, options) {
    let idsPath = this.getPath(resourceConfig, options);
    return new DSUtils.Promise((resolve, reject) => {
      this.db.get(idsPath, (err, ids) => {
        if ((err && !err.message) || (err && err.message && err.message.indexOf('Key not found in database') !== 0)) {
          return reject(err);
        } else if (ids) {
          return resolve(ids);
        } else {
          return this.db.put(idsPath, {}, err => {
            if (err) {
              reject(err);
            } else {
              resolve({});
            }
          });
        }
      });
    });
  }

  saveKeys(ids, resourceConfig, options) {
    let keysPath = this.getPath(resourceConfig, options);
    return new DSUtils.Promise((resolve, reject) => {
      this.db.put(keysPath, ids, err => {
        if (err) {
          reject(err);
        } else {
          resolve(ids);
        }
      });
    });
  }

  ensureId(id, resourceConfig, options) {
    return this.getIds(resourceConfig, options).then(ids => {
      ids[id] = 1;
      return this.saveKeys(ids, resourceConfig, options);
    });
  }

  removeId(id, resourceConfig, options) {
    return this.getIds(resourceConfig, options).then(ids => {
      delete ids[id];
      return this.saveKeys(ids, resourceConfig, options);
    });
  }

  GET(key) {
    return new DSUtils.Promise((resolve, reject) => {
      this.db.get(key, (err, v) => {
        if (err) {
          if (err.message && err.message.indexOf('Key not found in database') === 0) {
            resolve();
          } else {
            reject(err);
          }
        } else {
          resolve(v);
        }
      });
    });
  }

  PUT(key, value) {
    value = removeCircular(value);
    return this.GET(key).then(item => {
      if (item) {
        deepMixIn(item, value);
      }
      return new DSUtils.Promise((resolve, reject) => {
        this.db.put(key, item || value, err => err ? reject(err) : resolve(item || value));
      });
    });
  }

  DEL(key) {
    return new DSUtils.Promise((resolve, reject) => this.db.del(key, err => {
      if (err) {
        if (err.message && err.message.indexOf('Key not found in database') === 0) {
          resolve();
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    }));
  }

  find(resourceConfig, id, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        options = options || {};
        this.GET(this.getIdPath(resourceConfig, options, id)).then(item => {
          if (!item) {
            reject(new Error('Not Found!'));
          } else {
            resolve(item);
          }
        }, reject);
      });
    });
  }

  findAll(resourceConfig, params, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        options = options || {};
        this.getIds(resourceConfig, options).then(ids => {
          let idsArray = keys(ids);
          if (!('allowSimpleWhere' in options)) {
            options.allowSimpleWhere = true;
          }
          let tasks = [];
          forEach(idsArray, id => {
            tasks.push(this.GET(this.getIdPath(resourceConfig, options, id)));
          });
          return DSUtils.Promise.all(tasks);
        }).then(items => {
          return filter.call(emptyStore, items, resourceConfig.name, params, options);
        }).then(resolve, reject);
      });
    });
  }

  create(resourceConfig, attrs, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        let i;
        attrs[resourceConfig.idAttribute] = attrs[resourceConfig.idAttribute] || guid();
        options = options || {};
        this.PUT(
          makePath(this.getIdPath(resourceConfig, options, attrs[resourceConfig.idAttribute])),
          omit(attrs, resourceConfig.relationFields || [])
        ).then(item => {
            i = item;
            return this.ensureId(item[resourceConfig.idAttribute], resourceConfig, options);
          }).then(() => {
            resolve(i);
          }, reject);
      });
    });
  }

  update(resourceConfig, id, attrs, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        let i;
        options = options || {};
        this.PUT(
          this.getIdPath(resourceConfig, options, id),
          omit(attrs, resourceConfig.relationFields || [])
        ).then(item => {
            i = item;
            return this.ensureId(item[resourceConfig.idAttribute], resourceConfig, options);
          }).then(() => resolve(i), reject);
      });
    });
  }

  updateAll(resourceConfig, attrs, params, options) {
    return this.findAll(resourceConfig, params, options).then(items => {
      let tasks = [];
      forEach(items, item => {
        tasks.push(this.update(resourceConfig, item[resourceConfig.idAttribute], omit(attrs, resourceConfig.relationFields || []), options));
      });
      return DSUtils.Promise.all(tasks);
    });
  }

  destroy(resourceConfig, id, options) {
    return createTask((resolve, reject) => {
      queueTask(() => {
        options = options || {};
        this.DEL(this.getIdPath(resourceConfig, options, id)).then(() => {
          return this.removeId(id, resourceConfig, options);
        }).then(() => resolve(null), reject);
      });
    });
  }

  destroyAll(resourceConfig, params, options) {
    return this.findAll(resourceConfig, params, options).then(items => {
      var tasks = [];
      forEach(items, item => {
        tasks.push(this.destroy(resourceConfig, item[resourceConfig.idAttribute], options));
      });
      return DSUtils.Promise.all(tasks);
    });
  }
}

module.exports = DSLevelUpAdapter;