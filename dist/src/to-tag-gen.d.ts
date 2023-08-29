import { LotOptions, TagGeneratorConfig } from './tagDefs';
export interface CodeDef {
    codeText: string;
    key: string;
}
export declare class TagGenerator {
    private config;
    private initialized;
    private pdfDoc;
    private templateDoc;
    private previewer;
    private qrDimensions;
    private templatePage;
    private overlayPage;
    constructor();
    setConfig(config: string | TagGeneratorConfig): Promise<void>;
    private initPdfDocuments;
    private resolveFonts;
    createPdfLot(codeDefs: unknown[], options?: LotOptions): Promise<Uint8Array | string>;
    private setBoxes;
    private writeCodeText;
    private writeQR;
    createSvgPreview(code: unknown, options?: LotOptions): string;
    private setPdfInfo;
}
