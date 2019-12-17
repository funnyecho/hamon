/**
 * Created by samhwang1990@gmail.com.
 */

global.closureName = function closureName(metaOrGiven, should) {
    let givenInput, shouldInput;
    
    if (typeof metaOrGiven === 'string') {
        givenInput = [metaOrGiven];
    } else if (Array.isArray(metaOrGiven)) {
        givenInput = metaOrGiven;
    } else {
        givenInput = metaOrGiven.given;
        shouldInput = metaOrGiven.should;
    }
    
    if (should != undefined) {
        shouldInput = should;
    }
    
    if (!Array.isArray(givenInput)) {
        givenInput = [givenInput];
    }
    
    if (shouldInput == undefined) {
        return `\n${givenInput.map(v => `\t* ${v}`).join('\n')}`;
    }
    
    if (!Array.isArray(shouldInput)) {
        shouldInput = [shouldInput];
    }
    
    return `\n given:\n${givenInput.map(v => `\t* ${v}`).join('\n')}\n should:\n${shouldInput.map(v => `\t* ${v}`).join('\n')}`;
};

global.closureToDo = function closureToDo() {
    fail(new Error('test closure is empty'));
};

global.suiteName = function suiteName(given) {
    if (!Array.isArray(given)) {
        given = [given];
    }
    
    return given.join('; ').trim();
};

global.noop = function() {};