/**
 * Created by samhwang1990@gmail.com.
 */

import { AsArray, Append, Callback } from "./types";

type ITapID = string;

type IHookBucketType = any;
type IHookBucketHashcode<T> = (...args: AsArray<T>) => IHookBucketType;

type IAsyncTapArgs<T, R> = Append<AsArray<T>, Callback<Error, R>>;

type ISyncTapCallback<T, R> = (...args: AsArray<T>) => R;
type IAsyncTapCallback<T, R> = (...args: IAsyncTapArgs<T, R>) => void;
type IPromiseTapCallback<T, R> = (...args: AsArray<T>) => Promise<R>;

/**
 * Type of unTap function
 *
 * @public
 * */
export type ITapDestroy = () => void;

interface ITapOptions<T, R> {
  fn: IAsyncTapCallback<T, R> | ISyncTapCallback<T, R>;
  bucket: string;
}

interface IInvokeSeriesObserver<T, R> {
  shouldBail?: boolean;
  shouldWaterfall?: boolean;
  onComplete?: (err: Error, result?: R) => void;
}

interface IInvokeParallelObserver<T, R> {
  shouldBail?: boolean;
  onComplete?: (err: Error, result?: R) => void;
}

interface IInvokeSynchronouslyObserver<T, R> {
  shouldBail?: boolean;
  shouldWaterfall?: boolean;
}

function once(fn: Function): Function {
  let called = false;
  return function onceWrapper(...args) {
    if (called) return;
    called = true;
    fn(...args);
  };
}

function invokeSeriesNext<T, R>(
  observer: IInvokeSeriesObserver<T, R>,
  args: AsArray<T>,
  list: ITapOptions<T, R>[]
) {
  let onComplete;

  if (typeof observer.onComplete === "function") {
    onComplete = observer.onComplete;
  } else {
    onComplete = function unImplementOnComplete(err: Error, result?: R) {
      //
    };
  }

  if (!list.length) {
    onComplete(null, args[0]);
    return;
  }

  let tap = list.shift();
  let downstreamTaps = list;
  let downstreamArgs = Array.from(args) as AsArray<T>;

  let nextArgs = [
    ...args,
    function onNext(err: Error, result?: R) {
      if (err != null) {
        onComplete(err);
        return;
      }

      if (result !== undefined && observer.shouldBail === true) {
        onComplete(null, result);
        return;
      }

      if (result !== undefined && observer.shouldWaterfall === true) {
        downstreamArgs[0] = result;
      }

      invokeSeriesNext(observer, downstreamArgs, downstreamTaps);
    }
  ] as IAsyncTapArgs<T, R>;

  tap.fn(...nextArgs);
}

function invokeParallel<T, R>(
  observer: IInvokeParallelObserver<T, R>,
  args: AsArray<T>,
  list: ITapOptions<T, R>[]
) {
  let onComplete;

  if (typeof observer.onComplete === "function") {
    onComplete = observer.onComplete;
  } else {
    onComplete = function unImplementOnComplete(err: Error, result?: R) {
      //
    };
  }

  if (!list.length) {
    onComplete(null, args[0]);
    return;
  }

  let parallelSize = list.length;

  let nextArgs = [
    ...args,
    function onNext(err: Error, result?: R) {
      if (err != null) {
        onComplete(err);
        return;
      }

      if (result !== undefined && observer.shouldBail === true) {
        onComplete(null, result);
        return;
      }

      --parallelSize;
      if (parallelSize <= 0) {
        onComplete(null, args[0]);
        return;
      }
    }
  ] as IAsyncTapArgs<T, R>;

  for (let option of list) {
    option.fn(...nextArgs);
  }
}

function invokeSynchronously<T, R>(
  observer: IInvokeSynchronouslyObserver<T, R>,
  args: AsArray<T>,
  list: ITapOptions<T, R>[]
): R {
  if (!list.length) {
    return args[0];
  }

  let downstreamArgs = Array.from(args) as AsArray<T>;

  for (let option of list) {
    let fn = option.fn as ISyncTapCallback<T, R>;
    let result = fn(...downstreamArgs);

    if (result !== undefined && observer.shouldBail === true) {
      return result;
    }

    if (result !== undefined && observer.shouldWaterfall === true) {
      downstreamArgs[0] = result;
    }
  }

  return downstreamArgs[0];
}

/**
 * Basic Hook Type
 *
 * @remarks
 * All subtype hooks are extends from `Hook` which provide the tapping and calling logic
 *
 * @param T - tuple types of calling arguments
 * @param R - returning value type of calling
 *
 * @public
 * */
export abstract class Hook<T, R> {
  private tapIdSeed = 0;

  /**
   * @internal
   * */
  protected readonly bucketHashcode: IHookBucketHashcode<T>;

  /**
   * @internal
   * */
  protected readonly presetTapBucket: Set<ITapID>;

  /**
   * @internal
   * */
  protected readonly tapBuckets: Map<IHookBucketType, Set<ITapID>>;

  /**
   * @internal
   * */
  protected readonly tapOptionsCache: Map<ITapID, ITapOptions<T, R>>;

  /**
   * @param bucketHashcode - calculate the hashcode value of calling arguments
   * */
  constructor(bucketHashcode?: IHookBucketHashcode<T>) {
    this.presetTapBucket = new Set<ITapID>();
    this.tapBuckets = new Map();
    this.tapOptionsCache = new Map();

    this.bucketHashcode = bucketHashcode;
  }

  /**
   * clear all tapping from hook
   *
   * @public
   * */
  public exhaust() {
    this.presetTapBucket.clear();
    this.tapBuckets.clear();
    this.tapOptionsCache.clear();
  }

  /**
   * clear all tapping from hook
   *
   * @remarks
   * The same as `exhaust` {@link Hook.exhaust}
   *
   * @privateRemarks
   * call `exhaust`
   *
   * @public
   * */
  public destroy() {
    this.exhaust();
  }

  /**
   * @internal
   * */
  protected insertSyncTap(
    fn: ISyncTapCallback<T, R>,
    bucket?: IHookBucketType
  ): ITapDestroy {
    return this.tapping(fn, bucket);
  }

  /**
   * @internal
   * */
  protected insertAsyncTap(
    fn: IAsyncTapCallback<T, R>,
    bucket?: IHookBucketType
  ): ITapDestroy {
    function asyncTapFn(...args: IAsyncTapArgs<T, R>) {
      let invokeCb = args[args.length - 1] as Callback<Error, R>;

      try {
        fn(...args);
      } catch (e) {
        invokeCb(e);
      }
    }

    return this.tapping(asyncTapFn, bucket);
  }

  /**
   * @internal
   * */
  protected insertPromiseTap(
    fn: IPromiseTapCallback<T, R | void>,
    bucket?: IHookBucketType
  ): ITapDestroy {
    function promiseTapFn(...args) {
      let invokeCb = args.pop() as Callback<Error, R>;
      let invokeArgs = args as AsArray<T>;

      try {
        Promise.resolve(fn(...invokeArgs)).then(
          (tapResult: R) => {
            invokeCb(null, tapResult);
          },
          (e: Error) => {
            invokeCb(e);
          }
        );
      } catch (e) {
        invokeCb(e);
      }
    }

    return this.tapping(promiseTapFn, bucket);
  }

  /**
   * @internal
   * */
  protected invokeSeries(
    args: AsArray<T>,
    observer?: IInvokeSeriesObserver<T, R>
  ) {
    if (!observer) {
      observer = {};
    }

    if (typeof observer.onComplete === "function") {
      // @ts-ignored
      observer.onComplete = once(observer.onComplete);
    }

    invokeSeriesNext<T, R>(
      observer,
      args,
      Array.from(this.getBucketTaps(args))
    );
  }

  /**
   * @internal
   * */
  protected invokeParallel(
    args: AsArray<T>,
    observer?: IInvokeParallelObserver<T, R>
  ) {
    if (!observer) {
      observer = {};
    }

    if (typeof observer.onComplete === "function") {
      // @ts-ignored
      observer.onComplete = once(observer.onComplete);
    }

    invokeParallel<T, R>(observer, args, Array.from(this.getBucketTaps(args)));
  }

  /**
   * @internal
   * */
  protected invokeSynchronously(
    args: AsArray<T>,
    observer?: IInvokeSynchronouslyObserver<T, R>
  ) {
    if (!observer) {
      observer = {};
    }

    return invokeSynchronously<T, R>(
      observer,
      args,
      Array.from(this.getBucketTaps(args))
    );
  }

  /**
   * @internal
   * */
  protected getBucketTaps(args: AsArray<T>): Set<ITapOptions<T, R>> {
    let presetTaps = Array.from(this.presetTapBucket);
    let bucketTaps: ITapID[] = [];

    if (typeof this.bucketHashcode === "function") {
      let bucket = this.bucketHashcode(...args);

      if (this.tapBuckets.has(bucket)) {
        bucketTaps = Array.from(this.tapBuckets.get(bucket)!);
      }
    }

    let selectedTapIds = new Set<ITapID>([...presetTaps, ...bucketTaps]);
    let selectedTapOptions = new Set<ITapOptions<T, R>>();

    for (let tapId of selectedTapIds) {
      selectedTapOptions.add(this.tapOptionsCache.get(tapId));
    }

    return selectedTapOptions;
  }

  /**
   * @internal
   * */
  private tapping(
    fn: IAsyncTapCallback<T, R> | ISyncTapCallback<T, R>,
    bucketHash?: IHookBucketType
  ): ITapDestroy {
    let tapBucket = this.presetTapBucket;

    if (bucketHash) {
      if (!this.tapBuckets.has(bucketHash)) {
        this.tapBuckets.set(bucketHash, new Set<ITapID>());
      }

      tapBucket = this.tapBuckets.get(bucketHash)!;
    }

    let tapId = this.generateTapId();
    let options: ITapOptions<T, R> = {
      fn,
      bucket: bucketHash
    };

    this.tapOptionsCache.set(tapId, options);
    tapBucket.add(tapId);

    return () => {
      this.popoutTap(tapId);
    };
  }

  /**
   * @internal
   * */
  protected popoutTap(tapId: ITapID) {
    let options = this.tapOptionsCache.get(tapId);
    if (!options) return;

    let bucketHash = options.bucket;
    if (!bucketHash) {
      this.presetTapBucket.delete(tapId);
    } else {
      if (this.tapBuckets.has(bucketHash)) {
        this.tapBuckets.get(bucketHash)!.delete(tapId);
      }
    }

    this.tapOptionsCache.delete(tapId);
  }

  /**
   * @internal
   * */
  private generateTapId(): ITapID {
    return `tap:${++this.tapIdSeed}?${Date.now()}`;
  }
}

/**
 * Abstract Sync Hook
 *
 * @remarks
 * Providing `tap` method for synchronous hooks
 *
 * @public
 * */
export abstract class SyncTapHook<T, R> extends Hook<T, R> {
  /**
   * listen to hook
   *
   * @param fn - Listener callback
   * @param bucket - Listen to specified hashcode bucket
   * @returns The unTap function
   *
   * @public
   * */
  public tap(
    fn: ISyncTapCallback<T, R>,
    bucket?: IHookBucketType
  ): ITapDestroy {
    return this.insertSyncTap(fn, bucket);
  }
}

/**
 * Abstract Async Hook
 *
 * @remarks
 * Providing `tapAsync` and `tapPromise` methods for asynchronous hooks
 *
 * @public
 * */
export abstract class AsyncTapHook<T, R> extends Hook<T, R> {
  /**
   * listen to hook in async callback mode
   *
   * @param fn - Listener callback
   * The last argument of `fn` which named `cb` will be a function which signature is `(err?: Error, result?: T) => void`.
   * When error occur, pass the error to `cb` as first param and the `result` param should be void,
   * Otherwise, first param must be void.
   *
   * @param bucket - Listen to specified hashcode bucket
   * @returns The unTap function
   *
   * @public
   * */
  public tapAsync(
    fn: IAsyncTapCallback<T, R>,
    bucket?: IHookBucketType
  ): ITapDestroy {
    return this.insertAsyncTap(fn, bucket);
  }

  /**
   * listen to hook in async promise mode
   *
   * @param fn - Listener callback
   * When tapping success, return resolved promise.
   * Otherwise, throw error or return rejected promise.
   *
   * @param bucket - Listen to specified hashcode bucket
   * @returns The unTap function
   *
   * @public
   * */
  public tapPromise(
    fn: IPromiseTapCallback<T, R | void>,
    bucket?: IHookBucketType
  ): ITapDestroy {
    return this.insertPromiseTap(fn, bucket);
  }
}

/**
 * Synchronous Hook
 *
 * @remarks
 * Invoke listener Synchronously and return nothing
 *
 * @public
 * */
export class SyncHook<T, R = void> extends SyncTapHook<T, R> {
  /**
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   *
   * */
  public call(...args: AsArray<T>): void {
    this.invokeSynchronously(args);
  }
}

/**
 * Synchronous Bail Hook
 *
 * @remarks
 * Invoke listener Synchronously.
 * Calling will bail with non-undefined value returned with listener.
 * If no listener return non-undefined value, calling will bail with first element of arguments
 *
 * @public
 * */
export class SyncBailHook<T, R> extends SyncTapHook<T, R> {
  /**
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   * @returns bailed value
   * */
  public call(...args: AsArray<T>): R {
    return this.invokeSynchronously(args, {
      shouldBail: true
    });
  }
}

/**
 * Synchronous Waterfall Hook
 *
 * @remarks
 * Invoke listener Synchronously.
 * Those non-undefined value returned from upstream listener, will waterfall to downstream as first element of arguments.
 * Calling return with waterfall value of last listener.
 *
 * @public
 * */
export class SyncWaterfallHook<T, R> extends SyncTapHook<T, R> {
  /**
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   * @returns waterfall value
   * */
  public call(...args: AsArray<T>): R {
    return this.invokeSynchronously(args, {
      shouldWaterfall: true
    });
  }
}

/**
 * Asynchronous Parallel Hook
 *
 * @remarks
 * Invoke listeners in parallel asynchronously
 *
 * @public
 * */
export class AsyncParallelHook<T, R = void> extends AsyncTapHook<T, R> {
  /**
   * call listener with `...args` and `cb`
   *
   * @param args - rest parameters of calling arguments and `cb`
   * The signature of `cb` is `(err?: Error) => void`.
   * */
  public callAsync(...args: IAsyncTapArgs<T, R>): void {
    let asyncCb = args.pop() as Callback<Error, R>;

    this.invokeParallel(
      // @ts-ignored
      args,
      {
        onComplete(err: Error) {
          if (err != null) {
            asyncCb(err);
          } else {
            asyncCb();
          }
        }
      }
    );
  }

  /***
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   * @returns Promise indicated whether calling succeed or failed
   * */
  public callPromise(...args: AsArray<T>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.invokeParallel(args, {
        onComplete(err: Error) {
          if (err != null) {
            reject(err);
          } else {
            resolve();
          }
        }
      });
    });
  }
}

/**
 * Asynchronous Parallel Bail Hook
 *
 * @remarks
 * Invoke listeners in parallel asynchronously.
 * Calling will bail with the first non-undefined value returned from listener, or failed with error if error occur first.
 *
 * @public
 * */
export class AsyncParallelBailHook<T, R> extends AsyncTapHook<T, R> {
  /**
   * call listener with `...args` and `cb`
   *
   * @param args - rest parameters of calling arguments and `cb`
   * The signature of `cb` is `(err?: Error, result?: R) => void`.
   * */
  public callAsync(...args: IAsyncTapArgs<T, R>): void {
    let asyncCb = args.pop() as Callback<Error, R>;

    this.invokeParallel(
      // @ts-ignored
      args,
      {
        shouldBail: true,
        onComplete: asyncCb
      }
    );
  }

  /***
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   * @returns Promise<R> indicated whether calling succeed or failed
   * If calling succeed, promise was resolved with bailed value.
   * */
  public callPromise(...args: AsArray<T>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.invokeParallel(args, {
        shouldBail: true,
        onComplete(err: Error, result) {
          if (err != null) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      });
    });
  }
}

/**
 * Asynchronous Series Hook
 *
 * @remarks
 * Invoke listeners in queue asynchronously.
 *
 * @public
 * */
export class AsyncSeriesHook<T, R = void> extends AsyncTapHook<T, R> {
  /**
   * call listener with `...args` and `cb`
   *
   * @param args - rest parameters of calling arguments and `cb`
   * The signature of `cb` is `(err?: Error) => void`.
   * */
  public callAsync(...args: IAsyncTapArgs<T, R>): void {
    let asyncCb = args.pop() as Callback<Error, R>;

    this.invokeSeries(
      // @ts-ignored
      args,
      {
        onComplete(err: Error) {
          if (err != null) {
            asyncCb(err);
          } else {
            asyncCb();
          }
        }
      }
    );
  }

  /***
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   * @returns Promise indicated whether calling succeed or failed
   * */
  public callPromise(...args: AsArray<T>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.invokeSeries(args, {
        onComplete(err: Error) {
          if (err != null) {
            reject(err);
          } else {
            resolve();
          }
        }
      });
    });
  }
}

/**
 * Asynchronous Series Bail Hook
 *
 * @remarks
 * Invoke listeners in queue asynchronously.
 * Calling will bail with non-undefined value returned with listener.
 * If no listener return non-undefined value, calling will bail with first element of arguments
 *
 * @public
 * */
export class AsyncSeriesBailHook<T, R> extends AsyncTapHook<T, R> {
  /**
   * call listener with `...args` and `cb`
   *
   * @param args - rest parameters of calling arguments and `cb`
   * The signature of `cb` is `(err?: Error, result?: R) => void`.
   * */
  public callAsync(...args: IAsyncTapArgs<T, R>): void {
    let asyncCb = args.pop() as Callback<Error, R>;

    this.invokeSeries(
      // @ts-ignored
      args,
      {
        shouldBail: true,
        onComplete: asyncCb
      }
    );
  }

  /***
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   * @returns Promise<R> indicated whether calling succeed or failed
   * If calling succeed, promise was resolved with bailed value.
   * */
  public callPromise(...args: AsArray<T>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.invokeSeries(args, {
        shouldBail: true,
        onComplete(err, result) {
          if (err != null) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      });
    });
  }
}

/**
 * Asynchronous Waterfall Hook
 *
 * @remarks
 * Invoke listener in queue Asynchronously.
 * Those non-undefined value returned from upstream listener, will waterfall to downstream as first element of arguments.
 * Calling return with waterfall value of last listener.
 *
 * @public
 * */
export class AsyncSeriesWaterfallHook<T, R> extends AsyncTapHook<T, R> {
  /**
   * call listener with `...args` and `cb`
   *
   * @param args - rest parameters of calling arguments and `cb`
   * The signature of `cb` is `(err?: Error) => void`.
   * */
  public callAsync(...args: IAsyncTapArgs<T, R>): void {
    let asyncCb = args.pop() as Callback<Error, R>;

    this.invokeSeries(
      // @ts-ignored
      args,
      {
        shouldWaterfall: true,
        onComplete: asyncCb
      }
    );
  }

  /***
   * call listener with `...args`
   *
   * @param args - rest parameters of calling arguments
   * @returns Promise indicated whether calling succeed or failed
   * If calling succeed, promise was resolved with waterfall value.
   * */
  public callPromise(...args: AsArray<T>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.invokeSeries(args, {
        shouldWaterfall: true,
        onComplete(err, result) {
          if (err != null) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      });
    });
  }
}

export default {
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,

  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,

  AsyncParallelHook,
  AsyncParallelBailHook
};
