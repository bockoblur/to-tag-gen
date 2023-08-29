import { PDFFont } from "pdf-lib";

/**
 * Boje se definišu kao *nizovi brojeva u rasponu 0..1*
 * 
 * Model boja je definisan dužinom niza:
 *    - Grayscale: [g]  0=crna, 1=bela
 *    - RGB:       [r, g, b]
 *    - CMYK:      [c, m, y, k]
 * 
 *    Podrazumevana vrednost za sve boje je Grayscale crna, sem za boju pozadine.
 *    Podrazumevana pozadina je transparentna.
 *
 *    Preporuka je da se koriste Grayscale i/ili CMYK, da bi generisani PDF fajlovi bili spremni za štampanje.
 *
 *    U PDF fajlu će se koristiti model boja koji je definisan u konfiguracionom fajlu,
 *    ali u SVG preview-u će svi modeli biti konvertovani u RGB kao #rrggbb string.
 * 
 *    Ako je važna tačna definicija RGB boje u SVG fajlu, koristiti polja `svgColor` i `svgBackgroundColor`
 * 
 */


export interface TagGeneratorConfig {

    /**
     *  Parametri QR-koda. Vidi `QrDefinition` za opis
     */
    qr: QrDefinition;
    
    /**
     *  Parametri za promenljiva polja. Vidi `LabelDefinition` za opis
     */
    labels?: LabelDefinition[];

    /**
     *  url PDF fajla koji sadrži šablon
     * 
     * Šablon može imati dve ili tri strane:
     * - Prva je uvek sam šablon, 
     * - Druga definiše poziciju QR koda,
     * - Treća (opciono) definiše overlay grafiku koja se iscrtava preko QR koda 
     *
     */
    pdfTemplateUrl: string;
    
    /**
     *  Url SVG šablona za preview.
     * 
     *  SVG šablon mora biti istih dimenzija kao PDF šablon i mora sadržati dva komentara:
     *  - `<!--_QR_-->`
     *  - `<!--_LABELS_-->`
     * 
     *  Ovi komentari će biti zamenjeni generisanim kodom i labelama, respektivno
     */
    svgTemplateUrl: string;

    _svgtext?: string;            // Ovo polje ostavljamo nedefinisano - biće popunjeno kada se završi inicijalizacija.

    /**
     * Definicije custom fontova. Samo za fontove koji nisu u AdobeStandard setu.
     * Svaki objekat u nizu definiše jedan font
     *  @family je ime koje se koristi za identifikaciju fonta
     *  @url pokazuje na font fajl
     *  @_fontData će biti popunjeno nakon inicijalizacije
     */
    
    customFonts?: IFontMap[];

  }
  
  interface IFontMap{
    family: string;
    url: string;
    _fontData?: PDFFont;
  }

  interface QrDefinition {
    /**
     *  Prefiks koji će biti dodat ispred svakog teksta koji ide u QR. 
     *  Default je prazan string.
     */
    codePrefix?: string;

    /**
     *  Ime propertija koji se koristi za generisanje QR koda.
     */
    propName: string;

    /**
     *  Boja pozadine za QR polje. Default: transparentno, ako nije definisano.
     */
    backgroundColor?: number[];

    /**
     *  Ako je zadat, ovaj string se koristi za definiciju boje pozadine u SVG preview fajlu.
     *  Ako nije definisan, koristiće se interna konverzija `backgroundColor` propertija, što ne daje uvek dobre rezultate
     *  pri konverziji iz CMYK u RGB
     */
    svgBackgroundColor?: string;

    /**
     *  Boja QR koda. Default je Grayscale crna, ako nije definisano.
     *  
     */
    color?: number[];
    
    /**
     *  Ako je zadat, ovaj string se koristi za definiciju boje kôda u SVG preview fajlu.
     *  Ako nije definisan, koristiće se interna konverzija `color` propertija, što ne daje uvek dobre rezultate
     *  pri konverziji iz CMYK u RGB
     */
    svgColor?: string;

    /**
     *  `'L'|'M'|'Q'|'H'`   // QR error correction level. Default: 'M'.
     */
    ec_level?: string;
    
    /**
     *  Unutrašnja margina kôda.
     *  Jedinica mere je veličina osnovnog kvadrata kôda. Može biti 0-4. Default: 2
     */
    margin: number;
  }
  

  export interface LabelDefinition {
  
    /**
     * Jedinstveni ID ove labele. Koristi se za generisanje DOM @font-face za ovu labelu. Biće dodeljen sekvencijalni broj ako nije zadat
     */
    id?: string;

    /**
     *  Ime propertija koji se koristi za ispis teksta ove labele
     */
    propName: string;

    /**
     * x pozicija (u mm) labele mereno od donjeg levog ugla (stvarna pozicija zavisi od `alignment`-a)
     */
    x: number;

    /**
     * y pozicija (u mm) labele mereno od donjeg levog ugla
     */
    y: number;
    
    /**
     * Ugao rotacije (u stepenima). Default: 0°.
     * Pozitivne vrednosti su counterclockwise
     */
    angle?: number;            // Ugao rotacije (u stepenima). Default: 0°.
    
    /**
     *  Veličina fonta za ispis ove labele
     */
    fontSize: number;

    /**
     * Opcije poravnanja teksta.
     * `"start"|"middle"|"end"`, default je `"start"`
     */
    alignment?: string;

    /**
     * Boja teksta ove labele. Default je Grayscale crna, ako nije definisano.
     */
    color?: number[];

    /**
     *  Ako je zadat, ovaj string se koristi za definiciju boje kôda u SVG preview fajlu.
     *  Ako nije definisan, koristiće se interna konverzija `color` propertija, što ne daje uvek dobre rezultate
     *  pri konverziji iz CMYK u RGB
     */
    svgColor?: string

    /**
     * Ime fonta koji se koristi za ispis ove labele. (Ako NIJE jednako imenu nekog od Adobe standard fontova, 
     * u config fajlu mora postojati sekcija `customFonts`
     * 
     */
    font: string;
                                  // 
                                  // https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/pdf_reference_archives/PDFReference.pdf

  }

  
  /**
   *  Opcije za generisanje pdf-a i svg-a
   *  metadata i dataUri se koriste samo za PDF
   */

  export interface LotOptions{
    metadata?: PDFMetaData;   // default: {}

  /**
   * ako je `true`, upisuje interaktivni link u svaku stranu pdf fajla, kao i u generisane SVG fajlove
   */  
  embedLinks?: boolean; // default: false

  /**
   * Ako hoćemo da PDF bude vraćen kao `dataUri` a ne kao `UInt8Array` (default)
   */
    dataUri?: boolean; // default: false

  }

  /**
   *  PDF Metadata koji će biti upisani u PDF fajl pri generisanju.
   *  Vidi https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/pdf_reference_archives/PDFReference.pdf za opcije
   */
 
  export interface PDFMetaData{
    title?: string;
    subject?: string;
    keywords?: string[];
    created?: Date;    // (Default: `Date.now` )
    modified?: Date;   // (Default: `Date.now` )
  }
  