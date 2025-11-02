declare module 'roughjs/bundled/rough.esm.js' {
  export interface RoughGenerator {
    circle(x: number, y: number, diameter: number, options?: any): SVGElement;
    rectangle(x: number, y: number, width: number, height: number, options?: any): SVGElement;
    line(x1: number, y1: number, x2: number, y2: number, options?: any): SVGElement;
  }
  
  export interface RoughSVG {
    circle(x: number, y: number, diameter: number, options?: any): SVGElement;
    rectangle(x: number, y: number, width: number, height: number, options?: any): SVGElement;
    line(x1: number, y1: number, x2: number, y2: number, options?: any): SVGElement;
  }
  
  export interface Rough {
    svg(svg: SVGSVGElement): RoughSVG;
    canvas(canvas: HTMLCanvasElement): any;
  }
  
  const rough: Rough;
  export default rough;
}
