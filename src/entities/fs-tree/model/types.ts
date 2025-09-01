export type NodeType = "file" | "folder";
export type TreeNode = {
  name: string;
  path: string;
  type: NodeType;
  size?: number;
  children?: TreeNode[];
};

export type Tab =
  | { path: string; kind: "text"; language?: string; content?: string }
  | { path: string; kind: "image"; dataUrl: string }
  | { path: string; kind: "binary" };
