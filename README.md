# ES2015 OOP implementation helping tool. Babelless, Webpackless. UMD.

## Creating classes

```javascript
/**@param {string} name - classname
  *@param {function||undefined} $superConstructor - 
  *@param {array<$Interface>||undefined} interfaces - interfaces that class has to implement
  *@param {object} $prototype - class prototype definition + class construcor function
  */
var $Class = function(name, $superConstructor, interfaces, $prototype){...
```

```javascript
var Creature = new $Class("Creature", {
    $constructor : function(name){
        this.name = name;
    },
    sayHello : function(){
        alert("Hello, my name is " + this.name + "!");
    }
});
```

## Extending classes

```javascript
var Dog = new $Class("Dog", Creature, {
    $constructor : function(name, age){
        $super();
        this.age = age;
    },
    sayHello : function(){
        $super();
        alert("And by the way, I am " + this.age + " years old!");
    },
    sayGoodbye : function(){
        alert("Goodbye!");
    }
});
```

## Creating interfaces 

```javascript
var HasUUID = new $Class.$Interface({
    uuid : "string" // "string" is actually regexp.
});

var Serializable = new $Class.$Interface({
    toJSON : "function"
});

```

## Implementing interfaces

```javascript
var TextNode = new $Class("TextNode", Node, [HasUUID, Serializable], {
    $constructor : function(){
        "..."
    },
    uuid : {
        get : function(){
            if (!this.__uuid) this.__uuid = Math.random().toString(32);
            return this.__uuid;
        }
    },
    toJSON : function(){
        "..."
    }
})
```
