# Hamon

## Event-driven architecture in hooking

In traditional event-base repositories, event is just downstream flow which we can only emit data to listener but can not get any response from listener.

So once i came across from [webpack/tapable](https://github.com/webpack/tapable), i'm sure `tapable` is the better event-driven architecture then traditional event-emitter like.

The repo is almost a tapable-lite, referring to [webpack/tapable](https://github.com/webpack/tapable).

There are some differences between tapable and hamon:

* hamon do not support `interception`,` Context`,` HookMap` and `MultiHook`;
* hamon do not support `TapOptions`;
* hamon haven't implement `SyncLoopHook`;
* hamon is less performance then tapable, since hamon didn't compile all listeners into a method;

But:
* hamon support self-destroy tapping by returning a `unTap` function after tapping;
* hamon support `exhaust` method to clean all listeners;
* hamon support bucket-distribution by providing a `bucketHashcode` function when creating hooks;

## Installation

`npm install --save @funnyecho/hamon`

## Hook types

### Supported Hook types

```typescript
import {
	SyncHook,
	SyncBailHook,
	SyncWaterfallHook,
  
	AsyncParallelHook,
	AsyncParallelBailHook,
  
	AsyncSeriesHook,
	AsyncSeriesBailHook,
	AsyncSeriesWaterfallHook
 } from "@funnyecho/hamon";
```

The hook listeners executed in different ways depending on the different hook types:

* `Bail`：Allows hook calling exited earily. if listener return with a non-undefined value, and skip remaining downstream listeners. The calling will return with that non-undefined bail value or first element of calling arguments;
* `Waterfall`: Allows upstream listener to change the calling arguments of downstream listener by returning a non-undefined value;
* Basic: All listeners was called with the same arguments, and returning undefined;

Besides, we can combine with `Sync`, `AsyncParallel`, or `AsyncSeries` for more powerful function:

* `Sync`: 
  *  `tap(listener)` to tapping; 
  *  `call(...args)` to invoke hook, all listeners were called in synchronous queue;
* `AsyncParallel`：
  * `tapAsync(listener)` or `tapPromise(listener)` to tapping;
  *  `callAsync(...args, cb)` or `callPromise(...args)` to invoke hook, all listeners were called asynchronously in parallel; 
  * Able to combine with `Bail` and basic type;
* `AsyncSeries`：
  * `tapAsync(listener)` or `tapPromise(listener)` to tapping;
  *  `callAsync(...args, cb)` or `callPromise(...args)` to invoke hook, all listeners were called asynchronously in series; 
  * Able to combine with `Bail` , `Waterfall` and basic type;

## Documentation

refer to: [docs](./docs/index.md)

## Usage

### Synchook

```typescript
import { SyncHook } from '@funnyecho/hamon';

// create SyncHook
let hook = new SyncHook<[number, string]>();

// tapping to SyncHook
// calling `unTap` can remove listener
let unTap = hook.tap((a1: number, a2: string) => {
  console.log('SyncHook', a1, a2);
})

// invoke
hook.call(1, 'foo');

// console:
// SyncHook 1 'foo'
```

### SyncBailHook

```typescript
import { SyncBailHook } from '@funnyecho/hamon';

// create SyncBailHook
let hook = new SyncBailHook<[number, string], number>();

// tapping to SyncBailHook
// calling `unTap` can remove listener
let unTap1 = hook.tap((a1: number, a2: string): number => {
  console.log('SyncBailHook_1', a1, a2);
  
  return a1 * a1;
})

let unTap2 = hook.tap((a1: number, a2: string): undefined => {
  console.log('SyncBailHook_2', a1, a2);
})

// invoke
// listener1 was called and return `4`, listener2 won't be called
// calling return `4`
hook.call(2, 'foo');

// console:
// SyncBailHook_1 2 'foo'
```

### SyncWaterfallHook

```typescript
import { SyncWaterfallHook } from '@funnyecho/hamon';

// create SyncHook
let hook = new SyncWaterfallHook<[number, string], number>();

// tapping to SyncWaterfallHook
// calling `unTap` can remove listener
let unTap1 = hook.tap((a1: number, a2: string): number => {
  console.log('SyncWaterfallHook_1', a1, a2);
  
  return a1 * a1;
})

let unTap2 = hook.tap((a1: number, a2: string): undefined => {
  console.log('SyncWaterfallHook_2', a1, a2);
})

let unTap3 = hook.tap((a1: number, a2: string): number => {
  console.log('SyncWaterfallHook_3', a1, a2);
  
  return a1 + 100;
})

// invoke
// listener1 was called with `[2, 'foo']` and return `4`,
// listener2 was called with `[4, 'foo']`,
// listener3 was called with `[4, 'foo']` and return `104`
// calling return `104`
hook.call(2, 'foo');

// console:
// SyncBailHook_1 2 'foo'
// SyncBailHook_2 4 'foo'
// SyncBailHook_3 4 'foo'
```

### AsyncParallelHook

```typescript
import { AsyncParallelHook } from '@funnyecho/hamon';

let hook = new AsyncParallelHook<[number]>();

let unTap1 = hook.tapAsync((a1, cb) => {
  console.log('AsyncParallelHook_1', a1);
  setTimeout(() => {
    console.log('AsyncParallelHook_1', 'async', a1);
    cb();
  }, 10);
})

let unTap2 = hook.tapPromise(async (a1) => {
  console.log('AsyncParallelHook_2', a1);
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('AsyncParallelHook_2', 'promise', a1);
      resolve();
    }, 10);
  })
})

// invoke with async callback, calling return undefined
/*
* console output:
*  AsyncParallelHook_1 2
*  AsyncParallelHook_2 2
*  AsyncParallelHook_1 async 2
*  AsyncParallelHook_2 promsie 2
*  AsyncParallelHook_async_done
*/
hook.callAsync(2, () => {
  console.log('AsyncParallelHook_async_done');
});
               
// invoke with async promise, calling return Promise
/*
* console output:
*  AsyncParallelHook_1 2
*  AsyncParallelHook_2 2
*  AsyncParallelHook_1 async 2
*  AsyncParallelHook_2 promsie 2
*  AsyncParallelHook_promise_done
*/
hook.callPromise(2).then(() => console.log('AsyncParallelHook_promise_done'));
```

### AsyncParallelBailHook

```typescript
import { AsyncParallelBailHook } from '@funnyecho/hamon';

let hook = new AsyncParallelBailHook<[number]>();

let unTap1 = hook.tapAsync((a1, cb) => {
  setTimeout(() => {
    // bailed
    cb(a1 * 100);
  }, 10);
})

let unTap2 = hook.tapPromise(async (a1) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 10);
  })
})

// invoke with async callback, calling return undefined
/*
* console output:
*  AsyncParallelHook_async_done 200
*/
hook.callAsync(2, (v) => {
  console.log('AsyncParallelBailHook_async_done', v);
});
               
// invoke with async promise, calling return Promise
/*
* console output:
*  AsyncParallelBailHook_promise_done 200
*/
hook.callPromise(2).then((v) => console.log('AsyncParallelBailHook_promise_done', v));
```

### AsyncSeriesHook

```typescript
import { AsyncSeriesHook } from '@funnyecho/hamon';

let hook = new AsyncSeriesHook<[number]>();

let unTap1 = hook.tapAsync((a1, cb) => {
  console.log('AsyncSeriesHook_1', a1);
  setTimeout(() => {
    console.log('AsyncSeriesHook_1', 'async', a1);
    cb();
  }, 10);
})

let unTap2 = hook.tapPromise(async (a1) => {
  console.log('AsyncSeriesHook_2', a1);
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('AsyncSeriesHook_2', 'promise', a1);
      resolve();
    }, 10);
  })
})

// invoke with async callback, calling return undefined
/*
* console output:
*  AsyncSeriesHook_1 2
*  AsyncSeriesHook_1 async 2
*  AsyncSeriesHook_2 2
*  AsyncSeriesHook_2 promsie 2
*  AsyncSeriesHook_async_done
*/
hook.callAsync(2, () => {
  console.log('AsyncSeriesHook_async_done');
});
               
// invoke with async promise, calling return Promise
/*
* console output:
*  AsyncSeriesHook_1 2
*  AsyncSeriesHook_1 async 2
*  AsyncSeriesHook_2 2
*  AsyncSeriesHook_2 promsie 2
*  AsyncSeriesHook_async_done
*/
hook.callPromise(2).then(() => console.log('AsyncSeriesHook_promise_done'));
```

### AsyncSeriesBailHook

```typescript
import { AsyncSeriesBailHook } from '@funnyecho/hamon';

let hook = new AsyncSeriesBailHook<[number]>();

let unTap1 = hook.tapAsync((a1, cb) => {
  setTimeout(() => {
    // bailed
    cb(a1 * 100);
  }, 10);
})

let unTap2 = hook.tapPromise(async (a1) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 10);
  })
})

// invoke with async callback, calling return undefined
/*
* console output:
*  AsyncSeriesBailHook_async_done 200
*/
hook.callAsync(2, (v) => {
  console.log('AsyncSeriesBailHook_async_done', v);
});
               
// invoke with async promise, calling return Promise
/*
* console output:
*  AsyncSeriesBailHook_promise_done 200
*/
hook.callPromise(2).then((v) => console.log('AsyncSeriesBailHook_promise_done', v));
```

### AsyncSeriesWaterfallHook

```typescript
import { AsyncSeriesWaterfallHook } from '@funnyecho/hamon';

let hook = new AsyncSeriesWaterfallHook<[number]>();

let unTap1 = hook.tapAsync((a1, cb) => {
  console.log('AsyncSeriesWaterfallHook_1', a1);
  setTimeout(() => {
    // waterfall
    cb(a1 * 100);
  }, 10);
})

let unTap2 = hook.tapPromise(async (a1) => {
  console.log('AsyncSeriesWaterfallHook_2', a1);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 10);
  })
})

// invoke with async callback, calling return undefined
/*
* console output:
*  AsyncSeriesWaterfallHook_1 1
*  AsyncSeriesWaterfallHook_2 200
*  AsyncSeriesWaterfallHook_async_done 200
*/
hook.callAsync(2, (v) => {
  console.log('AsyncSeriesWaterfallHook_async_done', v);
});
               
// invoke with async promise, calling return Promise
/*
* console output:
*  AsyncSeriesWaterfallHook_1 1
*  AsyncSeriesWaterfallHook_2 200
*  AsyncSeriesWaterfallHook_promise_done 200
*/
hook.callPromise(2).then((v) => console.log('AsyncSeriesWaterfallHook_promise_done', v));
```