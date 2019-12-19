/**
 * Created by samhwang1990@gmail.com.
 */

import { AsyncParallelBailHook } from '../index';

import isPromise from "./utils/isPromise";
import {homedir} from "os";

describe('AsyncParallelBailHook', () => {
    describe(
        '`unTap = tapAsync((...args, cb) => void)` to listen',
        () => {
            test(
                closureName([
                        'args is the invoked arguments',
                        'last argument of tapAsync callback must be function type',
                        'fail with `cb(error, undefined)`',
                        'complete with `cb(undefined, value)`',
                        '`unTap` can remove listener from hook'
                    ]),
                async () => {
                    let errFail = new Error('failed');
                    
                    let cb = jest.fn()
                        .mockImplementationOnce((...args) => args.pop()(errFail))
                        .mockImplementation((...args) => args.pop()(undefined, 'foo'));
                    
                    let args = [1, 2, 3];

                    let invokePromise: Promise<number | string>;
                    let unTap;

                    let hook = new AsyncParallelBailHook<number[], number | string>();
                    unTap = hook.tapAsync(cb);
                    
                    invokePromise = hook.callPromise(...args);

                    await expect(invokePromise).rejects.toThrow(errFail);
                    expect(cb).toBeCalledTimes(1);
                    expect(cb.mock.calls[0][0]).toBe(1);
                    expect(cb.mock.calls[0][1]).toBe(2);
                    expect(cb.mock.calls[0][2]).toBe(3);
                    expect(cb.mock.calls[0][3]).toBeFunction();

                    invokePromise = hook.callPromise(...args);
                    
                    await expect(invokePromise).resolves.toBe('foo');
                    expect(cb).toBeCalledTimes(2);
                    expect(cb.mock.calls[1][0]).toBe(1);
                    expect(cb.mock.calls[1][1]).toBe(2);
                    expect(cb.mock.calls[1][2]).toBe(3);
                    expect(cb.mock.calls[1][3]).toBeFunction();
                    
                    unTap();

                    await hook.callPromise(...args);

                    expect(cb).toBeCalledTimes(2);
                }
            );
        }
    );
    
    describe(
        '`unTap = tapPromise(cb)` to listen',
        () => {
            test(closureName([
                '`cb` was called with invoked arguments',
                '`cb` can return value in any type which will be wrapped as promise',
                'fail with throw error or rejected promise',
                'complete with resolved promise',
                '`unTap` can remove listener from hook'
            ]), async () => {
                let errThrowingError= new Error('throw error');
                let errRejectedPromise = new Error('rejected promise');
                
                let cb = jest.fn()
                    .mockImplementationOnce(() => {
                        throw errThrowingError;
                    })
                    .mockRejectedValueOnce(errRejectedPromise)
                    .mockResolvedValue('foo');
                
                let args = [1, 2, 3];
                
                let unTap;
                let invokePromise: Promise<number | string>;

                let hook = new AsyncParallelBailHook<number[], number | string>();
                unTap = hook.tapPromise(cb);
                
                invokePromise = hook.callPromise(...args);
                
                await expect(invokePromise).rejects.toThrow(errThrowingError);
                expect(cb).toBeCalledTimes(1);
                expect(cb.mock.calls[0][0]).toBe(1);
                expect(cb.mock.calls[0][1]).toBe(2);
                expect(cb.mock.calls[0][2]).toBe(3);

                invokePromise = hook.callPromise(...args);

                await expect(invokePromise).rejects.toThrow(errRejectedPromise);
                expect(cb).toBeCalledTimes(2);
                expect(cb.mock.calls[1][0]).toBe(1);
                expect(cb.mock.calls[1][1]).toBe(2);
                expect(cb.mock.calls[1][2]).toBe(3);

                invokePromise = hook.callPromise(...args);

                await expect(invokePromise).resolves.toBe('foo');
                expect(cb).toBeCalledTimes(3);
                expect(cb.mock.calls[2][0]).toBe(1);
                expect(cb.mock.calls[2][1]).toBe(2);
                expect(cb.mock.calls[2][2]).toBe(3);
                
                unTap();

                await hook.callPromise(...args);
                
                expect(cb).toBeCalledTimes(3);
            });
        }
    );
    
    describe(
        '`callAsync(...args, cb)` to invoke',
        () => {
            test('invocation calling return nothing', () => {
                let invokeResult = null;
                
                let hook = new AsyncParallelBailHook();
                invokeResult = hook.callAsync(noop);

                expect(invokeResult).toBeUndefined();
            });

            test('all listener was called in queue immediately with args', (done) => {
                let immediateCalledResult = [];
                let asyncListener = jest.fn((...args) => {
                    let cb = args.pop();
                    immediateCalledResult.push(1);
                    setTimeout(() => {
                        immediateCalledResult.push(2);
                        cb();
                    }, 50);
                });

                let promiseListener = jest.fn((...args) => {
                    immediateCalledResult.push(3);
                    return new Promise<void>((resolve => {
                        setTimeout(() => {
                            immediateCalledResult.push(4);
                            resolve();
                        }, 100);
                    }));
                });

                let invokeCb = function() {
                    expect(immediateCalledResult[0]).toBe(1);
                    expect(immediateCalledResult[1]).toBe(3);
                    expect(immediateCalledResult[2]).toBe(2);
                    expect(immediateCalledResult[3]).toBe(4);

                    done();
                };

                let hook = new AsyncParallelBailHook();
                hook.tapAsync(asyncListener);
                hook.tapPromise(promiseListener);
                
                hook.callAsync(invokeCb);
            });
            
            test(
                closureName([
                    'if bailed with failed listener first, invocation failed by calling `cb(error)`',
                    'if bailed with completed listener first, invocation completed by calling `cb(undefined, value)`',
                    'if no listener was bailed, invocation completed with args[0] by calling `cb(undefined, args[0])`',
                ]),
                (done) => {
                    let asyncErr = new Error('async error');
                    let promiseErr = new Error('promise error');
                    
                    let callbackDefer = {
                        asyncComplete: 0,
                        promiseComplete: 0,
                        asyncFailed: 0,
                        promiseFailed: 0,
                    };

                    let asyncCompleteCb = jest.fn((...args) => {
                        setTimeout(() => {
                            args.pop()(null, 'async complete');
                        }, callbackDefer.asyncComplete);
                    });
                    let promiseCompleteCb = jest.fn((...args) => {
                        return new Promise<string>(resolve => {
                            setTimeout(() => {
                                resolve('promise complete');
                            }, callbackDefer.promiseComplete);
                        })
                    });

                    let asyncFailedCb = jest.fn((...args) => {
                        setTimeout(() => {
                            args.pop()(asyncErr);
                        }, callbackDefer.asyncFailed);
                    });

                    let promiseFailedCb = jest.fn((...args) => {
                        return new Promise<string>((resolve, reject) => {
                            setTimeout(() => {
                                reject(promiseErr);
                            }, callbackDefer.promiseFailed)
                        });
                    });

                    let args = [1, 2, 3];
                    
                    let hook = new AsyncParallelBailHook<[number, number, number], number | string>();
                    hook.tapAsync(asyncCompleteCb);
                    hook.tapPromise(promiseCompleteCb);
                    hook.tapAsync(asyncFailedCb);
                    hook.tapPromise(promiseFailedCb);
                    
                    let invokeCb = jest.fn()
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(1);
                            expect(args[0]).toBe(asyncErr);

                            callbackDefer = {
                                asyncComplete: 10,
                                promiseComplete: 10,
                                asyncFailed: 10,
                                promiseFailed: 0,
                            };
                            hook.callAsync.call(hook, ...args, invokeCb);
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(1);
                            expect(args[0]).toBe(promiseErr);
                            
                            callbackDefer = {
                                asyncComplete: 0,
                                promiseComplete: 10,
                                asyncFailed: 10,
                                promiseFailed: 10,
                            };
                            hook.callAsync.call(hook, ...args, invokeCb);
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(2);
                            expect(args[0]).toBeNil();
                            expect(args[1]).toBe('async complete');

                            callbackDefer = {
                                asyncComplete: 10,
                                promiseComplete: 0,
                                asyncFailed: 10,
                                promiseFailed: 10,
                            };
                            hook.callAsync.call(hook, ...args, invokeCb);
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(2);
                            expect(args[0]).toBeNil();
                            expect(args[1]).toBe('promise complete');
                            
                            done();
                        });

                    callbackDefer = {
                        asyncComplete: 10,
                        promiseComplete: 10,
                        asyncFailed: 0,
                        promiseFailed: 10,
                    };
                    
                    hook.callAsync.call(hook, ...args, invokeCb);
                }
            )
        }
    );
    
    describe(
        '`callPromise(...args, cb)` to invoke',
        () => {
            test('invocation return a promise', () => {
                let invokeReturn;

                let hook = new AsyncParallelBailHook();
                invokeReturn = hook.callPromise();

                expect(isPromise(invokeReturn)).toBeTrue();
            });

            test('all listener was called in queue immediately with args', async () => {
                let immediateCalledResult = [];
                let asyncListener = jest.fn((...args) => {
                    let cb = args.pop();
                    immediateCalledResult.push(1);
                    setTimeout(() => {
                        immediateCalledResult.push(2);
                        cb();
                    }, 50);
                });

                let promiseListener = jest.fn((...args) => {
                    immediateCalledResult.push(3);
                    return new Promise((resolve => {
                        setTimeout(() => {
                            immediateCalledResult.push(4);
                            resolve();
                        }, 100);
                    }));
                });

                let hook = new AsyncParallelBailHook();
                hook.tapAsync(asyncListener);
                hook.tapPromise(promiseListener);
                
                await hook.callPromise();

                expect(immediateCalledResult[0]).toBe(1);
                expect(immediateCalledResult[1]).toBe(3);
                expect(immediateCalledResult[2]).toBe(2);
                expect(immediateCalledResult[3]).toBe(4);
            });

            test(
                closureName([
                    'if bailed with failed listener first, invocation failed by rejecting promise with error',
                    'if bailed with completed listener first, invocation completed by resolving promise',
                    'if no listener was bailed, invocation completed by resolving promise with `args[0]`',
                ]),
                async () => {
                    let asyncErr = new Error('async error');
                    let promiseErr = new Error('promise error');

                    let callbackDefer = {
                        asyncComplete: 0,
                        promiseComplete: 0,
                        asyncFailed: 0,
                        promiseFailed: 0,
                    };

                    let asyncCompleteCb = jest.fn((...args) => {
                        setTimeout(() => {
                            args.pop()(null, 'async complete');
                        }, callbackDefer.asyncComplete);
                    });

                    let promiseCompleteCb = jest.fn((...args) => {
                        return new Promise<string>(resolve => {
                            setTimeout(() => {
                                resolve('promise complete');
                            }, callbackDefer.promiseComplete);
                        })
                    });

                    let asyncFailedCb = jest.fn((...args) => {
                        setTimeout(() => {
                            args.pop()(asyncErr);
                        }, callbackDefer.asyncFailed);
                    });

                    let promiseFailedCb = jest.fn((...args) => {
                        return new Promise<string>((resolve, reject) => {
                            setTimeout(() => {
                                reject(promiseErr);
                            }, callbackDefer.promiseFailed)
                        });
                    });

                    let args = [1, 2, 3];
                    let invokePromise;

                    let hook = new AsyncParallelBailHook<[number, number, number], number | string>();
                    hook.tapAsync(asyncCompleteCb);
                    hook.tapPromise(promiseCompleteCb);
                    hook.tapAsync(asyncFailedCb);
                    hook.tapPromise(promiseFailedCb);

                    callbackDefer = {
                        asyncComplete: 10,
                        promiseComplete: 10,
                        asyncFailed: 0,
                        promiseFailed: 10,
                    };

                    invokePromise = hook.callPromise.apply(hook, args);

                    await expect(invokePromise).rejects.toThrow(asyncErr);

                    callbackDefer = {
                        asyncComplete: 10,
                        promiseComplete: 10,
                        asyncFailed: 10,
                        promiseFailed: 0,
                    };

                    invokePromise = hook.callPromise.apply(hook, args);

                    await expect(invokePromise).rejects.toThrow(promiseErr);

                    callbackDefer = {
                        asyncComplete: 0,
                        promiseComplete: 10,
                        asyncFailed: 10,
                        promiseFailed: 10,
                    };

                    invokePromise = hook.callPromise.apply(hook, args);

                    await expect(invokePromise).resolves.toBe('async complete');

                    callbackDefer = {
                        asyncComplete: 10,
                        promiseComplete: 0,
                        asyncFailed: 10,
                        promiseFailed: 10,
                    };

                    invokePromise = hook.callPromise.apply(hook, args);

                    await expect(invokePromise).resolves.toBe('promise complete');
                }
            );
        }
    );
    
    describe(
        'clean all listeners',
        () => {
            let hook: AsyncParallelBailHook<number[], string>;
            let asyncCb, promiseCb;
            let args;

            beforeEach(() => {
                args = [1, 2, 3];
                asyncCb = jest.fn((...args) => {
                    setTimeout(() => {
                        args.pop()(null, 'async complete')
                    }, 10);
                });
                promiseCb = jest.fn((...args) => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve('promise complete');
                        }, 10);  
                    })
                });
            });

            test(
                '`callPromise(...args)` invoke nothing, promise resolved with `args[0]` immediately',
                async () => {
                    let invokePromise;

                    hook = new AsyncParallelBailHook<number[], string>();
                    hook.tapAsync(asyncCb);
                    hook.tapPromise(promiseCb);
                    
                    invokePromise = hook.callPromise(...args);

                    await expect(invokePromise).resolves.toBe('async complete');
                    expect(asyncCb).toBeCalledTimes(1);
                    expect(promiseCb).toBeCalledTimes(1);

                    asyncCb.mockClear();
                    promiseCb.mockClear();

                    hook.exhaust();
                    invokePromise = hook.callPromise(...args);

                    await expect(invokePromise).resolves.toBe(1);
                    expect(asyncCb).not.toBeCalled();
                    expect(promiseCb).not.toBeCalled();
                }
            );

            test(
                '`callAsync(...args, cb)` invoke nothing, `cb` called with `args[0]` immediately',
                (done) => {
                    let invokeCb = jest.fn()
                        .mockImplementationOnce((...invokeResult) => {
                            expect(invokeResult.length).toBe(2);
                            expect(invokeResult[0]).toBeNil();
                            expect(invokeResult[1]).toBe('async complete');
                            
                            expect(asyncCb).toBeCalledTimes(1);
                            expect(promiseCb).toBeCalledTimes(1);

                            asyncCb.mockClear();
                            promiseCb.mockClear();

                            hook.exhaust();
                            hook.callAsync.call(hook, ...args, invokeCb);
                        })
                        .mockImplementationOnce((...invokeResult) => {
                            expect(invokeResult.length).toBe(2);
                            expect(invokeResult[0]).toBeNil();
                            expect(invokeResult[1]).toBe(args[0]);

                            expect(asyncCb).not.toBeCalled();
                            expect(promiseCb).not.toBeCalled();

                            done();
                        });

                    hook = new AsyncParallelBailHook<number[], string>();
                    hook.tapAsync(asyncCb);
                    hook.tapPromise(promiseCb);
                    hook.callAsync.call(hook, ...args, invokeCb);
                }
            )
        }
    );
});