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
		}
	};

	var _ = new Toolchain();

	/**Interface implementation*/
	var $Interface = function(params){
		this.params = params || {};
	};

	$Interface.prototype = {
		__validateClass : function($constructor){
			var result = true;

			_.loop(this.params, function(type, name){
				if (typeof $constructor.prototype[name] != type){
					result = false;
					console.error("The implementation of does not match the interface: `" + name + "` is not a `" + type + "`, it's a `" + typeof $constructor.prototype[name] + "`");
				}
			});

			return result;
		}
	};

	/**Class implementation*/
	var $Class = function(name, $super, interfaces, $prototype){
		if (typeof name != "string"){
			$prototype = interfaces;
			interfaces = $super;
			$super = name;
			name = "AnonymousClass";
		}

		if (typeof $super != "function"){
			$prototype = interfaces;
			interfaces = $super;
			$super = null;
		}

		if (!(interfaces instanceof Array)){
			$prototype = interfaces;
			interfaces = null;
		}

		console.log(name, $prototype, $super, interfaces);

		var $class = this.__createClass(name, $prototype, $super, interfaces);

		return $class;
	};

	$Class.prototype = {
		__createClass : function(name, $prototype, $super, interfaces){
			var $constructor;

			if (typeof $prototype.$constructor == "function"){
				$constructor = $prototype.$constructor;
				delete $prototype.$constructor;
			} else {
				$constructor = function(){};
			}

			$constructor = this.__addSuper($constructor);

			$constructor = this.__renameFunction($constructor, name);

			this.__setupProto($constructor, $prototype, $super, interfaces);

			if ($constructor.$interfaces){
				_.loop($constructor.$interfaces, function($interface, index){
					if ($interface instanceof $Interface){
						$interface.__validateClass($constructor);
					}
				});
			}

			return $constructor;

		},	
		__setupProto : function($constructor, $prototype, $super, interfaces){
			if ($super){
				_.loop($super.$prototype, function(token, name){
					this.__defineProperty($constructor.prototype, name, token);
				}, this);	

				this.__defineProperty($constructor.prototype, "$super", {
					value : $super,
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

			this.__defineProperty($constructor, "extend", {
				value : this.__extend.bind(this, $constructor),
				enumerable : false,
				writable : false,
				configurable : false
			});
		},
		__extend : function($super, name, interfaces, $prototype){
			return new Klass(name, $super, interfaces, $prototype);
		},	
		__renameFunction : function(func, name){
			return eval(["var ", name, "=", func.toString(), ";", name, ";"].join(""));
		},	
		__addSuper(func, name){
			var stringified = func.toString();
			var start = stringified.split("{")[0];
			var body = stringified.split("{")[1];

			body = body.split("}")[0];

			if (!name){
				body = [[
					  "var args = Array.prototype.slice.call(arguments);"
					, "var $super = function(args){",
					, "	  if (this.$super && typeof this.$super.$constructor == \"function\"){"
					, "	  	   this.$super.$constructor.apply(this, args);"
					, "	  }"
					, "}.bind(this, args)"
				].join(""), body].join("");	
			} else {
				body = [[
					  "var args = Array.prototype.slice.call(arguments);"
					, "var $super = function(args){",
					, "	  if (this.$super && this.$super.$prototype && typeof this.$super.$prototype[\"" + name + "\"] == \"function\"){"
					, "	  	   this.$super.$prototype[\"" + name + "\"].apply(this, args);"
					, "	  }"
					, "}.bind(this, args)"
				].join(""), body].join("");	
			}			

			return eval(["var $constructor = ", start, "{", body, "}", ";$constructor;"].join(""));		

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

	$Class.$Interface = $Interface;

	return $Class;
    
}));
