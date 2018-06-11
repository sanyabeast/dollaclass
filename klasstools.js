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

	/**Toolchain*/
	var Toolchain = function(){};
	Toolchain.prototype = {
		loop : function(list, cb, ctx){
			if (list instanceof window.Array){
				for (var a = 0, l = list.length; a < l; a++){
					cb.call(ctx, list[a], a, list);
				}
			} else if (list instanceof window.Object){
				for (var a in list){
					cb.call(ctx, list[a], a, list);
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
		genRandString : function(){
			var string = "";

            while (string.length < length){
                string = string + (Math.random().toString(32).substring(3, 12));
            }

            string = [(prefix || ""), string.substring(0, length), (postfix || "")].join("-");
            return string;
		}
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
			if ($superConstructor){

				if ($superConstructor instanceof Array){
					_.loop($superConstructor, function($superConstructor, index){
						_.loop($superConstructor.$prototype, function(token, name){
							console.log(token, name);
							if (token.static == true){
								this.__defineProperty($constructor, name, token);
							}

							this.__defineProperty($constructor.prototype, name, token);
						}, this);	
					}, this);
				} else {
					_.loop($superConstructor.$prototype, function(token, name){
						if (token.static == true){
							this.__defineProperty($constructor, name, token);
						} 

						this.__defineProperty($constructor.prototype, name, token);
					}, this);
				}

				this.__defineProperty($constructor.prototype, "$super", {
					value : $superConstructor,
					enumerable : false,
					writable : false,
					configurable : false
				});

				this.__defineProperty($constructor.prototype, "$extends", {
					value : $superConstructor,
					enumerable : false,
					writable : false,
					configurable : false
				});	
			}	

			if (interfaces){
				this.__defineProperty($constructor, "$interfaces", {
					value : interfaces,
					enumerable : false,
					writable : false,
					configurable : false
				});
			}

			this.__defineProperty($constructor, "$prototype", {
				value : $prototype,
				enumerable : false,
				writable : false,
				configurable : false
			});


			_.loop($prototype, function(token, name, list){
				if (typeof token == "function"){
					token = list[name] = this.__addSuper(token, name, false);
				} else if (typeof token.value == "function"){
					token.value = this.__addSuper(token.value, name, false);
				}

				if (token.static === true){
					this.__defineProperty($constructor, name, token);
				} 

				this.__defineProperty($constructor.prototype, name, token);

			}, this);	

			this.__defineProperty($constructor, "$constructor", {
				value : $constructor,
				enumerable : false,
				writable : false,
				configurable : false
			});

			this.__defineProperty($constructor, "$name", {
				value : name,
				enumerable : false,
				writable : false,
				configurable : false
			});

			this.__defineProperty($constructor.prototype, "$name", {
				value : name,
				enumerable : false,
				writable : false,
				configurable : false
			});

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
				var args = Array.prototype.slice.call(arguments);
				var $super;

				if (func.super){
					this.super = func.super;
				} else {
					if (isConstructor){
						$super = function(args){
							if (typeof this.$super == "function" && typeof this.$super.$constructor == "function"){
								this.$super.$constructor.apply(this, args);
							} else if (this.$super instanceof Array){
								var lastID = this.$super.length - 1;
								if (typeof this.$super[lastID] == "function" && typeof this.$super[lastID].$constructor == "function"){
									this.$super[lastID].$constructor.apply(this, args);
								}
							}
						}.bind(this, args);
					} else {
						$super = function(args){
							if (this.$super && this.$super.$prototype && typeof this.$super.$prototype[name] == "function"){
								this.$super.$prototype[name].apply(this, args);
							} else if (this.$super instanceof Array){
								var lastID = this.$super.length - 1;
								if (this.$super[lastID] && this.$super[lastID].$prototype && typeof this.$super[lastID].$prototype[name] == "function"){
									this.$super[lastID].$prototype[name].apply(this, args);
								}

							}
						}.bind(this, args);
					}
					
					this.super = func.super = $super;
				}
				

				if (true || !isConstructor){
					return func.apply(this, args);
				} else {
					return new (Function.prototype.bind.apply(func, args));
				}

			};

			wrapped = eval(["var ", name, "=", wrapped.toString(), ";", name, ";"].join(""));
			wrapped.isSuper = true;

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
			} else {
				Object.defineProperty(obj, name, value);
			}
		},
	};

	/*=====================================================================*/
	/*=====================================================================*/
	/*=====================================================================*/
	/**Namespace*/
	var $Namespace = new $Class({
		name : "$Namespace"
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
				console.error(new Error("Import failed: `" + name + "` not found at `" + path + "`."));
			}
		},
		$export : function(path, name, data){
			if (this.content[_.join(".", path, name)]){
				console.error(new Error("Export failed: `" + name + "` already exists at `" + path + "`."));
			} else {
				this.content[_.join(".", path, name)] = data;				
			}
		}
	});

	/**Interface implementation*/
	var $Interface = new $Class({
		name : "$Interface"
	}, {
		$constructor : function(params){
			this.params = params;
		},
		__validateClass : function($constructor){
			var result = true;

			_.loop(this.params, function(type, name){
				if ((typeof $constructor.prototype[name]).match(new RegExp(type)) != null){
					result = false;
					console.error("The implementation of does not match the interface: `" + name + "` is not a `" + type + "`, it's a `" + typeof $constructor.prototype[name] + "`");
				}
			});

			return result;
		}
	});

	/**Class reimplementation using $Class*/
	$Class = new $Class({
		name : "$Class"
	}, {
		$constructor : $Class,
		__createClass : $Class.prototype.__createClass,
		__setupProto : $Class.prototype.__setupProto,
		__extend : $Class.prototype.__extend,
		__addSuper : $Class.prototype.__addSuper,
		__checkInterfacesImplementation : $Class.prototype.__checkInterfacesImplementation,
		__defineProperty : $Class.prototype.__defineProperty,
		$Interface : {
			value : $Interface,
			static : true
		},
		$Namespace : {
			value : $Namespace,
			static : true
		},
		$namespace : {
			value : new $Namespace,
			static : true
		}
	});

	$Class.$namespace.$export("$Class", "$Class", $Class);
	$Class.$namespace.$export("$Class", "$Interface", $Interface);
	$Class.$namespace.$export("$Class", "$Namespace", $Namespace);

	

	return $Class;
    
}));
