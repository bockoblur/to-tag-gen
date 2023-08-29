import { ec_level, svgObject } from "qr-image-color";
import { LabelDefinition, LotOptions, TagGeneratorConfig } from "../tagDefs";
import { isStandardFont, Rect } from "./pdf-utils";
import {mm2pt, propNameList, toRGB} from './utils';

export interface SvgFontProperties {
  family: string;
  weight: string;
  style: string;
}

    const adobeStandardFontsMapping = {
        Courier: {
          family: "Courier, monospace",
          weight: "normal",
          style: "normal"
        },
        "Courier-Bold": {
          family: "Courier, monospace",
          weight: "bold",
          style: "normal"
        },
        "Courier-Oblique": {
          family: "Courier, monospace",
          weight: "normal",
          style: "oblique"
        },
        "Courier-BoldOblique": {
          family: "Courier, monospace",
          weight: "bold",
          style: "oblique"
        },
        Helvetica: {
          family: "Helvetica, Arial, sans-serif",
          weight: "normal",
          style: "normal"
        },
        "Helvetica-Bold": {
          family: "Helvetica, Arial, sans-serif",
          weight: "bold",
          style: "normal"
        },
        "Helvetica-Oblique": {
          family: "Helvetica, Arial, sans-serif",
          weight: "normal",
          style: "oblique"
        },
        "Helvetica-BoldOblique": {
          family: "Helvetica, Arial, sans-serif",
          weight: "bold",
          style: "oblique"
        },
        "Times-Roman": {
          family: "Times, serif",
          weight: "normal",
          style: "normal"
        },
        "Times-Bold": {
          family: "Times, serif",
          weight: "bold",
          style: "normal"
        },
        "Times-Italic": {
          family: "Times, serif",
          weight: "normal",
          style: "italic"
        },
        "Times-BoldItalic": {
          family: "Times, serif",
          weight: "bold",
          style: "italic"
        },
        Symbol: {
          family: "Symbol",
          weight: "normal",
          style: "normal"
        },
        ZapfDingbats: {
          family: "ZapfDingbats",
          weight: "normal",
          style: "normal"
        }
      };
      
      export class TagSvgPreviewer{

        private _width: number;
        private _height: number;   // potrebno zbog mapiranja koordinatnog sistema iz PDF u SVG
        private qrDimensions : Rect;

        private domFonts: Map<string, SvgFontProperties | FontFace> = new Map();

        constructor(width: number, height: number, qrDimensions:Rect ){
          this._height = height;
          this._width = width;
          this.qrDimensions = qrDimensions;
        }
      
        public get width(){
          return this._width;
        } 

        private mapY = (pdfY: number) => this._height - pdfY;

        /**
         * 
         * Generiše SVG string na osnovu konfiguracionog objekta config.
         * 
         * @param code Objejat (treba da sadrži propName koji je definisan u config objektu)
         * @param config 
         * @returns SVG string koji sadrži Tag preview
         */
        public svgPreview( code: unknown, config: TagGeneratorConfig, options?: LotOptions ) : string{

           var s = config._svgtext;

           if (!s) return '';

           s = s.replace('<!--_QR_-->', this.renderQr(code, config, options));
           if (config.labels)
              s = s.replace('<!--_LABELS_-->', this.renderLabels(code, config.labels));

           return s;

        }

        private renderQr(code: any, config: TagGeneratorConfig, options?: LotOptions):string {
          
          const {embedLinks = false} = options || {embedLinks:false};

          var linkText =  encodeURI( config.qr.codePrefix + code[config.qr.propName] );

          var qr = svgObject(
            linkText,
            { type: "svg", ec_level: config.qr.ec_level as ec_level || "M", margin: config.qr.margin },
            );
      
            let codeValid = true;
            if ( !code.hasOwnProperty(config.qr.propName) ){
              console.warn(`SVG: QR Property '${config.qr.propName}' not found in input. We got: ${propNameList(code)}.`);
              codeValid = false;
              qr.path = `M0,0l${qr.size},${qr.size} M0,${qr.size}L${qr.size},0`; // large X across the QR field
            }
      
          let bkg = '';
          if (config.qr.backgroundColor) 
            bkg = `<rect fill="${ config.qr.svgBackgroundColor || toRGB(config.qr.backgroundColor)}" x="0" y="0" width="${qr.size}" height="${qr.size}" />`;
          
          let s = "";
          if (!codeValid){
            s = `<symbol id="QR" width="${qr.size}" height="${qr.size}" viewBox="0 0 ${qr.size} ${qr.size}"> ${bkg} <path stroke="red" d="${qr.path}"/></symbol>`;
          }else{
            s = `<symbol id="QR" width="${qr.size}" height="${qr.size}" viewBox="0 0 ${qr.size} ${qr.size}"> ${bkg} <path fill="${config.qr.svgColor}" d="${qr.path}"/></symbol>`;
          }
          const {x, y, width, height} = this.qrDimensions;
          if (embedLinks){
            s += `<a href="${linkText}">\n`;
          }
          // reverse y coordinate for SVG!
          s += `<use xlink:href="#QR" x="${x}" y="${this.mapY(y+height)}" width="${width}" height="${height}" />`;
          if (embedLinks){
            s += `\n</a>`;
          }
          
          return s;

        }

        public addFontToDOM = async (fontName:string, buffer?: ArrayBuffer ) => {
          
          let font = this.domFonts.get(fontName);
          
          if (!font){
            if (isStandardFont(fontName)){
                font = TagSvgPreviewer.mapStandardFontToCss(fontName);
              }else{
                if (!buffer){
                  throw new Error("addFontToDom: buffer is not defined");
                  
                }
                const fontFace = new FontFace(fontName, buffer);
                await fontFace.load();
                document.fonts.add(fontFace);
                font = fontFace;
              }
              this.domFonts.set(fontName, font);
            }
          }

        // private removeFontFromDom = (fontName: string) => {
        //   if (!this.domFonts.has(fontName)) return;
        //   let font = this.domFonts.get(fontName);
        //   if(font instanceof FontFace){
        //     document.fonts.delete(font);
        //   }
        //   this.domFonts.delete(fontName);
        // }

        // private removeCustomFonts = () => {
        //   this.domFonts.forEach( f => this.removeFontFromDom(f.family));
        // }

        //@ts-ignore
        private static mapStandardFontToCss = (fontName: string) : SvgFontProperties =>  adobeStandardFontsMapping[fontName] || adobeStandardFontsMapping["Times-Roman"];


        //pravi SVG <text> element na osnovu definicije labele iz config objekta
        private textElement(code: any, label: LabelDefinition): string{
          var {x,y,propName, font, fontSize, alignment, svgColor, color=[0], angle} = label;
          let domFont = this.domFonts.get(font);
          if (!domFont){
            console.warn(`SVG: font '${font}' not found. Check your config file. Using 'Helvetica' as default`);
            domFont = TagSvgPreviewer.mapStandardFontToCss("Helvetica");
          }
          const {family, weight, style} = domFont;

          if (!svgColor) svgColor = toRGB(color);

          x = mm2pt(x);
          y = this.mapY( mm2pt(y) ) ;
          let text = "";
          if (code.hasOwnProperty(propName)){
            text = code[propName];
          } else {
            text = propName + "?";
            console.warn(`SVG: Label property '${propName}' not found in input. We got: ${propNameList(code)}.`);
          }
          let rotation = angle ? ` transform="rotate(${-angle},${x},${y}) "` : "";

          return `<text x="${x}" y="${y}" fill="${svgColor}" font-family="${family}" font-weight="${weight}" font-style="${style}" font-size="${fontSize}"${rotation}text-anchor="${alignment}">${text}</text>`
        }

        private renderLabels(code:unknown, labels: LabelDefinition[]) : string{
          let res : string[]= [];
          labels.forEach(l => res.push( this.textElement(code, l) ));
          return res.join('\n');
        }

      }


      // const findFont = (name: string) : FontFace => {
      //   let found : FontFace;  
      //   document.fonts.forEach( f => {
      //       if (f.family == name){
      //           found = f;
      //           return;
      //       }
      //     });
      //   return found;
      // }