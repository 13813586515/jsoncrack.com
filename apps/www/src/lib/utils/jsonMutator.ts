import type { JSONPath } from "jsonc-parser";
import { applyEdits, modify, parse } from "jsonc-parser";

export function updateJsonByPath(
  jsonText: string,
  path: JSONPath,
  key: string | number,
  newValue: string | number | boolean | null
): string {
  try {
    const edits = modify(jsonText, [...path, key], newValue, {
      formattingOptions: {
        tabSize: 2,
        insertSpaces: true,
        eol: "\n",
      },
    });
    return applyEdits(jsonText, edits);
  } catch {
    try {
      const parsed = parse(jsonText);
      if (parsed && path.length === 0 && typeof key === "string") {
        (parsed as Record<string, unknown>)[key] = newValue;
        return JSON.stringify(parsed, null, 2);
      }
      return jsonText;
    } catch {
      return jsonText;
    }
  }
}

export function deleteJsonByPath(
  jsonText: string,
  path: JSONPath,
  key: string | number
): string {
  try {
    const parsed = JSON.parse(jsonText);
    let current: unknown = parsed;

    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      if (current && typeof current === "object") {
        current = (current as Record<string | number, unknown>)[segment];
      } else {
        return jsonText;
      }
    }

    if (Array.isArray(current)) {
      if (typeof key === "number" && key >= 0 && key < current.length) {
        current.splice(key, 1);
      }
    } else if (current && typeof current === "object") {
      delete (current as Record<string, unknown>)[key as string];
    }

    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonText;
  }
}

export function addJsonField(
  jsonText: string,
  path: JSONPath,
  key: string,
  value: string | number | boolean | null
): string {
  try {
    const parsed = JSON.parse(jsonText);
    let current: unknown = parsed;

    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      if (current && typeof current === "object") {
        current = (current as Record<string | number, unknown>)[segment];
      } else {
        return jsonText;
      }
    }

    if (current && typeof current === "object" && !Array.isArray(current)) {
      (current as Record<string, unknown>)[key] = value;
    }

    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonText;
  }
}

export function getAllJsonKeys(obj: unknown): string[] {
  const keys: Set<string> = new Set();

  function traverse(current: unknown) {
    if (current && typeof current === "object") {
      if (Array.isArray(current)) {
        current.forEach(item => traverse(item));
      } else {
        Object.keys(current as Record<string, unknown>).forEach(key => {
          keys.add(key);
          traverse((current as Record<string, unknown>)[key]);
        });
      }
    }
  }

  traverse(obj);
  return Array.from(keys);
}
