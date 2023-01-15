module.exports = {
    extends: [
        // By extending from a plugin config, we can get recommended rules without having to add them manually.
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    ignorePatterns: ['dist/', 'node_modules/', 'gas_scanner_server.ts'],
    rules: {
        // Add your own rules here to override ones from the extended configs.
    },
};