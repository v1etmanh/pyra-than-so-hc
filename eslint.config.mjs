export default [
  {
    ignores: [
      '.next/**',
      'mobile_app/.expo/**',
      'node_modules/**',
      'public/**',
      'new-design/**',
      'references/**',
      'scripts/**',
      '**/*.{ts,tsx,jsx}'
    ]
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      semi: ['error', 'always'],
      'no-unused-vars': ['error', { vars: 'all', args: 'none' }]
    }
  }
];
