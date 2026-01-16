// 验证码生成和验证工具

// 存储验证码的Map，key为验证码ID，value为{code, expires}
const captchaStore = new Map<string, { code: string; expires: number }>();

// 验证码有效期（5分钟）
const CAPTCHA_EXPIRES = 5 * 60 * 1000;

// 清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (data.expires < now) {
      captchaStore.delete(id);
    }
  }
}, 60000); // 每分钟清理一次

/**
 * 生成随机验证码
 * @param length 验证码长度，默认4位
 * @returns 验证码字符串
 */
export function generateCaptchaCode(length: number = 4): string {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 生成验证码并返回ID和验证码
 * @returns {id: string, code: string}
 */
export function createCaptcha(): { id: string; code: string } {
  const id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const code = generateCaptchaCode(4);
  const expires = Date.now() + CAPTCHA_EXPIRES;
  
  captchaStore.set(id, { code, expires });
  
  return { id, code };
}

/**
 * 验证验证码
 * @param id 验证码ID
 * @param inputCode 用户输入的验证码
 * @returns 是否验证通过
 */
export function verifyCaptcha(id: string, inputCode: string): boolean {
  const data = captchaStore.get(id);
  
  if (!data) {
    return false; // 验证码不存在或已过期
  }
  
  if (data.expires < Date.now()) {
    captchaStore.delete(id);
    return false; // 验证码已过期
  }
  
  // 验证码验证后删除（一次性使用）
  captchaStore.delete(id);
  
  // 不区分大小写比较
  return data.code.toLowerCase() === inputCode.toLowerCase().trim();
}

/**
 * 删除验证码（用于刷新时）
 */
export function deleteCaptcha(id: string): void {
  captchaStore.delete(id);
}








