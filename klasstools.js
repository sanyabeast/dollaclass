"use strict";
define(function(){

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
		this.params = params;
	};

	$Interface.prototype = {
		__validateClass : function($class){

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
			$super = null;

		}

		var $class = this.__createClass(name, $super, interfaces, $prototype);

		return $class;
	};

	$Class.prototype = {
		__createClass : function(name, $super, interfaces, $prototype){
			var $construcor;

			if (typeof $prototype.$construcor == "function"){
				$construcor = $prototype.$construcor;
				delete $prototype.$construcor;
			} else {
				$construcor = function(){};
			}

			console.log($construcor);

			$construcor = this.__addSuperConstrucor($construcor);

			$construcor = this.__renameFunction($construcor, name);

			this.__setupProto($construcor, $prototype, $super, interfaces);

			return $construcor;

		},	
		__setupProto : function($construcor, $prototype, $super, interfaces){
			if ($super){
				this.loop($super.$prototype, function(token, name){
					this.__defineProperty($construcor.prototype, name, token);
				}, this);	

				this.__defineProperty($construcor.prototype, "$super", {
					value : $super.prototype,
					enumerable : false,
					writable : false,
					configurable : false
				});
			}	

			if (interfaces){
				this.__defineProperty($construcor.prototype, "$interfaces", {
					value : interfaces,
					enumerable : false,
					writable : false,
					configurable : false
				});
			}

			this.__defineProperty($construcor.prototype, "$prototype", {
				value : $prototype,
				enumerable : false,
				writable : false,
				configurable : false
			});

			console.log($prototype);

			_.loop($prototype, function(token, name){
				console.log(name);
				this.__defineProperty($construcor.prototype, name, token);
			}, this);	

			this.__defineProperty($construcor.prototype, "$construcor", {
				value : $construcor,
				enumerable : false,
				writable : false,
				configurable : false
			});
		},
		__renameFunction : function(func, name){
			return eval(["var ", name, "=", func.toString(), ";", name, ";"].join(""));
		},	
		__addSuperConstrucor(func){
			var stringified = func.toString();
			var start = stringified.split("{")[0];
			var body = stringified.split("{")[1];

			body = body.split("}")[0];

			body = [[
				  "var args = Array.prototype.slice.call(arguments);"
				, "	  var $super = function(args){",
				, "	  if (this.$super && typeof this.$super.$constructor == \"function\"){"
				, "	  	   this.$super.$constructor.apply(this, args);"
				, "	  }"
				, "}.bind(this, args)"
			].join(""), body].join("");	

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

	return $Class;

});