export function safeParseJson(json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function isEmpty(value: any) {
  return value === undefined || value === null || value === "";
}
