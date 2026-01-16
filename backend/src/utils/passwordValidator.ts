/**
 * 密码验证工具
 */

interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 验证密码强度
 * 要求：
 * - 最少8位
 * - 必须包含字母和数字
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, message: '密码不能为空' };
  }

  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }

  if (password.length > 100) {
    return { valid: false, message: '密码长度不能超过100位' };
  }

  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  if (!hasNumber) {
    return { valid: false, message: '密码必须包含数字' };
  }

  if (!hasLetter) {
    return { valid: false, message: '密码必须包含字母' };
  }

  return { valid: true };
}

/**
 * 密码强度评分（1-5）
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return strength;
}
