/**
 * Created by samhwang1990@gmail.com.
 */

describe('SyncWaterfallHook', () => {
    test(
        closureName(
            [
                'listen to hook with `cb`s',
                'invoke hook with args',
            ],
            [
                'when `cb` return undefined, waterfall on input arguments',
                'when `cb` return non-undefined, waterfall on input arguments replacing first element with `cb` return`',
                'invocation return waterfall value of last `cb`'
            ],
        ),
        closureToDo
    );
});

describe('SyncWaterfallHook with hashcode', () => {
    test(
        closureName(
            ['create SyncWaterfallHook with hashcode function', 'invoke hook with args'],
            ['hashcode function was called once with args which invoked the hook'],
        ),
        closureToDo
    );
    
    test(
        closureName(
            [
                'listen to hook with `cb`s and specified `hashcode`',
                'invoke hook with args',
            ],
            [
                'args which hits the `hashcode`, `cb` was called',
                'args which did\'t hit the `hashcode`, `cb` won\'t be called',
                'when `cb` return undefined, waterfall on input arguments',
                'when `cb` return non-undefined, waterfall on input arguments replacing first element with `cb` return`',
                'invocation return waterfall value of last `cb`'
            ],
        ),
        closureToDo
    );
});