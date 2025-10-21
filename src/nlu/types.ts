export interface GraphCommand {
  action: string;
  nodes?: string[];
  edges?: string[][];
  start?: string;
  goal?: string;
  text?: string;
}
