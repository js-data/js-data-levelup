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

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var JSData = __webpack_require__(1);
	var levelup = __webpack_require__(2);
	var guid = __webpack_require__(3);
	var unique = __webpack_require__(4);
	var map = __webpack_require__(5);

	var emptyStore = new JSData.DS();
	var DSUtils = JSData.DSUtils;

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
	    DSUtils.deepMixIn(this.defaults, options);
	    this.db = levelup(this.defaults.basePath, this.defaults);
	  }

	  _createClass(DSLevelUpAdapter, [{
	    key: 'getPath',
	    value: function getPath(resourceConfig, options) {
	      return DSUtils.makePath(options.basePath || this.defaults.basePath || resourceConfig.basePath, resourceConfig.name);
	    }
	  }, {
	    key: 'getIdPath',
	    value: function getIdPath(resourceConfig, options, id) {
	      return DSUtils.makePath(options.basePath || this.defaults.basePath || resourceConfig.basePath, resourceConfig.endpoint, id);
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

	      value = DSUtils.removeCircular(value);
	      return this.GET(key).then(function (item) {
	        if (item) {
	          DSUtils.deepMixIn(item, value);
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

	      var instance = undefined;
	      return new DSUtils.Promise(function (resolve, reject) {
	        options = options || {};
	        options['with'] = options['with'] || [];
	        _this8.GET(_this8.getIdPath(resourceConfig, options, id)).then(function (item) {
	          if (!item) {
	            reject(new Error('Not Found!'));
	          } else {
	            resolve(item);
	          }
	        }, reject);
	      }).then(function (_instance) {
	        instance = _instance;
	        var tasks = [];

	        DSUtils.forEach(resourceConfig.relationList, function (def) {
	          var relationName = def.relation;
	          var relationDef = resourceConfig.getResource(relationName);
	          var containedName = null;
	          if (DSUtils.contains(options['with'], relationName)) {
	            containedName = relationName;
	          } else if (DSUtils.contains(options['with'], def.localField)) {
	            containedName = def.localField;
	          }
	          if (containedName) {
	            (function () {
	              var __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options);
	              __options = DSUtils._(relationDef, __options);
	              DSUtils.remove(__options['with'], containedName);
	              DSUtils.forEach(__options['with'], function (relation, i) {
	                if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
	                  __options['with'][i] = relation.substr(containedName.length + 1);
	                }
	              });

	              var task = undefined;

	              if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
	                task = _this8.findAll(resourceConfig.getResource(relationName), {
	                  where: _defineProperty({}, def.foreignKey, {
	                    '==': instance[resourceConfig.idAttribute]
	                  })
	                }, __options).then(function (relatedItems) {
	                  if (def.type === 'hasOne' && relatedItems.length) {
	                    DSUtils.set(instance, def.localField, relatedItems[0]);
	                  } else {
	                    DSUtils.set(instance, def.localField, relatedItems);
	                  }
	                  return relatedItems;
	                });
	              } else if (def.type === 'hasMany' && def.localKeys) {
	                var localKeys = [];
	                var itemKeys = instance[def.localKeys] || [];
	                itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys);
	                localKeys = localKeys.concat(itemKeys || []);
	                task = _this8.findAll(resourceConfig.getResource(relationName), {
	                  where: _defineProperty({}, relationDef.idAttribute, {
	                    'in': DSUtils.filter(unique(localKeys), function (x) {
	                      return x;
	                    })
	                  })
	                }, __options).then(function (relatedItems) {
	                  DSUtils.set(instance, def.localField, relatedItems);
	                  return relatedItems;
	                });
	              } else if (def.type === 'belongsTo' || def.type === 'hasOne' && def.localKey) {
	                task = _this8.find(resourceConfig.getResource(relationName), DSUtils.get(instance, def.localKey), __options).then(function (relatedItem) {
	                  DSUtils.set(instance, def.localField, relatedItem);
	                  return relatedItem;
	                });
	              }

	              if (task) {
	                tasks.push(task);
	              }
	            })();
	          }
	        });

	        return DSUtils.Promise.all(tasks);
	      }).then(function () {
	        return instance;
	      });
	    }
	  }, {
	    key: 'findAll',
	    value: function findAll(resourceConfig, params, options) {
	      var _this9 = this;

	      var items = null;
	      return new DSUtils.Promise(function (resolve, reject) {
	        options = options || {};
	        options['with'] = options['with'] || [];
	        _this9.getIds(resourceConfig, options).then(function (ids) {
	          var idsArray = DSUtils.keys(ids);
	          if (!('allowSimpleWhere' in options)) {
	            options.allowSimpleWhere = true;
	          }
	          var tasks = [];
	          DSUtils.forEach(idsArray, function (id) {
	            tasks.push(_this9.GET(_this9.getIdPath(resourceConfig, options, id)));
	          });
	          return DSUtils.Promise.all(tasks);
	        }).then(function (items) {
	          return filter.call(emptyStore, items, resourceConfig.name, params, options);
	        }).then(resolve, reject);
	      }).then(function (_items) {
	        items = _items;
	        var tasks = [];
	        DSUtils.forEach(resourceConfig.relationList, function (def) {
	          var relationName = def.relation;
	          var relationDef = resourceConfig.getResource(relationName);
	          var containedName = null;
	          if (DSUtils.contains(options['with'], relationName)) {
	            containedName = relationName;
	          } else if (DSUtils.contains(options['with'], def.localField)) {
	            containedName = def.localField;
	          }
	          if (containedName) {
	            (function () {
	              var __options = DSUtils.deepMixIn({}, options.orig ? options.orig() : options);
	              __options = DSUtils._(relationDef, __options);
	              DSUtils.remove(__options['with'], containedName);
	              DSUtils.forEach(__options['with'], function (relation, i) {
	                if (relation && relation.indexOf(containedName) === 0 && relation.length >= containedName.length && relation[containedName.length] === '.') {
	                  __options['with'][i] = relation.substr(containedName.length + 1);
	                }
	              });

	              var task = undefined;

	              if ((def.type === 'hasOne' || def.type === 'hasMany') && def.foreignKey) {
	                task = _this9.findAll(resourceConfig.getResource(relationName), {
	                  where: _defineProperty({}, def.foreignKey, {
	                    'in': DSUtils.filter(map(items, function (item) {
	                      return DSUtils.get(item, resourceConfig.idAttribute);
	                    }), function (x) {
	                      return x;
	                    })
	                  })
	                }, __options).then(function (relatedItems) {
	                  DSUtils.forEach(items, function (item) {
	                    var attached = [];
	                    DSUtils.forEach(relatedItems, function (relatedItem) {
	                      if (DSUtils.get(relatedItem, def.foreignKey) === item[resourceConfig.idAttribute]) {
	                        attached.push(relatedItem);
	                      }
	                    });
	                    if (def.type === 'hasOne' && attached.length) {
	                      DSUtils.set(item, def.localField, attached[0]);
	                    } else {
	                      DSUtils.set(item, def.localField, attached);
	                    }
	                  });
	                  return relatedItems;
	                });
	              } else if (def.type === 'hasMany' && def.localKeys) {
	                (function () {
	                  var localKeys = [];
	                  DSUtils.forEach(items, function (item) {
	                    var itemKeys = item[def.localKeys] || [];
	                    itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys);
	                    localKeys = localKeys.concat(itemKeys || []);
	                  });
	                  task = _this9.findAll(resourceConfig.getResource(relationName), {
	                    where: _defineProperty({}, relationDef.idAttribute, {
	                      'in': DSUtils.filter(unique(localKeys), function (x) {
	                        return x;
	                      })
	                    })
	                  }, __options).then(function (relatedItems) {
	                    DSUtils.forEach(items, function (item) {
	                      var attached = [];
	                      var itemKeys = item[def.localKeys] || [];
	                      itemKeys = Array.isArray(itemKeys) ? itemKeys : DSUtils.keys(itemKeys);
	                      DSUtils.forEach(relatedItems, function (relatedItem) {
	                        if (itemKeys && DSUtils.contains(itemKeys, relatedItem[relationDef.idAttribute])) {
	                          attached.push(relatedItem);
	                        }
	                      });
	                      DSUtils.set(item, def.localField, attached);
	                    });
	                    return relatedItems;
	                  });
	                })();
	              } else if (def.type === 'belongsTo' || def.type === 'hasOne' && def.localKey) {
	                task = _this9.findAll(resourceConfig.getResource(relationName), {
	                  where: _defineProperty({}, relationDef.idAttribute, {
	                    'in': DSUtils.filter(map(items, function (item) {
	                      return DSUtils.get(item, def.localKey);
	                    }), function (x) {
	                      return x;
	                    })
	                  })
	                }, __options).then(function (relatedItems) {
	                  DSUtils.forEach(items, function (item) {
	                    DSUtils.forEach(relatedItems, function (relatedItem) {
	                      if (relatedItem[relationDef.idAttribute] === item[def.localKey]) {
	                        DSUtils.set(item, def.localField, relatedItem);
	                      }
	                    });
	                  });
	                  return relatedItems;
	                });
	              }

	              if (task) {
	                tasks.push(task);
	              }
	            })();
	          }
	        });
	        return DSUtils.Promise.all(tasks);
	      }).then(function () {
	        return items;
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
	          _this10.PUT(DSUtils.makePath(_this10.getIdPath(resourceConfig, options, attrs[resourceConfig.idAttribute])), DSUtils.omit(attrs, resourceConfig.relationFields || [])).then(function (item) {
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
	          _this11.PUT(_this11.getIdPath(resourceConfig, options, id), DSUtils.omit(attrs, resourceConfig.relationFields || [])).then(function (item) {
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
	        DSUtils.forEach(items, function (item) {
	          tasks.push(_this12.update(resourceConfig, item[resourceConfig.idAttribute], DSUtils.omit(attrs, resourceConfig.relationFields || []), options));
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
	        DSUtils.forEach(items, function (item) {
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

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("mout/array/unique");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("mout/array/map");

/***/ }
/******/ ]);