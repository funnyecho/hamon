/**
 * Created by samhwang1990@gmail.com.
 */

describe('SyncHook', () => {
    test(
        closureName(
            ['listen to hook with `cb`', 'invoke hook'],
            [
                'listening return a function which can remove listener',
                'invocation return `undefined`',
                '`cb` was called before removing listener',
                '`cb` won\'t be called after removing listener',
            ]
        ),
        closureToDo
     );
    
    test(
        closureName(
            'clean all listeners',
            ['hook invocation return `undefined`', 'no `cb`s will be called']
        ),
        closureToDo
    )
});

describe('SyncHook with hashcode', () => {
    test(
        closureName(
            ['create SyncHook with hashcode function', 'invoke hook with args'],
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