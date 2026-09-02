export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'new-design/**',
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
