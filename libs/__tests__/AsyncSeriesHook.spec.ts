/**
 * Created by samhwang1990@gmail.com.
 */

import isPromise from "./utils/isPromise";

describe('AsyncSeriesHook', () => {
    describe(
        '`unTap = tapAsync((...args, cb) => void)` to listen',
        () => {
            test(
                closureName([
                    'args is the invoked arguments',
                    'last argument of tapAsync callback must be function type',
                    'fail with `cb(error)`',
                    'complete with `cb(undefined)`',
                    '`unTap` can remove listener from hook'
                ]),
                async () => {
                    let errFail = new Error('failed');

                    let cb = jest.fn()
                        .mockImplementationOnce((...args) => args.pop()(errFail))
                        .mockImplementation((...args) => args.pop()());

                    let args = [1, 2, 3];

                    let invokePromise: Promise<undefined>;
                    let unTap;

                    // TODO: create AsyncSeriesHook
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
                }
            )
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

                // TODO: create AsyncSeriesHook
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

                await expect(invokePromise).resolves.toBeUndefined();
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

                // TODO: create AsyncSeriesHook
                // TODO: invoke hook

                expect(invokeResult).toBeUndefined();
            });
            
            test('all listener was called in queue with args', (done) => {
                let seriesCalledResult = [];
                let asyncListener = jest.fn((...args) => {
                    let cb = args.pop();
                    seriesCalledResult.push(1);
                    setTimeout(() => {
                        seriesCalledResult.push(2);
                        cb();
                    }, 50);
                });

                let promiseListener = jest.fn((...args) => {
                    seriesCalledResult.push(3);
                    return new Promise((resolve => {
                        setTimeout(() => {
                            seriesCalledResult.push(4);
                            resolve();
                        }, 100);
                    }));
                });

                let invokeCb = function() {
                    expect(seriesCalledResult[0]).toBe(1);
                    expect(seriesCalledResult[1]).toBe(2);
                    expect(seriesCalledResult[2]).toBe(3);
                    expect(seriesCalledResult[3]).toBe(4);

                    done();
                }

                // TODO: create AsyncSeriesHook
                // TODO: listen to hook with [asyncListener, promiseListener]

                // TODO: invoke hook with invokeCb
            });
            
            test(
                closureName([
                    'if listener failed with error, invocation failed by calling `cb` with error',
                    'all listeners completed, invocation completed by calling `cb` without error',
                ]),
                (done) => {
                    let args = [1, 2];
                    
                    let asyncErr = new Error('async error');
                    let promiseErr = new Error('promise error');

                    let asyncCompleteCb = jest.fn((...args) => {
                        setTimeout(() => {
                            args.pop()();
                        }, 10);
                    });
                    let promiseCompleteCb = jest.fn((...args) => {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                resolve();
                            }, 10);
                        })
                    });
                    let asyncFailedCb = jest.fn((...args) => {
                        setTimeout(() => {
                            args.pop()(asyncErr);
                        }, 10);
                    });
                    let promiseFailedCb = jest.fn((...args) => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                reject(promiseErr);
                            }, 10)
                        });
                    });

                    let unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete;

                    // TODO: create AsyncSeriesHook
                    /**
                     * TODO:
                     *    listen to hook with [asyncFailedCb, promiseFailedCb, asyncCompleteCb, promiseCompleteCb]
                     *    update unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete
                     * */

                    let invokeCb = jest.fn()
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(1);
                            expect(args[0]).toBe(asyncErr);
                            
                            expect(asyncFailedCb).toBeCalled();
                            
                            expect(promiseFailedCb).not.toBeCalled();
                            expect(asyncCompleteCb).not.toBeCalled();
                            expect(promiseCompleteCb).not.toBeCalled();

                            unTapAsyncFailed();
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(1);
                            expect(args[0]).toBe(promiseErr);

                            expect(promiseFailedCb).toBeCalled();
                            
                            expect(asyncCompleteCb).not.toBeCalled();
                            expect(promiseCompleteCb).not.toBeCalled();

                            unTapPromiseFailed();
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(0);

                            expect(asyncCompleteCb).toBeCalled();
                            
                            expect(promiseCompleteCb).not.toBeCalled();
                            
                            unTapAsyncComplete();
                        })
                        .mockImplementationOnce((...args) => {
                            expect(args.length).toBe(0);

                            expect(promiseCompleteCb).toBeCalled();
                            
                            done();
                        })

                    // TODO: invoke hook with args and invokeCb
                    // TODO: invoke hook with args and invokeCb
                    // TODO: invoke hook with args and invokeCb
                    // TODO: invoke hook with args and invokeCb

                }
            )
        }
    );
    
    describe('`callPromise(...args, cb)` to invoke', () => {
        test('invocation return a promise', () => {
            let invokeReturn;

            // TODO: create AsyncParallelHooks
            // TODO: invoke hook

            expect(isPromise(invokeReturn)).toBeTrue();
        });

        test('all listener was called in queue with args', (done) => {
            let seriesCalledResult = [];
            let asyncListener = jest.fn((...args) => {
                let cb = args.pop();
                seriesCalledResult.push(1);
                setTimeout(() => {
                    seriesCalledResult.push(2);
                    cb();
                }, 50);
            });

            let promiseListener = jest.fn((...args) => {
                seriesCalledResult.push(3);
                return new Promise((resolve => {
                    setTimeout(() => {
                        seriesCalledResult.push(4);
                        resolve();
                    }, 100);
                }));
            });

            // TODO: create AsyncSeriesHook
            // TODO: listen to hook with [asyncListener, promiseListener]

            // TODO: invoke hook with invokeCb
            
            expect(seriesCalledResult[0]).toBe(1);
            expect(seriesCalledResult[1]).toBe(2);
            expect(seriesCalledResult[2]).toBe(3);
            expect(seriesCalledResult[3]).toBe(4);
        });

        test(
            closureName([
                'if listener failed with error, invocation failed by rejecting promise with error',
                'all listeners completed, invocation completed by resolving promise with void'
            ]),
            async () => {
                let args = [1, 2];

                let asyncErr = new Error('async error');
                let promiseErr = new Error('promise error');

                let asyncCompleteCb = jest.fn((...args) => {
                    setTimeout(() => {
                        args.pop()();
                    }, 10);
                });
                let promiseCompleteCb = jest.fn((...args) => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve();
                        }, 10);
                    })
                });
                let asyncFailedCb = jest.fn((...args) => {
                    setTimeout(() => {
                        args.pop()(asyncErr);
                    }, 10);
                });
                let promiseFailedCb = jest.fn((...args) => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(promiseErr);
                        }, 10)
                    });
                });

                let unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete;
                let invokePromise;

                // TODO: create AsyncSeriesHook
                /**
                 * TODO:
                 *    listen to hook with [asyncFailedCb, promiseFailedCb, asyncCompleteCb, promiseCompleteCb]
                 *    update unTapAsyncFailed, unTapPromiseFailed, unTapAsyncComplete, unTapPromiseComplete
                 * */

                // TODO: invoke hook with args and update invokePromise

                await expect(invokePromise).rejects.toThrow(asyncErr);

                expect(asyncFailedCb).toBeCalled();

                expect(promiseFailedCb).not.toBeCalled();
                expect(asyncCompleteCb).not.toBeCalled();
                expect(promiseCompleteCb).not.toBeCalled();

                unTapAsyncFailed();

                // TODO: invoke hook with args and update invokePromise

                await expect(invokePromise).rejects.toThrow(promiseErr);

                expect(promiseFailedCb).toBeCalled();

                expect(asyncCompleteCb).not.toBeCalled();
                expect(promiseCompleteCb).not.toBeCalled();

                unTapPromiseFailed();

                // TODO: invoke hook with args and update invokePromise

                await expect(invokePromise).resolves.toBeUndefined();

                expect(asyncCompleteCb).toBeCalled();

                expect(promiseCompleteCb).not.toBeCalled();

                unTapAsyncComplete();

                // TODO: invoke hook with args and update invokePromise

                await expect(invokePromise).resolves.toBeUndefined();

                expect(promiseCompleteCb).toBeCalled();
            }
        );
    });

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
                    // TODO: create AsyncSeriesHook
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

                    // TODO: create AsyncSeriesHook
                    // TODO: listen to hook with [asyncCb, promiseCb]
                    // TODO: invoke hook with invokeCb
                }
            )
        }
    );
});