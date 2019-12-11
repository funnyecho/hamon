/**
 * Created by samhwang1990@gmail.com.
 */

describe('AsyncSeriesWaterfallHook', () => {
    test(
        closureName(
            ['`unTap = tapAsync((...args, cb) => void)` to listen'],
            [
                'args is the invoked arguments from upstream',
                'last argument of tapAsync callback must be function type',
                'fail with `cb(error, undefined)`',
                'complete with `cb(undefined, value)`',
                '`unTap` can remove listener from hook'
            ]
        ),
        closureToDo
    );

    test(
        closureName(
            ['`unTap = tapPromise(cb)` to listen'],
            [
                '`cb` was called with invoked arguments from upstream',
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
                'all listener was called in queue',
                'if listener failed, invocation immediately failed by calling `cb(error)`',
                'the first listener was called with args',
                'if listener return non-undefined value, downstream will waterfall with `[non-undefined, args[1:]]`',
                'if listener return undefined, downstream will waterfall with args from upstream',
                'if the last listener return undefined, invocation complete with first element of args from upstream',
                'if the last listener return non-undefined value, invocation complete with that value',
            ],
        ),
        closureToDo
    );

    test(
        closureName(
            ['`callPromise(...args, cb)` to invoke'],
            [
                'invocation calling return nothing',
                'all listener was called in queue',
                'if listener failed, invocation immediately failed by calling `cb(error)`',
                'the first listener was called with args',
                'if listener return non-undefined value, downstream will waterfall with `[non-undefined, args[1:]]`',
                'if listener return undefined, downstream will waterfall with args from upstream',
                'if the last listener return undefined, invocation complete with first element of args from upstream',
                'if the last listener return non-undefined value, invocation complete with that value',
            ],
        ),
        closureToDo
    );

    test(
        closureName(
            ['clean all listeners'],
            [
                '`callPromise(...args)` invoke nothing, promise resolved with `args[0]` immediately',
                '`callAsync(...args, cb)` invoke nothing, `cb` called with `args[0]` immediately',
            ]
        ),
        closureToDo
    );
});

describe('AsyncSeriesWaterfallHook with hashcode', () => {
    test(
        closureName(
            ['create AsyncSeriesWaterfallHook with hashcode function', 'invoke hook with args'],
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