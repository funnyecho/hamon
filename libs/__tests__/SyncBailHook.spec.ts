/**
 * Created by samhwang1990@gmail.com.
 */

import "../../types/jest-global.d";
import "../../types/jest-extend.d";

import { SyncBailHook } from "../index";

describe("SyncBailHook", () => {
  describe(
    suiteName([
      "`unTap = tap(cb)` to listen",
      "bail on non-undefined return",
      "`call(...args)` to invoke"
    ]),
    () => {
      test(
        closureName([
          "`cb`s before bailing was called with args",
          "`cb`s after bailing won't be called",
          "invocation return bailing value"
        ]),
        () => {
          let args = [1, 2, 3];
          let cb1 = jest.fn();
          let cb2 = jest.fn().mockReturnValue("foo");
          let bailResult;

          let hook: SyncBailHook<[number, number, number], number>;

          hook = new SyncBailHook<[number, number, number], number>();
          hook.tap(cb1);
          hook.tap(cb1);
          hook.tap(cb1);

          bailResult = hook.call.apply(hook, args);

          expect(cb1).toBeCalledTimes(3);
          expect(cb1).toBeCalledWith(...args);
          expect(bailResult).toBe(undefined);

          cb1.mockClear();
          cb2.mockClear();

          hook = new SyncBailHook<[number, number, number], number>();
          hook.tap(cb1);
          hook.tap(cb2);
          hook.tap(cb1);

          bailResult = hook.call.apply(hook, args);

          expect(cb1).toBeCalledTimes(1);
          expect(cb1).toBeCalledWith(...args);
          expect(cb2).toBeCalledTimes(1);
          expect(cb2).toBeCalledWith(...args);
          expect(bailResult).toBe("foo");
        }
      );

      test("`unTap` is a function which can remove listener", () => {
        const cb = jest.fn();

        const hook = new SyncBailHook();
        const unTap = hook.tap(cb);

        hook.call();

        expect(cb).toBeCalledTimes(1);
        cb.mockClear();

        unTap();

        hook.call();

        expect(cb).not.toBeCalled();
      });
    }
  );

  describe("clean all listeners", () => {
    test("neither listener was been called", () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      let hook = new SyncBailHook();
      hook.tap(cb1);
      hook.tap(cb2);

      hook.call();

      expect(cb1).toBeCalledTimes(1);
      expect(cb2).toBeCalledTimes(1);

      cb1.mockClear();
      cb2.mockClear();

      hook.exhaust();
      hook.call();

      expect(cb1).not.toBeCalled();
      expect(cb2).not.toBeCalled();
    });
  });
});
