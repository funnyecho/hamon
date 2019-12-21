/**
 * Created by samhwang1990@gmail.com.
 */

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
    testRegex: [
        '/__tests__/.*?(test|spec)\\.[jt]sx?$',
    ]
});