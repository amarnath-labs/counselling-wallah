// Local/mock choice-list helpers. Persistence and server-side validation belong to a future backend.
export function addChoiceItem(list, item) {
  if (list.some(x => x.collegeId === item.collegeId && x.branchName === item.branchName)) return list;
  return [...list, item];
}

export function removeChoiceItem(list, index) {
  return list.filter((_, i) => i !== index);
}

export function reorderChoiceItem(list, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
