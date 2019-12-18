/**
 * Created by samhwang1990@gmail.com.
 */

import {
    AsArray,
    Append,
    Callback,
} from './types';
import {on} from "cluster";

type ITapID = string;

type IHookBucketType = any;
type IHookBucketHashcode<T> = (...args: AsArray<T>) => IHookBucketType;

type IAsyncTapArgs<T, R> = Append<AsArray<T>, Callback<Error, R>>;

type ISyncTapCallback<T, R> = (...args: AsArray<T>) => R;
type IAsyncTapCallback<T, R> = (...args: IAsyncTapArgs<T, R>) => void;
type IPromiseTapCallback<T, R> = (...args: AsArray<T>) => Promise<R>;
type ITapCallback<T, R> = ISyncTapCallback<T, R> | IAsyncTapCallback<T, R> | IPromiseTapCallback<T, R>;

export type ITapDestroy = () => void;

type ISyncTap<T, R> = (fn: ISyncTapCallback<T, R>) => ITapDestroy;
type IAsyncTap<T, R> = (fn: IAsyncTapCallback<T, R>) => ITapDestroy;
type IPromiseTap<T, R> = (fn: IPromiseTapCallback<T, R>) => ITapDestroy;

interface ITapOptions<T, R> {
    fn: IAsyncTapCallback<T, R> | ISyncTapCallback<T, R>;
    bucket: string;
}

interface IInvokeSeriesObserver<T, R> {
    shouldBail?: boolean;
    shouldWaterfall?: boolean;
    onError?: (err: Error) => void;
    onComplete?: (result?: R) => void;
}

interface IInvokeParallelObserver<T, R> {
    shouldBail?: boolean;
    onError?: (err: Error) => void;
    onComplete?: (result?: R) => void;
}

interface IInvokeSynchronouslyObserver<T, R> {
    shouldBail?: boolean;
    shouldWaterfall?: boolean;
}

function once(fn: Function): Function {
    let called = false;
    return function onceWrapper(...args) {
        if (called) return;
        fn(...args);
    };
}

function invokeSeriesNext<T, R>(
    observer: IInvokeSeriesObserver<T, R>,
    args: AsArray<T>,
    list: ITapOptions<T, R>[]
) {
    let onComplete;
    let onError;

    if (typeof observer.onComplete === 'function') {
        onComplete = observer.onComplete;
    } else {
        onComplete = function unImplementOnComplete(result?: R) {
            // 
        }
    }

    if (typeof observer.onError === 'function') {
        onError = observer.onError;
    } else {
        onError = function unImplementOnError(err: Error) {
            // 
        }
    }
    
    if (!list.length) {
        onComplete(args[0]);
        return;
    }
    
    let tap = list.shift();
    let downstreamTaps = list;
    let downstreamArgs = Array.from(args) as AsArray<T>;

    let nextArgs = [...args, function onNext(err: Error, result?: R) {
        if (err != null) {
            onError(err);
            return;
        }

        if (result !== undefined && observer.shouldBail === true) {
            onComplete(result);
            return;
        }
        
        if (result !== undefined && observer.shouldWaterfall === true) {
            downstreamArgs[0] = result;
        }
        
        invokeSeriesNext(observer, downstreamArgs, downstreamTaps);
    }] as IAsyncTapArgs<T, R>;

    tap.fn(...nextArgs);
}

function invokeParallel<T, R>(
    observer: IInvokeParallelObserver<T, R>,
    args: AsArray<T>,
    list: ITapOptions<T, R>[],
) {
    let onComplete;
    let onError;

    if (typeof observer.onComplete === 'function') {
        onComplete = observer.onComplete;
    } else {
        onComplete = function unImplementOnComplete(err: Error, result?: R) {
            // 
        }
    }

    if (typeof observer.onError === 'function') {
        onError = observer.onError;
    } else {
        onError = function unImplementOnError(err: Error) {
            // 
        }
    }

    if (!list.length) {
        onComplete(args[0]);
        return;
    }

    let parallelSize = list.length;
    
    let nextArgs = [...args, function onNext(err: Error, result?: R) {
        if (err != null) {
            onError(err);
            return;
        }

        if (result !== undefined && observer.shouldBail === true) {
            onComplete(result);
            return;
        }

        --parallelSize;
        if (parallelSize <= 0) {
            onComplete(args[0]);
            return;
        }
        
    }] as IAsyncTapArgs<T, R>;
    
    for (let option of list) {
        option.fn(...nextArgs);
    }
}

function invokeSynchronously<T, R>(
    observer: IInvokeSynchronouslyObserver<T, R>,
    args: AsArray<T>,
    list: ITapOptions<T, R>[],
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

class Hook<T, R> {
    private tapIdSeed = 0;
    
    protected readonly bucketHashcode: IHookBucketHashcode<T>;
    protected readonly presetTapBucket: Set<ITapID>;
    protected readonly tapBuckets: Map<IHookBucketType, Set<ITapID>>;
    protected readonly tapOptionsCache: Map<ITapID, ITapOptions<T, R>>;
    
    constructor(bucketHashcode?: IHookBucketHashcode<T>) {
        this.presetTapBucket = new Set<ITapID>();
        this.tapBuckets = new Map();
        this.tapOptionsCache = new Map();
        
        this.bucketHashcode = bucketHashcode;
    }
    
    public exhaust() {
        this.presetTapBucket.clear();
        this.tapBuckets.clear();
        this.tapOptionsCache.clear();
    }
    
    public destroy() {
        this.exhaust();
    }
    
    protected insertSyncTap(fn: ISyncTapCallback<T, R>, bucket?: IHookBucketType): ITapDestroy {
        return this.tapping(fn, bucket);
    }

    protected insertAsyncTap(fn: IAsyncTapCallback<T, R>, bucket?: IHookBucketType): ITapDestroy {
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

    protected insertPromiseTap(fn: IPromiseTapCallback<T, R>, bucket?: IHookBucketType): ITapDestroy {
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
                )
            } catch (e) {
                invokeCb(e);
            }
        }
        
        return this.tapping(promiseTapFn, bucket);
    }
    
    protected invokeSeries(args: AsArray<T>, observer?: IInvokeSeriesObserver<T, R>) {
        if (observer == null) {
            observer = {
                shouldWaterfall: false,
                shouldBail: false,
            }
        }
        
        if (typeof observer.onComplete === 'function') {
            // @ts-ignored
            observer.onComplete = once(observer.onComplete);
        }

        if (typeof observer.onError === 'function') {
            // @ts-ignored
            observer.onError = once(observer.onError);
        }
        
        invokeSeriesNext<T, R>(observer, args, Array.from(this.getBucketTaps(args)));
    }
    
    protected invokeParallel(args: AsArray<T>, observer?: IInvokeParallelObserver<T, R>) {
        if (observer == null) {
            observer = {
                shouldBail: false,
            }
        }

        if (typeof observer.onComplete === 'function') {
            // @ts-ignored
            observer.onComplete = once(observer.onComplete);
        }

        if (typeof observer.onError === 'function') {
            // @ts-ignored
            observer.onError = once(observer.onError);
        }
        
        invokeParallel<T, R>(observer, args, Array.from(this.getBucketTaps(args)));
    }
    
    protected invokeSynchronously(args: AsArray<T>, observer?: IInvokeSynchronouslyObserver<T, R>) {
        if (observer == null) {
            observer = {
                shouldBail: false,
                shouldWaterfall: false,
            }
        }
        return invokeSynchronously<T, R>(observer, args, Array.from(this.getBucketTaps(args)));
    }

    protected getBucketTaps(args: AsArray<T>): Set<ITapOptions<T, R>> {
        let presetTaps = Array.from(this.presetTapBucket);
        let bucketTaps: ITapID[] = [];

        if (typeof this.bucketHashcode === 'function') {
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
    
    private tapping(fn: IAsyncTapCallback<T, R> | ISyncTapCallback<T, R>, bucketHash?: IHookBucketType): ITapDestroy {
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
            bucket: bucketHash,
        };

        this.tapOptionsCache.set(tapId, options);
        tapBucket.add(tapId);
        
        return () => {
            this.popoutTap(tapId);
        }
    }
    
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
    
    private generateTapId(): ITapID {
        return `tap:${++this.tapIdSeed}?${Date.now()}`;
    }
}

class SyncTapHook<T, R> extends Hook<T, R> {
    public tap(fn: ISyncTapCallback<T, R>, bucket?: IHookBucketType): ITapDestroy {
        return this.insertSyncTap(fn, bucket);
    }
}

class AsyncTapHook<T, R> extends Hook<T, R> {
    public tapAsync(fn: IAsyncTapCallback<T, R>, bucket?: IHookBucketType): ITapDestroy {
        return this.insertAsyncTap(fn, bucket);
    }
    public tapPromise(fn: IPromiseTapCallback<T, R>, bucket?: IHookBucketType): ITapDestroy {
        return this.insertPromiseTap(fn, bucket);
    }
}

export class SyncHook<T, R = void> extends SyncTapHook<T, R> {
    public call(...args: AsArray<T>): void {
        this.invokeSynchronously(args);
    }
}

export class SyncBailHook<T, R> extends SyncTapHook<T, R> {
    public call(...args: AsArray<T>): R {
        return this.invokeSynchronously(args, {
            shouldBail: true,
        });
    }
}

export class SyncWaterfallHook<T, R> extends SyncTapHook<T, R> {
    public call(...args: AsArray<T>): R {
        return this.invokeSynchronously(args, {
            shouldWaterfall: true,
        });
    }
}

export class AsyncParallelHook<T, R = void> extends AsyncTapHook<T, R> {
    public callAsync(...args: IAsyncTapArgs<T, R>): void {
        let asyncCb = args.pop() as Callback<Error, R>;
        
        this.invokeParallel(
            // @ts-ignored
            args,
            {
                onError(err) {
                    asyncCb(err);
                },
                onComplete(_) {
                    asyncCb(null, undefined);
                }
            }
        )
    }
    
    public callPromise(...args: AsArray<T>): Promise<R> {
        return new Promise((resolve, reject) => {
            this.invokeParallel(
                args,
                {
                    onError(err) {
                        reject(err);
                    },
                    onComplete(_) {
                        resolve(undefined);
                    }
                }
            )
        });
    }
}

export class AsyncParallelBailHook<T, R> extends AsyncTapHook<T, R> {
    public callAsync(...args: IAsyncTapArgs<T, R>): void {
        let asyncCb = args.pop() as Callback<Error, R>;

        this.invokeParallel(
            // @ts-ignored
            args,
            {
                shouldBail: true,
                onError(err) {
                    asyncCb(err);
                },
                onComplete(result) {
                    asyncCb(null, result);
                }
            }
        )
    }

    public callPromise(...args: AsArray<T>): Promise<R> {
        return new Promise((resolve, reject) => {
            this.invokeParallel(
                args,
                {
                    shouldBail: true,
                    onError(err) {
                        reject(err);
                    },
                    onComplete(result) {
                        resolve(result);
                    }
                }
            )
        });
    }
}

export class AsyncSeriesHook<T, R = void> extends AsyncTapHook<T, R> {
    public callAsync(...args: IAsyncTapArgs<T, R>): void {
        let asyncCb = args.pop() as Callback<Error, R>;

        this.invokeSeries(
            // @ts-ignored
            args,
            {
                onError(err) {
                    asyncCb(err);
                },
                onComplete(_) {
                    asyncCb(null, undefined);
                }
            }
        )
    }

    public callPromise(...args: AsArray<T>): Promise<R> {
        return new Promise((resolve, reject) => {
            this.invokeSeries(
                args,
                {
                    onError(err) {
                        reject(err);
                    },
                    onComplete(_) {
                        resolve(undefined);
                    }
                }
            )
        });
    }
}

export class AsyncSeriesBailHook<T, R> extends AsyncTapHook<T, R> {
    public callAsync(...args: IAsyncTapArgs<T, R>): void {
        let asyncCb = args.pop() as Callback<Error, R>;

        this.invokeSeries(
            // @ts-ignored
            args,
            {
                shouldBail: true,
                onError(err) {
                    asyncCb(err);
                },
                onComplete(result) {
                    asyncCb(null, result);
                }
            }
        )
    }

    public callPromise(...args: AsArray<T>): Promise<R> {
        return new Promise((resolve, reject) => {
            this.invokeSeries(
                args,
                {
                    shouldBail: true,
                    onError(err) {
                        reject(err);
                    },
                    onComplete(result) {
                        resolve(result);
                    }
                }
            )
        });
    }
}

export class AsyncSeriesWaterfallHook<T, R> extends AsyncTapHook<T, R> {
    public callAsync(...args: IAsyncTapArgs<T, R>): void {
        let asyncCb = args.pop() as Callback<Error, R>;

        this.invokeSeries(
            // @ts-ignored
            args,
            {
                shouldWaterfall: true,
                onError(err) {
                    asyncCb(err);
                },
                onComplete(result) {
                    asyncCb(null, result);
                }
            }
        )
    }

    public callPromise(...args: AsArray<T>): Promise<R> {
        return new Promise((resolve, reject) => {
            this.invokeSeries(
                args,
                {
                    shouldWaterfall: true,
                    onError(err) {
                        reject(err);
                    },
                    onComplete(result) {
                        resolve(result);
                    }
                }
            )
        });
    }
}