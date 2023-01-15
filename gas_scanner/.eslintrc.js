module.exports = {
    extends: [
        // By extending from a plugin config, we can get recommended rules without having to add them manually.
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    settings: {
        react: {
            // Tells eslint-plugin-react to automatically detect the version of React to use.
            version: 'detect',
        },
        // Tells eslint how to resolve imports
        'import/resolver': {
            node: {
                paths: ['src'],
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
    rules: {
        // Add your own rules here to override ones from the extended configs.
    },
};