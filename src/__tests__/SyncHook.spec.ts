/**
 * Created by samhwang1990@gmail.com.
 */

describe('SyncHook', () => {
    describe(
        suiteName([
            '`unTap = tap(cb)` to listen',
            '`call(...args)` to invoke'
        ]),
        () => {
            test('`cb` was called with args', () => {
                const cb = jest.fn();
                const args1 = [1, false, 'foo'];
                const args2 = [undefined, null, { foo: 1 }, ['bar']];
                
                // TODO: listen to hook
                // TODO: invoke hook with args1
                // TODO: invoke hook with args2
                expect(cb).toBeCalledTimes(2);
                expect(cb).nthCalledWith(1, ...args1);
                expect(cb).nthCalledWith(2, ...args2);
            });
            
            test('`unTap` is a function which can remove listener', () => {
                const cb = jest.fn();
                const unTap = noop;

                // TODO: listen to hook
                // TODO: invoke hook
                
                expect(cb).toBeCalledTimes(1);
                cb.mockClear();
                
                unTap();

                // TODO: invoke hook
                
                expect(cb).not.toBeCalled();
            });
            
            test('invocation return `undefined`', () => {
                let invokeResult = null;

                // TODO: listen to hook
                // TODO: invoke hook
                
                expect(invokeResult).toBe(undefined);
            })
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
            
            test('invocation return `undefined`', () => {
                const invokeResult = null;

                // TODO: listen to hook
                // TODO: invoke hook

                expect(invokeResult).toBe(undefined);
            })
        }
    );
});

describe('SyncHook with hashcode', () => {
    describe(
        suiteName([
            'create SyncHook with hashcode function',
            'invoke hook with args'
        ]),
        () => {
           test('hashcode function was called once with args which invoked the hook', () => {
               const hashcodeFn = jest.fn();
               const args = [1, false, 'foo'];
               
               // TODO: create SyncHook with hashcode function
               // TODO: invoke hook with args
               
               expect(hashcodeFn).toBeCalledTimes(1);
               expect(hashcodeFn).toBeCalledWith(...args);
           }) 
        }
    );
    
    describe(
        suiteName([
            'listen with `cb`s with `hashcode` specified',
            'invoke hook with args'
        ]),
        () => {
            test(
                closureName([
                    'invocation return `undefined`',
                    'args which hits the `hashcode`, `cb` was called',
                    'args which did\'t hit the `hashcode`, `cb` won\'t be called'
                ]),
                () => {
                    function hashFn(v1, v2) {
                        return v1 + v2;
                    }

                    let invokeResult = null;
                    let input = {
                        hash1: {
                            args: [1, 2],
                            cb: jest.fn(),
                        },
                        hash2: {
                            args: [2, 3],
                            cb: jest.fn(),
                        }
                    };
                    
                    // TODO: create hook with hashFn
                    // TODO: listen to hook with input
                    
                    // TODO: invoke hook with args1
                    
                    expect(invokeResult).toBe(undefined);
                    expect(input.hash1.cb).toBeCalledWith(...input.hash1.args);
                    expect(input.hash2.cb).not.toBeCalled();

                    input.hash1.cb.mockClear();
                    input.hash2.cb.mockClear();

                    // TODO: invoke hook with args1

                    expect(invokeResult).toBe(undefined);
                    expect(input.hash1.cb).not.toBeCalled();
                    expect(input.hash2.cb).toBeCalledWith(...input.hash2.args);
                }
            );

            test(
                closureName(
                    [
                        'listen with `cb`s without `hashcode` specified',
                    ],
                    [
                        'invocation return `undefined`',
                        '`cb` was called regardless of the hashcode of args'
                    ]
                ),
                () => {
                    let invocationResult = null;
                    let cb = jest.fn();
                    let args = [1,2];

                    function hashFn(v1, v2) {
                        return v1 + v2;
                    }

                    // TODO: create SyncHook with hashFn
                    // TODO: listen to hook without hashcode specified
                    // TODO: invoke hook with args

                    expect(cb).toBeCalledWith(...args);
                    expect(invocationResult).toBe(undefined);
                }
            )
        }
    );
});