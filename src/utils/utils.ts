
  export function isNode(){
    return typeof window === 'undefined';
  }

  export function mm2pt(x:number):number {
    return x * 2.834645669291339;
  }
  
  export function pt2mm(x:number):number {
    return x * 0.3527777777777778;
  }

  async function fetchWithError(url:string) : Promise<Response> {
    
    let res = await fetch(url);
    if (!res.ok){
      throw new Error(`fetch from ${url} failed: ${res.statusText}`)
    }
    return res;
  }

  export async function fetchBytes(url: string) : Promise<ArrayBuffer> {
    return (await fetchWithError(url)).arrayBuffer();
  }


  export async function fetchJson(url: string) : Promise<any> {
    return (await fetchWithError(url)).json();
  }


  export async function fetchText(url: string) : Promise<string> {
    return (await fetchWithError(url)).text();
  }

  export const propNameList = (obj:any):string => Object.keys(obj) ? Object.keys(obj).map(n=>`'${n}'`).join(", ") : `nothing`;
  
  export const toRGB = (color: number[]) : string => {

    const toHex = (n:number):string => ('0' + Math.round(Math.abs(Math.min(1, n))*255).toString(16)).slice(-2);
    
    const DEFAULT_COLOR = "#000000"; // default is black
    if (!color || color.length>4)
      return DEFAULT_COLOR;
    const l = color.length;
    if (l == 1){  // grayscale
      const g = toHex(color[0]);
      return '#'+g+g+g;
    }else if (l==3){  // rgb
      return '#'+toHex(color[0])+toHex(color[1])+toHex(color[2]);
    }
    else if (l==4){  // cmyk
      const c = color[0];
      const m = color[1];
      const y = color[2];
      const k = color[3];
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      return '#'+toHex(r)+toHex(g)+toHex(b);
    }
    return DEFAULT_COLOR;
  }