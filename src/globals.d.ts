declare const __BUILD_TIME__: string
declare const __APP_VERSION__: string

// exifr's lite build (JPEG + HEIC, EXIF + GPS) ships without its own typings
declare module 'exifr/dist/lite.esm.mjs' {
  import exifr from 'exifr'
  export default exifr
}
