import  {
  PDFDict,
    PDFDocument, PDFName, PDFPage, PDFString, StandardFonts, 
    // PageBoundingBox
  } from "pdf-lib";
import { mm2pt } from "./utils";

  export interface Rect{
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export const createPageLinkAnnotation = (page: PDFPage, uri: string, rect: Rect) => {

    if (!page || !uri ) return;

    // If rect is passed use that for dimensions. If not - use page size.
    const {x=0, y=0, width=page.getSize().width, height=page.getSize().height} = rect;

    const link = page.doc.context.register(
      page.doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [x, y, x+width, y+height],
        Border: [0, 0, 2, [6,3]],
        C: [.28,.84,1], // light blue
        H: 'P',   // Highlight: push 
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(uri),
        },
      }),
      );

      //page.node.set(PDFName.of('Annots'), page.doc.context.obj([link]));
      page.node.addAnnot(link);
    }



    export const createPageTextAnnotation = (page: PDFPage, text: string, x?: number, y?:number) => {

      if (!page || !text ) return;
      
      const {width, height} = page.getSize();

      x = x ? mm2pt(x) : width/2;
      y = y ? mm2pt(y) : height/2;

      const note = page.doc.context.register(
        page.doc.context.obj({
          Type: 'Annot',
          Subtype: 'Text',
          Open: true,
          Rect: [x, y, x, y],
          Name: 'Help',
          Contents: PDFString.of(text),
          // Border: [0, 0, 1],
          C: [1, 0, 0],
        }),
        );
        page.node.addAnnot(note);

      }

    const standardFonts = {
      'Courier' : StandardFonts.Courier,
      'Courier-Bold': StandardFonts.CourierBold,
      'Courier-Oblique': StandardFonts.CourierOblique,
      'Courier-BoldOblique': StandardFonts.CourierBoldOblique,
      'Helvetica': StandardFonts.Helvetica,
      'Helvetica-Bold': StandardFonts.HelveticaBold,
      'Helvetica-Oblique': StandardFonts.HelveticaOblique,
      'Helvetica-BoldOblique': StandardFonts.HelveticaBoldOblique,
      'Times-Roman': StandardFonts.TimesRoman,
      'Times-Bold': StandardFonts.TimesRomanBold,
      'Times-Italic': StandardFonts.TimesRomanItalic,
      'Times-BoldItalic': StandardFonts.TimesRomanBoldItalic,
      'Symbol' : StandardFonts.Symbol,
      'ZapfDingbats': StandardFonts.ZapfDingbats
    };

    export const isStandardFont = (name: string): boolean => Object.keys(standardFonts).find(p=> p===name) !== undefined;
    
    //@ts-ignore
    export const toStandardFont = (name: string): StandardFonts => standardFonts[name];


    export const getCustomProp = (
      doc: PDFDocument,
      key: string
    ): string | undefined => {
      const customProps = doc.context.lookup(doc.context.trailerInfo.Info);
      if (!(customProps instanceof PDFDict)) return undefined;
    
      const val = customProps.get(PDFName.of(key));
      return val ? val.toString() : undefined;
    };