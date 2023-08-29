import { LotOptions, TagGeneratorConfig } from "../tagDefs";
import { Rect } from "./pdf-utils";
export interface SvgFontProperties {
    family: string;
    weight: string;
    style: string;
}
export declare class TagSvgPreviewer {
    private _width;
    private _height;
    private qrDimensions;
    private domFonts;
    constructor(width: number, height: number, qrDimensions: Rect);
    get width(): number;
    private mapY;
    /**
     *
     * Generiše SVG string na osnovu konfiguracionog objekta config.
     *
     * @param code Objejat (treba da sadrži propName koji je definisan u config objektu)
     * @param config
     * @returns SVG string koji sadrži Tag preview
     */
    svgPreview(code: unknown, config: TagGeneratorConfig, options?: LotOptions): string;
    private renderQr;
    addFontToDOM: (fontName: string, buffer?: ArrayBuffer) => Promise<void>;
    private static mapStandardFontToCss;
    private textElement;
    private renderLabels;
}
