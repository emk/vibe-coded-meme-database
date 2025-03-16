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
     * Meme category.
     *
     * @pattern ^[a-z0-9_]{1,20}$
     * @examples ["reaction", "politics"]
     */
    category: string;
    /** Search keywords for this meme (up to 5). */
    keywords: string[];
    /**
     * A descriptive filename based on the short description. (Does not
     * include an extension.)
     * 
     * @pattern ^[a-z0-9_]{1,40}$
     * @examples ["gru_characters_feelings", "horse_stalling"]
     */
    descriptive_image_filename: string;
}