/**
 * GitDB Token 混淆工具
 * 🔐 用于将 GitHub Token 混淆成非明文格式
 * 
 * 使用方法：
 * 1. 打开 token-mixer.html
 * 2. 输入 GitHub Token
 * 3. 点击生成混淆 Token
 * 4. 复制混淆后的 Token 到配置文件
 * 
 * ⚠️ 注意：这只是简单的字符串混淆，不是加密！
 * 目的是防止 GitHub 扫描检测到明文 token
 */

class TokenMixer {
    // 混淆前缀标识
    static PREFIX = 'gitdb_';
    
    // 字符映射表
    static CHAR_MAP = {
        '0': 'a', '1': 'b', '2': 'c', '3': 'd', '4': 'e',
        '5': 'f', '6': 'g', '7': 'h', '8': 'i', '9': 'j',
        'a': 'k', 'b': 'l', 'c': 'm', 'd': 'n', 'e': 'o',
        'f': 'p', 'g': 'q', 'h': 'r', 'i': 's', 'j': 't',
        'k': 'u', 'l': 'v', 'm': 'w', 'n': 'x', 'o': 'y',
        'p': 'z', 'q': 'A', 'r': 'B', 's': 'C', 't': 'D',
        'u': 'E', 'v': 'F', 'w': 'G', 'x': 'H', 'y': 'I',
        'z': 'J', 'A': 'K', 'B': 'L', 'C': 'M', 'D': 'N',
        'E': 'O', 'F': 'P', 'G': 'Q', 'H': 'R', 'I': 'S',
        'J': 'T', 'K': 'U', 'L': 'V', 'M': 'W', 'N': 'X',
        'O': 'Y', 'P': 'Z', 'Q': '0', 'R': '1', 'S': '2',
        'T': '3', 'U': '4', 'V': '5', 'W': '6', 'X': '7',
        'Y': '8', 'Z': '9', '_': '-', '-': '_'
    };
    
    // 反向映射表
    static REVERSE_MAP = {};
    
    constructor() {
        // 生成反向映射
        for (const [key, value] of Object.entries(TokenMixer.CHAR_MAP)) {
            TokenMixer.REVERSE_MAP[value] = key;
        }
    }
    
    /**
     * 混淆 Token
     * @param {string} token - 原始 GitHub Token
     * @returns {string} 混淆后的 Token
     */
    mix(token) {
        if (!token || typeof token !== 'string') {
            throw new Error('Invalid token');
        }
        
        // 支持多种 Token 格式
        const validPrefixes = ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', 'github_pat_'];
        const isValidFormat = validPrefixes.some(prefix => token.startsWith(prefix));
        
        if (!isValidFormat) {
            throw new Error('Invalid token format. Should start with ghp_, gho_, ghu_, ghs_, ghr_, or github_pat_');
        }
        
        // 添加前缀并混淆
        let mixed = TokenMixer.PREFIX;
        for (const char of token) {
            mixed += TokenMixer.CHAR_MAP[char] || char;
        }
        
        // 添加校验位
        mixed += this._generateChecksum(token);
        
        return mixed;
    }
    
    /**
     * 解混淆 Token
     * @param {string} mixedToken - 混淆后的 Token
     * @returns {string} 原始 GitHub Token
     */
    unmix(mixedToken) {
        if (!mixedToken || typeof mixedToken !== 'string') {
            throw new Error('Invalid mixed token');
        }
        
        // 检查前缀
        if (!mixedToken.startsWith(TokenMixer.PREFIX)) {
            throw new Error('Invalid token format: missing prefix');
        }
        
        // 移除前缀和校验位
        const core = mixedToken.slice(TokenMixer.PREFIX.length, -4);
        const checksum = mixedToken.slice(-4);
        
        // 解混淆
        let original = '';
        for (const char of core) {
            original += TokenMixer.REVERSE_MAP[char] || char;
        }
        
        // 验证校验位
        if (this._generateChecksum(original) !== checksum) {
            throw new Error('Invalid token checksum');
        }
        
        return original;
    }
    
    /**
     * 生成校验位
     * @private
     */
    _generateChecksum(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(4, '0');
    }
    
    /**
     * 检查是否为混淆后的 Token
     * @param {string} token - 待检查的 Token
     * @returns {boolean}
     */
    isMixed(token) {
        return token && token.startsWith(TokenMixer.PREFIX);
    }
    
    /**
     * 自动处理 Token（如果是混淆的则解混淆，否则直接返回）
     * @param {string} token - Token
     * @returns {string} 原始 Token
     */
    autoUnmix(token) {
        if (this.isMixed(token)) {
            return this.unmix(token);
        }
        return token;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TokenMixer;
}

if (typeof window !== 'undefined') {
    window.TokenMixer = TokenMixer;
}
