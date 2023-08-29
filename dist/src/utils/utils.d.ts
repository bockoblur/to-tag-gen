export declare function isNode(): boolean;
export declare function mm2pt(x: number): number;
export declare function pt2mm(x: number): number;
export declare function fetchBytes(url: string): Promise<ArrayBuffer>;
export declare function fetchJson(url: string): Promise<any>;
export declare function fetchText(url: string): Promise<string>;
export declare const propNameList: (obj: any) => string;
export declare const toRGB: (color: number[]) => string;
