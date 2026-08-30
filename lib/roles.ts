export const FEDERATION_ROLES = ['member', 'federation_president', 'admin', 'staff', 'engineer', 'cto'] as const
export type FederationRole = typeof FEDERATION_ROLES[number]

export const FEDERATION_ROLE_LABELS: Record<FederationRole, string> = {
  member: '会員',
  federation_president: '連盟長',
  admin: '管理者',
  staff: 'スタッフ',
  engineer: 'エンジニア',
  cto: '最高技術責任者',
}
