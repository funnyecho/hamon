/**
 * Created by samhwang1990@gmail.com.
 */

import isPromise from "./utils/isPromise";

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

                    let invokePromise: Promise<undefined>;
                    let unTap;

                    // TODO: create AsyncParallelBailHook
                    // TODO: listen to hook with cb, update unTap;

                    // TODO: invoke hook with callPromise, update invokePromise
                    
                    await expect(invokePromise).rejects.toThrow(errFail);
                    expect(cb).toBeCalledTimes(1);
                    expect(cb.mock.calls[0][0]).toBe(1);
                    expect(cb.mock.calls[0][1]).toBe(2);
                    expect(cb.mock.calls[0][2]).toBe(3);
                    expect(cb.mock.calls[0][3]).toBeFunction();

                    // TODO: invoke hook with callPromise, update invokePromise
                    await expect(invokePromise).resolves.toBe('foo');
                    expect(cb).toBeCalledTimes(2);
                    expect(cb.mock.calls[1][0]).toBe(1);
                    expect(cb.mock.calls[1][1]).toBe(2);
                    expect(cb.mock.calls[1][2]).toBe(3);
                    expect(cb.mock.calls[1][3]).toBeFunction();
                    
                    unTap();

                    // TODO: invoke hook with callPromise

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
                let invokePromise: Promise<undefined>;

                // TODO: create AsyncParallelBailHook
                // TODO: listen to hook with cb, update unTap;

                // TODO: invoke hook with callPromise, update invokePromise
                
                await expect(invokePromise).rejects.toThrow(errThrowingError);
                expect(cb).toBeCalledTimes(1);
                expect(cb.mock.calls[0][0]).toBe(1);
                expect(cb.mock.calls[0][1]).toBe(2);
                expect(cb.mock.calls[0][2]).toBe(3);

                // TODO: invoke hook with callPromise, update invokePromise

                await expect(invokePromise).rejects.toThrow(errRejectedPromise);
                expect(cb).toBeCalledTimes(2);
                expect(cb.mock.calls[1][0]).toBe(1);
                expect(cb.mock.calls[1][1]).toBe(2);
                expect(cb.mock.calls[1][2]).toBe(3);

                // TODO: invoke hook with callPromise, update invokePromise

                await expect(invokePromise).resolves.toBe('foo');
                expect(cb).toBeCalledTimes(3);
                expect(cb.mock.calls[2][0]).toBe(1);
                expect(cb.mock.calls[2][1]).toBe(2);
                expect(cb.mock.calls[2][2]).toBe(3);
                
                unTap();
                
                // TODO: invoke hook with callPromise
                
                expect(cb).toBeCalledTimes(3);
            });
        }
    );
    
    describe(
        '`callAsync(...args, cb)` to invoke',
        () => {
            test('invocation calling return nothing', () => {
                let invokeResult = null;

                // TODO: create AsyncParallelBailHook
                // TODO: invoke hook

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
                    return new Promise((resolve => {
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
                }

                // TODO: create AsyncParallelBailHook
                // TODO: listen to hook with [asyncListener, promiseListener]

                // TODO: invoke hook with invokeCb
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

                    let callbackCalled = {
                        asyncComplete: false,
                        promiseComplete: false,
                        asyncFailed: false,
                        promiseFailed: false,
                    };
                    
                    let callbackDefer = {
                        asyncComplete: 0,
                        promiseComplete: 0,
                        asyncFailed: 0,
                        promiseFailed: 0,
                    };

                    function initCallbackCalledCache() {
                        callbackCalled = {
                            asyncComplete: false,
                            promiseComplete: false,
                            asyncFailed: false,
                            promiseFailed: false,
                        };
                    }

                    let asyncCompleteCb = jest.fn((...args) => {
                        setTimeout(() => {
                            callbackCalled.asyncComplete = true;
                            args.pop()('async complete');
                        }, callbackDefer.asyncComplete);
                    });
                    let promiseCompleteCb = jest.fn((...args) => {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                callbackCalled.promiseComplete = true;
                                resolve('promise complete');
                            }, callbackDefer.promiseComplete);
                        })
                    });

                    let asyncFailedCb = jest.fn((...args) => {
                        setTimeout(() => {
                            callbackCalled.asyncFailed = true;
                            args.pop()(asyncErr);
                        }, callbackDefer.asyncFailed);
                    });

                    let promiseFailedCb = jest.fn((...args) => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                callbackCalled.promiseFailed = true;
                                reject(promiseErr);
                            }, callbackDefer.promiseFailed)
                        });
                    });

                    let args = [1, 2, 3];

                    // TODO: create AsyncParallelBailHook
                    /**
                     * TODO:
                     *    listen to hook with [asyncCompleteCb, promiseCompleteCb, asyncFailedCb, promiseFailedCb]
                     *    update unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete
                     * */

                    let invokeCb = jest.fn()
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(1);
                            expect(args[0]).toBe(asyncErr);

                            expect(callbackCalled.asyncFailed).toBeTrue();

                            expect(callbackCalled.asyncComplete).toBeFalse();
                            expect(callbackCalled.promiseComplete).toBeFalse();
                            expect(callbackCalled.promiseFailed).toBeFalse();

                            initCallbackCalledCache();
                            callbackDefer = {
                                asyncComplete: 10,
                                promiseComplete: 10,
                                asyncFailed: 10,
                                promiseFailed: 0,
                            };
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(1);
                            expect(args[0]).toBe(promiseErr);

                            expect(callbackCalled.promiseFailed).toBeTrue();

                            expect(callbackCalled.asyncComplete).toBeFalse();
                            expect(callbackCalled.promiseComplete).toBeFalse();
                            expect(callbackCalled.asyncFailed).toBeFalse();

                            initCallbackCalledCache();
                            callbackDefer = {
                                asyncComplete: 0,
                                promiseComplete: 10,
                                asyncFailed: 10,
                                promiseFailed: 10,
                            };
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(2);
                            expect(args[0]).toBeNil();
                            expect(args[1]).toBe('async complete');

                            expect(callbackCalled.asyncComplete).toBeTrue();
                            
                            expect(callbackCalled.promiseComplete).toBeFalse();
                            expect(callbackCalled.asyncFailed).toBeFalse();
                            expect(callbackCalled.promiseFailed).toBeFalse();

                            initCallbackCalledCache();
                            callbackDefer = {
                                asyncComplete: 10,
                                promiseComplete: 0,
                                asyncFailed: 10,
                                promiseFailed: 10,
                            };
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(2);
                            expect(args[0]).toBeNil();
                            expect(args[1]).toBe('promise complete');

                            expect(callbackCalled.promiseComplete).toBeTrue();

                            expect(callbackCalled.asyncComplete).toBeFalse();
                            expect(callbackCalled.asyncFailed).toBeFalse();
                            expect(callbackCalled.promiseFailed).toBeFalse();
                            
                            done();
                        });

                    callbackDefer = {
                        asyncComplete: 10,
                        promiseComplete: 10,
                        asyncFailed: 0,
                        promiseFailed: 10,
                    };

                    // TODO: invoke hook with args and invokeCb
                    // TODO: invoke hook with args and invokeCb
                    // TODO: invoke hook with args and invokeCb
                    // TODO: invoke hook with args and invokeCb

                }
            )
        }
    );
    
    describe(
        '`callPromise(...args, cb)` to invoke',
        () => {
            test('invocation return a promise', () => {
                let invokeReturn;

                // TODO: create AsyncParallelBailHooks
                // TODO: invoke hook

                expect(isPromise(invokeReturn)).toBeTrue();
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
                    return new Promise((resolve => {
                        setTimeout(() => {
                            immediateCalledResult.push(4);
                            resolve();
                        }, 100);
                    }));
                });

                // TODO: create AsyncParallelBailHook
                // TODO: listen to hook with [asyncListener, promiseListener]

                // TODO: invoke hook

                expect(immediateCalledResult[0]).toBe(1);
                expect(immediateCalledResult[1]).toBe(3);
                expect(immediateCalledResult[2]).toBe(2);
                expect(immediateCalledResult[3]).toBe(4);
            });
        }
    );
    
    test(
        closureName([
            'if bailed with failed listener first, invocation failed by rejecting promise with error',
            'if bailed with completed listener first, invocation completed by resolving promise',
            'if no listener was bailed, invocation completed by resolving promise with `args[0]`',
        ]),
        async () => {
            let asyncErr = new Error('async error');
            let promiseErr = new Error('promise error');

            let callbackCalled = {
                asyncComplete: false,
                promiseComplete: false,
                asyncFailed: false,
                promiseFailed: false,
            };

            let callbackDefer = {
                asyncComplete: 0,
                promiseComplete: 0,
                asyncFailed: 0,
                promiseFailed: 0,
            };

            function initCallbackCalledCache() {
                callbackCalled = {
                    asyncComplete: false,
                    promiseComplete: false,
                    asyncFailed: false,
                    promiseFailed: false,
                };
            }

            let asyncCompleteCb = jest.fn((...args) => {
                setTimeout(() => {
                    callbackCalled.asyncComplete = true;
                    args.pop()(null, 'async complete');
                }, callbackDefer.asyncComplete);
            });
            
            let promiseCompleteCb = jest.fn((...args) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        callbackCalled.promiseComplete = true;
                        resolve('promise complete');
                    }, callbackDefer.promiseComplete);
                })
            });

            let asyncFailedCb = jest.fn((...args) => {
                setTimeout(() => {
                    callbackCalled.asyncFailed = true;
                    args.pop()(asyncErr);
                }, callbackDefer.asyncFailed);
            });

            let promiseFailedCb = jest.fn((...args) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        callbackCalled.promiseFailed = true;
                        reject(promiseErr);
                    }, callbackDefer.promiseFailed)
                });
            });

            let invokePromise;

            // TODO: create AsyncParallelHook
            /**
             * TODO:
             *    listen to hook with [asyncCompleteCb, promiseCompleteCb, asyncFailedCb, promiseFailedCb]
             *    update unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete
             * */

            callbackDefer = {
                asyncComplete: 10,
                promiseComplete: 10,
                asyncFailed: 0,
                promiseFailed: 10,
            };

            // TODO: invoke hook with args, update invokePromise

            await exports(invokePromise).rejects.toThrow(asyncErr);
            expect(callbackCalled.asyncFailed).toBeTrue();

            expect(callbackCalled.asyncComplete).toBeFalse();
            expect(callbackCalled.promiseComplete).toBeFalse();
            expect(callbackCalled.promiseFailed).toBeFalse();

            initCallbackCalledCache();
            callbackDefer = {
                asyncComplete: 10,
                promiseComplete: 10,
                asyncFailed: 10,
                promiseFailed: 0,
            };

            // TODO: invoke hook with args, update invokePromise

            await exports(invokePromise).rejects.toThrow(promiseErr);

            expect(callbackCalled.promiseFailed).toBeTrue();
            
            expect(callbackCalled.asyncComplete).toBeFalse();
            expect(callbackCalled.promiseComplete).toBeFalse();
            expect(callbackCalled.asyncFailed).toBeFalse();

            initCallbackCalledCache();
            callbackDefer = {
                asyncComplete: 0,
                promiseComplete: 10,
                asyncFailed: 10,
                promiseFailed: 10,
            };

            // TODO: invoke hook with args, update invokePromise

            await exports(invokePromise).resolves.toBe('async complete');

            expect(callbackCalled.asyncComplete).toBeTrue();
            
            expect(callbackCalled.promiseComplete).toBeFalse();
            expect(callbackCalled.asyncFailed).toBeFalse();
            expect(callbackCalled.promiseFailed).toBeFalse();

            initCallbackCalledCache();
            callbackDefer = {
                asyncComplete: 10,
                promiseComplete: 0,
                asyncFailed: 10,
                promiseFailed: 10,
            };

            // TODO: invoke hook with args, update invokePromise

            await exports(invokePromise).resolves.toBe('promise complete');

            expect(callbackCalled.promiseComplete).toBeTrue();

            expect(callbackCalled.asyncComplete).toBeFalse();
            expect(callbackCalled.asyncFailed).toBeFalse();
            expect(callbackCalled.promiseFailed).toBeFalse();
        }
    );
    
    describe(
        'clean all listeners',
        () => {
            let asyncCb, promiseCb;
            let args;

            beforeEach(() => {
                args = [1, 2, 3];
                asyncCb = jest.fn((...args) => args.pop()('async complete'));
                promiseCb = jest.fn(() => Promise.resolve('promise complete'));
            });

            test(
                '`callPromise(...args)` invoke nothing, promise resolved with `args[0]` immediately',
                async () => {
                    let invokePromise;
                    // TODO: create AsyncParallelBailHook
                    // TODO: listen to hook with [asyncCb, promiseCb], update invokePromise;
                    // TODO: invoke hook

                    await expect(invokePromise).resolves.toBe('promise complete');
                    expect(asyncCb).toBeCalledTimes(1);
                    expect(promiseCb).toBeCalledTimes(1);

                    asyncCb.mockClear();
                    promiseCb.mockClear();

                    // TODO: exhaust hook
                    // TODO: invoke hook

                    await expect(invokePromise).resolves.toBe(1);
                    expect(asyncCb).not.toBeCalled();
                    expect(promiseCb).not.toBeCalled();
                }
            );

            test(
                '`callAsync(...args, cb)` invoke nothing, `cb` called with `args[0]` immediately',
                (done) => {
                    let invokeCb = jest.fn()
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(2);
                            expect(args[0]).toBeNil();
                            expect(args[1]).toBe('async complete');
                            
                            expect(asyncCb).toBeCalledTimes(1);
                            expect(promiseCb).toBeCalledTimes(1);

                            asyncCb.mockClear();
                            promiseCb.mockClear();

                            // TODO: exhaust hook
                            // TODO: invoke hook
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(2);
                            expect(args[0]).toBeNil();
                            expect(args[1]).toBe(args[0]);

                            expect(asyncCb).not.toBeCalled();
                            expect(promiseCb).not.toBeCalled();

                            done();
                        });

                    // TODO: create AsyncParallelBailHook
                    // TODO: listen to hook with [asyncCb, promiseCb]
                    // TODO: invoke hook with invokeCb
                }
            )
        }
    );
});