'use strict'

module.exports = {
    root: true,
    extends: 'usecases/usecase/nodejs',
    env: {
        jest: true, // Add Jest environment
    },
    rules: {
        'no-console': 'off', // Disable no-console rule globally
    },
}

