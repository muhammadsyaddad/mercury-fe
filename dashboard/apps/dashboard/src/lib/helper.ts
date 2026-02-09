
export function hasGroup(groups: string[] = [], required: string | string[]) {
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((role) => groups.includes(role));
}
