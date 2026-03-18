function t(t,e,i,o){var r,s=arguments.length,n=s<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,o);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(s<3?r(n):s>3?r(e,i,n):r(e,i))||n);return s>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),r=new WeakMap;let s=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new s("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:a,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:c,getOwnPropertySymbols:p,getPrototypeOf:h}=Object,u=globalThis,g=u.trustedTypes,f=g?g.emptyScript:"",v=u.reactiveElementPolyfillSupport,x=(t,e)=>t,m={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!a(t,e),_={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&l(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:r}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const s=o?.call(this);r?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??_}static _$Ei(){if(this.hasOwnProperty(x("elementProperties")))return;const t=h(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(x("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(x("properties"))){const t=this.properties,e=[...c(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,o)=>{if(i)t.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of o){const o=document.createElement("style"),r=e.litNonce;void 0!==r&&o.setAttribute("nonce",r),o.textContent=i.cssText,t.appendChild(o)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:m).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:m;this._$Em=o;const s=r.fromAttribute(e,t.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(t,e,i,o=!1,r){if(void 0!==t){const s=this.constructor;if(!1===o&&(r=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??y)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:r},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==r||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[x("elementProperties")]=new Map,b[x("finalized")]=new Map,v?.({ReactiveElement:b}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,k=t=>t,$=w.trustedTypes,z=$?$.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,A="?"+S,M=`<${A}>`,T=document,E=()=>T.createComment(""),P=t=>null===t||"object"!=typeof t&&"function"!=typeof t,D=Array.isArray,F="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,W=/-->/g,H=/>/g,I=RegExp(`>|${F}(?:([^\\s"'>=/]+)(${F}*=${F}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),B=/'/g,L=/"/g,N=/^(?:script|style|textarea|title)$/i,U=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),O=U(1),Z=U(2),j=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),X=new WeakMap,q=T.createTreeWalker(T,129);function Y(t,e){if(!D(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,o=[];let r,s=2===e?"<svg>":3===e?"<math>":"",n=R;for(let e=0;e<i;e++){const i=t[e];let a,l,d=-1,c=0;for(;c<i.length&&(n.lastIndex=c,l=n.exec(i),null!==l);)c=n.lastIndex,n===R?"!--"===l[1]?n=W:void 0!==l[1]?n=H:void 0!==l[2]?(N.test(l[2])&&(r=RegExp("</"+l[2],"g")),n=I):void 0!==l[3]&&(n=I):n===I?">"===l[0]?(n=r??R,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?I:'"'===l[3]?L:B):n===L||n===B?n=I:n===W||n===H?n=R:(n=I,r=void 0);const p=n===I&&t[e+1].startsWith("/>")?" ":"";s+=n===R?i+M:d>=0?(o.push(a),i.slice(0,d)+C+i.slice(d)+S+p):i+S+(-2===d?e:p)}return[Y(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class J{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let r=0,s=0;const n=t.length-1,a=this.parts,[l,d]=G(t,e);if(this.el=J.createElement(l,i),q.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=q.nextNode())&&a.length<n;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(C)){const e=d[s++],i=o.getAttribute(t).split(S),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:n[2],strings:i,ctor:"."===n[1]?it:"?"===n[1]?ot:"@"===n[1]?rt:et}),o.removeAttribute(t)}else t.startsWith(S)&&(a.push({type:6,index:r}),o.removeAttribute(t));if(N.test(o.tagName)){const t=o.textContent.split(S),e=t.length-1;if(e>0){o.textContent=$?$.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],E()),q.nextNode(),a.push({type:2,index:++r});o.append(t[e],E())}}}else if(8===o.nodeType)if(o.data===A)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(S,t+1));)a.push({type:7,index:r}),t+=S.length-1}r++}}static createElement(t,e){const i=T.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,o){if(e===j)return e;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const s=P(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(t),r._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(e=K(t,r._$AS(t,e.values),r,o)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??T).importNode(e,!0);q.currentNode=o;let r=q.nextNode(),s=0,n=0,a=i[0];for(;void 0!==a;){if(s===a.index){let e;2===a.type?e=new tt(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new st(r,this,t)),this._$AV.push(e),a=i[++n]}s!==a?.index&&(r=q.nextNode(),s++)}return q.currentNode=T,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),P(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==j&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>D(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&P(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new Q(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=X.get(t.strings);return void 0===e&&X.set(t.strings,e=new J(t)),e}k(t){D(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const r of t)o===e.length?e.push(i=new tt(this.O(E()),this.O(E()),this,this.options)):i=e[o],i._$AI(r),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,r){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=V}_$AI(t,e=this,i,o){const r=this.strings;let s=!1;if(void 0===r)t=K(this,t,e,0),s=!P(t)||t!==this._$AH&&t!==j,s&&(this._$AH=t);else{const o=t;let n,a;for(t=r[0],n=0;n<r.length-1;n++)a=K(this,o[i+n],e,n),a===j&&(a=this._$AH[n]),s||=!P(a)||a!==this._$AH[n],a===V?t=V:t!==V&&(t+=(a??"")+r[n+1]),this._$AH[n]=a}s&&!o&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class ot extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class rt extends et{constructor(t,e,i,o,r){super(t,e,i,o,r),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??V)===j)return;const i=this._$AH,o=t===V&&i!==V||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==V&&(i===V||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(J,tt),(w.litHtmlVersions??=[]).push("3.3.2");const at=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let lt=class extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let r=o._$litPart$;if(void 0===r){const t=i?.renderBefore??null;o._$litPart$=r=new tt(e.insertBefore(E(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}};lt._$litElement$=!0,lt.finalized=!0,at.litElementHydrateSupport?.({LitElement:lt});const dt=at.litElementPolyfillSupport;dt?.({LitElement:lt}),(at.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ct={attribute:!0,type:String,converter:m,reflect:!1,hasChanged:y},pt=(t=ct,e,i)=>{const{kind:o,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,r,t,!0,i)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];e.call(this,i),this.requestUpdate(o,r,t,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ht(t){return(e,i)=>"object"==typeof i?pt(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ut(t){return ht({...t,state:!0,attribute:!1})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const gt=2;class ft{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class vt extends ft{constructor(t){if(super(t),this.it=V,t.type!==gt)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===V||null==t)return this._t=void 0,this.it=t;if(t===j)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const e=[t];return e.raw=e,this._t={_$litType$:this.constructor.resultType,strings:e,values:[]}}}vt.directiveName="unsafeHTML",vt.resultType=1;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class xt extends vt{}xt.directiveName="unsafeSVG",xt.resultType=2;const mt=(t=>(...e)=>({_$litDirective$:t,values:e}))(xt),yt={armchair:{viewBox:"0 0 256 256",content:'<rect x="16" y="16" width="224" height="224" rx="16" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="16" width="224" height="48" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="192" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="64" y="64" width="128" height="176" rx="8" stroke="black" stroke-width="8" fill="none"/>'},bath:{viewBox:"0 0 600 300",content:'<rect x="50" y="50" width="500" height="200" rx="40" stroke="black" stroke-width="8" fill="none"/><path d="M 100 220 C 100 240, 500 240, 500 220" stroke="black" stroke-width="8" fill="none"/><rect x="70" y="70" width="30" height="20" stroke="black" stroke-width="8" fill="none"/><rect x="80" y="90" width="10" height="20" stroke="black" stroke-width="8" fill="none"/><circle cx="510" cy="150" r="10" stroke="black" stroke-width="8" fill="none"/>'},"bed-double":{viewBox:"0 0 512 512",content:'<rect x="0" y="0" width="512" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H480C497.673 32 512 46.3269 512 64V128C512 145.673 497.673 160 480 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="272" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="480" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="496" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="496" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"bed-single":{viewBox:"0 0 256 512",content:'<rect x="0" y="0" width="256" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H224C241.673 32 256 46.3269 256 64V128C256 145.673 241.673 160 224 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="192" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="224" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="240" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="240" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"door-left":{viewBox:"0 0 256 256",content:'<rect x="0" y="210" width="80" height="20" fill="black"/><rect x="60" y="60" width="20" height="150" fill="black"/><rect x="200" y="210" width="56" height="20" fill="black"/><path d="M 80 60 A 150 150 0 0 1 200 210" stroke="black" stroke-width="3" fill="none"/>'},"door-right":{viewBox:"0 0 256 256",content:'<rect x="176" y="210" width="80" height="20" fill="black"/><rect x="176" y="60" width="20" height="150" fill="black"/><rect x="0" y="210" width="56" height="20" fill="black"/><path d="M 176 60 A 150 150 0 0 0 56 210" stroke="black" stroke-width="3" fill="none"/>'},"floor-lamp":{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" stroke="black" stroke-width="8" fill="none"/><circle cx="128" cy="128" r="16" fill="black"/><line x1="128" y1="112" x2="128" y2="48" stroke="black" stroke-width="8"/><circle cx="128" cy="48" r="8" fill="black"/><path d="M 64 64 A 128 128 0 0 1 192 64" stroke="black" stroke-width="8" stroke-dasharray="8 8"/>'},oven:{viewBox:"0 0 256 256",content:'<rect x="0" y="0" width="256" height="256" rx="16" stroke="black" stroke-width="16" fill="none"/><line x1="0" y1="224" x2="256" y2="224" stroke="black" stroke-width="16"/><circle cx="64" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="64" r="16" fill="black"/><circle cx="192" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="64" r="16" fill="black"/><circle cx="64" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="192" r="16" fill="black"/><circle cx="192" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="192" r="16" fill="black"/><rect x="32" y="240" width="192" height="16" rx="4" stroke="black" stroke-width="8" fill="black"/>'},plant:{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" fill="none"/><g transform="translate(128 128)"><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(72)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(144)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(216)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(288)" fill="none" stroke="black" stroke-width="12"/></g>'},shower:{viewBox:"0 0 256 256",content:'<path d="M 32 32 H 224 V 224 H 32 Z" stroke="black" stroke-width="16" fill="none"/><line x1="32" y1="32" x2="224" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><line x1="224" y1="32" x2="32" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><circle cx="128" cy="200" r="16" stroke="black" stroke-width="16" fill="none"/>'},"sofa-two-seater":{viewBox:"0 0 400 200",content:'<rect x="8" y="8" width="384" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="384" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="204" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"sofa-three-seater":{viewBox:"0 0 560 200",content:'<rect x="8" y="8" width="544" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="544" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="200" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="376" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"table-dining-room":{viewBox:"0 0 600 400",content:'<rect x="150" y="100" width="300" height="200" stroke="black" stroke-width="8" fill="none" rx="10"/><rect x="80" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="460" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/>'},"table-dining-room-round":{viewBox:"0 0 400 400",content:'<circle cx="200" cy="200" r="100" stroke="black" stroke-width="8" fill="none"/><rect x="150" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="150" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="30" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="310" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/>'},television:{viewBox:"0 0 256 64",content:'<line x1="0" y1="56" x2="256" y2="56" stroke="black" stroke-width="16"/><rect x="32" y="16" width="192" height="40" rx="4" stroke="black" stroke-width="16" fill="none"/><rect x="40" y="24" width="176" height="24" rx="2" stroke="black" stroke-width="8" fill="none"/>'},toilet:{viewBox:"0 0 300 400",content:'<rect x="75" y="30" width="150" height="80" rx="10" stroke="black" stroke-width="8" fill="none"/><path d="M 75 110 C 75 110, 50 160, 50 210 C 50 310, 125 360, 150 360 C 175 360, 250 310, 250 210 C 250 160, 225 110, 225 110 Z" stroke="black" stroke-width="8" fill="none"/><path d="M 100 150 C 100 150, 75 190, 75 220 C 75 300, 125 340, 150 340 C 175 340, 225 300, 225 220 C 225 190, 200 150, 200 150 Z" stroke="black" stroke-width="8" fill="none"/><circle cx="150" cy="70" r="15" stroke="black" stroke-width="8" fill="none"/>'}},_t=[{type:"svg",icon:"armchair",label:"Armchair",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"bath",label:"Bath",defaultWidth:1700,defaultHeight:700},{type:"svg",icon:"bed-double",label:"Double bed",defaultWidth:1600,defaultHeight:2e3},{type:"svg",icon:"bed-single",label:"Single bed",defaultWidth:900,defaultHeight:2e3},{type:"svg",icon:"door-left",label:"Door (left swing)",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"door-right",label:"Door (right swing)",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"table-dining-room",label:"Dining table",defaultWidth:1600,defaultHeight:900},{type:"svg",icon:"table-dining-room-round",label:"Round table",defaultWidth:1e3,defaultHeight:1e3},{type:"svg",icon:"floor-lamp",label:"Lamp",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"oven",label:"Oven / stove",defaultWidth:600,defaultHeight:600},{type:"svg",icon:"plant",label:"Plant",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"shower",label:"Shower",defaultWidth:900,defaultHeight:900},{type:"svg",icon:"sofa-two-seater",label:"Sofa (2 seat)",defaultWidth:1600,defaultHeight:800},{type:"svg",icon:"sofa-three-seater",label:"Sofa (3 seat)",defaultWidth:2400,defaultHeight:800},{type:"svg",icon:"television",label:"TV",defaultWidth:1200,defaultHeight:200},{type:"svg",icon:"toilet",label:"Toilet",defaultWidth:400,defaultHeight:700},{type:"icon",icon:"mdi:countertop",label:"Counter",defaultWidth:2e3,defaultHeight:600,lockAspect:!1},{type:"icon",icon:"mdi:cupboard",label:"Cupboard",defaultWidth:1e3,defaultHeight:500,lockAspect:!1},{type:"icon",icon:"mdi:desk",label:"Desk",defaultWidth:1400,defaultHeight:700,lockAspect:!1},{type:"icon",icon:"mdi:fridge",label:"Fridge",defaultWidth:700,defaultHeight:700,lockAspect:!0},{type:"icon",icon:"mdi:speaker",label:"Speaker",defaultWidth:300,defaultHeight:300,lockAspect:!0},{type:"icon",icon:"mdi:window-open-variant",label:"Window",defaultWidth:1e3,defaultHeight:150,lockAspect:!1}],bt=t=>!!(3&t),wt=t=>3&t,kt=t=>t>>2&7,$t=(t,e)=>-4&t|3&e,zt=(t,e)=>-29&t|(7&e)<<2,Ct=["Front-left","Front-right","Back-right","Back-left"],St=[["left wall","front wall"],["right wall","front wall"],["right wall","back wall"],["left wall","back wall"]],At=20,Mt=20,Tt=400,Et=300,Pt=6e3,Dt=["#2196F3","#FF5722","#4CAF50"],Ft=["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7"];class Rt extends lt{constructor(){super(...arguments),this._grid=new Uint8Array(Tt),this._zoneConfigs=new Array(7).fill(null),this._activeZone=null,this._sidebarTab="zones",this._expandedSensorInfo=null,this._showLiveMenu=!1,this._showDeleteCalibrationDialog=!1,this._showCustomIconPicker=!1,this._customIconValue="",this._furniture=[],this._selectedFurnitureId=null,this._dragState=null,this._pendingRenames=[],this._showRenameDialog=!1,this._roomSensitivity=1,this._targets=[],this._sensorState={occupancy:!1,static_presence:!1,pir_motion:!1,illuminance:null,temperature:null,humidity:null,co2:null},this._zoneState={occupancy:{},target_counts:{}},this._isPainting=!1,this._paintAction="set",this._frozenBounds=null,this._saving=!1,this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation=null,this._showTemplateSave=!1,this._showTemplateLoad=!1,this._templateName="",this._entries=[],this._selectedEntryId="",this._loading=!0,this._setupStep=null,this._wizardSaving=!1,this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardRoomWidth=0,this._wizardRoomDepth=0,this._wizardCapturing=!1,this._wizardCaptureProgress=0,this._view="live",this._openAccordions=new Set,this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._beforeUnloadHandler=t=>{this._dirty&&(t.preventDefault(),t.returnValue="")},this._originalPushState=null,this._originalReplaceState=null,this._interceptNavigation=()=>!!this._dirty&&(this._showUnsavedDialog=!0,this._pendingNavigation=null,!0),this._dismissTooltips=()=>{this.shadowRoot.querySelectorAll(".setting-info-tooltip").forEach(t=>{t.style.display="none"})},this._smoothBuffer=[]}connectedCallback(){super.connectedCallback(),this._initialize(),window.addEventListener("beforeunload",this._beforeUnloadHandler),window.addEventListener("click",this._dismissTooltips),this._originalPushState=history.pushState.bind(history),this._originalReplaceState=history.replaceState.bind(history);const t=this;history.pushState=function(...e){t._interceptNavigation()?t._pendingNavigation=()=>{t._originalPushState(...e),window.dispatchEvent(new PopStateEvent("popstate"))}:t._originalPushState(...e)},history.replaceState=function(...e){t._interceptNavigation()?t._pendingNavigation=()=>{t._originalReplaceState(...e),window.dispatchEvent(new PopStateEvent("popstate"))}:t._originalReplaceState(...e)}}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeTargets(),window.removeEventListener("beforeunload",this._beforeUnloadHandler),window.removeEventListener("click",this._dismissTooltips),this._originalPushState&&(history.pushState=this._originalPushState),this._originalReplaceState&&(history.replaceState=this._originalReplaceState)}updated(t){t.has("hass")&&this.hass&&this._loading&&!this._entries.length&&this._initialize()}async _initialize(){this.hass&&(this._loading=!0,await this._loadEntries(),this._selectedEntryId&&await this._loadEntryConfig(this._selectedEntryId),this._loading=!1)}async _loadEntries(){try{const t=await this.hass.callWS({type:"everything_presence_pro/list_entries"});this._entries=t.sort((t,e)=>(t.title||"").localeCompare(e.title||""))}catch{return void(this._entries=[])}const t=localStorage.getItem("epp_selected_entry"),e=t&&this._entries.find(e=>e.entry_id===t);this._selectedEntryId=e?t:this._entries[0]?.entry_id??""}async _loadEntryConfig(t){try{const e=await this.hass.callWS({type:"everything_presence_pro/get_config",entry_id:t});this._applyConfig(e)}catch{}this._subscribeTargets(t)}_applyConfig(t){const e=t.calibration;e?.perspective&&e.room_width>0?(this._perspective=e.perspective,this._roomWidth=e.room_width||0,this._roomDepth=e.room_depth||0,this._setupStep=null):(this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._setupStep=null);const i=t.room_layout||{};this._roomSensitivity=i.room_sensitivity??1,this._furniture=(i.furniture||[]).map((t,e)=>({id:t.id||`f_load_${e}`,type:t.type||"icon",icon:t.icon||"mdi:help",label:t.label||"Item",x:t.x??0,y:t.y??0,width:t.width??600,height:t.height??600,rotation:t.rotation??0,lockAspect:t.lockAspect??"svg"!==t.type})),i.grid_bytes&&Array.isArray(i.grid_bytes)?this._grid=new Uint8Array(i.grid_bytes):this._roomWidth>0&&this._roomDepth>0?this._initGridFromRoom():this._grid=new Uint8Array(Tt);const o=i.zone_slots||i.zones||[];this._zoneConfigs=Array.from({length:7},(t,e)=>{const i=o[e];return i?{name:i.name||`Zone ${e+1}`,color:i.color||Ft[e%Ft.length],sensitivity:i.sensitivity??1}:null}),this._reportingConfig=t.reporting||{}}_subscribeTargets(t){if(this._unsubscribeTargets(),!this.hass||!t)return;this.hass.connection.subscribeMessage(t=>{this._targets=(t.targets||[]).map(t=>({x:t.x,y:t.y,raw_x:t.raw_x??t.x,raw_y:t.raw_y??t.y,speed:0,active:t.active})),t.sensors&&(this._sensorState={occupancy:t.sensors.occupancy??!1,static_presence:t.sensors.static_presence??!1,pir_motion:t.sensors.pir_motion??!1,illuminance:t.sensors.illuminance??null,temperature:t.sensors.temperature??null,humidity:t.sensors.humidity??null,co2:t.sensors.co2??null}),t.zones&&(this._zoneState={occupancy:t.zones.occupancy??{},target_counts:t.zones.target_counts??{}})},{type:"everything_presence_pro/subscribe_targets",entry_id:t}).then(t=>{this._unsubTargets=t})}_unsubscribeTargets(){this._unsubTargets&&(this._unsubTargets(),this._unsubTargets=void 0),this._targets=[]}_onCellMouseDown(t){if("furniture"===this._sidebarTab)return void(this._selectedFurnitureId=null);if(null===this._activeZone)return;this._isPainting=!0,this._frozenBounds=this._getRoomBounds();const e=this._grid[t];if(0===this._activeZone){const t=bt(e)&&0===kt(e)&&1===wt(e);this._paintAction=t?"clear":"set"}else if(-1===this._activeZone||-2===this._activeZone){const t=-1===this._activeZone?2:3;this._paintAction=wt(e)===t?"clear":"set"}else this._paintAction=kt(e)===this._activeZone?"clear":"set";this._applyPaintToCell(t)}_onCellMouseEnter(t){this._isPainting&&this._applyPaintToCell(t)}_onCellMouseUp(){this._isPainting=!1,this._frozenBounds=null}_applyPaintToCell(t){if(null===this._activeZone)return;const e=this._grid[t];if(this._grid=new Uint8Array(this._grid),0===this._activeZone)"set"===this._paintAction?this._grid[t]=1:this._grid[t]=0;else if(-1===this._activeZone||-2===this._activeZone){if(!bt(e))return;const i=-1===this._activeZone?2:3;"set"===this._paintAction?this._grid[t]=$t(e,i):this._grid[t]=$t(e,1)}else{if(!bt(e))return;"set"===this._paintAction?this._grid[t]=zt(e,this._activeZone):this._grid[t]=zt(e,0)}this._dirty=!0,this.requestUpdate()}_addZone(){const t=this._zoneConfigs.findIndex(t=>null===t);if(-1===t)return;const e=new Set(this._zoneConfigs.filter(t=>null!==t).map(t=>t.color)),i=Ft.find(t=>!e.has(t))??Ft[t%Ft.length],o=[...this._zoneConfigs];o[t]={name:`Zone ${t+1}`,color:i,sensitivity:1},this._zoneConfigs=o,this._activeZone=t+1,this._dirty=!0}_removeZone(t){if(t<1||t>7||null===this._zoneConfigs[t-1])return;this._grid=new Uint8Array(this._grid);for(let e=0;e<Tt;e++)kt(this._grid[e])===t&&(this._grid[e]=zt(this._grid[e],0));const e=[...this._zoneConfigs];e[t-1]=null,this._zoneConfigs=e,this._activeZone===t&&(this._activeZone=null),this._dirty=!0,this.requestUpdate()}_clearOverlay(t){this._grid=new Uint8Array(this._grid);for(let e=0;e<Tt;e++)wt(this._grid[e])===t&&(this._grid[e]=$t(this._grid[e],1));this._dirty=!0,this.requestUpdate()}_addFurniture(t){const e={id:`f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:t.type,icon:t.icon,label:t.label,x:Math.max(0,(this._roomWidth-t.defaultWidth)/2),y:Math.max(0,(this._roomDepth-t.defaultHeight)/2),width:t.defaultWidth,height:t.defaultHeight,rotation:0,lockAspect:t.lockAspect??"icon"===t.type};this._furniture=[...this._furniture,e],this._selectedFurnitureId=e.id,this._dirty=!0}_addCustomFurniture(t){this._addFurniture({type:"icon",icon:t,label:"Custom",defaultWidth:600,defaultHeight:600,lockAspect:!1})}_removeFurniture(t){this._furniture=this._furniture.filter(e=>e.id!==t),this._selectedFurnitureId===t&&(this._selectedFurnitureId=null),this._dirty=!0}_updateFurniture(t,e){this._furniture=this._furniture.map(i=>i.id===t?{...i,...e}:i),this._dirty=!0}_mmToPx(t,e){return t/Et*(e+1)}_pxToMm(t,e){return t/(e+1)*Et}_onFurniturePointerDown(t,e,i,o){t.preventDefault(),t.stopPropagation(),this._selectedFurnitureId=e;const r=this._furniture.find(t=>t.id===e);if(!r)return;let s=0,n=0,a=0;if("rotate"===i){const i=this.shadowRoot?.querySelector(`.furniture-item[data-id="${e}"]`);if(i){const e=i.getBoundingClientRect();s=e.left+e.width/2,n=e.top+e.height/2,a=Math.atan2(t.clientY-n,t.clientX-s)*(180/Math.PI)}}this._dragState={type:i,id:e,startX:t.clientX,startY:t.clientY,origX:r.x,origY:r.y,origW:r.width,origH:r.height,origRot:r.rotation,handle:o,centerX:s,centerY:n,startAngle:a};const l=t=>this._onFurnitureDrag(t),d=()=>{this._dragState=null,window.removeEventListener("pointermove",l),window.removeEventListener("pointerup",d)};window.addEventListener("pointermove",l),window.addEventListener("pointerup",d)}_onFurnitureDrag(t){if(!this._dragState)return;const e=this._dragState,i=this.shadowRoot?.querySelector(".grid");if(!i)return;const o=i.firstElementChild?i.firstElementChild.offsetWidth:28,r=t.clientX-e.startX,s=t.clientY-e.startY;if("move"===e.type){const t=this._furniture.find(t=>t.id===e.id),i=t?.width??0,n=t?.height??0;this._updateFurniture(e.id,{x:Math.max(-i/2,Math.min(this._roomWidth-i/2,e.origX+this._pxToMm(r,o))),y:Math.max(-n/2,Math.min(this._roomDepth-n/2,e.origY+this._pxToMm(s,o)))})}else if("resize"===e.type&&e.handle){const t=this._pxToMm(r,o),i=this._pxToMm(s,o);let{origX:n,origY:a,origW:l,origH:d}=e;const c=this._furniture.find(t=>t.id===e.id);if(c?.lockAspect??!1){const o=Math.abs(t)>Math.abs(i)?t:i,r=e.origW/e.origH,s=e.handle.includes("w")||e.handle.includes("n")?-1:1;l=Math.max(100,e.origW+s*o),d=Math.max(100,l/r),l=d*r,e.handle.includes("w")&&(n=e.origX+(e.origW-l)),e.handle.includes("n")&&(a=e.origY+(e.origH-d))}else e.handle.includes("e")&&(l=Math.max(100,l+t)),e.handle.includes("w")&&(l=Math.max(100,l-t),n+=t),e.handle.includes("s")&&(d=Math.max(100,d+i)),e.handle.includes("n")&&(d=Math.max(100,d-i),a+=i);this._updateFurniture(e.id,{x:n,y:a,width:l,height:d})}else if("rotate"===e.type){const i=Math.atan2(t.clientY-(e.centerY??0),t.clientX-(e.centerX??0))*(180/Math.PI)-(e.startAngle??0);this._updateFurniture(e.id,{rotation:Math.round((e.origRot+i+360)%360)})}}_getCellColor(t){const e=this._grid[t];if(!bt(e))return"var(--secondary-background-color, #e0e0e0)";const i=kt(e);if(i>0&&i<=7){const t=this._zoneConfigs[i-1];if(t)return t.color}return"var(--card-background-color, #fff)"}_getCellOverlayColor(t){const e=this._grid[t],i=wt(e);return 2===i?"#00FFFF":3===i?"#FF0000":""}_getRoomBounds(){let t=At,e=0,i=Mt,o=0;for(let r=0;r<Tt;r++)if(bt(this._grid[r])){const s=r%At,n=Math.floor(r/At);s<t&&(t=s),s>e&&(e=s),n<i&&(i=n),n>o&&(o=n)}return{minCol:Math.max(0,t-1),maxCol:Math.min(19,e+1),minRow:Math.max(0,i-1),maxRow:Math.min(19,o+1)}}async _applyLayout(){this._saving=!0;try{const t=await this.hass.callWS({type:"everything_presence_pro/set_room_layout",entry_id:this._selectedEntryId,grid_bytes:Array.from(this._grid),zone_slots:this._zoneConfigs.map(t=>null!==t?{name:t.name,color:t.color,sensitivity:t.sensitivity}:null),room_sensitivity:this._roomSensitivity,furniture:this._furniture.map(t=>({type:t.type,icon:t.icon,label:t.label,x:t.x,y:t.y,width:t.width,height:t.height,rotation:t.rotation,lockAspect:t.lockAspect}))});this._dirty=!1,this._view="live";const e=t?.entity_id_renames||[];e.length>0&&(this._pendingRenames=e,this._showRenameDialog=!0)}finally{this._saving=!1}}async _saveSettings(){this._saving=!0;try{const t=this.shadowRoot.querySelector(".settings-container");if(!t)return;const e={};t.querySelectorAll("[data-report-key]").forEach(t=>{e[t.dataset.reportKey]=t.checked}),await this.hass.callWS({type:"everything_presence_pro/set_reporting",entry_id:this._selectedEntryId,reporting:e}),this._dirty=!1,this._view="live"}finally{this._saving=!1}}async _applyRenames(){if(this._pendingRenames.length)try{const t=await this.hass.callWS({type:"everything_presence_pro/rename_zone_entities",entry_id:this._selectedEntryId,renames:this._pendingRenames});t.errors?.length&&console.warn("Entity rename errors:",t.errors)}finally{this._showRenameDialog=!1,this._pendingRenames=[]}}_dismissRenameDialog(){this._showRenameDialog=!1,this._pendingRenames=[]}_getTemplates(){try{return JSON.parse(localStorage.getItem("epp_layout_templates")||"[]")}catch{return[]}}_saveTemplate(){const t=this._templateName.trim();if(!t)return;const e=this._getTemplates(),i=e.findIndex(e=>e.name===t),o={name:t,grid:Array.from(this._grid),zones:this._zoneConfigs.map(t=>null!==t?{...t}:null),roomWidth:this._roomWidth,roomDepth:this._roomDepth,roomSensitivity:this._roomSensitivity,furniture:this._furniture.map(t=>({...t}))};i>=0?e[i]=o:e.push(o),localStorage.setItem("epp_layout_templates",JSON.stringify(e)),this._showTemplateSave=!1,this._templateName=""}_loadTemplate(t){const e=this._getTemplates().find(e=>e.name===t);if(!e)return;this._grid=new Uint8Array(e.grid);const i=e.zones||[];this._zoneConfigs=Array.from({length:7},(t,e)=>i[e]??null),this._roomWidth=e.roomWidth,this._roomDepth=e.roomDepth,this._roomSensitivity=e.roomSensitivity??1,this._furniture=(e.furniture||[]).map(t=>({...t})),this._showTemplateLoad=!1}_deleteTemplate(t){const e=this._getTemplates().filter(e=>e.name!==t);localStorage.setItem("epp_layout_templates",JSON.stringify(e)),this.requestUpdate()}_initGridFromRoom(){const t=new Uint8Array(Tt),e=Math.ceil(this._roomWidth/Et),i=Math.ceil(this._roomDepth/Et),o=Math.floor((At-e)/2);for(let r=0;r<Mt;r++)for(let s=0;s<At;s++){s>=o&&s<o+e&&r>=0&&r<0+i&&(t[r*At+s]=1)}this._grid=t}_mapTargetToPercent(t){if(this._roomWidth>0&&this._roomDepth>0){const e=Math.max(0,Math.min(t.x,this._roomWidth)),i=Math.max(0,Math.min(t.y,this._roomDepth));return{x:e/this._roomWidth*100,y:i/this._roomDepth*100}}return{x:t.x/Pt*100,y:t.y/Pt*100}}_getGridRoomMetrics(){const t=this._getRawRoomBounds();if(t.minCol>t.maxCol)return null;const e=t.maxCol-t.minCol+1,i=t.maxRow-t.minRow+1,o=e*Et,r=i*Et,s=(t.minCol+t.maxCol)/2,n=t.minRow;let a=0;for(let t=0;t<Tt;t++){if(!bt(this._grid[t]))continue;const e=t%At+.5,i=Math.floor(t/At)+.5,o=(e-s)*Et,r=(i-n)*Et,l=o*o+r*r;l>a&&(a=l)}return{widthM:(o/1e3).toFixed(1),depthM:(r/1e3).toFixed(1),furthestM:(Math.sqrt(a)/1e3).toFixed(1)}}_getRawRoomBounds(){let t=At,e=0,i=Mt,o=0;for(let r=0;r<Tt;r++)if(bt(this._grid[r])){const s=r%At,n=Math.floor(r/At);s<t&&(t=s),s>e&&(e=s),n<i&&(i=n),n>o&&(o=n)}return{minCol:t,maxCol:e,minRow:i,maxRow:o}}_mapTargetToGridCell(t){if(this._roomWidth<=0||this._roomDepth<=0)return null;const e=Math.ceil(this._roomWidth/Et),i=Math.floor((At-e)/2),o=this._getRawRoomBounds(),r=(o.minCol-i)*Et,s=(o.maxCol-i+1)*Et,n=(o.maxRow+1)*Et,a=Math.max(r,Math.min(t.x,s)),l=Math.max(0,Math.min(t.y,n));return{col:i+a/Et,row:l/Et}}_guardNavigation(t){this._dirty?(this._pendingNavigation=t,this._showUnsavedDialog=!0):t()}_discardAndNavigate(){this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation&&(this._pendingNavigation(),this._pendingNavigation=null)}async _onDeviceChange(t){const e=t.target.value;this._guardNavigation(async()=>{this._unsubscribeTargets(),this._selectedEntryId=e,localStorage.setItem("epp_selected_entry",e),await this._loadEntryConfig(e)})}_getSmoothedRaw(){const t=this._targets.find(t=>t.active);if(!t)return null;const e=Date.now();for(this._smoothBuffer.push({x:t.raw_x,y:t.raw_y,t:e});this._smoothBuffer.length>0&&e-this._smoothBuffer[0].t>1e3;)this._smoothBuffer.shift();if(0===this._smoothBuffer.length)return{x:t.raw_x,y:t.raw_y};const i=t=>{const e=t.slice().sort((t,e)=>t-e),i=Math.floor(e.length/2);return e.length%2?e[i]:(e[i-1]+e[i])/2};return{x:i(this._smoothBuffer.map(t=>t.x)),y:i(this._smoothBuffer.map(t=>t.y))}}_wizardStartCapture(){const t=this._targets.find(t=>t.active);if(!t)return;this._wizardCapturing=!0,this._wizardCaptureProgress=0;const e=[],i=Date.now(),o=()=>{const t=Date.now()-i;this._wizardCaptureProgress=Math.min(t/5e3,1);const r=this._targets.find(t=>t.active);if(r&&e.push({x:r.raw_x,y:r.raw_y}),t<5e3)return void requestAnimationFrame(o);if(this._wizardCapturing=!1,0===e.length)return;const s=e.map(t=>t.x).sort((t,e)=>t-e),n=e.map(t=>t.y).sort((t,e)=>t-e),a=Math.floor(e.length/2),l=e.length%2?s[a]:(s[a-1]+s[a])/2,d=e.length%2?n[a]:(n[a-1]+n[a])/2,c=this._wizardCornerIndex;this._wizardCorners=[...this._wizardCorners],this._wizardCorners[c]={raw_x:l,raw_y:d,offset_side:0,offset_fb:0},c<3&&(this._wizardCornerIndex=c+1),this._wizardCorners.every(t=>null!==t)&&(this._autoComputeRoomDimensions(),this._computeWizardPerspective(),this._wizardFinish())};requestAnimationFrame(o)}_autoComputeRoomDimensions(){const t=this._wizardCorners,e=(t,e)=>Math.sqrt((t.raw_x-e.raw_x)**2+(t.raw_y-e.raw_y)**2);this._wizardRoomWidth=Math.round(e(t[0],t[1]));const i=e(t[0],t[3]),o=e(t[1],t[2]);this._wizardRoomDepth=Math.round((i+o)/2)}_solvePerspective(t,e){const i=[],o=[];for(let r=0;r<4;r++){const s=t[r].x,n=t[r].y,a=e[r].x,l=e[r].y;i.push([s,n,1,0,0,0,-s*a,-n*a]),o.push(a),i.push([0,0,0,s,n,1,-s*l,-n*l]),o.push(l)}const r=i.map((t,e)=>[...t,o[e]]);for(let t=0;t<8;t++){let e=Math.abs(r[t][t]),i=t;for(let o=t+1;o<8;o++)Math.abs(r[o][t])>e&&(e=Math.abs(r[o][t]),i=o);if(e<1e-12)return null;[r[t],r[i]]=[r[i],r[t]];for(let e=t+1;e<8;e++){const i=r[e][t]/r[t][t];for(let o=t;o<=8;o++)r[e][o]-=i*r[t][o]}}const s=new Array(8);for(let t=7;t>=0;t--){s[t]=r[t][8];for(let e=t+1;e<8;e++)s[t]-=r[t][e]*s[e];s[t]/=r[t][t]}return s}_computeWizardPerspective(){const t=this._wizardCorners;if(!t.every(t=>null!==t))return;const e=this._wizardRoomWidth,i=this._wizardRoomDepth,o=t.map(t=>({x:t.raw_x,y:t.raw_y})),r=[{x:t[0].offset_side,y:t[0].offset_fb},{x:e-t[1].offset_side,y:t[1].offset_fb},{x:e-t[2].offset_side,y:i-t[2].offset_fb},{x:t[3].offset_side,y:i-t[3].offset_fb}];this._perspective=this._solvePerspective(o,r),this._roomWidth=e,this._roomDepth=i}async _wizardFinish(){if(this._perspective){this._wizardSaving=!0;try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,perspective:this._perspective,room_width:this._wizardRoomWidth,room_depth:this._wizardRoomDepth}),this._roomWidth=this._wizardRoomWidth,this._roomDepth=this._wizardRoomDepth,this._initGridFromRoom(),this._setupStep=null,this._view="live"}finally{this._wizardSaving=!1}}}_rawToFovPct(t,e){const i=Rt.FOV_X_EXTENT;return{xPct:(t+i)/(2*i)*100,yPct:e/Pt*100}}_getWizardTargetStyle(t){const{xPct:e,yPct:i}=this._rawToFovPct(t.raw_x,t.raw_y);return`left: ${e}%; top: ${i}%;`}render(){return this._loading?O`<div class="loading-container">Loading...</div>`:this._entries.length?null!==this._setupStep?this._renderWizard():"settings"===this._view?this._renderSettings():"editor"===this._view&&this._perspective?this._renderEditor():O`
      ${this._renderLiveOverview()}
      ${this._showDeleteCalibrationDialog?O`
        <div class="template-dialog">
          <div class="template-dialog-card">
            <h3>Delete room calibration?</h3>
            <p class="overlay-help">This will also delete all detection zones and furniture. This cannot be undone.</p>
            <div class="template-dialog-actions">
              <button class="wizard-btn wizard-btn-back"
                @click=${()=>{this._showDeleteCalibrationDialog=!1}}
              >Cancel</button>
              <button class="wizard-btn wizard-btn-primary" style="background: var(--error-color, #f44336);"
                @click=${this._deleteCalibration}
              >Delete</button>
            </div>
          </div>
        </div>
      `:V}
    `:O`<div class="loading-container">Loading...</div>`}async _deleteCalibration(){this._showDeleteCalibrationDialog=!1,this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._grid=new Uint8Array(400),this._zoneConfigs=new Array(7).fill(null),this._furniture=[];try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,perspective:[0,0,0,0,0,0,0,0],room_width:0,room_depth:0}),await this.hass.callWS({type:"everything_presence_pro/set_room_layout",entry_id:this._selectedEntryId,grid_bytes:Array.from(this._grid),zone_slots:this._zoneConfigs.map(()=>null),room_sensitivity:1,furniture:[]})}catch(t){console.error("Failed to delete calibration",t)}this._dirty=!1,this._view="live"}_changePlacement(){this._guardNavigation(()=>{this._setupStep="guide",this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardRoomWidth=this._roomWidth,this._wizardRoomDepth=this._roomDepth})}_renderHeader(){const t=V;return O`
      <div class="panel-header">
        <select
          class="device-select"
          .value=${this._selectedEntryId}
          @change=${t=>{if("__add__"===t.target.value)return window.open("/config/integrations/integration/everything_presence_pro","_blank"),void(t.target.value=this._selectedEntryId);this._onDeviceChange(t)}}
        >
          ${this._entries.map(t=>O`
              <option value=${t.entry_id}>
                ${t.title}${t.room_name?` — ${t.room_name}`:""}
              </option>
            `)}
          <option value="__add__">+ Add another sensor</option>
        </select>
        ${t}
      </div>
    `}_renderWizard(){let t;switch(this._setupStep){case"guide":t=this._renderWizardGuide();break;case"corners":t=this._renderWizardCorners()}return O`
      <div class="wizard-container">
        ${this._renderHeader()} ${t}
        ${this._wizardCapturing?O`
          <div class="capture-overlay">
            <div class="capture-overlay-content">
              <div class="capture-progress" style="width: 200px;">
                <div class="capture-bar">
                  <div class="capture-fill" style="width: ${100*this._wizardCaptureProgress}%"></div>
                </div>
                <span>Recording... ${Math.round(5*this._wizardCaptureProgress)}s / ${5}s</span>
              </div>
              <p style="margin: 8px 0 0; font-size: 13px; color: var(--secondary-text-color);">Stand still</p>
            </div>
          </div>
        `:V}
      </div>
    `}_renderWizardGuide(){const t=(t,e,i=!1,o=0)=>Z`
      <g transform="translate(${t}, ${e}) rotate(${o}) scale(${i?-.7:.7}, 0.7)">
        <circle cx="0" cy="-12" r="4" fill="var(--primary-color, #03a9f4)"/>
        <line x1="0" y1="-8" x2="0" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="-4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="-5" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="5" y2="-1" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
      </g>
    `,e=(t,e,i,o)=>{const r=i-t,s=o-e,n=Math.sqrt(r*r+s*s),a=r/n,l=s/n,d=i-40*a,c=o-40*l;return Z`
        <line x1="${t+40*a}" y1="${e+40*l}" x2="${d}" y2="${c}" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <polygon points="${d},${c} ${d-8*a+4*l},${c-8*l-4*a} ${d-8*a-4*l},${c-8*l+4*a}" fill="var(--primary-color, #03a9f4)" opacity="0.5"/>
      `},i=50,o=55,r=290,s=55,n=290,a=225,l=50,d=235,c=98,p=225,h=Z`
      <svg viewBox="0 0 360 290" width="360" height="290" style="display: block; margin: 0 auto;">
        <!-- Room with rounded corners, soft fill -->
        <rect x="30" y="35" width="280" height="210" rx="8"
              fill="var(--secondary-background-color, #f5f5f5)"
              stroke="var(--divider-color, #d0d0d0)" stroke-width="2.5"/>

        <!-- Wall labels -->
        <text x="170" y="28" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">Front wall (sensor side)</text>
        <text x="170" y="262" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">Back wall</text>

        <!-- Arrows with walking figures: 1→2→3→4 -->
        ${e(i,o,r,s)}
        ${t(170,72)}
        ${e(r,s,n,a)}
        ${t(265,145,!1,90)}
        <!-- 3rd arrow flat from 3 to 4 badge, same gap as arrow 1 has from 2 -->
        ${e(n,a,c-15,a)}
        ${t(190,a-17,!0)}

        <!-- Corner 4 badge: same height as 3, just past arrow end -->
        <circle cx="${c}" cy="${p}" r="14" fill="#FF9800" opacity="0.15"/>
        <circle cx="${c}" cy="${p}" r="14" fill="none" stroke="#FF9800" stroke-width="2.5" stroke-dasharray="5 3"/>
        <text x="${c}" y="${p+5}" font-size="14" fill="#FF9800" font-weight="bold" text-anchor="middle">4</text>

        <!-- Pot plant in the corner (BL) -->
        <g transform="translate(${l+5}, ${d-5})">
          <!-- Pot -->
          <path d="M -12 -2 L -10 12 L 10 12 L 12 -2 Z" fill="#C68642" stroke="#A0522D" stroke-width="1.5"/>
          <rect x="-14" y="-5" width="28" height="5" rx="2" fill="#A0522D"/>
          <!-- Plant leaves -->
          <ellipse cx="0" cy="-18" rx="12" ry="10" fill="#66BB6A" stroke="#43A047" stroke-width="1"/>
          <ellipse cx="-10" cy="-12" rx="9" ry="7" fill="#81C784" stroke="#43A047" stroke-width="1"/>
          <ellipse cx="10" cy="-12" rx="9" ry="7" fill="#81C784" stroke="#43A047" stroke-width="1"/>
          <ellipse cx="-6" cy="-22" rx="7" ry="6" fill="#A5D6A7" stroke="#66BB6A" stroke-width="1"/>
          <ellipse cx="6" cy="-22" rx="7" ry="6" fill="#A5D6A7" stroke="#66BB6A" stroke-width="1"/>
        </g>

        <!-- Horizontal distance measure below the room -->
        <line x1="30" y1="${d+18}" x2="${c}" y2="${d+18}" stroke="#FF9800" stroke-width="1.5"/>
        <line x1="30" y1="${d+12}" x2="30" y2="${d+24}" stroke="#FF9800" stroke-width="1.5"/>
        <line x1="${c}" y1="${d+12}" x2="${c}" y2="${d+24}" stroke="#FF9800" stroke-width="1.5"/>
        <text x="${(30+c)/2}" y="${d+32}" font-size="9" fill="#FF9800" text-anchor="middle" font-weight="500">65cm</text>

        <!-- Corner 1: front-left -->
        <circle cx="${i}" cy="${o}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${i}" cy="${o}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${i}" y="${o+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">1</text>

        <!-- Corner 2: front-right (sensor here) -->
        <circle cx="${r}" cy="${s}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${r}" cy="${s}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${r}" y="${s+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">2</text>

        <!-- Corner 3: back-right -->
        <circle cx="${n}" cy="${a}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${n}" cy="${a}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${n}" y="${a+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">3</text>

        <!-- Sensor icon outside the top-right corner -->
        <g transform="translate(${r+18}, ${s-18}) rotate(-45)">
          <rect x="-5" y="-7" width="10" height="14" rx="3" fill="var(--primary-color, #03a9f4)"/>
          <circle cx="0" cy="-11" r="3.5" fill="var(--primary-color, #03a9f4)" opacity="0.4"/>
        </g>
        <text x="${r+24}" y="${s-24}" font-size="10" fill="var(--primary-color, #03a9f4)" font-weight="500">Sensor</text>
      </svg>
    `;return O`
      <div style="max-width: 560px; margin: 0 auto;">
        <div class="setting-group">
          <h4 style="text-align: center; margin-bottom: 16px;">How room calibration works</h4>

          ${h}

          <div style="display: flex; flex-direction: column; gap: 14px; padding: 16px 4px 0;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="min-width: 22px; height: 22px; border-radius: 50%; background: #4CAF50; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">1</div>
              <div style="font-size: 13px;">
                <strong>Walk to each corner</strong> in order (1 → 2 → 3 → 4) and click Mark. Stand still for a few seconds so the sensor can lock on.
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="min-width: 22px; height: 22px; border-radius: 50%; background: #FF9800; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">!</div>
              <div style="font-size: 13px;">
                <strong>Can't reach a corner?</strong> Stand as close as you can and enter the distance from each wall in the offset fields — like corner 4 in the diagram above, where a plant is in the way.
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 20px; color: var(--primary-color); flex-shrink: 0; margin-top: 1px;"></ha-icon>
              <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                Corner 2 is where your sensor is mounted. You can stand right under it.
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button class="wizard-btn wizard-btn-back"
            @click=${()=>{this._setupStep=null}}
          >Cancel</button>
          <button class="wizard-btn wizard-btn-primary"
            @click=${()=>{this._setupStep="corners"}}
          >Begin marking corners</button>
        </div>
      </div>
    `}_renderWizardCorners(){const t=this._wizardCornerIndex,e=this._targets.filter(t=>t.active),i=e.length>0,o=e.length>1,r=this._wizardCorners.every(t=>null!==t),s=Ct[t]||"",[n,a]=St[t]||["",""];return O`
      <div class="wizard-card">
        <h2>Calibrate room size</h2>
        <p>
          Walk to each corner of the room and click Mark. The sensor will
          record your position over ${5} seconds.
        </p>

        ${r?V:O`
            <p class="corner-instruction">
              <strong>Corner ${t+1}/4:</strong> Walk to the
              <strong>${s.toLowerCase()}</strong> corner.
            </p>
        `}

        <div class="corner-progress">
          ${Ct.map((e,i)=>{const o=!!this._wizardCorners[i];return O`
                <span
                  class="corner-chip ${o?"done":""} ${i===t?"active":""}"
                  @click=${()=>{this._wizardCornerIndex=i}}
                >
                  ${e} ${o?"✓":""}
                </span>
                ${i<3?O`
                  <span class="corner-arrow ${i<t?"done":""}">›</span>
                `:V}
              `})}
        </div>

        ${r?V:O`

            <div class="corner-offsets" key="${t}">
              <span class="offset-label">Distance from:</span>
              <input
                type="number"
                class="offset-input"
                min="0"
                step="1"
                placeholder="${n} (cm)"
                .value=${this._wizardCorners[t]?.offset_side?String(this._wizardCorners[t].offset_side/10):""}
                @change=${e=>{const i=10*(parseFloat(e.target.value)||0),o=this._wizardCorners[t];o&&(o.offset_side=i)}}
              />
              <input
                type="number"
                class="offset-input"
                min="0"
                step="1"
                placeholder="${a} (cm)"
                .value=${this._wizardCorners[t]?.offset_fb?String(this._wizardCorners[t].offset_fb/10):""}
                @change=${e=>{const i=10*(parseFloat(e.target.value)||0),o=this._wizardCorners[t];o&&(o.offset_fb=i)}}
              />
            </div>

            ${this._renderMiniSensorView()}

            ${i?o?O`<p class="no-target-warning">
                  Multiple targets detected. Only one person should be in the room during calibration.
                </p>`:V:O`<p class="no-target-warning">
                  No target detected. Make sure you are visible to the sensor.
                </p>`}

            <div class="wizard-actions">
              <button
                class="wizard-btn wizard-btn-back"
                @click=${()=>{this._setupStep=null}}
              >Cancel</button>
              <button
                class="wizard-btn wizard-btn-primary"
                ?disabled=${!i||o||this._wizardCapturing}
                @click=${()=>this._wizardStartCapture()}
              >
                Mark ${s}
              </button>
            </div>
          `}
      </div>
    `}_renderMiniSensorView(){const t=Rt.FOV_X_EXTENT,e=Pt,i=200,o=-t,r=e*Math.cos(Rt.FOV_HALF_ANGLE),s=`M 0 0 L ${o} ${r} A 6000 6000 0 0 0 ${t} ${r} Z`,n=[2e3,4e3].map(t=>{const e=t*Math.sin(Rt.FOV_HALF_ANGLE),i=t*Math.cos(Rt.FOV_HALF_ANGLE);return`M ${-e} ${i} A ${t} ${t} 0 0 0 ${e} ${i}`});return O`
      <div class="mini-grid-container">
        <div class="sensor-fov-view">
          <svg
            class="sensor-fov-svg"
            viewBox="${-t-i} ${-200} ${2*t+400} ${6400}"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="${s}"
              fill="rgba(3, 169, 244, 0.10)"
              stroke="rgba(3, 169, 244, 0.3)"
              stroke-width="30"
            />
            ${n.map(t=>Z`
                <path
                  d="${t}"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  stroke-width="40"
                  stroke-dasharray="80 80"
                />
              `)}
            <!-- Sensor dot -->
            <circle cx="0" cy="0" r="100" fill="var(--primary-color, #03a9f4)" stroke="#fff" stroke-width="40" />
          </svg>
          <!-- Marked corners (positioned via CSS %) -->
          ${this._wizardCorners.filter(t=>null!==t).map((t,e)=>{const{xPct:i,yPct:o}=this._rawToFovPct(t.raw_x,t.raw_y);return O`
                <div
                  class="mini-grid-captured"
                  style="left: ${i}%; top: ${o}%;"
                  title="${Ct[e]}"
                ></div>
              `})}
          <!-- Live targets (per-target colors) -->
          ${this._targets.map((t,e)=>t.active?O`
              <div
                class="mini-grid-target"
                style="${this._getWizardTargetStyle(t)} background: ${Dt[e]||Dt[0]};"
              ></div>
            `:V)}
        </div>
      </div>
    `}_renderSaveCancelButtons(){const t="settings"===this._view?this._saveSettings:this._applyLayout;return O`
      <div class="save-cancel-bar">
        <button class="wizard-btn wizard-btn-back"
          @click=${()=>{this._dirty=!1,this._view="live",this._loadEntryConfig(this._selectedEntryId)}}
        >Cancel</button>
        <button class="wizard-btn wizard-btn-primary"
          ?disabled=${this._saving||!this._dirty}
          @click=${t}
        >${this._saving?"Saving...":"Save"}</button>
      </div>
    `}_renderLiveOverview(){return O`
      <div class="panel">
        ${this._renderHeader()}
        <div class="editor-layout">
          <div style="flex: 1; min-width: 0;">
            ${V}
            <div class="grid-container">
              ${this._perspective?this._renderLiveGrid():this._renderUncalibratedFov()}
            </div>
          </div>
          <div class="zone-sidebar">
            <div class="sidebar-header">
              <span class="sidebar-title">Live overview</span>
              <div class="sidebar-menu-wrapper">
                <button class="sidebar-menu-btn" @click=${()=>{this._showLiveMenu=!this._showLiveMenu}}>
                  <ha-icon icon="mdi:dots-vertical" style="--mdc-icon-size: 20px;"></ha-icon>
                </button>
                ${this._showLiveMenu?O`
                  <div class="sidebar-menu" @click=${()=>{this._showLiveMenu=!1}}>
                    ${this._perspective?O`
                      <button class="sidebar-menu-item" @click=${()=>{this._view="editor",this._sidebarTab="zones"}}>
                        <ha-icon icon="mdi:vector-square" style="--mdc-icon-size: 18px;"></ha-icon> Detection zones
                      </button>
                      <button class="sidebar-menu-item" @click=${()=>{this._view="editor",this._sidebarTab="furniture"}}>
                        <ha-icon icon="mdi:sofa" style="--mdc-icon-size: 18px;"></ha-icon> Furniture
                      </button>
                    `:V}
                    <button class="sidebar-menu-item" @click=${()=>{this._view="settings"}}>
                      <ha-icon icon="mdi:cog" style="--mdc-icon-size: 18px;"></ha-icon> Settings
                    </button>
                    <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 4px 0;"/>
                    <button class="sidebar-menu-item" @click=${this._changePlacement}>
                      <ha-icon icon="mdi:target" style="--mdc-icon-size: 18px;"></ha-icon> Room size calibration
                    </button>
                    ${this._perspective?O`
                      <button class="sidebar-menu-item" style="color: var(--error-color, #f44336);" @click=${()=>{this._showDeleteCalibrationDialog=!0}}>
                        <ha-icon icon="mdi:delete" style="--mdc-icon-size: 18px;"></ha-icon> Delete room calibration
                      </button>
                    `:V}
                    <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 4px 0;"/>
                    <button class="sidebar-menu-item" @click=${()=>{this._showTemplateSave=!0}}>
                      <ha-icon icon="mdi:content-save" style="--mdc-icon-size: 18px;"></ha-icon> Save template
                    </button>
                    <button class="sidebar-menu-item" @click=${()=>{this._showTemplateLoad=!0}}>
                      <ha-icon icon="mdi:folder-open" style="--mdc-icon-size: 18px;"></ha-icon> Load template
                    </button>
                  </div>
                `:V}
              </div>
            </div>
            ${this._renderLiveSidebar()}
          </div>
        </div>
      </div>
    `}_renderLiveGrid(){const t=this._getRoomBounds(),e=t.minCol>t.maxCol,i=e?0:t.minCol,o=e?19:t.maxCol,r=e?0:t.minRow,s=e?19:t.maxRow,n=o-i+1,a=s-r+1,l=Math.min(480,.55*(this.offsetWidth||800)),d=Math.min(Math.floor(l/n),Math.floor(l/a),32);return O`
      <div
        class="grid"
        style="grid-template-columns: repeat(${n}, ${d}px); grid-template-rows: repeat(${a}, ${d}px);"
      >
        ${this._renderVisibleCells(i,o,r,s,d)}
      </div>
      ${this._renderFurnitureOverlay(d,i,r,n,a)}
      <div class="targets-overlay" style="pointer-events: none;">
        ${this._targets.map((t,e)=>{if(!t.active)return V;const o=this._mapTargetToGridCell(t);if(!o)return V;const s=(o.col-i)/n*100,l=(o.row-r)/a*100;return O`
            <div
              class="target-dot"
              style="left: ${s}%; top: ${l}%; background: ${Dt[e]||Dt[0]};"
            ></div>
          `})}
      </div>
      ${this._renderGridDimensions()}
    `}_renderGridDimensions(){const t=this._getGridRoomMetrics();return t?O`
      <div class="grid-dimensions">
        ${t.widthM}m × ${t.depthM}m · Furthest point: ${t.furthestM}m
      </div>
    `:V}_renderUncalibratedFov(){const t=this._sensorState.occupancy,e=t?"#4CAF50":"var(--primary-color, #03a9f4)",i=150,o=10,r=180,s=30*Math.PI/180,n=150*Math.PI/180,a=i+r*Math.cos(s),l=o+r*Math.sin(s),d=i+r*Math.cos(n),c=o+r*Math.sin(n);return O`
      <div style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
        <svg viewBox="0 0 300 210" width="300" height="210" style="display: block;">
          <!-- Sensor at top center -->
          <rect x="${144}" y="0" width="12" height="8" rx="3" fill="${e}"/>
          <circle cx="${i}" cy="0" r="4" fill="${e}" opacity="0.4"/>

          <!-- 120° FOV wedge with rounded arc end -->
          <path d="M ${i} ${o} L ${a} ${l} A ${r} ${r} 0 0 1 ${d} ${c} Z"
                fill="${e}" fill-opacity="${t?.15:.06}"
                stroke="${e}" stroke-width="1" stroke-opacity="0.2"/>

          <!-- Range arcs -->
          ${[60,120,180].map(t=>{const r=i+t*Math.cos(s),a=o+t*Math.sin(s),l=i+t*Math.cos(n),d=o+t*Math.sin(n);return Z`
              <path d="M ${r} ${a} A ${t} ${t} 0 0 1 ${l} ${d}"
                    fill="none" stroke="${e}" stroke-width="1"
                    stroke-dasharray="4 3" opacity="0.2"/>
            `})}

          <!-- Edge lines -->
          <line x1="${i}" y1="${o}" x2="${a}" y2="${l}" stroke="${e}" stroke-width="0.5" opacity="0.2"/>
          <line x1="${i}" y1="${o}" x2="${d}" y2="${c}" stroke="${e}" stroke-width="0.5" opacity="0.2"/>

          <!-- Target dots -->
          ${this._targets.map((t,e)=>{if(!t.active)return V;const s=Math.sqrt(t.raw_x*t.raw_x+t.raw_y*t.raw_y),n=Math.atan2(t.raw_x,t.raw_y),a=Math.min(s/6e3,1)*r,l=Math.PI/2+n,d=i+a*Math.cos(l),c=o+a*Math.sin(l);return Z`<circle cx="${d}" cy="${c}" r="5" fill="${Dt[e]||Dt[0]}"/>`})}

          ${t?Z`
            <text x="${i}" y="120" font-size="13" fill="${e}" text-anchor="middle" font-weight="500">Detected</text>
          `:Z`
            <text x="${i}" y="120" font-size="13" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">No presence</text>
          `}
        </svg>

        <button
          class="live-nav-link" style="margin-top: 16px;"
          @click=${()=>{this._setupStep="guide",this._view="live"}}
        >
          <ha-icon icon="mdi:target" style="--mdc-icon-size: 16px;"></ha-icon>
          Calibrate room size
        </button>
      </div>
    `}_renderNeedsCalibration(){const t=Z`
      <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
        <!-- Floor and wall -->
        <line x1="20" y1="150" x2="180" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <line x1="20" y1="10" x2="20" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <!-- Person outline -->
        <circle cx="130" cy="50" r="10" fill="none" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="60" x2="130" y2="105" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="105" x2="118" y2="148" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="105" x2="142" y2="148" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="75" x2="115" y2="95" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <line x1="130" y1="75" x2="145" y2="95" stroke="var(--secondary-text-color, #888)" stroke-width="1.5"/>
        <!-- Sensor on wall -->
        <rect x="14" y="52" width="12" height="8" rx="2" fill="var(--primary-color, #03a9f4)"/>
        <!-- Height bracket -->
        <line x1="40" y1="56" x2="40" y2="150" stroke="var(--primary-color, #03a9f4)" stroke-width="1" stroke-dasharray="4 2"/>
        <line x1="36" y1="56" x2="44" y2="56" stroke="var(--primary-color, #03a9f4)" stroke-width="1.5"/>
        <line x1="36" y1="150" x2="44" y2="150" stroke="var(--primary-color, #03a9f4)" stroke-width="1.5"/>
        <text x="48" y="108" font-size="11" fill="var(--primary-color, #03a9f4)">1.5–2m</text>
        <!-- Detection cone -->
        <path d="M 26 56 L 100 30 L 100 82 Z" fill="var(--primary-color, #03a9f4)" opacity="0.1" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5"/>
      </svg>
    `,e=(()=>{const t=28,e=28,i=180,o=-15*Math.PI/180,r=105*Math.PI/180,s=t+i*Math.cos(o),n=e+i*Math.sin(o),a=t+i*Math.cos(r),l=e+i*Math.sin(r),d=(i,s)=>{const n=t+i*Math.cos(o),a=e+i*Math.sin(o),l=t+i*Math.cos(r),d=e+i*Math.sin(r),c=45*Math.PI/180,p=t+(i-10)*Math.cos(c),h=e+(i-10)*Math.sin(c);return Z`
          <path d="M ${n} ${a} A ${i} ${i} 0 0 1 ${l} ${d}"
                fill="none" stroke="var(--primary-color, #03a9f4)" stroke-width="1"
                stroke-dasharray="4 3" opacity="0.35" clip-path="url(#room-clip)"/>
          <text x="${p}" y="${h}" font-size="8" fill="var(--secondary-text-color, #aaa)"
                text-anchor="middle" clip-path="url(#room-clip)">${s}</text>
        `};return Z`
        <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
          <defs>
            <clipPath id="room-clip"><rect x="20" y="20" width="160" height="120"/></clipPath>
          </defs>
          <!-- Room outline -->
          <rect x="20" y="20" width="160" height="120" fill="none" stroke="var(--divider-color, #ccc)" stroke-width="2" rx="2"/>
          <!-- 120° FOV wedge clipped to room -->
          <path d="M ${t} ${e} L ${a} ${l} A ${i} ${i} 0 0 0 ${s} ${n} Z"
                fill="var(--primary-color, #03a9f4)" opacity="0.08"
                clip-path="url(#room-clip)"/>
          <!-- Cone edge lines -->
          <line x1="${t}" y1="${e}" x2="${s}" y2="${n}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <line x1="${t}" y1="${e}" x2="${a}" y2="${l}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <!-- Range arcs -->
          ${d(60,"2m")}
          ${d(120,"4m")}
          ${d(180,"")}
          <!-- Sensor dot -->
          <circle cx="${t}" cy="${e}" r="6" fill="var(--primary-color, #03a9f4)"/>
          <!-- Labels -->
          <text x="30" y="16" font-size="10" fill="var(--primary-color, #03a9f4)">Sensor</text>
          <text x="152" y="136" font-size="8" fill="var(--secondary-text-color, #aaa)" text-anchor="end">6m</text>
        </svg>
      `})(),i=Z`
      <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
        <!-- Wall -->
        <line x1="20" y1="10" x2="20" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <line x1="20" y1="150" x2="180" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <!-- Sensor -->
        <rect x="14" y="56" width="12" height="8" rx="2" fill="var(--primary-color, #03a9f4)"/>
        <!-- Correct: horizontal beam -->
        <line x1="26" y1="60" x2="170" y2="60" stroke="var(--primary-color, #03a9f4)" stroke-width="1.5"/>
        <polygon points="170,60 162,56 162,64" fill="var(--primary-color, #03a9f4)"/>
        <text x="70" y="52" font-size="10" fill="var(--primary-color, #03a9f4)">Horizontal ✓</text>
        <!-- Wrong: angled down -->
        <line x1="26" y1="60" x2="140" y2="140" stroke="var(--error-color, #f44336)" stroke-width="1" stroke-dasharray="4 2" opacity="0.6"/>
        <text x="90" y="118" font-size="10" fill="var(--error-color, #f44336)" opacity="0.7">Angled ✗</text>
        <!-- Wrong: angled up -->
        <line x1="26" y1="60" x2="120" y2="22" stroke="var(--error-color, #f44336)" stroke-width="1" stroke-dasharray="4 2" opacity="0.6"/>
        <text x="75" y="18" font-size="10" fill="var(--error-color, #f44336)" opacity="0.7">Angled ✗</text>
      </svg>
    `;return O`
      <div class="panel">
        ${this._renderHeader()}
        <div style="max-width: 560px; margin: 0 auto; padding: 0 24px;">
          <div class="setting-group">
            <h4>How to position your sensor</h4>
            <div style="display: flex; flex-direction: column; gap: 20px; padding: 8px 0;">

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${t}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">Mount height</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    Place the sensor <strong>1.5 to 2 meters</strong> from the floor
                  </div>
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 0;"/>

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${e}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">Placement</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    Place in a <strong>corner or on a wall</strong>, pointing toward the most distant opposite corner
                  </div>
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 0;"/>

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${i}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">Beam direction</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    Keep the beam <strong>horizontal</strong> — not angled up or down
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <button
              class="wizard-btn wizard-btn-primary"
              @click=${()=>{this._setupStep="guide"}}
            >
              Start room size calibration
            </button>
          </div>
        </div>
      </div>
    `}_toggleAccordion(t){const e=new Set(this._openAccordions);e.has(t)?e.delete(t):e.add(t),this._openAccordions=e}_autoDetectionRange(){const t=Math.max(this._roomWidth,this._roomDepth);if(t<=0)return 0;const e=t/1e3;return Math.ceil(2*e)/2}_renderSettings(){return O`
      <div class="panel">
        ${this._renderHeader()}
        <div class="settings-container" @input=${()=>{this._dirty=!0}} @change=${()=>{this._dirty=!0}}>
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500;">Settings</h2>
          ${[{id:"detection",label:"Detection Ranges",icon:"mdi:signal-distance-variant"},{id:"sensitivity",label:"Sensor Calibration",icon:"mdi:tune-vertical"},{id:"reporting",label:"Entities",icon:"mdi:format-list-checks"}].map(t=>{const e=this._openAccordions.has(t.id);return O`
              <div class="accordion">
                <button class="accordion-header" ?data-open=${e} @click=${()=>this._toggleAccordion(t.id)}>
                  <ha-icon icon=${t.icon}></ha-icon>
                  <span class="accordion-title">${t.label}</span>
                  <ha-icon class="accordion-chevron" icon="mdi:chevron-down" ?data-open=${e}></ha-icon>
                </button>
                ${e?O`
                  <div class="accordion-body">
                    ${this._renderSettingsSection(t.id)}
                  </div>
                `:V}
              </div>
            `})}
          ${this._renderSaveCancelButtons()}
        </div>
      </div>
    `}_renderSettingsSection(t){switch(t){case"detection":return this._renderDetectionRanges();case"sensitivity":return this._renderSensitivities();case"reporting":return this._renderReporting();default:return V}}_infoTip(t){return O`<span class="setting-info"
      @click=${t=>{t.stopPropagation();const e=t.currentTarget,i=e.querySelector(".setting-info-tooltip");if(!i)return;const o="block"===i.style.display;if(this.shadowRoot.querySelectorAll(".setting-info-tooltip").forEach(t=>{t.style.display="none"}),o)return;const r=e.getBoundingClientRect();i.style.display="block",i.style.left=`${Math.max(8,Math.min(r.right-240,window.innerWidth-256))}px`,i.style.top=`${r.bottom+6}px`}}
    ><ha-icon icon="mdi:help-circle-outline"></ha-icon><span class="setting-info-tooltip">${t}</span></span>`}_renderDetectionRanges(){const t=this._autoDetectionRange(),e=this._getGridRoomMetrics();return O`
      <div class="settings-section">
        ${e?O`<p style="font-size: 13px; color: var(--secondary-text-color, #757575); margin: 0 0 12px;">Current furthest point from sensor: <strong style="color: var(--error-color, #e53935);">${e.furthestM}m</strong></p>`:V}
        <div class="setting-group">
          <h4>Target Sensor</h4>
          <div class="setting-row">
            <label>Detection range</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(t)} min="0" max="6" step="0.1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">${t}</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Maximum detection distance for the target sensor. Auto-set from room dimensions.")}
          </div>
          <div class="setting-row">
            <label>Update rate</label>
            <span class="setting-input-unit">
              <select class="setting-input">
                <option value="5" selected>5 Hz (default)</option>
                <option value="10">10 Hz (fast)</option>
                <option value="2">2 Hz (low power)</option>
              </select>
              <span class="setting-value"></span><span class="setting-unit"></span>
            </span>
            ${this._infoTip("How often the sensor reports target data.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Static Sensor</h4>
          <div class="setting-row">
            <label>Min distance</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="0" min="0" max="25" step="0.1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">0</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Minimum detection distance for the static sensor.")}
          </div>
          <div class="setting-row">
            <label>Max distance</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(t)} min="0" max="25" step="0.1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">${t}</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Maximum detection distance for the static sensor. Auto-set from room dimensions.")}
          </div>
          <div class="setting-row">
            <label>Trigger distance</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(t)} min="0" max="25" step="0.1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">${t}</span><span class="setting-unit">m</span></span>
            ${this._infoTip("Distance at which the static sensor triggers presence.")}
          </div>
        </div>
      </div>
    `}_renderSensitivities(){return O`
      <div class="settings-section">
        <div class="setting-group">
          <h4>Motion Sensor</h4>
          <div class="setting-row">
            <label>Presence timeout</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="5" min="0" max="120" step="1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">5</span><span class="setting-unit">s</span></span>
            ${this._infoTip("Time after last motion before the motion sensor clears.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Static Sensor</h4>
          <div class="setting-row">
            <label>Presence timeout</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="30" min="0" max="120" step="1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">30</span><span class="setting-unit">s</span></span>
            ${this._infoTip("Time after last static detection before the sensor clears.")}
          </div>
          <div class="setting-row">
            <label>Trigger sensitivity</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value="7" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">7</span><span class="setting-unit"></span></span>
            ${this._infoTip("How easily static presence is initially detected. Higher = more sensitive.")}
          </div>
          <div class="setting-row">
            <label>Sustain sensitivity</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value="5" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">5</span><span class="setting-unit"></span></span>
            ${this._infoTip("How easily static presence is sustained after initial detection. Higher = holds longer.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Target Sensor</h4>
          ${this._renderZoneTypeProfile("Entrance / Exit",5,1,1,!0)}
          ${this._renderZoneTypeProfile("Thoroughfare",3,1,1,!1)}
          ${this._renderZoneTypeProfile("Living area",15,3,3,!1)}
          ${this._renderZoneTypeProfile("Bed / Sofa",60,5,1,!1)}
        </div>
        <div class="setting-group">
          <h4>Environmental</h4>
          <div class="setting-row">
            <label>Illuminance offset</label>
            <span style="font-size: 12px; color: var(--secondary-text-color, #757575); width: 100%; order: 3;">Current reading: ${null!=this._sensorState.illuminance?`${this._sensorState.illuminance.toFixed(0)} lux`:"—"}</span>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="0" min="-500" max="500" step="1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">0</span> lux</span>
            ${this._infoTip("Adjust the illuminance reading by a fixed amount.")}
          </div>
          <div class="setting-row">
            <label>Humidity offset</label>
            <span style="font-size: 12px; color: var(--secondary-text-color, #757575); width: 100%; order: 3;">Current reading: ${null!=this._sensorState.humidity?`${this._sensorState.humidity.toFixed(1)}%`:"—"}</span>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="0" min="-50" max="50" step="0.1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">0</span> %</span>
            ${this._infoTip("Adjust the humidity reading by a fixed amount.")}
          </div>
          <div class="setting-row">
            <label>Temperature offset</label>
            <span style="font-size: 12px; color: var(--secondary-text-color, #757575); width: 100%; order: 3;">Current reading: ${null!=this._sensorState.temperature?`${this._sensorState.temperature.toFixed(1)} °C`:"—"}</span>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="0" min="-20" max="20" step="0.1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">0</span> °C</span>
            ${this._infoTip("Adjust the temperature reading by a fixed amount.")}
          </div>
        </div>
      </div>
    `}_renderZoneTypeProfile(t,e,i,o,r){return O`
      <div class="zone-type-group">
        <h5>${t}</h5>
        <div class="setting-row">
          <label>Presence timeout</label>
          <span class="setting-input-unit"><input type="range" class="setting-range" value=${e} min="0" max="120" step="1" @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">${e}</span><span class="setting-unit">s</span></span>
          ${this._infoTip("Time after last target detection in this zone type before presence clears.")}
        </div>
        <div class="setting-row">
          <label>Trigger sensitivity</label>
          <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value=${i} @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">${i}</span><span class="setting-unit"></span></span>
          ${this._infoTip("Consecutive frames needed to confirm target presence. Lower = more sensitive.")}
        </div>
        <div class="setting-row">
          <label>Sustain sensitivity</label>
          <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value=${o} @input=${t=>{const e=t.target;e.nextElementSibling.textContent=e.value}} /><span class="setting-value">${o}</span><span class="setting-unit"></span></span>
          ${this._infoTip("Consecutive empty frames needed before target is considered gone. Lower = clears faster.")}
        </div>
        <div class="setting-row">
          <label>Is portal</label>
          <span class="setting-input-unit"><span style="flex:1"></span><label class="toggle-switch"><input type="checkbox" ?checked=${r} /><span class="toggle-slider"></span></label><span class="setting-value"></span><span class="setting-unit"></span></span>
          ${this._infoTip("Enable if targets typically enter/leave through this zone (e.g. doorways).")}
        </div>
      </div>
    `}_renderReporting(){const t=this._reportingConfig||{},e=(e,i)=>t[e]??i;return O`
      <div class="settings-section">
        <div class="setting-group">
          <h4>Room level</h4>
          <div class="setting-row">
            <label>Occupancy</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_occupancy" ?checked=${e("room_occupancy",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Combined room occupancy from all sensors.")}
          </div>
          <div class="setting-row">
            <label>Static presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_static_presence" ?checked=${e("room_static_presence",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("mmWave static presence detection.")}
          </div>
          <div class="setting-row">
            <label>Motion presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_motion_presence" ?checked=${e("room_motion_presence",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("PIR motion detection.")}
          </div>
          <div class="setting-row">
            <label>Target presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_target_presence" ?checked=${e("room_target_presence",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Whether any target is actively tracked.")}
          </div>
          <div class="setting-row">
            <label>Target count</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_target_count" ?checked=${e("room_target_count",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Number of targets detected in the room.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Zone level</h4>
          <div class="setting-row">
            <label>Presence</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="zone_presence" ?checked=${e("zone_presence",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Per-zone occupancy based on target tracking.")}
          </div>
          <div class="setting-row">
            <label>Target count</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="zone_target_count" ?checked=${e("zone_target_count",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Number of targets in each zone.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Target level</h4>
          <div class="setting-row">
            <label>XY position, relative to sensor</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_xy_sensor" ?checked=${e("target_xy_sensor",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Raw XY coordinates from the sensor.")}
          </div>
          <div class="setting-row">
            <label>XY position, relative to grid</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_xy_grid" ?checked=${e("target_xy_grid",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("XY coordinates mapped to the room grid.")}
          </div>
          <div class="setting-row">
            <label>Active</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_active" ?checked=${e("target_active",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Whether each target slot is actively tracking.")}
          </div>
          <div class="setting-row">
            <label>Distance</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_distance" ?checked=${e("target_distance",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Distance from sensor to each target.")}
          </div>
          <div class="setting-row">
            <label>Angle</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_angle" ?checked=${e("target_angle",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Angle from sensor to each target.")}
          </div>
          <div class="setting-row">
            <label>Speed</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_speed" ?checked=${e("target_speed",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Movement speed of each target.")}
          </div>
          <div class="setting-row">
            <label>Resolution</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_resolution" ?checked=${e("target_resolution",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("Detection resolution for each target.")}
          </div>
        </div>
        <div class="setting-group">
          <h4>Environmental</h4>
          <div class="setting-row">
            <label>Illuminance</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_illuminance" ?checked=${e("env_illuminance",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("BH1750 illuminance sensor.")}
          </div>
          <div class="setting-row">
            <label>Humidity</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_humidity" ?checked=${e("env_humidity",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("SHTC3 humidity sensor.")}
          </div>
          <div class="setting-row">
            <label>Temperature</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_temperature" ?checked=${e("env_temperature",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("SHTC3 temperature sensor.")}
          </div>
          <div class="setting-row">
            <label>CO₂</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_co2" ?checked=${e("env_co2",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip("SCD40 CO₂ sensor (optional module).")}
          </div>
        </div>
      </div>
    `}_renderEditor(){const t=this._frozenBounds??this._getRoomBounds(),e=t.minCol>t.maxCol,i=e?0:t.minCol,o=e?19:t.maxCol,r=e?0:t.minRow,s=e?19:t.maxRow,n=o-i+1,a=s-r+1,l=Math.min(520,.55*(this.offsetWidth||800)),d=Math.min(32,Math.floor(l/n),Math.floor(l/a));return O`
      <div class="panel" @click=${t=>{const e=t.target;e.closest(".grid")||e.closest(".zone-sidebar")||(this._activeZone=null)}}>
        ${this._renderHeader()}

        <div class="editor-layout">
          <div style="flex: 1; min-width: 0;">
            ${V}
            <!-- Grid -->
            <div class="grid-container" @click=${t=>{t.target.closest(".furniture-item")||(this._selectedFurnitureId=null)}}>
            <div
              class="grid"
              style="grid-template-columns: repeat(${n}, ${d}px); grid-template-rows: repeat(${a}, ${d}px);"
              @mouseup=${this._onCellMouseUp}
              @mouseleave=${this._onCellMouseUp}
            >
              ${this._renderVisibleCells(i,o,r,s,d)}
            </div>
            ${this._renderFurnitureOverlay(d,i,r,n,a)}
            <div class="targets-overlay" style="pointer-events: none;">
              ${this._targets.map((t,e)=>{if(!t.active)return V;const o=this._mapTargetToGridCell(t);if(!o)return V;const s=(o.col-i)/n*100,l=(o.row-r)/a*100;return O`
                    <div
                      class="target-dot"
                      style="left: ${s}%; top: ${l}%; background: ${Dt[e]||Dt[0]};"
                    ></div>
                  `})}
            </div>
            ${this._renderGridDimensions()}
          </div>
          </div>

          <!-- Sidebar -->
          <div class="zone-sidebar">
            <div class="sidebar-title">${"furniture"===this._sidebarTab?"Furniture":"Detection zones"}</div>
            ${"zones"===this._sidebarTab?this._renderZoneSidebar():this._renderFurnitureSidebar()}
            ${this._renderSaveCancelButtons()}
          </div>
        </div>

        ${this._showTemplateSave?this._renderTemplateSaveDialog():V}
        ${this._showTemplateLoad?this._renderTemplateLoadDialog():V}
        ${this._showRenameDialog?O`
          <div class="template-dialog">
            <div class="template-dialog-card" style="max-width: 520px;">
              <h3>Update entity IDs?</h3>
              <p class="overlay-help">Zone names changed. Would you like to update the entity IDs to match?</p>
              <div style="max-height: 240px; overflow-y: auto; margin: 12px 0;">
                ${this._pendingRenames.map(t=>{const e=t.old_entity_id.split(".")[1]||t.old_entity_id,i=t.new_entity_id.split(".")[1]||t.new_entity_id,o=t.old_entity_id.split(".")[0]||"";return O`
                    <div style="
                      padding: 8px 12px; margin: 4px 0;
                      background: var(--secondary-background-color, #f5f5f5);
                      border-radius: 8px; font-size: 13px;
                    ">
                      <div style="color: var(--secondary-text-color, #888); font-size: 11px; margin-bottom: 2px;">
                        ${o}
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 12px;">
                        <span style="color: var(--secondary-text-color, #888); text-decoration: line-through;">${e}</span>
                        <span style="color: var(--secondary-text-color, #888);">→</span>
                        <span style="font-weight: 500;">${i}</span>
                      </div>
                    </div>
                  `})}
              </div>
              <div class="template-dialog-actions">
                <button class="wizard-btn wizard-btn-back"
                  @click=${this._dismissRenameDialog}
                >Skip</button>
                <button class="wizard-btn wizard-btn-primary"
                  @click=${this._applyRenames}
                >Rename</button>
              </div>
            </div>
          </div>
        `:V}
        ${this._showUnsavedDialog?O`
          <div class="template-dialog">
            <div class="template-dialog-card">
              <h3>You have unsaved changes</h3>
              <p class="overlay-help">Your changes will be lost if you navigate away without applying.</p>
              <div class="template-dialog-actions">
                <button class="wizard-btn wizard-btn-back"
                  @click=${()=>{this._showUnsavedDialog=!1,this._pendingNavigation=null}}
                >Cancel</button>
                <button class="wizard-btn wizard-btn-primary" style="background: var(--error-color, #f44336);"
                  @click=${this._discardAndNavigate}
                >Discard</button>
              </div>
            </div>
          </div>
        `:V}
      </div>
    `}_renderTemplateSaveDialog(){return O`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>Save template</h3>
          <input
            type="text"
            class="template-name-input"
            placeholder="Template name"
            .value=${this._templateName}
            @input=${t=>{this._templateName=t.target.value}}
          />
          <div class="template-dialog-actions">
            <button
              class="wizard-btn wizard-btn-back"
              @click=${()=>{this._showTemplateSave=!1}}
            >Cancel</button>
            <button
              class="wizard-btn wizard-btn-primary"
              ?disabled=${!this._templateName.trim()}
              @click=${()=>this._saveTemplate()}
            >Save</button>
          </div>
        </div>
      </div>
    `}_renderTemplateLoadDialog(){const t=this._getTemplates();return O`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>Load template</h3>
          ${0===t.length?O`<p class="overlay-help">No saved templates.</p>`:t.map(t=>O`
              <div class="template-item">
                <span class="template-item-name">${t.name}</span>
                <span class="template-item-size">${(t.roomWidth/1e3).toFixed(1)}m x ${(t.roomDepth/1e3).toFixed(1)}m</span>
                <button
                  class="wizard-btn wizard-btn-primary template-item-btn"
                  @click=${()=>this._loadTemplate(t.name)}
                >Load</button>
                <button
                  class="zone-remove-btn"
                  @click=${()=>this._deleteTemplate(t.name)}
                >
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
            `)}
          <div class="template-dialog-actions">
            <button
              class="wizard-btn wizard-btn-back"
              @click=${()=>{this._showTemplateLoad=!1}}
            >Close</button>
          </div>
        </div>
      </div>
    `}_renderVisibleCells(t,e,i,o,r){const s=[];for(let n=i;n<=o;n++)for(let i=t;i<=e;i++){const t=n*At+i,e=this._getCellColor(t),o=this._getCellOverlayColor(t),a=o?`background: ${e}; width: ${r}px; height: ${r}px; outline: 2px solid ${o}; z-index: 1;`:`background: ${e}; width: ${r}px; height: ${r}px;`;s.push(O`
          <div
            class="cell"
            style=${a}
            @mousedown=${()=>this._onCellMouseDown(t)}
            @mouseenter=${()=>this._onCellMouseEnter(t)}
          ></div>
        `)}return s}_renderZoneSidebar(){return O`
      <!-- Boundary -->
      <div
        class="zone-item ${0===this._activeZone?"active":""}"
        @click=${()=>{this._activeZone=0}}
      >
        <div class="zone-item-row">
          <div class="zone-color-dot" style="background: #fff; border: 1px solid #ccc;"></div>
          <span class="zone-name">Boundary</span>
        </div>
        ${0===this._activeZone?O`
          <div class="zone-item-row zone-settings-row">
            <label class="zone-setting-label">Sensitivity</label>
            <select
              class="sensitivity-select"
              .value=${String(this._roomSensitivity)}
              @change=${t=>{this._roomSensitivity=parseInt(t.target.value)}}
              @click=${t=>t.stopPropagation()}
            >
              <option value="0">Low</option>
              <option value="1">Medium</option>
              <option value="2">High</option>
            </select>
          </div>
        `:V}
      </div>

      <!-- Entrance / exit overlay -->
      <div
        class="zone-item ${-1===this._activeZone?"active":""}"
        @click=${()=>{this._activeZone=-1}}
      >
        <div class="zone-item-row">
          <div class="zone-color-dot" style="background: #0FF;"></div>
          <span class="zone-name">Entrance / exit</span>
          <button
            class="zone-remove-btn"
            @click=${t=>{t.stopPropagation(),this._clearOverlay(2)}}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
      </div>

      <!-- Interference source overlay -->
      <div
        class="zone-item ${-2===this._activeZone?"active":""}"
        @click=${()=>{this._activeZone=-2}}
      >
        <div class="zone-item-row">
          <div class="zone-color-dot" style="background: #F00;"></div>
          <span class="zone-name">Interference source</span>
          <button
            class="zone-remove-btn"
            @click=${t=>{t.stopPropagation(),this._clearOverlay(3)}}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
      </div>

      <hr class="zone-separator"/>
      <div class="zone-scroll-area">
      <!-- Named zones 1..N -->
      ${this._zoneConfigs.map((t,e)=>{if(null===t)return V;const i=e+1;return O`
          <div
            class="zone-item ${this._activeZone===i?"active":""}"
            @click=${()=>{this._activeZone=i}}
          >
            <div class="zone-item-row">
              <div class="zone-color-dot" style="background: ${t.color};"></div>
              <input
                class="zone-name-input"
                type="text"
                .value=${t.name}
                @input=${i=>{const o=i.target.value,r=[...this._zoneConfigs];r[e]={...t,name:o},this._zoneConfigs=r}}
                @click=${t=>{t.stopPropagation(),this._activeZone=i}}
                @focus=${()=>{this._activeZone=i}}
              />
              <button
                class="zone-remove-btn"
                @click=${t=>{t.stopPropagation(),this._removeZone(i)}}
              >
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
            ${this._activeZone===i?O`
              <div class="zone-item-row zone-settings-row">
                <label class="zone-setting-label">Sensitivity</label>
                <select
                  class="sensitivity-select"
                  .value=${String(t.sensitivity)}
                  @change=${i=>{const o=parseInt(i.target.value),r=[...this._zoneConfigs];r[e]={...t,sensitivity:o},this._zoneConfigs=r}}
                  @click=${t=>t.stopPropagation()}
                >
                  <option value="0">Low</option>
                  <option value="1">Medium</option>
                  <option value="2">High</option>
                </select>
                <input
                  type="color"
                  class="zone-color-picker"
                  .value=${t.color}
                  @input=${i=>{const o=i.target.value,r=[...this._zoneConfigs];r[e]={...t,color:o},this._zoneConfigs=r}}
                  @click=${t=>t.stopPropagation()}
                />
              </div>
            `:V}
          </div>
        `})}

      ${this._zoneConfigs.some(t=>null===t)?O`
          <button class="add-zone-btn" @click=${this._addZone}>
            <ha-icon icon="mdi:plus"></ha-icon>
            Add zone
          </button>
        `:V}
      </div>
    `}_renderFurnitureOverlay(t,e,i,o,r){if(!this._furniture.length)return V;const s=Math.ceil(this._roomWidth/Et),n=Math.floor((At-s)/2),a=t+1,l="furniture"===this._sidebarTab;return O`
      <div class="furniture-overlay ${l?"":"non-interactive"}">
        ${this._furniture.map(o=>{const r=(n-e)*a+this._mmToPx(o.x,t),s=(0-i)*a+this._mmToPx(o.y,t),l=this._mmToPx(o.width,t),d=this._mmToPx(o.height,t),c=this._selectedFurnitureId===o.id;return O`
            <div
              class="furniture-item ${c?"selected":""}"
              data-id="${o.id}"
              style="
                left: ${r}px; top: ${s}px;
                width: ${l}px; height: ${d}px;
                transform: rotate(${o.rotation}deg);
              "
              @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"move")}
            >
              ${"svg"===o.type&&yt[o.icon]?Z`<svg viewBox="${yt[o.icon].viewBox}" preserveAspectRatio="none" class="furn-svg">
                    ${mt(yt[o.icon].content)}
                  </svg>`:O`<ha-icon icon="${o.icon}" style="--mdc-icon-size: ${.6*Math.min(l,d)}px;"></ha-icon>`}
              ${c?O`
                <!-- Resize handles -->
                <div class="furn-handle furn-handle-n" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","n")}></div>
                <div class="furn-handle furn-handle-s" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","s")}></div>
                <div class="furn-handle furn-handle-e" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","e")}></div>
                <div class="furn-handle furn-handle-w" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","w")}></div>
                <div class="furn-handle furn-handle-ne" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","ne")}></div>
                <div class="furn-handle furn-handle-nw" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","nw")}></div>
                <div class="furn-handle furn-handle-se" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","se")}></div>
                <div class="furn-handle furn-handle-sw" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"resize","sw")}></div>
                <!-- Rotate handle with stem -->
                <div class="furn-rotate-stem"></div>
                <div class="furn-rotate-handle" @pointerdown=${t=>this._onFurniturePointerDown(t,o.id,"rotate")}>
                  <ha-icon icon="mdi:rotate-right" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
                <!-- Delete button -->
                <div class="furn-delete-btn" @pointerdown=${t=>{t.stopPropagation(),this._removeFurniture(o.id)}}>
                  <ha-icon icon="mdi:close" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
              `:V}
            </div>
          `})}
      </div>
    `}_renderLiveSidebar(){const t=this._sensorState,e=this._zoneState,i=[{id:"occupancy",label:"Occupancy",on:t.occupancy,info:"Combined occupancy from all sources — PIR motion, static mmWave presence, and zone tracking. Shows detected if any source detects presence."},{id:"static",label:"Static presence",on:t.static_presence,info:"mmWave radar detects stationary people by measuring micro-movements like breathing. Works through furniture and blankets."},{id:"motion",label:"PIR motion",on:t.pir_motion,info:"Passive infrared sensor detects movement by sensing body heat. Fast response but only triggers on motion, not stationary presence."}];for(let t=0;t<7;t++){const o=this._zoneConfigs[t];if(!o)continue;const r=t+1,s=e.occupancy[r]??!1,n=e.target_counts[r]??0;i.push({id:`zone_${r}`,label:o.name,on:s,info:`Zone ${r} occupancy. Currently ${n} target${1!==n?"s":""} detected. Sensitivity determines how many consecutive frames are needed to confirm presence.`})}const o=[];null!==t.illuminance&&o.push({id:"illuminance",label:"Illuminance",value:`${t.illuminance.toFixed(1)} lux`}),null!==t.temperature&&o.push({id:"temperature",label:"Temperature",value:`${t.temperature.toFixed(1)} °C`}),null!==t.humidity&&o.push({id:"humidity",label:"Humidity",value:`${t.humidity.toFixed(1)} %`}),null!==t.co2&&o.push({id:"co2",label:"CO₂",value:`${Math.round(t.co2)} ppm`});const r=i.length>3;return O`
      <div style="padding: 8px 0;">
        <div class="live-section-header">Presence</div>
        ${i.slice(0,3).map(t=>O`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${t.on?"on":"off"}"></div>
            <span class="live-sensor-label">${t.label}</span>
            <span class="live-sensor-state ${t.on?"detected":""}">${t.on?"Detected":"Clear"}</span>
            <button class="live-sensor-info-btn"
              @click=${()=>{this._expandedSensorInfo=this._expandedSensorInfo===t.id?null:t.id}}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo===t.id?O`
            <div class="live-sensor-info-text">${t.info}</div>
          `:V}
        `)}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        <button class="live-section-header live-section-link" @click=${()=>{this._view="editor",this._sidebarTab="zones"}}>Detection zones</button>
        ${r?i.slice(3).map(t=>O`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${t.on?"on":"off"}"></div>
            <span class="live-sensor-label">${t.label}</span>
            <span class="live-sensor-state ${t.on?"detected":""}">${t.on?"Detected":"Clear"}</span>
            <button class="live-sensor-info-btn"
              @click=${()=>{this._expandedSensorInfo=this._expandedSensorInfo===t.id?null:t.id}}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo===t.id?O`
            <div class="live-sensor-info-text">${t.info}</div>
          `:V}
        `):O`
          <button class="live-nav-link" style="padding: 4px 12px;" @click=${()=>{this._view="editor",this._sidebarTab="zones"}}>
            <ha-icon icon="mdi:plus" style="--mdc-icon-size: 16px;"></ha-icon>
            Add zones
          </button>
        `}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        ${o.length?O`
          <div class="live-section-header">Environment</div>
          ${o.map(t=>O`
            <div class="live-sensor-row">
              <span class="live-sensor-label">${t.label}</span>
              <span class="live-sensor-value">${t.value}</span>
            </div>
          `)}
        `:V}

      </div>
    `}_renderFurnitureSidebar(){const t=this._furniture.find(t=>t.id===this._selectedFurnitureId);return O`
      ${t?O`
        <div class="furn-selected-info">
          <div class="zone-item-row">
            <ha-icon icon="${t.icon}" style="--mdc-icon-size: 20px;"></ha-icon>
            <strong>${t.label}</strong>
            <button class="zone-remove-btn" @click=${()=>this._removeFurniture(t.id)}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="furn-dims">
            <label>
              W (mm)
              <input type="number" min="100" step="50" .value=${String(Math.round(t.width))}
                @change=${e=>this._updateFurniture(t.id,{width:parseInt(e.target.value)})}
              />
            </label>
            <label>
              H (mm)
              <input type="number" min="100" step="50" .value=${String(Math.round(t.height))}
                @change=${e=>this._updateFurniture(t.id,{height:parseInt(e.target.value)})}
              />
            </label>
            <label>
              Rot
              <input type="number" step="5" .value=${String(Math.round(t.rotation))}
                @change=${e=>this._updateFurniture(t.id,{rotation:parseInt(e.target.value)%360})}
              />
            </label>
          </div>
        </div>
      `:V}

      <div class="furn-catalog">
        ${_t.map(t=>O`
          <button class="furn-sticker" @click=${()=>this._addFurniture(t)}>
            ${"svg"===t.type&&yt[t.icon]?Z`<svg viewBox="${yt[t.icon].viewBox}" class="furn-sticker-svg">
                  ${mt(yt[t.icon].content)}
                </svg>`:O`<ha-icon icon="${t.icon}" style="--mdc-icon-size: 24px;"></ha-icon>`}
            <span>${t.label}</span>
          </button>
        `)}
        <button class="furn-sticker furn-custom" @click=${()=>{this._showCustomIconPicker=!this._showCustomIconPicker}}>
          <ha-icon icon="mdi:plus" style="--mdc-icon-size: 24px;"></ha-icon>
          <span>Custom icon</span>
        </button>
      </div>
      ${this._showCustomIconPicker?O`
        <div class="template-dialog">
          <div class="template-dialog-card">
            <h3>Custom icon</h3>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._customIconValue}
              @value-changed=${t=>{this._customIconValue=t.detail.value||""}}
            ></ha-icon-picker>
            ${this._customIconValue.trim()?O`
              <div style="text-align: center;">
                <ha-icon icon="${this._customIconValue.trim()}" style="--mdc-icon-size: 48px;"></ha-icon>
              </div>
            `:V}
            <div class="template-dialog-actions">
              <button class="wizard-btn wizard-btn-back"
                @click=${()=>{this._showCustomIconPicker=!1,this._customIconValue=""}}
              >Cancel</button>
              <button class="wizard-btn wizard-btn-primary"
                ?disabled=${!this._customIconValue.trim()}
                @click=${()=>{this._addCustomFurniture(this._customIconValue.trim()),this._customIconValue="",this._showCustomIconPicker=!1}}
              >Add</button>
            </div>
          </div>
        </div>
      `:V}
    `}}Rt.FOV_HALF_ANGLE=Math.PI/3,Rt.FOV_X_EXTENT=Pt*Math.sin(Math.PI/3),Rt.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new s(i,t,o)})`
    :host {
      display: flex;
      height: 100%;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #212121);
      font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
    }

    .panel {
      padding: 24px;
      max-width: 1100px;
      margin: 0 auto;
      font-size: 14px;
    }

    .mode-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
    }

    .mode-tab {
      padding: 8px 18px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .mode-tab:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .mode-tab.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border-color: var(--primary-color, #03a9f4);
    }

    .mode-tab.apply-btn {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border-color: var(--primary-color, #03a9f4);
    }

    .mode-tab.apply-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .editor-layout {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .grid-container {
      position: relative;
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
    }

    .grid {
      display: grid;
      gap: 1px;
      background: var(--divider-color, #e0e0e0);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      user-select: none;
    }

    .cell {
      cursor: pointer;
      transition: opacity 0.1s;
    }

    .cell:hover {
      opacity: 0.75;
    }

    .overlay-help {
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      margin: 0;
    }

    .zone-name-input {
      flex: 1;
      border: none;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      background: transparent;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      padding: 2px 4px;
      min-width: 0;
    }

    .zone-name-input:focus {
      outline: none;
      border-bottom: 1px solid var(--primary-color, #03a9f4);
    }

    .template-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .template-dialog-card {
      background: var(--card-background-color, #fff);
      border-radius: 16px;
      padding: 24px;
      min-width: 320px;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    }

    .template-dialog-card h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .template-name-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .template-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .template-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .template-item-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .template-item-size {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
    }

    .template-item-btn {
      padding: 4px 12px;
      font-size: 13px;
    }

    .sensitivity-select {
      padding: 2px 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      font-size: 12px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      flex-shrink: 0;
    }

    /* Furniture overlay */
    .furniture-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 15;
    }

    .furniture-overlay.non-interactive {
      pointer-events: none !important;
    }

    .furniture-overlay.non-interactive .furniture-item {
      pointer-events: none !important;
      opacity: 0.6;
    }

    .furniture-item {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      background: transparent;
      pointer-events: auto;
      cursor: grab;
      transform-origin: center center;
      user-select: none;
    }

    .furniture-item:hover {
      border-color: var(--primary-color, #03a9f4);
    }

    .furniture-item.selected {
      border: 2px solid var(--primary-color, #03a9f4);
      box-shadow: 0 0 8px rgba(3, 169, 244, 0.4);
      z-index: 10;
    }

    .furniture-item ha-icon {
      color: rgba(0, 0, 0, 0.6);
      pointer-events: none;
    }

    .furn-svg {
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .furn-sticker-svg {
      width: 28px;
      height: 28px;
    }

    .furn-handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--primary-color, #03a9f4);
      border: 1px solid #fff;
      border-radius: 2px;
      pointer-events: auto;
      z-index: 2;
    }

    .furn-handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
    .furn-handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
    .furn-handle-e { right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
    .furn-handle-w { left: -4px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
    .furn-handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
    .furn-handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
    .furn-handle-se { bottom: -4px; right: -4px; cursor: se-resize; }
    .furn-handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }

    .furn-rotate-stem {
      position: absolute;
      top: -32px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 32px;
      background: var(--primary-color, #03a9f4);
      pointer-events: none;
    }

    .furn-rotate-handle {
      position: absolute;
      top: -48px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      background: var(--primary-color, #03a9f4);
      border: 2px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      pointer-events: auto;
      color: #fff;
    }

    .furn-delete-btn {
      position: absolute;
      top: -24px;
      right: -4px;
      width: 20px;
      height: 20px;
      background: var(--error-color, #f44336);
      border: 1px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto;
      color: #fff;
    }

    /* Furniture sidebar */
    .furn-selected-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      border: 2px solid var(--primary-color, #03a9f4);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .furn-dims {
      display: flex;
      gap: 6px;
    }

    .furn-dims label {
      flex: 1;
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .furn-dims input {
      width: 100%;
      padding: 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      font-size: 12px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .furn-catalog {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .furn-sticker {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      cursor: pointer;
      font-size: 11px;
      color: var(--primary-text-color, #212121);
      text-align: center;
      transition: background 0.15s;
    }

    .furn-sticker:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .furn-sticker span {
      line-height: 1.2;
    }

    .furn-icon-picker {
      margin-top: 8px;
    }

    .furn-icon-input-row {
      display: flex;
      gap: 6px;
    }

    .furn-icon-input {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 6px;
      font-size: 13px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .zone-color-picker {
      width: 24px;
      height: 24px;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .targets-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 20;
    }

    .target-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .target-dot.moving {
      background: #4caf50;
    }

    .target-dot.stationary {
      background: #ff9800;
    }

    .sensor-overlay {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 5;
    }

    .zone-sidebar {
      width: 240px;
      max-height: 70vh;
      background: var(--card-background-color, #fff);
      border-left: 1px solid var(--divider-color, #e0e0e0);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
    }

    .sidebar-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }

    .sidebar-tab {
      flex: 1;
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }

    .sidebar-tab.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border-color: var(--primary-color, #03a9f4);
    }

    .zone-sidebar h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .zone-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid var(--divider-color, #e0e0e0);
      transition: border-color 0.2s;
    }

    .zone-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .zone-item.active {
      border-color: var(--primary-color, #03a9f4);
    }

    .zone-item-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zone-settings-row {
      padding-left: 24px;
      gap: 6px;
    }

    .zone-separator {
      border: none;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      margin: 4px 0;
      flex-shrink: 0;
    }

    .zone-scroll-area {
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .zone-setting-label {
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
    }

    .zone-color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .zone-name {
      flex: 1;
      font-size: 14px;
    }

    .zone-remove-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .zone-remove-btn:hover {
      color: var(--error-color, #f44336);
    }

    .add-zone-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border: 2px dashed var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: none;
      color: var(--primary-color, #03a9f4);
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .add-zone-btn:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 16px;
      text-align: center;
    }

    .header-settings-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      transition: background 0.2s;
    }

    .header-settings-btn:hover {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--primary-text-color, #212121);
    }

    .header-settings-btn ha-icon {
      --mdc-icon-size: 20px;
    }

    .device-select {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      font-size: 16px;
      color: var(--secondary-text-color, #757575);
    }

    /* Setup wizard */
    .wizard-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      padding: 32px;
      box-sizing: border-box;
    }

    .wizard-card {
      max-width: 560px;
      width: 100%;
      background: var(--card-background-color, #fff);
      border-radius: 16px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .wizard-card h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 500;
    }

    .wizard-card p {
      margin: 0;
      color: var(--secondary-text-color, #757575);
      font-size: 15px;
      line-height: 1.5;
    }

    .wizard-card label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text-color, #757575);
    }

    .wizard-card input[type="text"] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }


    .wizard-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .wizard-btn {
      padding: 10px 24px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
    }

    .wizard-btn-primary {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .wizard-btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .wizard-btn-back {
      background: transparent;
      color: var(--secondary-text-color, #757575);
    }

    .wizard-btn-secondary {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--primary-text-color, #212121);
    }

    .wizard-btn-secondary:hover {
      opacity: 0.85;
    }

    /* Mini-grid used in orientation and bounds steps */
    .mini-grid-container {
      display: flex;
      justify-content: center;
    }

    .mini-grid {
      width: 280px;
      height: 224px;
      background: var(--secondary-background-color, #f5f5f5);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .mini-grid-label {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: var(--secondary-text-color, #757575);
      pointer-events: none;
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }

    .mini-grid-label.left-label {
      left: 6px;
    }

    .mini-grid-label.right-label {
      right: 6px;
      transform: translateY(-50%) rotate(180deg);
    }

    .mini-grid-sensor {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      z-index: 5;
    }

    .mini-grid-target {
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4caf50;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
      z-index: 10;
      transition: left 0.15s, top 0.15s;
    }

    .mini-grid-captured {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ff9800;
      border: 2px solid #fff;
      transform: translate(-50%, -50%);
      z-index: 8;
    }

    .sensor-fov-view {
      width: 480px;
      aspect-ratio: 1.732 / 1;
      background: #1a1a2e;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .sensor-fov-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .preview-grid-container {
      display: flex;
      justify-content: center;
      position: relative;
    }

    .preview-grid-wrapper {
      position: relative;
    }

    .preview-grid {
      display: grid;
      gap: 1px;
      width: 100%;
      height: 100%;
      background: var(--divider-color, #e0e0e0);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-cell {
      background: var(--card-background-color, #fff);
    }

    .no-target-warning {
      color: var(--error-color, #f44336);
      font-size: 13px;
      text-align: center;
    }

    .corner-progress {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .corner-chip {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 13px;
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      transition: background 0.2s;
    }

    .corner-chip.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .corner-chip.done {
      background: #4caf50;
      color: #fff;
    }

    .corner-arrow {
      font-size: 18px;
      color: var(--disabled-text-color, #ccc);
      font-weight: bold;
    }

    .corner-arrow.done {
      color: var(--primary-color, #03a9f4);
    }

    .corner-instruction {
      font-size: 15px;
      color: var(--primary-text-color, #212121);
    }

    .corner-offsets {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .offset-label {
      font-size: 13px;
      color: var(--secondary-text-color, #888);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .capture-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .capture-overlay-content {
      background: var(--card-background-color, #fff);
      padding: 24px 32px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .offset-input {
      flex: 1;
      width: 100%;
      padding: 14px 12px 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      font-size: 16px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .offset-input::placeholder {
      color: var(--secondary-text-color, #888);
      font-size: 13px;
    }

    .offset-input:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
    }

    .dimension-inputs {
      display: flex;
      gap: 16px;
    }

    .dimension-inputs label {
      flex: 1;
    }

    .dimension-inputs input {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .capture-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .capture-bar {
      flex: 1;
      height: 8px;
      background: var(--secondary-background-color, #e0e0e0);
      border-radius: 4px;
      overflow: hidden;
    }

    .capture-fill {
      height: 100%;
      background: var(--primary-color, #03a9f4);
      border-radius: 4px;
      transition: width 0.1s linear;
    }

    .capture-progress span {
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      white-space: nowrap;
    }

    /* Live sidebar */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 4px 4px 12px;
    }

    .sidebar-title {
      font-size: 15px;
      font-weight: 600;
      padding: 10px 12px 8px;
      color: var(--primary-text-color, #212121);
    }

    .sidebar-header .sidebar-title {
      padding: 0;
    }

    .sidebar-menu-wrapper {
      position: relative;
    }

    .sidebar-menu-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
    }

    .sidebar-menu-btn:hover {
      background: var(--secondary-background-color, #f0f0f0);
    }

    .sidebar-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      z-index: 100;
      min-width: 220px;
      padding: 4px 0;
    }

    .sidebar-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 14px;
      border: none;
      background: none;
      color: var(--primary-text-color, #212121);
      font-size: 13px;
      cursor: pointer;
      text-align: left;
    }

    .sidebar-menu-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .save-cancel-bar {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-top: 1px solid var(--divider-color, #eee);
      margin-top: auto;
    }

    .live-section-link {
      cursor: pointer;
      background: none;
      border: none;
      color: var(--primary-color, #03a9f4);
    }

    .live-section-link:hover {
      text-decoration: underline;
    }

    .live-section-header {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text-color, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 12px 6px;
    }

    .live-sensor-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      font-size: 13px;
    }

    .live-sensor-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .live-sensor-dot.on {
      background: #4CAF50;
    }

    .live-sensor-dot.off {
      background: var(--disabled-text-color, #bbb);
    }

    .live-sensor-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .live-sensor-state {
      font-size: 12px;
      color: var(--secondary-text-color, #888);
      flex-shrink: 0;
    }

    .live-sensor-state.detected {
      color: #4CAF50;
      font-weight: 500;
    }

    .live-sensor-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      margin-left: auto;
    }

    .live-sensor-info-btn {
      background: none;
      border: none;
      color: var(--secondary-text-color, #aaa);
      cursor: pointer;
      padding: 2px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .live-sensor-info-btn:hover {
      color: var(--primary-color, #03a9f4);
    }

    .live-sensor-info-text {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      padding: 2px 12px 8px 30px;
      line-height: 1.4;
    }

    .live-nav-links {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 12px 8px;
      margin-top: 8px;
      border-top: 1px solid var(--divider-color, #eee);
    }

    .live-nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: var(--primary-color, #03a9f4);
      cursor: pointer;
      padding: 6px 4px;
      font-size: 13px;
      border-radius: 6px;
      text-align: left;
    }

    .live-nav-link:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    /* Settings view */
    .grid-dimensions {
      text-align: center;
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      margin-top: 8px;
    }

    .settings-container {
      width: 560px;
      max-width: 100%;
      margin: 0 auto;
      padding: 0 16px;
      box-sizing: border-box;
    }

    .accordion {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      margin-bottom: 12px;
      background: var(--card-background-color, #fff);
    }

    .accordion-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      cursor: pointer;
      user-select: none;
      background: var(--card-background-color, #fff);
      border: none;
      border-radius: 12px;
      width: 100%;
      text-align: left;
      font-size: 15px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }

    .accordion-header[data-open] {
      border-radius: 12px 12px 0 0;
    }

    .accordion-header:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .accordion-header ha-icon {
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color, #757575);
    }

    .accordion-header .accordion-title {
      flex: 1;
    }

    .accordion-chevron {
      transition: transform 0.2s ease;
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color, #757575);
    }

    .accordion-chevron[data-open] {
      transform: rotate(180deg);
    }

    .accordion-body {
      padding: 0 16px 16px;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .setting-group {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
    }

    .setting-group h4 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      padding: 8px 0;
      gap: 4px;
      border-bottom: 1px solid var(--divider-color, #f0f0f0);
    }

    .setting-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .setting-row label:not(.toggle-switch) {
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      flex: 1;
      min-width: 120px;
    }

    .setting-info {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .setting-info ha-icon {
      --mdc-icon-size: 18px;
      color: var(--primary-text-color, #212121);
      cursor: default;
    }

    .setting-info .setting-info-tooltip {
      display: none;
      position: fixed;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      color: var(--primary-text-color, #212121);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      white-space: normal;
      width: 240px;
      z-index: 9999;
      line-height: 1.4;
      pointer-events: none;
    }

    .setting-value {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      font-weight: 500;
      display: inline-block;
      width: 36px;
      text-align: right;
      flex-shrink: 0;
    }

    .setting-unit {
      display: inline-block;
      width: 24px;
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      flex-shrink: 0;
    }

    .setting-input {
      width: 80px;
      padding: 6px 8px;
      font-size: 13px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      background: var(--secondary-background-color, #f5f5f5);
      color: var(--primary-text-color, #212121);
      text-align: right;
    }

    .setting-input-unit {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--secondary-text-color, #757575);
      flex: 1;
      min-width: 0;
      justify-content: flex-end;
    }

    select.setting-input {
      flex: 1;
      width: auto;
      text-align: left;
    }

    .setting-range {
      flex: 1;
      min-width: 80px;
      accent-color: var(--primary-color, #03a9f4);
    }

    .setting-toggle {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-color, #03a9f4);
      cursor: pointer;
    }

    .zone-type-group {
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 8px;
    }

    .zone-type-group:last-child {
      margin-bottom: 0;
    }

    .zone-type-group h5 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 40px;
      min-width: 40px;
      max-width: 40px;
      height: 22px;
      flex: 0 0 40px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: var(--divider-color, #ccc);
      border-radius: 22px;
      transition: background-color 0.2s;
    }

    .toggle-slider::before {
      content: "";
      position: absolute;
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background-color: var(--primary-color, #03a9f4);
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(18px);
    }
  `,t([ht({attribute:!1})],Rt.prototype,"hass",void 0),t([ut()],Rt.prototype,"_grid",void 0),t([ut()],Rt.prototype,"_zoneConfigs",void 0),t([ut()],Rt.prototype,"_activeZone",void 0),t([ut()],Rt.prototype,"_sidebarTab",void 0),t([ut()],Rt.prototype,"_expandedSensorInfo",void 0),t([ut()],Rt.prototype,"_showLiveMenu",void 0),t([ut()],Rt.prototype,"_showDeleteCalibrationDialog",void 0),t([ut()],Rt.prototype,"_showCustomIconPicker",void 0),t([ut()],Rt.prototype,"_customIconValue",void 0),t([ut()],Rt.prototype,"_furniture",void 0),t([ut()],Rt.prototype,"_selectedFurnitureId",void 0),t([ut()],Rt.prototype,"_pendingRenames",void 0),t([ut()],Rt.prototype,"_showRenameDialog",void 0),t([ut()],Rt.prototype,"_roomSensitivity",void 0),t([ut()],Rt.prototype,"_targets",void 0),t([ut()],Rt.prototype,"_sensorState",void 0),t([ut()],Rt.prototype,"_zoneState",void 0),t([ut()],Rt.prototype,"_isPainting",void 0),t([ut()],Rt.prototype,"_paintAction",void 0),t([ut()],Rt.prototype,"_saving",void 0),t([ut()],Rt.prototype,"_dirty",void 0),t([ut()],Rt.prototype,"_showUnsavedDialog",void 0),t([ut()],Rt.prototype,"_showTemplateSave",void 0),t([ut()],Rt.prototype,"_showTemplateLoad",void 0),t([ut()],Rt.prototype,"_templateName",void 0),t([ut()],Rt.prototype,"_entries",void 0),t([ut()],Rt.prototype,"_selectedEntryId",void 0),t([ut()],Rt.prototype,"_loading",void 0),t([ut()],Rt.prototype,"_setupStep",void 0),t([ut()],Rt.prototype,"_wizardSaving",void 0),t([ut()],Rt.prototype,"_wizardCornerIndex",void 0),t([ut()],Rt.prototype,"_wizardCorners",void 0),t([ut()],Rt.prototype,"_wizardRoomWidth",void 0),t([ut()],Rt.prototype,"_wizardRoomDepth",void 0),t([ut()],Rt.prototype,"_wizardCapturing",void 0),t([ut()],Rt.prototype,"_wizardCaptureProgress",void 0),t([ut()],Rt.prototype,"_view",void 0),t([ut()],Rt.prototype,"_openAccordions",void 0),t([ut()],Rt.prototype,"_perspective",void 0),t([ut()],Rt.prototype,"_roomWidth",void 0),t([ut()],Rt.prototype,"_roomDepth",void 0),customElements.get("everything-presence-pro-panel")||customElements.define("everything-presence-pro-panel",Rt);export{Rt as EverythingPresenceProPanel};
