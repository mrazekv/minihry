/** Exact set matching: extras and omissions both need correcting. */
export function checkSelection(selected: readonly string[], required: readonly string[]) {
  const missing = required.filter(id => !selected.includes(id))
  const extra = selected.filter(id => !required.includes(id))
  return { missing, extra, correct: missing.length === 0 && extra.length === 0 }
}
