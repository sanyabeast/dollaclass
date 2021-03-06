"use strict";
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(true);
    } else {
        window.$Class = factory();
        window.$Interface = window.$Class.$Interface;
    }
}(this, function(){

	var $classIDs = [];

	var decomposeExclude = [
		"constructor",
		"hasOwnProperty",
		"isPrototypeOf",
		"propertyIsEnumerable",
		"toLocaleString",
		"toString",
		"valueOf",
		"__defineGetter__",
		"__defineSetter__",
		"__lookupGetter__",
		"__lookupSetter__",
		"__proto__",
	];

	window.k = $classIDs;

	/**Toolchain*/
	var Toolchain = function(){};
	Toolchain.prototype = {
		loop : function(list, cb, ctx){
			if (Array.isArray(list)){
				for (var a = 0, l = list.length; a < l; a++){
					if (cb.call(ctx, list[a], a, list)){
						break;
					}
				}
			} else {
				for (var a in list){
					if (cb.call(ctx, list[a], a, list)){
						break;
					}
				}
			}
		},
		join : function(){
			var args = Array.prototype.slice.call(arguments);
			var joint = args[0];
			var strings = args.slice(1, args.length);
			return strings.join(joint);
		},
		toArray : function(data){
			return Array.prototype.slice.call(data);
		},
		clone : function(data){
			if (data instanceof Array){
				return data.slice();
			} else {
				var result = {};
				this.loop(data, function(value, key){
					result[key] = value;
				}, this);


				return result;
			}
		},
		genRandString : function(length, prefix, postfix){
			var string = "";

            while (string.length < length){
                string = string + (Math.random().toString(32).substring(3, 12));
            }

            string = [(prefix || ""), string.substring(0, length), (postfix || "")].join("");
            return string;
		},
		isDollaClass : function($constructor){
			return $classIDs.indexOf($constructor.$$id) > -1;
		},
		merge : function(objA, objB, deep, noClone){
			var result = noClone === true ? objA : this.clone(objA);
			for (var k in objB){
				result[k] = objB[k];
			}

			return result;
		},
		decompose : function(object){
			var result = {};
			var propNames = Object.getOwnPropertyNames(object);

			if (object.__proto__){
				result = this.merge(result, this.decompose(object.__proto__), false, true);
			}

			this.loop(propNames, function(key){
				if (decomposeExclude.indexOf(key) < 0){
					result[key] = Object.getOwnPropertyDescriptor(object, key);					
				}
			}, this);	

			return result;
		},
		getDescriptor : function(object, key){
			return Object.getOwnPropertyDescriptor(object, key);
		},
	};

	var _ = new Toolchain();

	/**Class implementation*/
	var $Class = function(options, $prototype){
		if (typeof $prototype == "undefined"){
			$prototype = options;
			options = {};
		}


		options = _.clone(options);
		options.name = options.name || _.genRandString("AnonymousClass");
		var $class = this.__createClass(options, $prototype);

		if (options.namespace){
			$Class.$namespace.$export(options.namespace, options.name, $class);
		}

		Object.defineProperty($class, "$$id", {
			value : _.genRandString(32, options.name, "class"),
			enumerable : false,
			writable : false,
			configurable : false
		});

		$classIDs.push($class.$$id);

		return $class;
	};

	$Class.prototype = {
		__createClass : function(options, $prototype){
			var name = options.name;
			var $superConstructor = options.extends || null;
			var interfaces = options.interfaces || null;
			var $constructor;

			if (typeof $prototype.$constructor == "function"){
				$constructor = $prototype.$constructor;
				delete $prototype.$constructor;
			} else {
				$constructor = function(){};
			}

			$constructor = this.__addSuper($constructor, name, true);

			if (options.singleton === true){
				var realConstrucor = $constructor;
				var instance = null;

				$constructor = function(){
					if (instance instanceof realConstrucor){
						return instance;
					} else {
						instance =  realConstrucor.apply(this, arguments);
						return instance;
					}
				};
			}

			this.__setupProto(name, $constructor, $prototype, $superConstructor, interfaces);

			if ($constructor.$interfaces){
				_.loop($constructor.$interfaces, function($interface, index){
					if ($interface instanceof $Interface){
						$interface.__validateClass($constructor);
					}
				});
			}

			return $constructor;

		},	
		__setupProto : function(name, $constructor, $prototype, $superConstructor, interfaces){
			var $processedPrototype = {};

			if ($superConstructor){
				if (Array.isArray($superConstructor)){
					_.loop($superConstructor, function($superConstructor){
						if (!_.isDollaClass($superConstructor)){
							$superConstructor = this.__convertToDollaClass($superConstructor);
						}
						_.loop($superConstructor.$prototype, function(token, name){
							$processedPrototype[name] = token;
						}, this);
					}, this);
				} else {
					if (!_.isDollaClass($superConstructor)){
						$superConstructor = this.__convertToDollaClass($superConstructor);
					}
					_.loop($superConstructor.$prototype, function(token, name){
						$processedPrototype[name] = token;
					}, this);
				}

				$processedPrototype.$super = {
					value : $superConstructor,
					static : true,
					nowrap : true,
					configurable : false,
					writable : false
				}
			}

			_.loop($prototype, function(token, name){
				$processedPrototype[name] = token;
			});

			this.__defineProperty($constructor, "$prototype", {
				value : $processedPrototype,
				enumerable : false,
				writable : false,
				configurable : false
			});

			if (interfaces){
				$processedPrototype.$interfaces = {
					static : true,
					value :  interfaces,
					writable : false,
					configurable : false
				};
			}

			$processedPrototype.$name = {
				static : true,
				value : name, 
				writable : false,
				configurable : false
			};


			_.loop($processedPrototype, function(token, name, list){
				if (typeof token == "function" && !_.isDollaClass(token)){
					token = list[name] = this.__addSuper(token, name, false);
				} else if (typeof token.value == "function" && !_.isDollaClass(token.value)){
					token.value = this.__addSuper(token.value, name, false);
				}

				if (token.static === true){
					this.__defineProperty($constructor, name, token);
				} 

				this.__defineProperty($constructor.prototype, name, token);
			}, this);	

			this.__defineProperty($constructor, "extend", {
				value : this.__extend.bind(this, $constructor),
				enumerable : false,
				writable : false,
				configurable : false
			});
		},
		__extend : function($superConstructor, name, interfaces, $prototype){
			return new Klass(name, $superConstructor, interfaces, $prototype);
		},	
		__addSuper(func, name, isConstructor){
			var wrapped = function(){
				"use strict";
				var args = Array.prototype.slice.call(arguments);
				var $super;				

				if (!func.super){
					if (isConstructor){
						$super = function(){
							var args = this.$args;
							if (typeof this.$super == "function"){
								this.$super.apply(this, args);
							} else if (Array.isArray(this.$super)){
								for (var a = 0, l = this.$super.length; a < l; a++){
									try {
										this.$super[a].apply(this, args);
									} catch (err){
										console.warn(err.message)
									}
								}
							}
						};
					} else {
						$super = function(args){
							var args = this.$args;

							if (this.$super && this.$super.$prototype && typeof this.$super.$prototype[name] == "function"){
								this.$super.$prototype[name].apply(this, args);
							} else if (Array.isArray(this.$super)){

								_.loop(this.$super, function($super, index){
									if ($super.$prototype && $super.$prototype[name] == "function"){
										$super.$prototype[name].apply(this, args);
									}
								});

							}
						};
					}

					func.super = $super;
				}
				
				Object.defineProperty(this, "$args", {
					value: args,
					enumerable: false,
					writable: true,
					configurable: true
				});

				Object.defineProperty(this, "super", {
					value: func.super,
					enumerable: false,
					writable: true,
					configurable: true
				});

				return func.apply(this, args);

			};

			if (isConstructor){
				wrapped = eval(["var ", name, "=", wrapped.toString(), ";", name, ";"].join(""));
			}

			return wrapped;

		},
		__checkInterfacesImplementation : function(){

		},
		__defineProperty : function(obj, name, value){
			if (typeof value == "function"){
				Object.defineProperty(obj, name, {
					value : value,
					writable : true, 
					configurable : true,
				});
			} else if (typeof data != "function" && typeof data != "undefined" && data !== null && typeof data.value == "undefined" && typeof data.get != "function" && typeof data.set != "function"){
				console.warn(new Error("$Class: property defining warning: auto-detected first-layer property; This may cause errors"));
				Object.defineProperty(obj, name, {
					value : value,
					writable : true, 
					configurable : true,
				});
			} else {
				Object.defineProperty(obj, name, value);
			}
		},
		__convertToDollaClass : function($constructor){
			if (typeof $constructor == "string"){
				return this.$namespace.$importFullPath($constructor);
			} else if (typeof $constructor == "function"){
				// console.warn("$Class: some of provided constructors were not created by $Class There may be some issues.");

				var name = $constructor.toString().match(/([a-zA-Z_{1}][a-zA-Z0-9_]+)(?=\()/g);
				if (name && name[0]) name = name[0];

				if (name == "function") name = "ConvertedClass";

				var description = _.merge({
					$constructor : $constructor
				}, _.decompose($constructor.prototype));

				return new $Class({
					name : name || "ConvertedClass"
				}, description);
			} else if (typeof $constructor == "object"){
				return new $Class({
					name : name || "ConvertedClass"
				}, _.decompose($constructor));
			} else {
				console.warn("$Class: provided data cannot be converted to $Class");
				
			}

			
		},
	};

	/*=====================================================================*/
	/*=====================================================================*/
	/*=====================================================================*/
	/**Namespace*/
	var $Namespace = new $Class({
		name : "$Namespace",
		// namespace : "$Class"
	}, {
		$constructor : function(){},
		content : {
			value : {},
			writable : false,
			configurable : false,
		},	
		$import : function(path, name){
			if (this.content[_.join(".", path, name)]){
				return this.content[_.join(".", path, name)];
			} else {
				console.error(new Error("$Class: Import failed: `" + name + "` not found at `" + path + "`."));
			}
		},
		$export : function(path, name, data){
			if (this.content[_.join(".", path, name)]){
				console.error(new Error("$Class: Export failed: `" + name + "` already exists at `" + path + "`."));
			} else {
				this.content[_.join(".", path, name)] = data;				
			}
		},
		$importFullPath : function(fullPath){
			var splitted = fullPath.split(".");
			var name = splitted.pop();
			var path = splitted.join(".");
			return this.$import(path, name);
		}
	});

	/**Interface implementation*/
	var $Interface = new $Class({
		name : "$Interface",
		// namespace : "$Class"
	}, {
		$constructor : function(params){
			this.params = params;
		},
		__validateClass : function($constructor){
			var result = true;

			_.loop(this.params, function(type, name){
				if ((typeof $constructor.prototype[name]).match(new RegExp(type)) != null){
					result = false;
					console.error("$Class: The implementation of does not match the interface: `" + name + "` is not a `" + type + "`, it's a `" + typeof $constructor.prototype[name] + "`");
				}
			});

			return result;
		}
	});

	/**Toolchain reimplementation*/
	var Toolchain = new $Class({
		name : "Toolchain",
		// namespace : "$Class",
	}, _.merge({
		$constructor : Toolchain,
	}, Toolchain.prototype));

	/**Class reimplementation using $Class*/
	$Class = new $Class({
		name : "$Class",
		// namespace : "$Class"
	}, _.merge({
		$constructor : $Class,
		convert : {
			value : $Class.prototype.__convertToDollaClass,
			static : true
		},
		$Interface : {
			value : $Interface,
			static : true
		},
		_ : {
			value : new Toolchain,
			static : true
		},
		$Namespace : {
			value : $Namespace,
			static : true
		},
		$namespace : {
			value : new $Namespace,
			static : true
		},
		$setInstanceOf : {
			value : function(target, source){
				target.prototype.__proto__ = source.prototype;
			},
			static : true
		},
		isInstanceOf : {
			static : true,
			value : function(instance, className){
				var result = false;

				if (Array.isArray(instance.$super)){
					_.loop(instance.$super, function(superConstructor, index){
						if (superConstructor.$name == className || $Class.isInstanceOf(superConstructor, className)){
							result = true;
							return true;
						}
					});
				} else if (typeof instance.$super == "function"){
					result = instance.$super.$name == className;
				}


				return result;
			}
		}
	}, $Class.prototype));

	$Class.export = function(){
		return this.$namespace.$export.apply(this.$namespace, arguments);
	};

	$Class.import = function(){
		return this.$namespace.$import.apply(this.$namespace, arguments);
	};

	return $Class;
    
}));
