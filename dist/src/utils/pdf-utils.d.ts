import { PDFDocument, PDFPage, StandardFonts } from "pdf-lib";
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare const createPageLinkAnnotation: (page: PDFPage, uri: string, rect: Rect) => void;
export declare const createPageTextAnnotation: (page: PDFPage, text: string, x?: number, y?: number) => void;
export declare const isStandardFont: (name: string) => boolean;
export declare const toStandardFont: (name: string) => StandardFonts;
export declare const getCustomProp: (doc: PDFDocument, key: string) => string | undefined;
