module.exports = {
    //ESLint的解析器换成 @typescript-eslint/parser 用于解析ts文件
    'parser': '@typescript-eslint/parser',
    // 让ESLint继承 @typescript-eslint/recommended 定义的规则
    'extends': ['plugin:@typescript-eslint/recommended'],
    'env': { 'node': true },
    'rules': {
        'semi': ['error', 'never'],
        'semi-style': ['error', 'last'],
        'indent': ['error', 4],
        'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1, 'maxBOF': 0 }],
        quotes: ['error', 'single']
    }
}
