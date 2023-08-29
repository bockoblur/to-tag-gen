import { ec_level, svgObject } from "qr-image-color";

import {LabelDefinition, LotOptions, PDFMetaData, TagGeneratorConfig} from './tagDefs';

import  {
  PDFDocument,
  PDFPage,
  PDFFont,
  PDFEmbeddedPage,
  componentsToColor,
  StandardFonts,
  // degrees,
  pushGraphicsState,
  translate,
  rotateDegrees,
  popGraphicsState,
} from "pdf-lib";

import * as fontkit from "@pdf-lib/fontkit";

import {mm2pt, propNameList, fetchBytes, toRGB, fetchText, fetchJson} from './utils/utils';
import {createPageLinkAnnotation, isStandardFont, toStandardFont, createPageTextAnnotation, Rect} from './utils/pdf-utils';
import { TagSvgPreviewer } from "./utils/svg-utils";

export interface CodeDef{
    codeText: string;
    key: string;
}


export class TagGenerator{

    private config! : TagGeneratorConfig;
  private initialized: boolean;
  
  private pdfDoc!: PDFDocument;
  private templateDoc!: PDFDocument;
  
  private previewer! : TagSvgPreviewer;

  private qrDimensions! : Rect;
  private templatePage! : PDFEmbeddedPage;
  private overlayPage!  : PDFEmbeddedPage;

  constructor(){
    this.initialized = false;
    }

  public async setConfig( config: string | TagGeneratorConfig) {
    
    var c: TagGeneratorConfig;
    
    if (typeof config == 'object'){
      c = config;
    }
    else{
      c = await fetchJson(config) as TagGeneratorConfig;
    }

  // set defaults
  if (!c.labels) c.labels = [];
  if (!c.qr.color) c.qr.color = [0];  // Grayscale black
  if (!c.qr.svgColor) c.qr.svgColor = toRGB(c.qr.color);
  if (!c.qr.codePrefix) c.qr.codePrefix = "";
  if (!c.qr.ec_level) c.qr.ec_level = "M";

  if (!this.templateDoc){
    const bytes = await fetchBytes(c.pdfTemplateUrl);
    this.templateDoc = await PDFDocument.load(bytes);
  }
  //c._pdfbytes = await fetchBytes(c.pdfTemplateUrl);

  c._svgtext = await fetchText(c.svgTemplateUrl);
  
  this.config = c;

  await this.initPdfDocuments();
  
  this.initialized = true;
}

private async initPdfDocuments(){

  this.pdfDoc = await PDFDocument.create();
  
  const pages = this.templateDoc.getPages();
  
  if (pages.length < 2){
    throw Error("Invalid PDF template. Less than 2 pages found.");
  }
  
  this.templatePage = await this.pdfDoc.embedPage(pages[0]);
  
  const { width, height } = this.templatePage.size(); //pages[0].getSize();
  
  if (pages.length > 2){
    // if present, page 3 contains graphics to overlay over QR code
    this.overlayPage = await this.pdfDoc.embedPage(pages[2]);
  }
  
  // ArtBox of page 2 is position and size of QR code
  this.qrDimensions = pages[1].getArtBox();
    
  if (!this.templateDoc){
    const bytes = await fetchBytes(this.config.pdfTemplateUrl);
    this.templateDoc = await PDFDocument.load(bytes);
  }
  
  this.previewer = new TagSvgPreviewer(width, height, this.qrDimensions);
  
  await this.resolveFonts();
}

private async resolveFonts(){
  
  // let registeredFonts : Map<string, PDFFont> = new Map();

  this.pdfDoc.registerFontkit(fontkit);
  
  const {customFonts = []} = this.config;

  for(let i=0; i<customFonts.length; i++){
      if (isStandardFont(customFonts[i].family)){
        customFonts[i]._fontData = this.pdfDoc.embedStandardFont(toStandardFont(customFonts[i].family));
        this.previewer.addFontToDOM(customFonts[i].family);
      }else{
        // treat 'font' as url to font data
        const fbytes = await fetchBytes(customFonts[i].url);
        customFonts[i]._fontData = await this.pdfDoc.embedFont(fbytes);
        this.previewer.addFontToDOM(customFonts[i].family, fbytes);
      }
    
  }

  // for(let idx=0;idx<this.config.labels.length; idx++){
  //   let label = this.config.labels[idx];
  //   label.id = label.id || 'TAG_LABEL_' + idx;
  //   if (!label.color) label.color = [0];  // set default label color if not defined
  //   if (!label.svgColor){
  //     label.svgColor = toRGB(label.color);
  //   }
    

  //   // TODO
  //   // ovde imamo problem sa registrovanjem fontova za svg
  //   //   false && je dodato da uvek embeduje font, pa makar i više puta
  //   if ( false && registeredFonts.has(label.font) ){
  //     // we already have this font embedded
  //     label._fdata = registeredFonts.get(label.font);
  //   }else{
  //     // this font is not yet embedded
  //     if (isStandardFont(label.font)){
  //       label._fdata = this.pdfDoc.embedStandardFont(toStandardFont(label.font));
  //       this.previewer.addFontToDOM(label);
  //     }else{
  //       // treat 'font' as url to font data
  //       const fbytes = await fetchBytes(label.font);
  //       label._fdata = await this.pdfDoc.embedFont(fbytes);
  //       this.previewer.addFontToDOM(label, fbytes);
  //     }
  //     // register font as embedded
  //     registeredFonts.set(label.font, label._fdata);
  //   }
  // }

}

public async createPdfLot ( codeDefs: unknown[], options: LotOptions = {} ) : Promise<Uint8Array | string> {

  
  if (!this.initialized) throw new Error("tag-gen not initialized.");
  
  await this.initPdfDocuments();

    const {embedLinks = false, dataUri = false, metadata = {} } = options;
    
    const { width, height } = this.templatePage.size();

    codeDefs.forEach((code:any, index) => {
        var page = this.pdfDoc.addPage([width, height]);

        this.setBoxes(page);

        let codeValid = true;
        if (!code.hasOwnProperty(this.config.qr.propName)){
          const errMsg = `Expected QR property '${this.config.qr.propName}' not found (page ${index+1}). Input has: ${propNameList(code)}`;
          console.warn(errMsg);
          codeValid = false;
          createPageTextAnnotation(page, errMsg);
        }

        const txt = encodeURI( this.config.qr.codePrefix + (code[this.config.qr.propName] || "") );
        if (embedLinks && codeValid){
          if (txt.trim().length > 0){
            createPageLinkAnnotation( page, txt, this.qrDimensions);
          }
        }

        page.drawPage(this.templatePage);

        if (codeValid) this.writeQR( txt, page, this.qrDimensions);

          this.config?.labels?.forEach( label => {
            let txt = "?";
            if (!code.hasOwnProperty(label.propName)){
              const errMsg = `Expected label property '${label.propName}' not found (page ${index+1}). Input has: ${propNameList(code)}`;
              console.warn(errMsg);
              createPageTextAnnotation(page, errMsg, label.x, label.y);
            }else{
              txt = code[label.propName];
              this.writeCodeText(txt, page, label);
            }
          });

        if (this.overlayPage) page.drawPage(this.overlayPage);
      });

      this.setPdfInfo(metadata);

    if (dataUri)
      return await this.pdfDoc.saveAsBase64({dataUri: true});
    else
      return await this.pdfDoc.save();
}

private setBoxes(target: PDFPage){
  var t = this.templateDoc.getPage(0);
  var {x,y,width,height} = t.getArtBox();
  target.setArtBox(x,y,width,height);
  var {x,y,width,height} = t.getBleedBox();
  target.setBleedBox(x,y,width,height);
  var {x,y,width,height} = t.getCropBox();
  target.setCropBox(x,y,width,height);
  var {x,y,width,height} = t.getMediaBox();
  target.setMediaBox(x,y,width,height);
  var {x,y,width,height} = t.getTrimBox();
  target.setTrimBox(x,y,width,height);
}

private async writeCodeText(txt: string, page:PDFPage, label: LabelDefinition) {
  
    var labelFont : PDFFont;

    page.pushOperators();
    const {x, y, alignment, angle=0, font, fontSize, color} = label;

    let embededFont = this.config?.customFonts?.find( f => f.family === font);

    if (!font || !embededFont){
      console.warn(`PDF: Font ${font} not found. Check your config file. Using Helvetica as default.`)
      labelFont = page.doc.embedStandardFont(StandardFonts.Helvetica);
    }else{
      labelFont = embededFont._fontData || page.doc.embedStandardFont(StandardFonts.Helvetica);;
    }

    const textWidth = labelFont.widthOfTextAtSize(txt, fontSize);
    let adjustedX = mm2pt(x);
    switch(alignment){
      case "middle":
        adjustedX -= textWidth/2;
        break;
      case "end":
        adjustedX -= textWidth;
        break;
      default:
        break;
    }
    
    page.pushOperators(
      pushGraphicsState(),
      translate(adjustedX, mm2pt(y)),
      rotateDegrees(angle),
      translate(0, -(mm2pt(x)-adjustedX)*Math.sin(angle*Math.PI/180))
    );

    page.drawText(txt, {
      font: labelFont,
      size: fontSize,
      // x: adjustedX,
      // y: mm2pt(y),
      // rotate: degrees(angle),
      color: componentsToColor(color)
    });

    page.pushOperators(
      popGraphicsState()
    );
  }
  
  private writeQR(txt:string, page: PDFPage, position: Rect) {
    const desiredQRSize = position.width; 
  
    const ecl = this.config.qr.ec_level as ec_level || "M";

    if (this.config.qr.backgroundColor){
      page.drawRectangle( {...position, color: componentsToColor(this.config.qr.backgroundColor) })
    }

    var qr = svgObject(
      txt,
      { type: "svg", ec_level: ecl , margin: this.config.qr.margin },
    );
  
    page.drawSvgPath(qr.path, {
      x: position.x,
      y: position.y + desiredQRSize,
      scale: desiredQRSize / qr.size,
      color: componentsToColor(this.config.qr.color)
    });
  }
  
  public createSvgPreview( code: unknown, options: LotOptions = {}) : string{
    if (!this.initialized) throw new Error("tag-gen not initialized.");
    return this.previewer.svgPreview(code, this.config, options);
  }


  private setPdfInfo(meta: PDFMetaData) {
    var meta = meta || {};
    // set the document author, title, subject, creator, creation date, additional info
    this.pdfDoc.setTitle(meta.title || '', {showInWindowTitleBar:true});
    this.pdfDoc.setSubject( meta.subject || "");
    this.pdfDoc.setKeywords( meta.keywords || []);
    this.pdfDoc.setAuthor("totalobserver.com");
    this.pdfDoc.setProducer("TO-GenTag V1.0");
    this.pdfDoc.setCreator("TO-GenTag V1.0");
    this.pdfDoc.setCreationDate( meta.created || new Date());
    this.pdfDoc.setModificationDate(meta.modified || new Date()); 
  }

}
