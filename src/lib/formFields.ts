export function formDataToTrimmedFields(formData: FormData) {
  const fields: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    const normalized = String(value).trim();
    if (!normalized) continue;
    fields[key] = fields[key] ? `${fields[key]}, ${normalized}` : normalized;
  }

  return fields;
}

export function getTrimmedFormFields(form: HTMLFormElement) {
  return formDataToTrimmedFields(new FormData(form));
}

export function trimFieldRecord(fields: Record<string, string>) {
  return Object.entries(fields).reduce<Record<string, string>>((result, [key, value]) => {
    const normalized = value.trim();
    if (!normalized) return result;
    result[key] = normalized;
    return result;
  }, {});
}
