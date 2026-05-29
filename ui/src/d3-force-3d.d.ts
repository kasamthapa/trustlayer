declare module "d3-force-3d" {
  export function forceManyBody(): any;
  export function forceCollide(radius?: number): any;
  export function forceCenter(x?: number, y?: number): any;
  export function forceLink(links?: any[]): any;
  export function forceX(x?: number): any;
  export function forceY(y?: number): any;
  export function forceSimulation(nodes?: any[]): any;
}
