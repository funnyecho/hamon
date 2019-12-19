/**
 * Created by samhwang1990@gmail.com.
 */

import isPromise from '../isPromise';

describe('isPromise for PromiseLike Object', () => {
    test('thenable object is also promise like object', () => {
        expect(isPromise()).toBeFalse();
        expect(isPromise(1)).toBeFalse();
        expect(isPromise('foo')).toBeFalse();
        expect(isPromise(null)).toBeFalse();
        expect(isPromise(undefined)).toBeFalse();
        expect(isPromise(Symbol())).toBeFalse();
        
        let arr = [1, 2];
        expect(isPromise(arr)).toBeFalse();
        
        arr['then'] = 1;
        expect(isPromise(arr)).toBeFalse();
        
        arr['then'] = noop;
        expect(isPromise(arr)).toBeTrue();
        
        let obj = { a: 1 };
        expect(isPromise(obj)).toBeFalse();

        obj['then'] = 1;
        expect(isPromise(obj)).toBeFalse();

        obj['then'] = noop;
        expect(isPromise(obj)).toBeTrue();
        
        let func = () => 1;
        expect(isPromise(func)).toBeFalse();

        func['then'] = 1;
        expect(isPromise(func)).toBeFalse();

        func['then'] = noop;
        expect(isPromise(func)).toBeTrue();
    });
});