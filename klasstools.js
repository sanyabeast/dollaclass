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
		}
	};

	var _ = new Toolchain();

	/**Class implementation*/
	var $Class = function(name, $superConstructor, interfaces, $prototype){
		if (typeof name != "string"){
			$prototype = interfaces;
			interfaces = $superConstructor;
			$superConstructor = name;
			name = "AnonymousClass";
		}

		if (typeof $superConstructor != "function"){
			$prototype = interfaces;
			interfaces = $superConstructor;
			$superConstructor = null;
		}

		if (!(interfaces instanceof Array)){
			$prototype = interfaces;
			interfaces = null;
		}

		var $class = this.__createClass(name, $prototype, $superConstructor, interfaces);

		return $class;
	};

	$Class.prototype = {
		__createClass : function(name, $prototype, $superConstructor, interfaces){
			var $constructor;

			if (typeof $prototype.$constructor == "function"){
				$constructor = $prototype.$constructor;
				delete $prototype.$constructor;
			} else {
				$constructor = function(){};
			}

			$constructor = this.__addSuper($constructor);

			$constructor = this.__renameFunction($constructor, name);

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
				_.loop($superConstructor.$prototype, function(token, name){
					if (token.static == true){
						this.__defineProperty($constructor, name, token);
					} else {
						this.__defineProperty($constructor.prototype, name, token);
					}
				}, this);	

				this.__defineProperty($constructor.prototype, "$super", {
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
					token = list[name] = this.__addSuper(token, name);
				} else if (typeof token.value == "function"){
					token.value = this.__addSuper(token.value, name);
				}

				if (token.static === true){
					this.__defineProperty($constructor, name, token);
				} else {
					this.__defineProperty($constructor.prototype, name, token);
				}

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
		__renameFunction : function(func, name){
			return eval(["var ", name, "=", func.toString(), ";", name, ";"].join(""));
		},	
		__addSuper(func, name){
			var stringified = func.toString();
			var start = stringified.split("{")[0];
			var body = stringified.substring(stringified.indexOf("{") + 1, stringified.lastIndexOf("}"));

			start = start.match(/\(.*?\)/)[0];

			if (!name){
				body = [[
					  "var args = Array.prototype.slice.call(arguments);"
					, "var $super = function(args){",
					, "	  if (this.$super && typeof this.$super.$constructor == \"function\"){"
					, "	  	   this.$super.$constructor.apply(this, args);"
					, "	  }"
					, "}.bind(this, args);"
				].join(""), body].join("");	
			} else {
				body = [[
					  "var args = Array.prototype.slice.call(arguments);"
					, "var $super = function(args){",
					, "	  if (this.$super && this.$super.$prototype && typeof this.$super.$prototype[\"" + name + "\"] == \"function\"){"
					, "	  	   this.$super.$prototype[\"" + name + "\"].apply(this, args);"
					, "	  }"
					, "}.bind(this, args);"
				].join(""), body].join("");	
			}			

			return eval(["var $constructor = function", start, "{", body, "}", ";$constructor;"].join(""));		

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
	var $Namespace = new $Class("$Namespace", {
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
	var $Interface = new $Class("$Interface", {
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
	$Class = new $Class("$Class", {
		$constructor : $Class,
		__createClass : $Class.prototype.__createClass,
		__setupProto : $Class.prototype.__setupProto,
		__extend : $Class.prototype.__extend,
		__renameFunction : $Class.prototype.__renameFunction,
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

	

	

	return $Class;
    
}));
