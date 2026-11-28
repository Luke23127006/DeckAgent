/**
 * The slide CSP. It comes before the slide HTML in `srcdoc`, so the slide cannot load a network source. The `srcdoc`
 * document also keeps the CSP of the Host.
 */
export const slideCsp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">`

/**
 * The only owner of a deck preview iframe. Slide HTML never joins the document of the app: it renders in an iframe
 * with an empty `sandbox` attribute, which gives it an opaque origin. A sample slide loads by `src` from the Host, which
 * serves it with a sandbox CSP.
 */
export function SlideFrame(props: {
  readonly html?: string | undefined
  readonly src?: string
  readonly title?: string
  readonly hidden?: boolean
  /** A thumbnail: hidden from assistive technology and from the tab order. */
  readonly decorative?: boolean
}) {
  return (
    <iframe
      sandbox=""
      referrerPolicy="no-referrer"
      title={props.title}
      src={props.src}
      srcDoc={props.html === undefined ? undefined : `${slideCsp}${props.html}`}
      hidden={props.hidden}
      aria-hidden={props.decorative ? 'true' : undefined}
      tabIndex={props.decorative ? -1 : undefined}
    />
  )
}
