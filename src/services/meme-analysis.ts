// The MemeAnalysis type below can be converted to a JSON Schema using
// `npm run update-schema`. Run this every time you change the MemeAnalysis
// type.

/** Information about a meme. */
export default interface MemeAnalysis {
    /** The full text found in this image. */
    full_ocr_text: string;
    /** A short description of the image (up to 100 words). */
    short_description: string;
    /**
     * Meme category ("politics", "reaction", etc).
     *
     * @pattern ^[a-z0-9_]{1,20}$
     */
    category: string;
    /** Search keywords for this meme (up to 5). */
    keywords: string[];
    /**
     * A descriptive filename based on the content. (Does not include
     * an extension.)
     * 
     * @pattern ^[a-z0-9_]{1,40}$
     */
    descriptive_image_filename: string;
}