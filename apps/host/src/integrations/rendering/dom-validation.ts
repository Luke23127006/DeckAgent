import { DeckError } from '@deckagent/deck'
import { inspectControlledLayout } from '@deckagent/html-format'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

const allowedCodes = [
  'ARTIFACT_IMAGE_UNREADABLE',
  'ARTIFACT_EMPTY',
  'ARTIFACT_REQUIRED_CONTENT_MISSING',
  'ARTIFACT_UNREADABLE',
  'ARTIFACT_OVERFLOW',
  'ARTIFACT_LAYOUT_GEOMETRY',
]

/** The in-page check of the exact materialized document; every measurement stays inside the 1280x720 viewport. */
export function buildValidationExpression(requiredText: readonly string[]): string {
  return `(async()=>{
        await document.fonts.ready;
        const failure=(code,element)=>{
          const binding=element?.closest('[data-node-id]')?.getAttribute('data-node-id');
          const rect=element?.getBoundingClientRect();
          return {code,path:binding?'document.'+binding:'nativeSource.'+(element?.tagName.toLowerCase()??'body'),expected:rect?'Visible bounds inside 1280x720; measured '+[rect.left,rect.top,rect.right,rect.bottom].map(n=>Math.round(n)).join(','):'All required text and images visible inside 1280x720'};
        };
        const images = await Promise.all(Array.from(document.images, i=>i.decode().then(()=>i.naturalWidth>0,()=>false)));
        if(images.some(ok=>!ok)) return failure('ARTIFACT_IMAGE_UNREADABLE',document.images[images.indexOf(false)]);
        const normalize=s=>s.replace(/\\s+/g,' ').trim();
        const text=normalize(document.body.innerText);
        if(!text && !images.length) return failure('ARTIFACT_EMPTY');
        const required=${JSON.stringify(requiredText)};
        if(required.some(t=>!text.includes(normalize(t)))) return failure('ARTIFACT_REQUIRED_CONTENT_MISSING');
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()){
          const n=walker.currentNode;
          if(!n.textContent.trim() || n.parentElement.tagName==='STYLE') continue;
          const range=document.createRange();range.selectNodeContents(n);
          const rect=range.getBoundingClientRect();
          const s=getComputedStyle(n.parentElement);
          if(!rect.width || !rect.height || s.visibility!=='visible' || s.color==='rgba(0, 0, 0, 0)') return failure('ARTIFACT_UNREADABLE',n.parentElement);
          if(rect.left<0 || rect.top<0 || rect.right>1281 || rect.bottom>721) return failure('ARTIFACT_OVERFLOW',n.parentElement);
          let background='rgb(255, 255, 255)';
          for(let e=n.parentElement;e;e=e.parentElement){
            const p=getComputedStyle(e);const r=e.getBoundingClientRect();
            if(Number(p.opacity)===0 || p.visibility!=='visible') return failure('ARTIFACT_UNREADABLE',n.parentElement);
            if(background==='rgb(255, 255, 255)' && p.backgroundColor!=='rgba(0, 0, 0, 0)') background=p.backgroundColor;
            if(['hidden','clip','auto','scroll'].includes(p.overflow) && (rect.right>r.right+1 || rect.bottom>r.bottom+1 || rect.left<r.left-1 || rect.top<r.top-1)) return failure('ARTIFACT_OVERFLOW',n.parentElement);
          }
          if(s.color===background) return failure('ARTIFACT_UNREADABLE',n.parentElement);
        }
        for(const image of document.images){const r=image.getBoundingClientRect();if(!r.width||!r.height||r.left<0||r.top<0||r.right>1281||r.bottom>721)return failure('ARTIFACT_OVERFLOW',image)}
        const layoutIssue = (${inspectControlledLayout.toString()})();
        if(layoutIssue) return layoutIssue;
        return {code:'ok'};
      })()`
}

/** A protocol failure and a refused slide are reported as distinct DeckError codes. */
export function assertValidationReport(report: unknown): void {
  if (!object(report) || report.exceptionDetails || !object(report.result) || !object(report.result.value))
    throw new DeckError('ARTIFACT_RENDERER_FAILED')
  const validation = report.result.value
  if (typeof validation.code !== 'string') throw new DeckError('ARTIFACT_RENDERER_FAILED')
  if (validation.code === 'ok') return
  if (
    !allowedCodes.includes(validation.code) ||
    typeof validation.path !== 'string' ||
    validation.path.length > 130 ||
    typeof validation.expected !== 'string' ||
    validation.expected.length > 250
  )
    throw new DeckError('ARTIFACT_RENDERER_FAILED')
  throw new DeckError(validation.code, [
    {
      code: validation.code,
      path: validation.path,
      message: 'The rendered slide fails visibility or viewport validation.',
      expected: validation.expected,
    },
  ])
}
