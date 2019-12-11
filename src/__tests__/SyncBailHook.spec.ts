/**
 * Created by samhwang1990@gmail.com.
 */

describe('SyncBailHook', () => {
    test(
        closureName(
            [
                'listen to hook with `cb`s',
                'invoke hook with args',
            ],
            [
                'bail on non-undefined return',
                '`cb`s before bailing was called with args',
                '`cb`s after bailing won\'t be called',
                'invocation return bailing value'
            ]
        ),
        closureToDo
    );
});

describe('SyncBailHook with hashcode', () => {
    test(
        closureName(
            ['create SyncBailHook with hashcode function', 'invoke hook with args'],
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
                'bail on non-undefined return',
                '`cb`s before bailing which specified hashcode hit the args was called with args',
                '`cb`s after bailing won\'t be called',
                'invocation return bailing value'
            ]
        ),
        closureToDo
    );
});