/**
 * ECMAScript 5 shim
 * http://es5.github.io/
 * Alternatives:
 * https://github.com/es-shims/es5-shim
 * https://github.com/ddrcode/ddr-ecma5
 * http://augmentjs.com/
 * https://github.com/inexorabletash/polyfill/blob/master/es5.js
 */
!function(){
  var Empty              = Function()
    , whitespace         = '[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]'
    , trimRegExp         = RegExp('^' + whitespace + '+|' + whitespace + '+$', 'g')
    // for fix IE 8- don't enum bug https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    , hiddenNames1       = array('toString,toLocaleString,valueOf,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,constructor')
    , hiddenNames2       = hiddenNames1.concat(['length'])
    , hiddenNames1Length = hiddenNames1.length
    , nativeSlice        = slice
    , nativeJoin         = $Array.join
    // Create object with null as it's prototype
    , createNullProtoObject = __PROTO__
      ? function(){
          return {__proto__: null};
        }
      : function(){
          // Thrash, waste and sodomy
          var iframe   = document.createElement('iframe')
            , i        = hiddenNames1Length
            , body     = document.body || document.documentElement
            , iframeDocument;
          iframe.style.display = 'none';
          body.appendChild(iframe);
          iframe.src = 'javascript:';
          iframeDocument = iframe.contentWindow.document || iframe.contentDocument || iframe.document;
          iframeDocument.open();
          iframeDocument.write('<script>document._=Object</script>');
          iframeDocument.close();
          createNullProtoObject = iframeDocument._;
          while(i--)delete createNullProtoObject[prototype][hiddenNames1[i]];
          return createNullProtoObject();
        }
    , createGetKeys = function(names, length){
        return function(O){
          O = ES5Object(O);
          var i      = 0
            , result = []
            , key;
          for(key in O)has(O, key) && result.push(key);
          // hidden names for Object.getOwnPropertyNames & don't enum bug fix for Object.keys
          while(length > i)has(O, key = names[i++]) && !~result.indexOf(key) && result.push(key);
          return result;
        }
      };
  // The engine works fine with descriptors? Thank's IE8 for his funny defineProperty.
  try {
    defineProperty({}, 0, $Object);
  }
  catch(e){
    DESCRIPTORS = false;
    // 19.1.2.6 / 15.2.3.3 Object.getOwnPropertyDescriptor(O, P)
    Object.getOwnPropertyDescriptor = getOwnPropertyDescriptor = function(O, P){
      if(has(O, P))return descriptor(6 + isEnumerable.call(O, P), O[P]);
    };
    // 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
    Object.defineProperty = defineProperty = function(O, P, Attributes){
      assertObject(O);
      if('value' in Attributes)O[P] = Attributes.value;
      return O;
    };
    // 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties) 
    Object.defineProperties = defineProperties = function(O, Properties){
      assertObject(O);
      var names  = keys(Properties)
        , length = names.length
        , i = 0
        , P, Attributes;
      while(length > i){
        P          = names[i++];
        Attributes = Properties[P];
        if('value' in Attributes)O[P] = Attributes.value;
      }
      return O;
    }
  }
  $define(STATIC, 'Object', {
    // 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O) 
    getPrototypeOf: function(O){
      var constructor
        , proto = O.__proto__ || ((constructor = O.constructor) ? constructor[prototype] : $Object);
      return O !== proto && 'toString' in O ? proto : null;
    },
    // 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
    getOwnPropertyNames: createGetKeys(hiddenNames2, hiddenNames2.length),
    // 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
    create: function(O, /*?*/Properties){
      if(O === null)return Properties ? defineProperties(createNullProtoObject(), Properties) : createNullProtoObject();
      assertObject(O);
      Empty[prototype] = O;
      var result = new Empty();
      if(Properties)defineProperties(result, Properties);
      // add __proto__ for Object.getPrototypeOf shim
      __PROTO__ || result.constructor[prototype] === O || (result.__proto__ = O);
      return result;
    },
    // 19.1.2.14 / 15.2.3.14 Object.keys(O)
    keys: createGetKeys(hiddenNames1, hiddenNames1Length)
  });
  // not array-like strings fix
  if(!(0 in Object('q') && 'q'[0] == 'q')){
    ES5Object = function(it){
      return classof(it) == 'String' ? it.split('') : Object(it);
    }
    // Array.prototype methods for strings in ES3
    // 22.1.3.22 / 15.4.4.10 Array.prototype.slice(start = 0, end = @[*-1])
    $Array.slice = slice = function(){
      return nativeSlice.apply(ES5Object(this), arguments);
    }
    // 22.1.3.12 / 15.4.4.5 Array.prototype.join(separator = ',')
    $Array.join = function(){
      return nativeJoin.apply(ES5Object(this), arguments);
    }
  }
  // 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg [, arg1 [, arg2, …]]) 
  $define(PROTO, 'Function', {
    bind: function(scope /*, args... */){
      var fn   = this
        , args = $slice(arguments, 1);
      assertFunction(fn);
      function bound(/* args... */){
        var _args = args.concat($slice(arguments))
          , result, that
        if(this instanceof fn)return isObject(result = apply.call(that = create(fn[prototype]), scope, _args)) ? result : that;
        return apply.call(fn, scope, _args);
      }
      bound[prototype] = undefined;
      return bound;
    }
  });
  // 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
  $define(STATIC, 'Array', {isArray: function(arg){
    return classof(arg) == 'Array'
  }});
  function forEach(callbackfn, thisArg /* = undefined */){
    assertFunction(callbackfn);
    var self   = ES5Object(this)
      , length = toLength(self.length)
      , i      = 0;
    for(;length > i; i++)i in self && callbackfn.call(thisArg, self[i], i, this);
  }
  $define(PROTO, 'Array', {
    // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
    indexOf: function(searchElement, fromIndex /* = 0 */){
      var self   = ES5Object(this)
        , length = toLength(self.length)
        , i      = fromIndex | 0;
      if(0 > i)i = toLength(length + i);
      for(;length > i; i++)if(i in self && self[i] === searchElement)return i;
      return -1;
    },
    // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
    lastIndexOf: function(searchElement, fromIndex /* = @[*-1] */){
      var self   = ES5Object(this)
        , length = toLength(self.length)
        , i      = length - 1;
      if(arguments.length > 1)i = min(i, fromIndex | 0);
      if(0 > i)i = toLength(length + i);
      for(;i >= 0; i--)if(i in self && self[i] === searchElement)return i;
      return -1;
    },
    // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
    every: function(callbackfn, thisArg /* = undefined */){
      assertFunction(callbackfn);
      var self   = ES5Object(this)
        , length = toLength(self.length)
        , i      = 0;
      for(;length > i; i++){
        if(i in self && !callbackfn.call(thisArg, self[i], i, this))return false;
      }
      return true;
    },
    // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
    some: function(callbackfn, thisArg /* = undefined */){
      assertFunction(callbackfn);
      var self   = ES5Object(this)
        , length = toLength(self.length)
        , i      = 0;
      for(;length > i; i++){
        if(i in self && callbackfn.call(thisArg, self[i], i, this))return true;
      }
      return false;
    },
    // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
    forEach: forEach,
    // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
    map: function(callbackfn, thisArg /* = undefined */){
      assertFunction(callbackfn);
      var result = Array(toLength(this.length));
      forEach.call(this, function(val, key, that){
        result[key] = callbackfn.call(thisArg, val, key, that);
      });
      return result;
    },
    // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
    filter: function(callbackfn, thisArg /* = undefined */){
      assertFunction(callbackfn);
      var result = [];
      forEach.call(this, function(val){
        callbackfn.apply(thisArg, arguments) && result.push(val);
      });
      return result;
    },
    // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
    reduce: function(callbackfn, memo /* = @.0 */){
      assertFunction(callbackfn);
      var self   = ES5Object(this)
        , length = toLength(self.length)
        , i      = 0;
      if(2 > arguments.length)for(;;){
        if(i in self){
          memo = self[i++];
          break;
        }
        assert(length > ++i, REDUCE_ERROR);
      }
      for(;length > i; i++)if(i in self)memo = callbackfn(memo, self[i], i, this);
      return memo;
    },
    // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
    reduceRight: function(callbackfn, memo /* = @[*-1] */){
      assertFunction(callbackfn);
      var self = ES5Object(this)
        , i    = toLength(self.length) - 1;
      if(2 > arguments.length)for(;;){
        if(i in self){
          memo = self[i--];
          break;
        }
        assert(0 <= --i, REDUCE_ERROR);
      }
      for(;i >= 0; i--)if(i in self)memo = callbackfn(memo, self[i], i, this);
      return memo;
    }
  });
  // 21.1.3.25 / 15.5.4.20 String.prototype.trim()
  $define(PROTO, 'String', {trim: function(){
    return String(this).replace(trimRegExp, '');
  }});
  // 20.3.3.1 / 15.9.4.4 Date.now()
  $define(STATIC, 'Date', {now: function(){
    return +new Date;
  }});
  if(isFunction(trimRegExp))isFunction = function(it){
    return classof(it) == 'Function';
  }
}();
create              = Object.create;
getPrototypeOf      = Object.getPrototypeOf;
keys                = Object.keys;
getOwnPropertyNames = Object.getOwnPropertyNames;