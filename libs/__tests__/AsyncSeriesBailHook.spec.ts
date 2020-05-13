/**
 * Created by samhwang1990@gmail.com.
 */

import "../../types/jest-global.d";
import "../../types/jest-extend.d";

import { AsyncSeriesBailHook } from "../index";

import isPromise from "./utils/isPromise";

describe("AsyncSeriesBailHook", () => {
  describe("`unTap = tapAsync((...args, cb) => void)` to listen", () => {
    test(
      closureName([
        "args is the invoked arguments",
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

        let invokePromise: Promise<string | number>;
        let unTap;

        let hook = new AsyncSeriesBailHook<number[], string | number>();
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
        "`cb` was called with invoked arguments",
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

        let hook = new AsyncSeriesBailHook<number[], string | number>();
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
      let invokeResult;

      invokeResult = new AsyncSeriesBailHook().callAsync(noop);

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

      let hook = new AsyncSeriesBailHook();
      hook.tapAsync(asyncListener);
      hook.tapPromise(promiseListener);

      hook.callAsync(invokeCb);
    });

    test(
      closureName([
        "if listener failed, invocation immediately bailed by calling `cb(error)`",
        "if listener bailed, invocation immediately bailed by calling `cb(undefined, value)`",
        "if no listener was bailed, invocation bailed with undefined by calling `cb(undefined, undefined)`"
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
        let promiseCompleteCb = jest.fn((...args) => {
          return new Promise<void>(resolve => {
            setTimeout(() => {
              resolve();
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

        let hook = new AsyncSeriesBailHook<number[], string | number>();

        unTapAsyncFailed = hook.tapAsync(asyncFailedCb);
        unTapPromiseFailed = hook.tapPromise(promiseFailedCb);
        unTapAsyncComplete = hook.tapAsync(asyncCompleteCb);
        unTapPromiseComplete = hook.tapPromise(promiseCompleteCb);

        let invokeCb = jest
          .fn()
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(1);
            expect(invokeResult[0]).toBe(asyncErr);

            expect(asyncFailedCb).toBeCalled();

            expect(promiseFailedCb).not.toBeCalled();
            expect(asyncCompleteCb).not.toBeCalled();
            expect(promiseCompleteCb).not.toBeCalled();

            unTapAsyncFailed();
            hook.callAsync.call(hook, ...args, invokeCb);
          })
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(1);
            expect(invokeResult[0]).toBe(promiseErr);

            expect(promiseFailedCb).toBeCalled();

            expect(asyncCompleteCb).not.toBeCalled();
            expect(promiseCompleteCb).not.toBeCalled();

            unTapPromiseFailed();
            hook.callAsync.call(hook, ...args, invokeCb);
          })
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(2);
            expect(invokeResult[0]).toBeNil();
            expect(invokeResult[1]).toBe("async complete");

            expect(asyncCompleteCb).toBeCalled();

            expect(promiseCompleteCb).not.toBeCalled();

            unTapAsyncComplete();
            hook.callAsync.call(hook, ...args, invokeCb);
          })
          .mockImplementationOnce((...invokeResult) => {
            expect(invokeResult.length).toBe(2);
            expect(invokeResult[0]).toBeNil();
            expect(invokeResult[1]).toBe(undefined);

            expect(promiseCompleteCb).toBeCalled();

            done();
          });

        hook.callAsync.call(hook, ...args, invokeCb);
      }
    );
  });

  describe("`callPromise(...args, cb)` to invoke", () => {
    test("invocation return a promise", () => {
      let invokeReturn = new AsyncSeriesBailHook().callPromise();

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

      let hook = new AsyncSeriesBailHook();
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
        "if listener failed, invocation immediately bailed by rejecting promise with error",
        "if listener bailed, invocation immediately bailed by resolving promise",
        "if no listener was bailed, invocation completed by resolving promise with `undefined`"
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
        let promiseCompleteCb = jest.fn((...args) => {
          return new Promise<void>(resolve => {
            setTimeout(() => {
              resolve();
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

        let hook = new AsyncSeriesBailHook<number[], string | number>();
        unTapAsyncFailed = hook.tapAsync(asyncFailedCb);
        unTapPromiseFailed = hook.tapPromise(promiseFailedCb);
        unTapAsyncComplete = hook.tapAsync(asyncCompleteCb);
        unTapPromiseComplete = hook.tapPromise(promiseCompleteCb);

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).rejects.toThrow(asyncErr);

        expect(asyncFailedCb).toBeCalled();

        expect(promiseFailedCb).not.toBeCalled();
        expect(asyncCompleteCb).not.toBeCalled();
        expect(promiseCompleteCb).not.toBeCalled();

        unTapAsyncFailed();

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).rejects.toThrow(promiseErr);

        expect(promiseFailedCb).toBeCalled();

        expect(asyncCompleteCb).not.toBeCalled();
        expect(promiseCompleteCb).not.toBeCalled();

        unTapPromiseFailed();

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).resolves.toBe("async complete");

        expect(asyncCompleteCb).toBeCalled();

        expect(promiseCompleteCb).not.toBeCalled();

        unTapAsyncComplete();

        invokePromise = hook.callPromise(...args);

        await expect(invokePromise).resolves.toBe(undefined);

        expect(promiseCompleteCb).toBeCalled();
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
      let hook = new AsyncSeriesBailHook<number[], number>();

      hook.tapAsync(asyncCb);
      hook.tapPromise(promiseCb);

      invokePromise = hook.callPromise(...args);

      await expect(invokePromise).resolves.toBe(undefined);
      expect(asyncCb).toBeCalledTimes(1);
      expect(promiseCb).toBeCalledTimes(1);

      asyncCb.mockClear();
      promiseCb.mockClear();

      hook.exhaust();
      invokePromise = hook.callPromise(...args);

      await expect(invokePromise).resolves.toBe(undefined);
      expect(asyncCb).not.toBeCalled();
      expect(promiseCb).not.toBeCalled();
    });

    test("`callAsync(...args, cb)` invoke nothing, `cb` called with void immediately", done => {
      let invokeCb = jest
        .fn()
        .mockImplementationOnce((...invokeResult) => {
          expect(invokeResult.length).toBe(2);
          expect(invokeResult[0]).toBeNil();
          expect(invokeResult[1]).toBe(undefined);

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
          expect(invokeResult[1]).toBe(undefined);

          expect(asyncCb).not.toBeCalled();
          expect(promiseCb).not.toBeCalled();

          done();
        });

      let hook = new AsyncSeriesBailHook<number[], number>();
      hook.tapPromise(promiseCb);
      hook.tapAsync(asyncCb);

      hook.callAsync.call(hook, ...args, invokeCb);
    });
  });
});
