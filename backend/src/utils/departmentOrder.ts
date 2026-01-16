// 固定的科室和中队排序顺序

// 科室顺序（自上而下）
export const DEPARTMENT_ORDER = [
  '综合科',
  '政工科',
  '法制科',
  '财务科',
  '指挥调度科',
  '管理服务科'
];

// 中队顺序（自上而下）
export const SQUAD_ORDER = [
  '直属中队',
  '新城中队',
  '高新区中队',
  '老城中队',
  '仪阳中队',
  '潮泉中队',
  '湖屯中队',
  '桃园中队',
  '安临站中队',
  '汶阳中队',
  '石横中队',
  '王庄中队',
  '安驾庄中队',
  '边院中队',
  '孙伯中队'
];

/**
 * 按照固定顺序排序departments
 * @param departments 部门列表
 * @param type 类型：'department' 或 'squad'
 * @returns 排序后的部门列表
 */
export function sortDepartments(departments: any[], type: 'department' | 'squad'): any[] {
  const order = type === 'department' ? DEPARTMENT_ORDER : SQUAD_ORDER;
  
  // 创建名称到索引的映射
  const nameToIndex = new Map<string, number>();
  order.forEach((name, index) => {
    nameToIndex.set(name, index);
  });
  
  // 排序：先按固定顺序，不在列表中的放在最后
  return [...departments].sort((a, b) => {
    const indexA = nameToIndex.get(a.name) ?? Infinity;
    const indexB = nameToIndex.get(b.name) ?? Infinity;
    
    if (indexA === Infinity && indexB === Infinity) {
      // 都不在列表中，按名称排序
      return a.name.localeCompare(b.name, 'zh-CN');
    }
    
    return indexA - indexB;
  });
}










