/**
 * Created by samhwang1990@gmail.com.
 */

describe('AsyncSeriesHook', () => {
    test(
        closureName(
            ['`unTap = tapAsync((...args, cb) => void)` to listen'],
            [
                'args is the invoked arguments',
                'last argument of tapAsync callback must be function type',
                'fail with `cb(error)`',
                'complete with `cb(undefined)`',
                '`unTap` can remove listener from hook'
            ]
        ),
        closureToDo
    );

    test(
        closureName(
            ['`unTap = tapPromise(cb)` to listen'],
            [
                '`cb` was called with invoked arguments',
                '`cb` can return value in any type which will be wrapped as promise',
                'fail with throw error or rejected promise',
                'complete with resolved promise',
                '`unTap` can remove listener from hook'
            ]
        ),
        closureToDo
    );

    test(
        closureName(
            ['`callAsync(...args, cb)` to invoke'],
            [
                'invocation calling return nothing',
                'all listener was called in queue with args',
                'if listener failed with error, invocation failed by calling `cb` with error',
                'all listeners completed, invocation completed by calling `cb` without error',
            ],
        ),
        closureToDo
    );

    test(
        closureName(
            ['`callPromise(...args, cb)` to invoke'],
            [
                'invocation return a promise',
                'all listener was called in queue with args',
                'if listener failed with error, invocation failed by rejecting promise with error',
                'all listeners completed, invocation completed by resolving promise with void',
            ],
        ),
        closureToDo
    );

    test(
        closureName(
            ['clean all listeners'],
            [
                '`callPromise(...args)` invoke nothing, promise resolved with void immediately',
                '`callAsync(...args, cb)` invoke nothing, `cb` called with void immediately',
            ]
        ),
        closureToDo
    );
});

describe('AsyncSeriesHook with hashcode', () => {
    test(
        closureName(
            ['create AsyncSeriesHook with hashcode function', 'invoke hook with args'],
            ['hashcode function was called once with args which invoked the hook'],
        ),
        closureToDo
    );

    test(
        closureName(
            [
                'listen with `cb`s and specified `hashcode`',
                'invoke hook with args'
            ],
            [
                'invocation return `undefined`',
                'args which hits the `hashcode`, `cb` was called',
                'args which did\'t hit the `hashcode`, `cb` won\'t be called',
            ]
        ),
        closureToDo
    );

    test(
        closureName(
            [
                'listen with `cb` which no hashcode was specified',
                'invoke hook with args'
            ],
            [
                '`cb` was called regardless of the hashcode of args'
            ],
        ),
        closureToDo
    )
});