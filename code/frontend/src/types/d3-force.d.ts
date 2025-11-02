declare module 'd3-force' {
  export interface Simulation<NodeType = any> {
    nodes(): NodeType[];
    nodes(nodes: NodeType[]): this;
    force(name: string, force?: any): this;
    alphaDecay(decay: number): this;
    velocityDecay(decay: number): this;
    on(event: string, callback: () => void): this;
    restart(): this;
    stop(): this;
    tick(): void;
  }

  export function forceSimulation<NodeType>(nodes?: NodeType[]): Simulation<NodeType>;
  
  export interface ForceManyBody {
    strength(strength: number | ((d: any) => number)): this;
  }
  export function forceManyBody(): ForceManyBody;
  
  export interface ForceCollide {
    radius(radius: number | ((d: any) => number)): this;
    strength(strength?: number): this;
  }
  export function forceCollide<NodeType>(radius?: number | ((d: NodeType) => number)): ForceCollide;
  
  export interface ForceCenter {
    x(x?: number): this;
    y(y?: number): this;
  }
  export function forceCenter(x?: number, y?: number): ForceCenter;
  
  export interface ForceX {
    x(x?: number | ((d: any) => number)): this;
    strength(strength?: number): this;
  }
  export function forceX(x?: number | ((d: any) => number)): ForceX;
  
  export interface ForceY {
    y(y?: number | ((d: any) => number)): this;
    strength(strength?: number): this;
  }
  export function forceY(y?: number | ((d: any) => number)): ForceY;
}
