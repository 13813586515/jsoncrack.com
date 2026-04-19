export type SchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

export type StringFormat =
  | "date-time"
  | "date"
  | "time"
  | "email"
  | "hostname"
  | "ipv4"
  | "ipv6"
  | "uri"
  | "uuid"
  | "regex"
  | null;

export interface SchemaConstraints {
  required?: boolean;
  stringMinLength?: number;
  stringMaxLength?: number;
  stringPattern?: string;
  stringFormat?: StringFormat;
  numberMinimum?: number;
  numberMaximum?: number;
  numberExclusiveMinimum?: number;
  numberExclusiveMaximum?: number;
  numberMultipleOf?: number;
  arrayMinItems?: number;
  arrayMaxItems?: number;
  arrayUniqueItems?: boolean;
  objectMinProperties?: number;
  objectMaxProperties?: number;
  enumValues?: string[];
  default?: string;
  description?: string;
}

export interface SchemaNodeData {
  id: string;
  name: string;
  type: SchemaType;
  constraints: SchemaConstraints;
  description?: string;
  x?: number;
  y?: number;
}

export interface SchemaEdgeData {
  id: string;
  from: string;
  to: string;
  propertyName?: string;
  isArrayItem?: boolean;
}

export interface SchemaGraph {
  nodes: SchemaNodeData[];
  edges: SchemaEdgeData[];
}

export interface JSONSchemaRoot {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: SchemaType;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: unknown;
  definitions?: Record<string, unknown>;
}
