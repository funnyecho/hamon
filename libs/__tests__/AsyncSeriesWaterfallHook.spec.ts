/**
 * Created by samhwang1990@gmail.com.
 */

import "../../types/jest-global.d";
import "../../types/jest-extend.d";

import { AsyncSeriesWaterfallHook } from "../index";

import isPromise from "./utils/isPromise";

describe("AsyncSeriesWaterfallHook", () => {
  describe("`unTap = tapAsync((...args, cb) => void)` to listen", () => {
    test(
      closureName([
        "args is the invoked arguments from upstream",
        "last argument of tapAsync callback must be function type",
        "fail with `cb(error, undefined)`",
        "complete with `cb(undefined, value)`",
        "`unTap` can remove listener from hook"
      ]),
      async () => {
        let errFail = new Error("failed");

        let cb = jest
          .fn()
          .mockImplementationOnce((...args) => args.pop()(errFail))
          .mockImplementation((...args) => args.pop()(null, "foo"));

        let args = [1, 2, 3];

        let invokePromise: Promise<number | string>;
        let unTap;

        let hook = new AsyncSeriesWaterfallHook<number[], number | string>();
        unTap = hook.tapAsync(cb);

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).rejects.toThrow(errFail);

        expect(cb).toBeCalledTimes(1);
        expect(cb.mock.calls[0][0]).toBe(1);
        expect(cb.mock.calls[0][1]).toBe(2);
        expect(cb.mock.calls[0][2]).toBe(3);
        expect(cb.mock.calls[0][3]).toBeFunction();

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).resolves.toBe("foo");

        expect(cb).toBeCalledTimes(2);
        expect(cb.mock.calls[0][0]).toBe(1);
        expect(cb.mock.calls[0][1]).toBe(2);
        expect(cb.mock.calls[0][2]).toBe(3);
        expect(cb.mock.calls[0][3]).toBeFunction();

        unTap();

        await hook.callPromise(...args);

        expect(cb).toBeCalledTimes(2);
      }
    );
  });

  describe("`unTap = tapPromise(cb)` to listen", () => {
    test(
      closureName([
        "`cb` was called with invoked arguments from upstream",
        "`cb` can return value in any type which will be wrapped as promise",
        "fail with throw error or rejected promise",
        "complete with resolved promise",
        "`unTap` can remove listener from hook"
      ]),
      async () => {
        let errThrowingError = new Error("throw error");
        let errRejectedPromise = new Error("rejected promise");

        let cb = jest
          .fn()
          .mockImplementationOnce(() => {
            throw errThrowingError;
          })
          .mockRejectedValueOnce(errRejectedPromise)
          .mockResolvedValue("foo");

        let args = [1, 2, 3];

        let unTap;
        let invokePromise: Promise<string | number>;

        let hook = new AsyncSeriesWaterfallHook<number[], number | string>();
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

        await expect(invokePromise).resolves.toBe("foo");
        expect(cb).toBeCalledTimes(3);
        expect(cb.mock.calls[2][0]).toBe(1);
        expect(cb.mock.calls[2][1]).toBe(2);
        expect(cb.mock.calls[2][2]).toBe(3);

        unTap();

        await hook.callPromise(...args);

        expect(cb).toBeCalledTimes(3);
      }
    );
  });

  describe("`callAsync(...args, cb)` to invoke", () => {
    test("invocation calling return nothing", () => {
      let invokeResult = new AsyncSeriesWaterfallHook().callAsync(noop);

      expect(invokeResult).toBeUndefined();
    });

    test("all listener was called in queue with args", done => {
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
        return new Promise(resolve => {
          setTimeout(() => {
            seriesCalledResult.push(4);
            resolve();
          }, 100);
        });
      });

      let invokeCb = function() {
        expect(seriesCalledResult[0]).toBe(1);
        expect(seriesCalledResult[1]).toBe(2);
        expect(seriesCalledResult[2]).toBe(3);
        expect(seriesCalledResult[3]).toBe(4);

        done();
      };

      let hook = new AsyncSeriesWaterfallHook();
      hook.tapAsync(asyncListener);
      hook.tapPromise(promiseListener);

      hook.callAsync(invokeCb);
    });

    test(
      closureName([
        "if listener failed, invocation immediately failed by calling `cb(error)`",
        "the first listener was called with args",
        "if listener return non-undefined value, downstream will waterfall with `[non-undefined, args[1:]]`",
        "if listener return undefined, downstream will waterfall with args from upstream",
        "if the last listener return undefined, invocation complete with first element of args from upstream",
        "if the last listener return non-undefined value, invocation complete with that value"
      ]),
      done => {
        let args = [1, 2];

        let asyncErr = new Error("async error");
        let promiseErr = new Error("promise error");

        let asyncCompleteCb = jest.fn((...args) => {
          setTimeout(() => {
            args.pop()(null, "async complete");
          }, 10);
        });
        let promiseCompleteCb = jest
          .fn()
          .mockImplementationOnce((...args) => {
            return new Promise<void>(resolve => {
              setTimeout(() => {
                resolve();
              }, 10);
            });
          })
          .mockImplementationOnce((...args) => {
            return new Promise<string>(resolve => {
              setTimeout(() => {
                resolve("promise complete");
              }, 10);
            });
          });
        let asyncFailedCb = jest.fn((...args) => {
          setTimeout(() => {
            args.pop()(asyncErr);
          }, 10);
        });
        let promiseFailedCb = jest.fn((...args) => {
          return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              reject(promiseErr);
            }, 10);
          });
        });

        let unTapAsyncFailed,
          unTapPromiseFailed,
          unTapAsyncComplete,
          unTapPromiseComplete;

        let hook = new AsyncSeriesWaterfallHook<number[], string | number>();

        unTapAsyncFailed = hook.tapAsync(asyncFailedCb);
        unTapAsyncComplete = hook.tapAsync(asyncCompleteCb);
        unTapPromiseFailed = hook.tapPromise(promiseFailedCb);
        unTapPromiseComplete = hook.tapPromise(promiseCompleteCb);

        let invokeCb = jest
          .fn()
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(1);
            expect(invokeResult[0]).toBe(asyncErr);

            expect(asyncFailedCb).toBeCalled();
            expect(asyncFailedCb.mock.calls[0][0]).toBe(args[0]);
            expect(asyncFailedCb.mock.calls[0][1]).toBe(args[1]);

            expect(promiseFailedCb).not.toBeCalled();
            expect(asyncCompleteCb).not.toBeCalled();
            expect(promiseCompleteCb).not.toBeCalled();

            unTapAsyncFailed();
            hook.callAsync.call(hook, ...args, invokeCb);
          })
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(1);
            expect(invokeResult[0]).toBe(promiseErr);

            expect(asyncCompleteCb).toBeCalledTimes(1);
            expect(asyncCompleteCb.mock.calls[0][0]).toBe(args[0]);
            expect(asyncCompleteCb.mock.calls[0][1]).toBe(args[1]);

            expect(promiseFailedCb).toBeCalledTimes(1);
            expect(promiseFailedCb.mock.calls[0][0]).toBe("async complete");
            expect(promiseFailedCb.mock.calls[0][1]).toBe(args[1]);

            expect(promiseCompleteCb).not.toBeCalled();

            unTapPromiseFailed();
            hook.callAsync.call(hook, ...args, invokeCb);
          })
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(2);
            expect(invokeResult[0]).toBeNil();
            expect(invokeResult[1]).toBe("async complete");

            expect(asyncCompleteCb).toBeCalledTimes(2);
            expect(asyncCompleteCb.mock.calls[1][0]).toBe(args[0]);
            expect(asyncCompleteCb.mock.calls[1][1]).toBe(args[1]);

            expect(promiseCompleteCb).toBeCalledTimes(1);
            expect(promiseCompleteCb.mock.calls[0][0]).toBe("async complete");
            expect(promiseCompleteCb.mock.calls[0][1]).toBe(args[1]);

            hook.callAsync.call(hook, ...args, invokeCb);
          })
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(2);
            expect(invokeResult[0]).toBeNil();
            expect(invokeResult[1]).toBe("promise complete");

            expect(asyncCompleteCb).toBeCalledTimes(3);
            expect(asyncCompleteCb.mock.calls[2][0]).toBe(args[0]);
            expect(asyncCompleteCb.mock.calls[2][1]).toBe(args[1]);

            expect(promiseCompleteCb).toBeCalledTimes(2);
            expect(promiseCompleteCb.mock.calls[1][0]).toBe("async complete");
            expect(promiseCompleteCb.mock.calls[1][1]).toBe(args[1]);

            done();
          });

        hook.callAsync.call(hook, ...args, invokeCb);
      }
    );
  });

  describe("`callPromise(...args, cb)` to invoke", () => {
    test("invocation return a promise", () => {
      let invokeReturn = new AsyncSeriesWaterfallHook().callPromise();

      expect(isPromise(invokeReturn)).toBeTrue();
    });

    test("all listener was called in queue with args", async () => {
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
        return new Promise(resolve => {
          setTimeout(() => {
            seriesCalledResult.push(4);
            resolve();
          }, 100);
        });
      });

      let hook = new AsyncSeriesWaterfallHook();
      hook.tapAsync(asyncListener);
      hook.tapPromise(promiseListener);

      await hook.callPromise();

      expect(seriesCalledResult[0]).toBe(1);
      expect(seriesCalledResult[1]).toBe(2);
      expect(seriesCalledResult[2]).toBe(3);
      expect(seriesCalledResult[3]).toBe(4);
    });

    test(
      closureName([
        "if listener failed, invocation immediately failed by rejecting promise with error",
        "the first listener was called with args",
        "if listener return non-undefined value, downstream will waterfall with `[non-undefined, args[1:]]`",
        "if listener return undefined, downstream will waterfall with args from upstream",
        "if the last listener return undefined, invocation complete with first element of args from upstream",
        "if the last listener return non-undefined value, invocation complete with that value"
      ]),
      async () => {
        let args = [1, 2];

        let asyncErr = new Error("async error");
        let promiseErr = new Error("promise error");

        let asyncCompleteCb = jest.fn((...args) => {
          setTimeout(() => {
            args.pop()(null, "async complete");
          }, 10);
        });
        let promiseCompleteCb = jest
          .fn()
          .mockImplementationOnce((...args) => {
            return new Promise<void>(resolve => {
              setTimeout(() => {
                resolve();
              }, 10);
            });
          })
          .mockImplementationOnce((...args) => {
            return new Promise<string>(resolve => {
              setTimeout(() => {
                resolve("promise complete");
              }, 10);
            });
          });
        let asyncFailedCb = jest.fn((...args) => {
          setTimeout(() => {
            args.pop()(asyncErr);
          }, 10);
        });
        let promiseFailedCb = jest.fn((...args) => {
          return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              reject(promiseErr);
            }, 10);
          });
        });

        let unTapAsyncFailed,
          unTapPromiseFailed,
          unTapAsyncComplete,
          unTapPromiseComplete;
        let invokePromise;

        let hook = new AsyncSeriesWaterfallHook<number[], number | string>();
        unTapAsyncFailed = hook.tapAsync(asyncFailedCb);
        unTapAsyncComplete = hook.tapAsync(asyncCompleteCb);
        unTapPromiseFailed = hook.tapPromise(promiseFailedCb);
        unTapPromiseComplete = hook.tapPromise(promiseCompleteCb);

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).rejects.toThrow(asyncErr);

        expect(asyncFailedCb).toBeCalled();
        expect(asyncFailedCb.mock.calls[0][0]).toBe(args[0]);
        expect(asyncFailedCb.mock.calls[0][1]).toBe(args[1]);

        expect(promiseFailedCb).not.toBeCalled();
        expect(asyncCompleteCb).not.toBeCalled();
        expect(promiseCompleteCb).not.toBeCalled();

        unTapAsyncFailed();

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).rejects.toThrow(promiseErr);

        expect(asyncCompleteCb).toBeCalledTimes(1);
        expect(asyncCompleteCb.mock.calls[0][0]).toBe(args[0]);
        expect(asyncCompleteCb.mock.calls[0][1]).toBe(args[1]);

        expect(promiseFailedCb).toBeCalledTimes(1);
        expect(promiseFailedCb.mock.calls[0][0]).toBe("async complete");
        expect(promiseFailedCb.mock.calls[0][1]).toBe(args[1]);

        expect(promiseCompleteCb).not.toBeCalled();

        unTapPromiseFailed();

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).resolves.toBe("async complete");

        expect(asyncCompleteCb).toBeCalledTimes(2);
        expect(asyncCompleteCb.mock.calls[1][0]).toBe(args[0]);
        expect(asyncCompleteCb.mock.calls[1][1]).toBe(args[1]);

        expect(promiseCompleteCb).toBeCalledTimes(1);
        expect(promiseCompleteCb.mock.calls[0][0]).toBe("async complete");
        expect(promiseCompleteCb.mock.calls[0][1]).toBe(args[1]);

        unTapAsyncComplete();

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).resolves.toBe("promise complete");

        expect(promiseCompleteCb).toBeCalledTimes(2);
        expect(promiseCompleteCb.mock.calls[1][0]).toBe(args[0]);
        expect(promiseCompleteCb.mock.calls[1][1]).toBe(args[1]);
      }
    );
  });

  describe("clean all listeners", () => {
    let asyncCb, promiseCb;
    let args;
    let unTapToAsync, unTapToPromise;

    beforeEach(() => {
      args = [1, 2];
      asyncCb = jest.fn((...args) => args.pop()());
      promiseCb = jest.fn(() => Promise.resolve());
    });

    test("`callPromise(...args)` invoke nothing, promise resolved with void immediately", async () => {
      let invokePromise;

      let hook = new AsyncSeriesWaterfallHook<number[], number>();
      hook.tapAsync(asyncCb);
      hook.tapPromise(promiseCb);

      invokePromise = hook.callPromise(...args);

      await expect(invokePromise).resolves.toBe(args[0]);
      expect(asyncCb).toBeCalledTimes(1);
      expect(promiseCb).toBeCalledTimes(1);

      asyncCb.mockClear();
      promiseCb.mockClear();

      hook.exhaust();
      invokePromise = hook.callPromise(...args);

      await expect(invokePromise).resolves.toBe(args[0]);
      expect(asyncCb).not.toBeCalled();
      expect(promiseCb).not.toBeCalled();
    });

    test("`callAsync(...args, cb)` invoke nothing, `cb` called with void immediately", done => {
      let invokeCb = jest
        .fn()
        .mockImplementationOnce((...invokeResult) => {
          expect(invokeResult.length).toBe(2);
          expect(invokeResult[0]).toBeNil();
          expect(invokeResult[1]).toBe(args[0]);

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

      let hook = new AsyncSeriesWaterfallHook<number[], number>();
      hook.tapAsync(asyncCb);
      hook.tapPromise(promiseCb);

      hook.callAsync.call(hook, ...args, invokeCb);
    });
  });
});
