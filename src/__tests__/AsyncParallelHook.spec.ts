/**
 * Created by samhwang1990@gmail.com.
 */

import isPromise from "./utils/isPromise";

describe('AsyncParallelHook', () => {
    describe(
        '`unTap = tapAsync((...args, cb) => void)` to listen',
        () => {
            test(closureName([
                'args is the invoked arguments',
                'last argument of tapAsync callback must be function type',
                'fail with `cb(error)`',
                'complete with `cb()`',
                '`unTap` is a function which can remove listener'
            ]), async () => {
                let errFail = new Error('failed');
                
                let cb = jest.fn()
                    .mockImplementationOnce((...args) => args.pop()(errFail))
                    .mockImplementation((...args) => args.pop()());
                
                let args = [1, 2, 3];
                
                let invokePromise: Promise<undefined>;
                let unTap;

                // TODO: create AsyncParallelHook
                // TODO: listen to hook with cb, update unTap;

                // TODO: invoke hook with callPromise, update invokePromise
                
                await expect(invokePromise).rejects.toThrow(errFail);

                expect(cb).toBeCalledTimes(1);
                expect(cb.mock.calls[0][0]).toBe(1);
                expect(cb.mock.calls[0][1]).toBe(2);
                expect(cb.mock.calls[0][2]).toBe(3);
                expect(cb.mock.calls[0][3]).toBeFunction();
                
                // TODO: invoke hook with callPromise, update invokePromise
                
                await expect(invokePromise).resolves.toBeUndefined();

                expect(cb).toBeCalledTimes(2);
                expect(cb.mock.calls[0][0]).toBe(1);
                expect(cb.mock.calls[0][1]).toBe(2);
                expect(cb.mock.calls[0][2]).toBe(3);
                expect(cb.mock.calls[0][3]).toBeFunction();
                
                unTap();

                // TODO: invoke hook with callPromise
                
                expect(cb).toBeCalledTimes(2);
            }, 1000);
        }
    );
    
    describe(
        '`unTap = tapPromise(cb)` to listen',
        () => {
            test(closureName([
                '`cb` was called with invoked arguments',
                'fail if throwing error or returning rejected promise',
                '`unTap` is a function which can remove listener'
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

                // TODO: create AsyncParallelHook
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
            }, 1000);
        }
    );
    
    describe('`callAsync(...args, cb)` to invoke', () => {
        test('invocation calling return nothing', () => {
            let invokeResult = null;

            // TODO: create AsyncParallelHook
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

            // TODO: create AsyncParallelHook
            // TODO: listen to hook with [asyncListener, promiseListener]

            // TODO: invoke hook with invokeCb
        });
        
        test(
            closureName([
                'if at least one listener failed with error, invocation failed by calling `cb` with error',
                'all listeners completed, invocation completed by calling `cb` without error',
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
                        args.pop()();
                    }, 10);
                });
                let promiseCompleteCb = jest.fn((...args) => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            callbackCalled.promiseComplete = true;
                            resolve();
                        }, 10);
                    })
                });
                
                let asyncFailedCb = jest.fn((...args) => {
                    setTimeout(() => {
                        callbackCalled.asyncFailed = true;
                        args.pop()(asyncErr);
                    }, 10);
                });

                let promiseFailedCb = jest.fn((...args) => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            callbackCalled.promiseFailed = true;
                            reject(promiseErr);
                        }, 10)
                    });
                });
                
                let unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete;
                
                // TODO: create AsyncParallelHook
                /**
                 * TODO:
                 *    listen to hook with [asyncCompleteCb, promiseCompleteCb, asyncFailedCb, promiseFailedCb]
                 *    update unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete
                 * */
                
                let invokeCb = jest.fn()
                    .mockImplementationOnce((...args) => {
                        expect(args.length).toBe(1);
                        expect(args[0]).toBe(asyncErr);
                        
                        expect(callbackCalled.asyncComplete).toBeTrue();
                        expect(callbackCalled.promiseComplete).toBeTrue();
                        expect(callbackCalled.asyncFailed).toBeTrue();
                        expect(callbackCalled.promiseFailed).toBeTrue();
                        
                        initCallbackCalledCache();
                        unTapAsyncFailed();
                    })
                    .mockImplementationOnce((...args) => {
                        expect(args.length).toBe(1);
                        expect(args[0]).toBe(promiseErr);
                        
                        expect(callbackCalled.asyncComplete).toBeTrue();
                        expect(callbackCalled.promiseComplete).toBeTrue();
                        expect(callbackCalled.promiseFailed).toBeTrue();

                        expect(callbackCalled.asyncFailed).toBeFalse();

                        initCallbackCalledCache();
                        unTapPromiseFailed();
                    })
                    .mockImplementationOnce((...args) => {
                        expect(args.length).toBe(0);

                        expect(callbackCalled.asyncComplete).toBeTrue();
                        expect(callbackCalled.promiseComplete).toBeTrue();

                        expect(callbackCalled.asyncFailed).toBeFalse();
                        expect(callbackCalled.promiseFailed).toBeFalse();

                        initCallbackCalledCache();
                        unTapAsyncComplete();
                    })
                    .mockImplementationOnce((...args) => {
                        expect(args.length).toBe(0);
                        
                        expect(callbackCalled.promiseComplete).toBeTrue();
                        
                        expect(callbackCalled.asyncComplete).toBeFalse();
                        expect(callbackCalled.asyncFailed).toBeFalse();
                        expect(callbackCalled.promiseFailed).toBeFalse();

                        initCallbackCalledCache();
                        unTapPromiseComplete();
                    })
                    .mockImplementationOnce((...args) => {
                        expect(args.length).toBe(0);

                        expect(callbackCalled.promiseComplete).toBeFalse();
                        expect(callbackCalled.asyncComplete).toBeFalse();
                        expect(callbackCalled.asyncFailed).toBeFalse();
                        expect(callbackCalled.promiseFailed).toBeFalse();

                        done();
                    });
                
                // TODO: invoke hook with args and invokeCb
                // TODO: invoke hook with args and invokeCb
                // TODO: invoke hook with args and invokeCb
                // TODO: invoke hook with args and invokeCb
                // TODO: invoke hook with args and invokeCb
                
            }
        );
    });
    
    describe(
        '`callPromise(...args, cb)` to invoke',
        () => {
            test('invocation return a promise', () => {
                let invokeReturn;
                
                // TODO: create AsyncParallelHooks
                // TODO: invoke hook
                
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

                // TODO: create AsyncParallelHook
                // TODO: listen to hook with [asyncListener, promiseListener]

                // TODO: invoke hook

                expect(immediateCalledResult[0]).toBe(1);
                expect(immediateCalledResult[1]).toBe(3);
                expect(immediateCalledResult[2]).toBe(2);
                expect(immediateCalledResult[3]).toBe(4);
            });
            
            test(
                closureName([
                    'if at least one listener failed with error, invocation failed by rejecting promise with error',
                    'all listeners completed, invocation completed by resolving promise with void',
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
                            args.pop()();
                        }, 10);
                    });
                    let promiseCompleteCb = jest.fn((...args) => {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                callbackCalled.promiseComplete = true;
                                resolve();
                            }, 10);
                        })
                    });

                    let asyncFailedCb = jest.fn((...args) => {
                        setTimeout(() => {
                            callbackCalled.asyncFailed = true;
                            args.pop()(asyncErr);
                        }, 10);
                    });

                    let promiseFailedCb = jest.fn((...args) => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                callbackCalled.promiseFailed = true;
                                reject(promiseErr);
                            }, 10)
                        });
                    });

                    let unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete;
                    let invokePromise;

                    // TODO: create AsyncParallelHook
                    /**
                     * TODO:
                     *    listen to hook with [asyncCompleteCb, promiseCompleteCb, asyncFailedCb, promiseFailedCb]
                     *    update unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete
                     * */

                    // TODO: invoke hook with args, update invokePromise
                    
                    await exports(invokePromise).rejects.toThrow(asyncErr);

                    expect(callbackCalled.asyncComplete).toBeTrue();
                    expect(callbackCalled.promiseComplete).toBeTrue();
                    expect(callbackCalled.asyncFailed).toBeTrue();
                    expect(callbackCalled.promiseFailed).toBeTrue();

                    initCallbackCalledCache();
                    unTapAsyncFailed();

                    // TODO: invoke hook with args, update invokePromise

                    await exports(invokePromise).rejects.toThrow(promiseErr);

                    expect(callbackCalled.asyncComplete).toBeTrue();
                    expect(callbackCalled.promiseComplete).toBeTrue();
                    expect(callbackCalled.promiseFailed).toBeTrue();

                    expect(callbackCalled.asyncFailed).toBeFalse();

                    initCallbackCalledCache();
                    unTapPromiseFailed();

                    // TODO: invoke hook with args, update invokePromise

                    await exports(invokePromise).resolves.toBeUndefined();

                    expect(callbackCalled.asyncComplete).toBeTrue();
                    expect(callbackCalled.promiseComplete).toBeTrue();

                    expect(callbackCalled.asyncFailed).toBeFalse();
                    expect(callbackCalled.promiseFailed).toBeFalse();

                    initCallbackCalledCache();
                    unTapAsyncComplete();

                    // TODO: invoke hook with args, update invokePromise

                    await exports(invokePromise).resolves.toBeUndefined();

                    expect(callbackCalled.promiseComplete).toBeTrue();

                    expect(callbackCalled.asyncComplete).toBeFalse();
                    expect(callbackCalled.asyncFailed).toBeFalse();
                    expect(callbackCalled.promiseFailed).toBeFalse();

                    // TODO: invoke hook with args, update invokePromise

                    await exports(invokePromise).resolves.toBeUndefined();

                    expect(callbackCalled.promiseComplete).toBeFalse();
                    expect(callbackCalled.asyncComplete).toBeFalse();
                    expect(callbackCalled.asyncFailed).toBeFalse();
                    expect(callbackCalled.promiseFailed).toBeFalse();
                }
            )
            
        }
    );
    
    describe(
        'clean all listeners',
        () => {
            let asyncCb, promiseCb;
            let unTapToAsync, unTapToPromise;
            
            beforeEach(() => {
                asyncCb = jest.fn((...args) => args.pop()());
                promiseCb = jest.fn(() => Promise.resolve());
            });
            
            test(
                '`callPromise(...args)` invoke nothing, promise resolved with void immediately',
                async () => {
                    let invokePromise;
                    // TODO: create AsyncParallelHook
                    // TODO: listen to hook with [asyncCb, promiseCb], update invokePromise;
                    // TODO: invoke hook
                    
                    await expect(invokePromise).resolves.toBeUndefined();
                    expect(asyncCb).toBeCalledTimes(1);
                    expect(promiseCb).toBeCalledTimes(1);
                    
                    asyncCb.mockClear();
                    promiseCb.mockClear();
                    
                    // TODO: exhaust hook
                    // TODO: invoke hook

                    await expect(invokePromise).resolves.toBeUndefined();
                    expect(asyncCb).not.toBeCalled();
                    expect(promiseCb).not.toBeCalled();
                }
            );
            
            test(
                '`callAsync(...args, cb)` invoke nothing, `cb` called with void immediately',
                (done) => {
                    let invokeCb = jest.fn()
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(0);
                            expect(asyncCb).toBeCalledTimes(1);
                            expect(promiseCb).toBeCalledTimes(1);

                            asyncCb.mockClear();
                            promiseCb.mockClear();

                            // TODO: exhaust hook
                            // TODO: invoke hook
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(0);
                            
                            expect(asyncCb).not.toBeCalled();
                            expect(promiseCb).not.toBeCalled();
                            
                            done();
                        });
                    
                    // TODO: create AsyncParallelHook
                    // TODO: listen to hook with [asyncCb, promiseCb]
                    // TODO: invoke hook with invokeCb
                }
            )
        }
    );
});