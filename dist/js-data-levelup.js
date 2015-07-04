module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var JSData = __webpack_require__(1);
	var levelup = __webpack_require__(2);
	var guid = __webpack_require__(3);

	var emptyStore = new JSData.DS();
	var DSUtils = JSData.DSUtils;
	var keys = DSUtils.keys;
	var omit = DSUtils.omit;
	var makePath = DSUtils.makePath;
	var deepMixIn = DSUtils.deepMixIn;
	var forEach = DSUtils.forEach;
	var removeCircular = DSUtils.removeCircular;

	var filter = emptyStore.defaults.defaultFilter;

	var Defaults = function Defaults() {
	  _classCallCheck(this, Defaults);

	  this.basePath = './db';
	  this.valueEncoding = 'json';
	};

	var queue = [];
	var taskInProcess = false;

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
	  return new DSUtils.Promise(fn).then(function (result) {
	    taskInProcess = false;
	    queue.shift();
	    setTimeout(dequeue, 0);
	    return result;
	  }, function (err) {
	    taskInProcess = false;
	    queue.shift();
	    setTimeout(dequeue, 0);
	    return DSUtils.Promise.reject(err);
	  });
	}

	var DSLevelUpAdapter = (function () {
	  function DSLevelUpAdapter(options) {
	    _classCallCheck(this, DSLevelUpAdapter);

	    if (DSUtils.isString(options)) {
	      options = {
	        basePath: options
	      };
	    }
	    this.defaults = new Defaults();
	    deepMixIn(this.defaults, options);
	    this.db = levelup(this.defaults.basePath, this.defaults);
	  }

	  _createClass(DSLevelUpAdapter, [{
	    key: 'getPath',
	    value: function getPath(resourceConfig, options) {
	      return makePath(options.basePath || this.defaults.basePath || resourceConfig.basePath, resourceConfig.name);
	    }
	  }, {
	    key: 'getIdPath',
	    value: function getIdPath(resourceConfig, options, id) {
	      return makePath(options.basePath || this.defaults.basePath || resourceConfig.basePath, resourceConfig.endpoint, id);
	    }
	  }, {
	    key: 'getIds',
	    value: function getIds(resourceConfig, options) {
	      var _this = this;

	      var idsPath = this.getPath(resourceConfig, options);
	      return new DSUtils.Promise(function (resolve, reject) {
	        _this.db.get(idsPath, function (err, ids) {
	          if (err && !err.message || err && err.message && err.message.indexOf('Key not found in database') !== 0) {
	            return reject(err);
	          } else if (ids) {
	            return resolve(ids);
	          } else {
	            return _this.db.put(idsPath, {}, function (err) {
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
	  }, {
	    key: 'saveKeys',
	    value: function saveKeys(ids, resourceConfig, options) {
	      var _this2 = this;

	      var keysPath = this.getPath(resourceConfig, options);
	      return new DSUtils.Promise(function (resolve, reject) {
	        _this2.db.put(keysPath, ids, function (err) {
	          if (err) {
	            reject(err);
	          } else {
	            resolve(ids);
	          }
	        });
	      });
	    }
	  }, {
	    key: 'ensureId',
	    value: function ensureId(id, resourceConfig, options) {
	      var _this3 = this;

	      return this.getIds(resourceConfig, options).then(function (ids) {
	        ids[id] = 1;
	        return _this3.saveKeys(ids, resourceConfig, options);
	      });
	    }
	  }, {
	    key: 'removeId',
	    value: function removeId(id, resourceConfig, options) {
	      var _this4 = this;

	      return this.getIds(resourceConfig, options).then(function (ids) {
	        delete ids[id];
	        return _this4.saveKeys(ids, resourceConfig, options);
	      });
	    }
	  }, {
	    key: 'GET',
	    value: function GET(key) {
	      var _this5 = this;

	      return new DSUtils.Promise(function (resolve, reject) {
	        _this5.db.get(key, function (err, v) {
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
	  }, {
	    key: 'PUT',
	    value: function PUT(key, value) {
	      var _this6 = this;

	      value = removeCircular(value);
	      return this.GET(key).then(function (item) {
	        if (item) {
	          deepMixIn(item, value);
	        }
	        return new DSUtils.Promise(function (resolve, reject) {
	          _this6.db.put(key, item || value, function (err) {
	            return err ? reject(err) : resolve(item || value);
	          });
	        });
	      });
	    }
	  }, {
	    key: 'DEL',
	    value: function DEL(key) {
	      var _this7 = this;

	      return new DSUtils.Promise(function (resolve, reject) {
	        return _this7.db.del(key, function (err) {
	          if (err) {
	            if (err.message && err.message.indexOf('Key not found in database') === 0) {
	              resolve();
	            } else {
	              reject(err);
	            }
	          } else {
	            resolve();
	          }
	        });
	      });
	    }
	  }, {
	    key: 'find',
	    value: function find(resourceConfig, id, options) {
	      var _this8 = this;

	      return createTask(function (resolve, reject) {
	        queueTask(function () {
	          options = options || {};
	          _this8.GET(_this8.getIdPath(resourceConfig, options, id)).then(function (item) {
	            if (!item) {
	              reject(new Error('Not Found!'));
	            } else {
	              resolve(item);
	            }
	          }, reject);
	        });
	      });
	    }
	  }, {
	    key: 'findAll',
	    value: function findAll(resourceConfig, params, options) {
	      var _this9 = this;

	      return createTask(function (resolve, reject) {
	        queueTask(function () {
	          options = options || {};
	          _this9.getIds(resourceConfig, options).then(function (ids) {
	            var idsArray = keys(ids);
	            if (!('allowSimpleWhere' in options)) {
	              options.allowSimpleWhere = true;
	            }
	            var tasks = [];
	            forEach(idsArray, function (id) {
	              tasks.push(_this9.GET(_this9.getIdPath(resourceConfig, options, id)));
	            });
	            return DSUtils.Promise.all(tasks);
	          }).then(function (items) {
	            return filter.call(emptyStore, items, resourceConfig.name, params, options);
	          }).then(resolve, reject);
	        });
	      });
	    }
	  }, {
	    key: 'create',
	    value: function create(resourceConfig, attrs, options) {
	      var _this10 = this;

	      return createTask(function (resolve, reject) {
	        queueTask(function () {
	          var i = undefined;
	          attrs[resourceConfig.idAttribute] = attrs[resourceConfig.idAttribute] || guid();
	          options = options || {};
	          _this10.PUT(makePath(_this10.getIdPath(resourceConfig, options, attrs[resourceConfig.idAttribute])), omit(attrs, resourceConfig.relationFields || [])).then(function (item) {
	            i = item;
	            return _this10.ensureId(item[resourceConfig.idAttribute], resourceConfig, options);
	          }).then(function () {
	            resolve(i);
	          }, reject);
	        });
	      });
	    }
	  }, {
	    key: 'update',
	    value: function update(resourceConfig, id, attrs, options) {
	      var _this11 = this;

	      return createTask(function (resolve, reject) {
	        queueTask(function () {
	          var i = undefined;
	          options = options || {};
	          _this11.PUT(_this11.getIdPath(resourceConfig, options, id), omit(attrs, resourceConfig.relationFields || [])).then(function (item) {
	            i = item;
	            return _this11.ensureId(item[resourceConfig.idAttribute], resourceConfig, options);
	          }).then(function () {
	            return resolve(i);
	          }, reject);
	        });
	      });
	    }
	  }, {
	    key: 'updateAll',
	    value: function updateAll(resourceConfig, attrs, params, options) {
	      var _this12 = this;

	      return this.findAll(resourceConfig, params, options).then(function (items) {
	        var tasks = [];
	        forEach(items, function (item) {
	          tasks.push(_this12.update(resourceConfig, item[resourceConfig.idAttribute], omit(attrs, resourceConfig.relationFields || []), options));
	        });
	        return DSUtils.Promise.all(tasks);
	      });
	    }
	  }, {
	    key: 'destroy',
	    value: function destroy(resourceConfig, id, options) {
	      var _this13 = this;

	      return createTask(function (resolve, reject) {
	        queueTask(function () {
	          options = options || {};
	          _this13.DEL(_this13.getIdPath(resourceConfig, options, id)).then(function () {
	            return _this13.removeId(id, resourceConfig, options);
	          }).then(function () {
	            return resolve(null);
	          }, reject);
	        });
	      });
	    }
	  }, {
	    key: 'destroyAll',
	    value: function destroyAll(resourceConfig, params, options) {
	      var _this14 = this;

	      return this.findAll(resourceConfig, params, options).then(function (items) {
	        var tasks = [];
	        forEach(items, function (item) {
	          tasks.push(_this14.destroy(resourceConfig, item[resourceConfig.idAttribute], options));
	        });
	        return DSUtils.Promise.all(tasks);
	      });
	    }
	  }]);

	  return DSLevelUpAdapter;
	})();

	module.exports = DSLevelUpAdapter;

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("js-data");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("levelup");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("mout/random/guid");

/***/ }
/******/ ]);