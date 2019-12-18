/**
 * Created by samhwang1990@gmail.com.
 */

describe('SyncWaterfallHook', () => {
    describe(
        suiteName([
            '`unTap = tap(cb)` to listen',
            '`call(...args)` to invoke'
        ]),
        () => {
            test(closureName([
                'when `cb` return undefined, waterfall on input arguments',
                'when `cb` return non-undefined, waterfall on input arguments replacing first element with `cb` return`',
                'invocation return waterfall value of last `cb`'
            ]), () => {
                let args = [1, 2, 3];
                let cb1 = jest.fn();
                let cb2 = jest.fn(v => v * 100);
                let wfResult = null;
                
                // TODO: create SyncWaterfallHook
                // TODO: listen with [cb1, cb1, cb1]
                // TODO: invoke hook, set return to wfResult
                
                expect(cb1).toBeCalledTimes(3);
                expect(cb1).nthCalledWith(1, ...args);
                expect(cb1).nthCalledWith(2, ...args);
                expect(cb1).nthCalledWith(3, ...args);
                expect(wfResult).toBe(1);

                wfResult = null;
                cb1.mockClear();

                // TODO: create SyncWaterfallHook
                // TODO: listen with [cb1, cb2, cb1]
                // TODO: invoke hook, set return to wfResult

                expect(cb1).toBeCalledTimes(2);
                expect(cb1).nthCalledWith(1, ...args);
                expect(cb1).nthCalledWith(2, 100, 2, 3);
                expect(cb2).toBeCalledWith(...args);
                expect(cb2).toReturnWith(100);
                expect(wfResult).toBe(100);

                wfResult = null;
                cb1.mockClear();
                cb2.mockClear();

                // TODO: create SyncWaterfallHook
                // TODO: listen with [cb1, cb2, cb2]
                // TODO: invoke hook, set return to wfResult

                expect(cb1).toBeCalledTimes(1);
                expect(cb1).toBeCalledWith(1, ...args);

                expect(cb2).toBeCalledTimes(2);
                expect(cb2).nthCalledWith(1, ...args);
                expect(cb2).nthReturnedWith(1, 100);
                expect(cb2).nthCalledWith(2, 100, 2, 3);
                expect(cb2).nthReturnedWith(2, 10000);
                expect(wfResult).toBe(10000);
            });

            test('`unTap` is a function which can remove listener', () => {
                const cb = jest.fn();
                const unTap = noop;

                // TODO: create SyncBailHook
                // TODO: listen to hook
                // TODO: invoke hook

                expect(cb).toBeCalledTimes(1);
                cb.mockClear();

                unTap();

                // TODO: invoke hook

                expect(cb).not.toBeCalled();
            });
        }
    );

    describe(
        'clean all listeners',
        () => {
            test(
                'neither listener was been called',
                () => {
                    const cb1 = jest.fn();
                    const cb2 = jest.fn();

                    // TODO: create SyncWaterfallHook
                    // TODO: listen to hook with cb1,cb2
                    // TODO: invoke hook

                    expect(cb1).toBeCalledTimes(1);
                    expect(cb2).toBeCalledTimes(1);

                    cb1.mockClear();
                    cb2.mockClear();

                    // TODO: clean hook listeners
                    // TODO: invoke hook

                    expect(cb1).not.toBeCalled();
                    expect(cb2).not.toBeCalled();
                }
            );

            test('invocation return args[0]', () => {
                const invokeResult = null;
                let args = [1, 2, 3];

                // TODO: create SyncWaterfallHook
                // TODO: listen to hook
                // TODO: invoke hook with args

                expect(invokeResult).toBe(args[0]);
            })
        }
    );
});