const ROLE_BY_ID = {
  1: 'admin',
  2: 'manager',
  3: 'staff',
}

export function getRoleKey(profile) {
  const role = profile?.role
  const roleText = [
    typeof role === 'string' ? role : null,
    role?.name,
    role?.roleName,
    role?.code,
    role?.title,
    profile?.roleName,
    profile?.roleCode,
  ]
    .find(Boolean)
    ?.toString()
    .toLowerCase()

  if (roleText?.includes('admin')) return 'admin'
  if (roleText?.includes('manager')) return 'manager'
  if (roleText?.includes('staff')) return 'staff'

  const roleId = Number(role?.id ?? profile?.roleId)
  return ROLE_BY_ID[roleId] || null
}
