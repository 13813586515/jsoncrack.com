import { create } from "zustand";
import type {
  SchemaNodeData,
  SchemaEdgeData,
  SchemaType,
  SchemaConstraints,
  JSONSchemaRoot,
} from "../../../../../types/schemaModeler";

let nodeIdCounter = 1;
let edgeIdCounter = 1;

const generateNodeId = () => `schema-node-${nodeIdCounter++}`;
const generateEdgeId = () => `schema-edge-${edgeIdCounter++}`;

const createDefaultNode = (name: string, type: SchemaType): SchemaNodeData => ({
  id: generateNodeId(),
  name,
  type,
  constraints: {
    required: false,
  },
  x: 100,
  y: 100,
});

interface SchemaModelerState {
  isOpen: boolean;
  nodes: SchemaNodeData[];
  edges: SchemaEdgeData[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  viewPort: { x: number; y: number; zoom: number };
}

interface SchemaModelerActions {
  openModeler: () => void;
  closeModeler: () => void;
  addNode: (name: string, type: SchemaType) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<SchemaNodeData>) => void;
  updateNodeConstraints: (nodeId: string, constraints: Partial<SchemaConstraints>) => void;
  addEdge: (from: string, to: string, propertyName?: string, isArrayItem?: boolean) => void;
  removeEdge: (edgeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  updateViewPort: (viewPort: Partial<{ x: number; y: number; zoom: number }>) => void;
  setSchema: (schema: JSONSchemaRoot) => void;
  exportSchema: () => JSONSchemaRoot;
  clearSchema: () => void;
}

const initialState: SchemaModelerState = {
  isOpen: false,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  viewPort: { x: 0, y: 0, zoom: 1 },
};

const buildSchemaFromNodes = (
  nodes: SchemaNodeData[],
  edges: SchemaEdgeData[]
): JSONSchemaRoot => {
  const rootNodes = nodes.filter(n => !edges.some(e => e.to === n.id));
  const rootNode = rootNodes[0] || nodes[0];

  if (!rootNode) {
    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {},
    };
  }

  const buildNodeSchema = (node: SchemaNodeData): Record<string, unknown> => {
    const schema: Record<string, unknown> = {
      type: node.type,
    };

    if (node.description) {
      schema.description = node.description;
    }

    const { constraints } = node;

    if (constraints.description) {
      schema.description = constraints.description;
    }

    if (constraints.default !== undefined) {
      try {
        schema.default = JSON.parse(constraints.default);
      } catch {
        schema.default = constraints.default;
      }
    }

    if (constraints.enumValues && constraints.enumValues.length > 0) {
      schema.enum = constraints.enumValues;
    }

    if (node.type === "string") {
      if (constraints.stringMinLength !== undefined) {
        schema.minLength = constraints.stringMinLength;
      }
      if (constraints.stringMaxLength !== undefined) {
        schema.maxLength = constraints.stringMaxLength;
      }
      if (constraints.stringPattern) {
        schema.pattern = constraints.stringPattern;
      }
      if (constraints.stringFormat) {
        schema.format = constraints.stringFormat;
      }
    }

    if (node.type === "number" || node.type === "integer") {
      if (constraints.numberMinimum !== undefined) {
        schema.minimum = constraints.numberMinimum;
      }
      if (constraints.numberMaximum !== undefined) {
        schema.maximum = constraints.numberMaximum;
      }
      if (constraints.numberExclusiveMinimum !== undefined) {
        schema.exclusiveMinimum = constraints.numberExclusiveMinimum;
      }
      if (constraints.numberExclusiveMaximum !== undefined) {
        schema.exclusiveMaximum = constraints.numberExclusiveMaximum;
      }
      if (constraints.numberMultipleOf !== undefined) {
        schema.multipleOf = constraints.numberMultipleOf;
      }
    }

    if (node.type === "array") {
      if (constraints.arrayMinItems !== undefined) {
        schema.minItems = constraints.arrayMinItems;
      }
      if (constraints.arrayMaxItems !== undefined) {
        schema.maxItems = constraints.arrayMaxItems;
      }
      if (constraints.arrayUniqueItems) {
        schema.uniqueItems = constraints.arrayUniqueItems;
      }

      const itemEdges = edges.filter(e => e.from === node.id && e.isArrayItem);
      if (itemEdges.length > 0) {
        const itemNode = nodes.find(n => n.id === itemEdges[0].to);
        if (itemNode) {
          schema.items = buildNodeSchema(itemNode);
        }
      }
    }

    if (node.type === "object") {
      if (constraints.objectMinProperties !== undefined) {
        schema.minProperties = constraints.objectMinProperties;
      }
      if (constraints.objectMaxProperties !== undefined) {
        schema.maxProperties = constraints.objectMaxProperties;
      }

      const propEdges = edges.filter(e => e.from === node.id && e.propertyName);
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      propEdges.forEach(edge => {
        const propNode = nodes.find(n => n.id === edge.to);
        if (propNode && edge.propertyName) {
          properties[edge.propertyName] = buildNodeSchema(propNode);
          if (propNode.constraints.required) {
            required.push(edge.propertyName);
          }
        }
      });

      if (Object.keys(properties).length > 0) {
        schema.properties = properties;
      }
      if (required.length > 0) {
        schema.required = required;
      }
    }

    return schema;
  };

  const result: JSONSchemaRoot = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...buildNodeSchema(rootNode),
  };

  return result;
};

const parseSchemaToGraph = (schema: JSONSchemaRoot): { nodes: SchemaNodeData[]; edges: SchemaEdgeData[] } => {
  const nodes: SchemaNodeData[] = [];
  const edges: SchemaEdgeData[] = [];
  let x = 100;
  let y = 100;

  const nodeMap = new Map<string, SchemaNodeData>();

  const createNode = (
    name: string,
    schemaObj: Record<string, unknown>,
    posX: number,
    posY: number
  ): SchemaNodeData => {
    const type = (schemaObj.type as SchemaType) || "object";
    const constraints: SchemaConstraints = {};

    if (schemaObj.description) {
      constraints.description = schemaObj.description as string;
    }

    if (type === "string") {
      if (schemaObj.minLength !== undefined) constraints.stringMinLength = schemaObj.minLength as number;
      if (schemaObj.maxLength !== undefined) constraints.stringMaxLength = schemaObj.maxLength as number;
      if (schemaObj.pattern) constraints.stringPattern = schemaObj.pattern as string;
      if (schemaObj.format) constraints.stringFormat = schemaObj.format as SchemaConstraints["stringFormat"];
    }

    if (type === "number" || type === "integer") {
      if (schemaObj.minimum !== undefined) constraints.numberMinimum = schemaObj.minimum as number;
      if (schemaObj.maximum !== undefined) constraints.numberMaximum = schemaObj.maximum as number;
      if (schemaObj.exclusiveMinimum !== undefined) {
        constraints.numberExclusiveMinimum = schemaObj.exclusiveMinimum as number;
      }
      if (schemaObj.exclusiveMaximum !== undefined) {
        constraints.numberExclusiveMaximum = schemaObj.exclusiveMaximum as number;
      }
      if (schemaObj.multipleOf !== undefined) constraints.numberMultipleOf = schemaObj.multipleOf as number;
    }

    if (type === "array") {
      if (schemaObj.minItems !== undefined) constraints.arrayMinItems = schemaObj.minItems as number;
      if (schemaObj.maxItems !== undefined) constraints.arrayMaxItems = schemaObj.maxItems as number;
      if (schemaObj.uniqueItems) constraints.arrayUniqueItems = true;
    }

    if (type === "object") {
      if (schemaObj.minProperties !== undefined) {
        constraints.objectMinProperties = schemaObj.minProperties as number;
      }
      if (schemaObj.maxProperties !== undefined) {
        constraints.objectMaxProperties = schemaObj.maxProperties as number;
      }
    }

    if (schemaObj.enum) {
      constraints.enumValues = schemaObj.enum as string[];
    }

    const node: SchemaNodeData = {
      id: generateNodeId(),
      name,
      type,
      constraints,
      description: schemaObj.description as string,
      x: posX,
      y: posY,
    };

    nodeMap.set(node.id, node);
    return node;
  };

  const requiredFields = new Set(schema.required || []);

  const processNode = (
    name: string,
    schemaObj: Record<string, unknown>,
    posX: number,
    posY: number,
    parentId?: string,
    propertyName?: string,
    isArrayItem?: boolean
  ): string => {
    const node = createNode(name, schemaObj, posX, posY);
    nodes.push(node);

    if (parentId && propertyName) {
      edges.push({
        id: generateEdgeId(),
        from: parentId,
        to: node.id,
        propertyName,
        isArrayItem,
      });

      if (requiredFields.has(propertyName)) {
        node.constraints.required = true;
      }
    }

    let childX = posX + 300;
    let childY = posY;

    if (schemaObj.type === "object" && schemaObj.properties) {
      const props = schemaObj.properties as Record<string, Record<string, unknown>>;
      Object.entries(props).forEach(([propName, propSchema]) => {
        processNode(propName, propSchema, childX, childY, node.id, propName);
        childY += 120;
      });
    }

    if (schemaObj.type === "array" && schemaObj.items) {
      const items = schemaObj.items as Record<string, unknown>;
      processNode("items", items, childX, childY, node.id, "items", true);
    }

    return node.id;
  };

  processNode("root", schema as Record<string, unknown>, x, y);

  return { nodes, edges };
};

const useSchemaModeler = create<SchemaModelerState & SchemaModelerActions>()((set, get) => ({
  ...initialState,

  openModeler: () => set({ isOpen: true }),
  closeModeler: () => set({ isOpen: false }),

  addNode: (name, type) => {
    const newNode = createDefaultNode(name, type);
    set(state => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
    }));
  },

  removeNode: nodeId => {
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== nodeId),
      edges: state.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  updateNode: (nodeId, updates) => {
    set(state => ({
      nodes: state.nodes.map(n => (n.id === nodeId ? { ...n, ...updates } : n)),
    }));
  },

  updateNodeConstraints: (nodeId, constraints) => {
    set(state => ({
      nodes: state.nodes.map(n =>
        n.id === nodeId ? { ...n, constraints: { ...n.constraints, ...constraints } } : n
      ),
    }));
  },

  addEdge: (from, to, propertyName, isArrayItem = false) => {
    const exists = get().edges.some(e => e.from === from && e.to === to);
    if (exists) return;

    const newEdge: SchemaEdgeData = {
      id: generateEdgeId(),
      from,
      to,
      propertyName,
      isArrayItem,
    };
    set(state => ({
      edges: [...state.edges, newEdge],
    }));
  },

  removeEdge: edgeId => {
    set(state => ({
      edges: state.edges.filter(e => e.id !== edgeId),
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
    }));
  },

  selectNode: nodeId => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: edgeId => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  updateViewPort: viewPort => {
    set(state => ({
      viewPort: { ...state.viewPort, ...viewPort },
    }));
  },

  setSchema: schema => {
    const { nodes, edges } = parseSchemaToGraph(schema);
    set({ nodes, edges, selectedNodeId: null, selectedEdgeId: null });
  },

  exportSchema: () => {
    const { nodes, edges } = get();
    return buildSchemaFromNodes(nodes, edges);
  },

  clearSchema: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    nodeIdCounter = 1;
    edgeIdCounter = 1;
  },
}));

export default useSchemaModeler;
