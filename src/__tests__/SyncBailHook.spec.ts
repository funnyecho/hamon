/**
 * Created by samhwang1990@gmail.com.
 */

describe('SyncBailHook', () => {
    describe(
        suiteName([
            '`unTap = tap(cb)` to listen',
            'bail on non-undefined return',
            '`call(...args)` to invoke'
        ]),
        () => {
            test(closureName([
                '`cb`s before bailing was called with args',
                '`cb`s after bailing won\'t be called',
                'invocation return bailing value',
            ]), () => {
                let args = [1, 2, 3];
                let cb1 = jest.fn();
                let cb2 = jest.fn().mockReturnValue('foo');
                let bailResult = null;
                
                // TODO: create SyncBailHook
                // TODO: listen with [cb1, cb1, cb1]
                // TODO: invoke hook, set return to bailResult
                
                expect(cb1).toBeCalledTimes(3);
                expect(cb1).toBeCalledWith(...args);
                expect(bailResult).toBe(args[0]);
                
                cb1.mockClear();
                cb2.mockClear();
                
                // TODO: create SyncWaterfallHook
                // TODO: listen with [cb1, cb2, cb1]
                // TODO: invoke hook, set return to bailResult
                
                expect(cb1).toBeCalledTimes(1);
                expect(cb1).toBeCalledWith(...args);
                expect(cb2).toBeCalledTimes(1);
                expect(cb2).toBeCalledWith(...args);
                expect(bailResult).toBe('foo');
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

                    // TODO: create SyncBailHook
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

                // TODO: create SyncBailHook
                // TODO: listen to hook
                // TODO: invoke hook with args

                expect(invokeResult).toBe(args[0]);
            })
        }
    );
});