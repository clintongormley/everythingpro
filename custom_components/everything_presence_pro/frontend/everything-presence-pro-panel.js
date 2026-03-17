function e(e,t,i,r){var o,s=arguments.length,n=s<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(n=(s<3?o(n):s>3?o(t,i,n):o(t,i))||n);return s>3&&n&&Object.defineProperty(t,i,n),n}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),o=new WeakMap;let s=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=o.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(t,e))}return e}toString(){return this.cssText}};const n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,r))(t)})(e):e,{is:a,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,v=g?g.emptyScript:"",f=u.reactiveElementPolyfillSupport,x=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?v:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},m=(e,t)=>!a(e,t),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:m};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(e,i,t);void 0!==r&&l(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){const{get:r,set:o}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){const s=r?.call(this);o?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(x("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(x("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(x("properties"))){const e=this.properties,t=[...c(e),...h(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,r)=>{if(i)e.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of r){const r=document.createElement("style"),o=t.litNonce;void 0!==o&&r.setAttribute("nonce",o),r.textContent=i.cssText,e.appendChild(r)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(void 0!==r&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(t,i.type);this._$Em=e,null==o?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(e,t){const i=this.constructor,r=i._$Eh.get(e);if(void 0!==r&&this._$Em!==r){const e=i.getPropertyOptions(r),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=r;const s=o.fromAttribute(t,e.type);this[r]=s??this._$Ej?.get(r)??s,this._$Em=null}}requestUpdate(e,t,i,r=!1,o){if(void 0!==e){const s=this.constructor;if(!1===r&&(o=this[e]),i??=s.getPropertyOptions(e),!((i.hasChanged??m)(o,t)||i.useDefault&&i.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:o},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==o||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,r=this[t];!0!==e||this._$AL.has(t)||void 0===r||this.C(t,void 0,i,r)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[x("elementProperties")]=new Map,_[x("finalized")]=new Map,f?.({ReactiveElement:_}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,k=e=>e,$=w.trustedTypes,z=$?$.createPolicy("lit-html",{createHTML:e=>e}):void 0,C="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,A="?"+S,M=`<${A}>`,P=document,E=()=>P.createComment(""),D=e=>null===e||"object"!=typeof e&&"function"!=typeof e,T=Array.isArray,F="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,W=/-->/g,I=/>/g,H=RegExp(`>|${F}(?:([^\\s"'>=/]+)(${F}*=${F}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,N=/"/g,B=/^(?:script|style|textarea|title)$/i,L=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),O=L(1),Z=L(2),j=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),X=new WeakMap,Y=P.createTreeWalker(P,129);function q(e,t){if(!T(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}const G=(e,t)=>{const i=e.length-1,r=[];let o,s=2===t?"<svg>":3===t?"<math>":"",n=R;for(let t=0;t<i;t++){const i=e[t];let a,l,d=-1,c=0;for(;c<i.length&&(n.lastIndex=c,l=n.exec(i),null!==l);)c=n.lastIndex,n===R?"!--"===l[1]?n=W:void 0!==l[1]?n=I:void 0!==l[2]?(B.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=H):void 0!==l[3]&&(n=H):n===H?">"===l[0]?(n=o??R,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?H:'"'===l[3]?N:U):n===N||n===U?n=H:n===W||n===I?n=R:(n=H,o=void 0);const h=n===H&&e[t+1].startsWith("/>")?" ":"";s+=n===R?i+M:d>=0?(r.push(a),i.slice(0,d)+C+i.slice(d)+S+h):i+S+(-2===d?t:h)}return[q(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),r]};class J{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let o=0,s=0;const n=e.length-1,a=this.parts,[l,d]=G(e,t);if(this.el=J.createElement(l,i),Y.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(r=Y.nextNode())&&a.length<n;){if(1===r.nodeType){if(r.hasAttributes())for(const e of r.getAttributeNames())if(e.endsWith(C)){const t=d[s++],i=r.getAttribute(e).split(S),n=/([.?@])?(.*)/.exec(t);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?ie:"?"===n[1]?re:"@"===n[1]?oe:te}),r.removeAttribute(e)}else e.startsWith(S)&&(a.push({type:6,index:o}),r.removeAttribute(e));if(B.test(r.tagName)){const e=r.textContent.split(S),t=e.length-1;if(t>0){r.textContent=$?$.emptyScript:"";for(let i=0;i<t;i++)r.append(e[i],E()),Y.nextNode(),a.push({type:2,index:++o});r.append(e[t],E())}}}else if(8===r.nodeType)if(r.data===A)a.push({type:2,index:o});else{let e=-1;for(;-1!==(e=r.data.indexOf(S,e+1));)a.push({type:7,index:o}),e+=S.length-1}o++}}static createElement(e,t){const i=P.createElement("template");return i.innerHTML=e,i}}function K(e,t,i=e,r){if(t===j)return t;let o=void 0!==r?i._$Co?.[r]:i._$Cl;const s=D(t)?void 0:t._$litDirective$;return o?.constructor!==s&&(o?._$AO?.(!1),void 0===s?o=void 0:(o=new s(e),o._$AT(e,i,r)),void 0!==r?(i._$Co??=[])[r]=o:i._$Cl=o),void 0!==o&&(t=K(e,o._$AS(e,t.values),o,r)),t}class Q{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??P).importNode(t,!0);Y.currentNode=r;let o=Y.nextNode(),s=0,n=0,a=i[0];for(;void 0!==a;){if(s===a.index){let t;2===a.type?t=new ee(o,o.nextSibling,this,e):1===a.type?t=new a.ctor(o,a.name,a.strings,this,e):6===a.type&&(t=new se(o,this,e)),this._$AV.push(t),a=i[++n]}s!==a?.index&&(o=Y.nextNode(),s++)}return Y.currentNode=P,r}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class ee{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=K(this,e,t),D(e)?e===V||null==e||""===e?(this._$AH!==V&&this._$AR(),this._$AH=V):e!==this._$AH&&e!==j&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>T(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==V&&D(this._$AH)?this._$AA.nextSibling.data=e:this.T(P.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,r="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=J.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{const e=new Q(r,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=X.get(e.strings);return void 0===t&&X.set(e.strings,t=new J(e)),t}k(e){T(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,r=0;for(const o of e)r===t.length?t.push(i=new ee(this.O(E()),this.O(E()),this,this.options)):i=t[r],i._$AI(o),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=k(e).nextSibling;k(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class te{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,o){this.type=1,this._$AH=V,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=V}_$AI(e,t=this,i,r){const o=this.strings;let s=!1;if(void 0===o)e=K(this,e,t,0),s=!D(e)||e!==this._$AH&&e!==j,s&&(this._$AH=e);else{const r=e;let n,a;for(e=o[0],n=0;n<o.length-1;n++)a=K(this,r[i+n],t,n),a===j&&(a=this._$AH[n]),s||=!D(a)||a!==this._$AH[n],a===V?e=V:e!==V&&(e+=(a??"")+o[n+1]),this._$AH[n]=a}s&&!r&&this.j(e)}j(e){e===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ie extends te{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===V?void 0:e}}class re extends te{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==V)}}class oe extends te{constructor(e,t,i,r,o){super(e,t,i,r,o),this.type=5}_$AI(e,t=this){if((e=K(this,e,t,0)??V)===j)return;const i=this._$AH,r=e===V&&i!==V||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==V&&(i===V||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class se{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){K(this,e)}}const ne=w.litHtmlPolyfillSupport;ne?.(J,ee),(w.litHtmlVersions??=[]).push("3.3.2");const ae=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let le=class extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const r=i?.renderBefore??t;let o=r._$litPart$;if(void 0===o){const e=i?.renderBefore??null;r._$litPart$=o=new ee(t.insertBefore(E(),e),e,void 0,i??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}};le._$litElement$=!0,le.finalized=!0,ae.litElementHydrateSupport?.({LitElement:le});const de=ae.litElementPolyfillSupport;de?.({LitElement:le}),(ae.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ce={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:m},he=(e=ce,t,i)=>{const{kind:r,metadata:o}=i;let s=globalThis.litPropertyMetadata.get(o);if(void 0===s&&globalThis.litPropertyMetadata.set(o,s=new Map),"setter"===r&&((e=Object.create(e)).wrapped=!0),s.set(i.name,e),"accessor"===r){const{name:r}=i;return{set(i){const o=t.get.call(this);t.set.call(this,i),this.requestUpdate(r,o,e,!0,i)},init(t){return void 0!==t&&this.C(r,void 0,e,t),t}}}if("setter"===r){const{name:r}=i;return function(i){const o=this[r];t.call(this,i),this.requestUpdate(r,o,e,!0,i)}}throw Error("Unsupported decorator location: "+r)};function pe(e){return(t,i)=>"object"==typeof i?he(e,t,i):((e,t,i)=>{const r=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),r?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ue(e){return pe({...e,state:!0,attribute:!1})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ge=2;class ve{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class fe extends ve{constructor(e){if(super(e),this.it=V,e.type!==ge)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===V||null==e)return this._t=void 0,this.it=e;if(e===j)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}fe.directiveName="unsafeHTML",fe.resultType=1;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class xe extends fe{}xe.directiveName="unsafeSVG",xe.resultType=2;const ye=(e=>(...t)=>({_$litDirective$:e,values:t}))(xe),me={armchair:{viewBox:"0 0 256 256",content:'<rect x="16" y="16" width="224" height="224" rx="16" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="16" width="224" height="48" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="192" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="64" y="64" width="128" height="176" rx="8" stroke="black" stroke-width="8" fill="none"/>'},bath:{viewBox:"0 0 600 300",content:'<rect x="50" y="50" width="500" height="200" rx="40" stroke="black" stroke-width="8" fill="none"/><path d="M 100 220 C 100 240, 500 240, 500 220" stroke="black" stroke-width="8" fill="none"/><rect x="70" y="70" width="30" height="20" stroke="black" stroke-width="8" fill="none"/><rect x="80" y="90" width="10" height="20" stroke="black" stroke-width="8" fill="none"/><circle cx="510" cy="150" r="10" stroke="black" stroke-width="8" fill="none"/>'},"bed-double":{viewBox:"0 0 512 512",content:'<rect x="0" y="0" width="512" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H480C497.673 32 512 46.3269 512 64V128C512 145.673 497.673 160 480 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="272" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="480" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="496" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="496" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"bed-single":{viewBox:"0 0 256 512",content:'<rect x="0" y="0" width="256" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H224C241.673 32 256 46.3269 256 64V128C256 145.673 241.673 160 224 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="192" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="224" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="240" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="240" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"door-left":{viewBox:"0 0 256 256",content:'<rect x="0" y="210" width="80" height="20" fill="black"/><rect x="60" y="60" width="20" height="150" fill="black"/><rect x="200" y="210" width="56" height="20" fill="black"/><path d="M 80 60 A 150 150 0 0 1 200 210" stroke="black" stroke-width="3" fill="none"/>'},"door-right":{viewBox:"0 0 256 256",content:'<rect x="176" y="210" width="80" height="20" fill="black"/><rect x="176" y="60" width="20" height="150" fill="black"/><rect x="0" y="210" width="56" height="20" fill="black"/><path d="M 176 60 A 150 150 0 0 0 56 210" stroke="black" stroke-width="3" fill="none"/>'},"floor-lamp":{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" stroke="black" stroke-width="8" fill="none"/><circle cx="128" cy="128" r="16" fill="black"/><line x1="128" y1="112" x2="128" y2="48" stroke="black" stroke-width="8"/><circle cx="128" cy="48" r="8" fill="black"/><path d="M 64 64 A 128 128 0 0 1 192 64" stroke="black" stroke-width="8" stroke-dasharray="8 8"/>'},oven:{viewBox:"0 0 256 256",content:'<rect x="0" y="0" width="256" height="256" rx="16" stroke="black" stroke-width="16" fill="none"/><line x1="0" y1="224" x2="256" y2="224" stroke="black" stroke-width="16"/><circle cx="64" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="64" r="16" fill="black"/><circle cx="192" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="64" r="16" fill="black"/><circle cx="64" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="192" r="16" fill="black"/><circle cx="192" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="192" r="16" fill="black"/><rect x="32" y="240" width="192" height="16" rx="4" stroke="black" stroke-width="8" fill="black"/>'},plant:{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" fill="none"/><g transform="translate(128 128)"><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(72)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(144)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(216)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(288)" fill="none" stroke="black" stroke-width="12"/></g>'},shower:{viewBox:"0 0 256 256",content:'<path d="M 32 32 H 224 V 224 H 32 Z" stroke="black" stroke-width="16" fill="none"/><line x1="32" y1="32" x2="224" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><line x1="224" y1="32" x2="32" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><circle cx="128" cy="200" r="16" stroke="black" stroke-width="16" fill="none"/>'},"sofa-two-seater":{viewBox:"0 0 400 200",content:'<rect x="8" y="8" width="384" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="384" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="204" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"sofa-three-seater":{viewBox:"0 0 560 200",content:'<rect x="8" y="8" width="544" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="544" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="200" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="376" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"table-dining-room":{viewBox:"0 0 600 400",content:'<rect x="150" y="100" width="300" height="200" stroke="black" stroke-width="8" fill="none" rx="10"/><rect x="80" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="460" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/>'},"table-dining-room-round":{viewBox:"0 0 400 400",content:'<circle cx="200" cy="200" r="100" stroke="black" stroke-width="8" fill="none"/><rect x="150" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="150" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="30" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="310" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/>'},television:{viewBox:"0 0 256 64",content:'<line x1="0" y1="56" x2="256" y2="56" stroke="black" stroke-width="16"/><rect x="32" y="16" width="192" height="40" rx="4" stroke="black" stroke-width="16" fill="none"/><rect x="40" y="24" width="176" height="24" rx="2" stroke="black" stroke-width="8" fill="none"/>'},toilet:{viewBox:"0 0 300 400",content:'<rect x="75" y="30" width="150" height="80" rx="10" stroke="black" stroke-width="8" fill="none"/><path d="M 75 110 C 75 110, 50 160, 50 210 C 50 310, 125 360, 150 360 C 175 360, 250 310, 250 210 C 250 160, 225 110, 225 110 Z" stroke="black" stroke-width="8" fill="none"/><path d="M 100 150 C 100 150, 75 190, 75 220 C 75 300, 125 340, 150 340 C 175 340, 225 300, 225 220 C 225 190, 200 150, 200 150 Z" stroke="black" stroke-width="8" fill="none"/><circle cx="150" cy="70" r="15" stroke="black" stroke-width="8" fill="none"/>'}},be=[{type:"svg",icon:"armchair",label:"Armchair",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"bath",label:"Bath",defaultWidth:1700,defaultHeight:700},{type:"svg",icon:"bed-double",label:"Double bed",defaultWidth:1600,defaultHeight:2e3},{type:"svg",icon:"bed-single",label:"Single bed",defaultWidth:900,defaultHeight:2e3},{type:"svg",icon:"door-left",label:"Door (left swing)",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"door-right",label:"Door (right swing)",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"table-dining-room",label:"Dining table",defaultWidth:1600,defaultHeight:900},{type:"svg",icon:"table-dining-room-round",label:"Round table",defaultWidth:1e3,defaultHeight:1e3},{type:"svg",icon:"floor-lamp",label:"Lamp",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"oven",label:"Oven / stove",defaultWidth:600,defaultHeight:600},{type:"svg",icon:"plant",label:"Plant",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"shower",label:"Shower",defaultWidth:900,defaultHeight:900},{type:"svg",icon:"sofa-two-seater",label:"Sofa (2 seat)",defaultWidth:1600,defaultHeight:800},{type:"svg",icon:"sofa-three-seater",label:"Sofa (3 seat)",defaultWidth:2400,defaultHeight:800},{type:"svg",icon:"television",label:"TV",defaultWidth:1200,defaultHeight:200},{type:"svg",icon:"toilet",label:"Toilet",defaultWidth:400,defaultHeight:700},{type:"icon",icon:"mdi:countertop",label:"Counter",defaultWidth:2e3,defaultHeight:600,lockAspect:!1},{type:"icon",icon:"mdi:cupboard",label:"Cupboard",defaultWidth:1e3,defaultHeight:500,lockAspect:!1},{type:"icon",icon:"mdi:desk",label:"Desk",defaultWidth:1400,defaultHeight:700,lockAspect:!1},{type:"icon",icon:"mdi:fridge",label:"Fridge",defaultWidth:700,defaultHeight:700,lockAspect:!0},{type:"icon",icon:"mdi:speaker",label:"Speaker",defaultWidth:300,defaultHeight:300,lockAspect:!0},{type:"icon",icon:"mdi:window-open-variant",label:"Window",defaultWidth:1e3,defaultHeight:150,lockAspect:!1}],_e=e=>!!(3&e),we=e=>3&e,ke=e=>e>>2&7,$e=(e,t)=>-4&e|3&t,ze=(e,t)=>-29&e|(7&t)<<2,Ce=["Front-left","Front-right","Back-right","Back-left"],Se=[["left wall","front wall"],["right wall","front wall"],["right wall","back wall"],["left wall","back wall"]],Ae=20,Me=20,Pe=400,Ee=300,De=6e3,Te=["#2196F3","#FF5722","#4CAF50"],Fe=["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7"];class Re extends le{constructor(){super(...arguments),this._grid=new Uint8Array(Pe),this._zoneConfigs=new Array(7).fill(null),this._activeZone=null,this._sidebarTab="zones",this._expandedSensorInfo=null,this._showLiveMenu=!1,this._showDeleteCalibrationDialog=!1,this._showCustomIconPicker=!1,this._customIconValue="",this._furniture=[],this._selectedFurnitureId=null,this._dragState=null,this._pendingRenames=[],this._showRenameDialog=!1,this._roomSensitivity=1,this._targets=[],this._sensorState={occupancy:!1,static_presence:!1,pir_motion:!1,illuminance:null,temperature:null,humidity:null,co2:null},this._zoneState={occupancy:{},target_counts:{}},this._isPainting=!1,this._paintAction="set",this._frozenBounds=null,this._saving=!1,this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation=null,this._showTemplateSave=!1,this._showTemplateLoad=!1,this._templateName="",this._entries=[],this._selectedEntryId="",this._loading=!0,this._setupStep=null,this._wizardSaving=!1,this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardRoomWidth=0,this._wizardRoomDepth=0,this._wizardCapturing=!1,this._wizardCaptureProgress=0,this._view="live",this._openAccordions=new Set(["detection"]),this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._beforeUnloadHandler=e=>{this._dirty&&(e.preventDefault(),e.returnValue="")},this._originalPushState=null,this._originalReplaceState=null,this._interceptNavigation=()=>!!this._dirty&&(this._showUnsavedDialog=!0,this._pendingNavigation=null,!0),this._smoothBuffer=[]}connectedCallback(){super.connectedCallback(),this._initialize(),window.addEventListener("beforeunload",this._beforeUnloadHandler),this._originalPushState=history.pushState.bind(history),this._originalReplaceState=history.replaceState.bind(history);const e=this;history.pushState=function(...t){e._interceptNavigation()?e._pendingNavigation=()=>{e._originalPushState(...t),window.dispatchEvent(new PopStateEvent("popstate"))}:e._originalPushState(...t)},history.replaceState=function(...t){e._interceptNavigation()?e._pendingNavigation=()=>{e._originalReplaceState(...t),window.dispatchEvent(new PopStateEvent("popstate"))}:e._originalReplaceState(...t)}}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeTargets(),window.removeEventListener("beforeunload",this._beforeUnloadHandler),this._originalPushState&&(history.pushState=this._originalPushState),this._originalReplaceState&&(history.replaceState=this._originalReplaceState)}updated(e){e.has("hass")&&this.hass&&this._loading&&!this._entries.length&&this._initialize()}async _initialize(){this.hass&&(this._loading=!0,await this._loadEntries(),this._selectedEntryId&&await this._loadEntryConfig(this._selectedEntryId),this._loading=!1)}async _loadEntries(){try{const e=await this.hass.callWS({type:"everything_presence_pro/list_entries"});this._entries=e.sort((e,t)=>(e.title||"").localeCompare(t.title||""))}catch{return void(this._entries=[])}const e=localStorage.getItem("epp_selected_entry"),t=e&&this._entries.find(t=>t.entry_id===e);this._selectedEntryId=t?e:this._entries[0]?.entry_id??""}async _loadEntryConfig(e){try{const t=await this.hass.callWS({type:"everything_presence_pro/get_config",entry_id:e});this._applyConfig(t)}catch{}this._subscribeTargets(e)}_applyConfig(e){const t=e.calibration;t?.perspective&&t.room_width>0?(this._perspective=t.perspective,this._roomWidth=t.room_width||0,this._roomDepth=t.room_depth||0,this._setupStep=null):(this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._setupStep=null);const i=e.room_layout||{};this._roomSensitivity=i.room_sensitivity??1,this._furniture=(i.furniture||[]).map((e,t)=>({id:e.id||`f_load_${t}`,type:e.type||"icon",icon:e.icon||"mdi:help",label:e.label||"Item",x:e.x??0,y:e.y??0,width:e.width??600,height:e.height??600,rotation:e.rotation??0,lockAspect:e.lockAspect??"svg"!==e.type})),i.grid_bytes&&Array.isArray(i.grid_bytes)?this._grid=new Uint8Array(i.grid_bytes):this._roomWidth>0&&this._roomDepth>0?this._initGridFromRoom():this._grid=new Uint8Array(Pe);const r=i.zone_slots||i.zones||[];this._zoneConfigs=Array.from({length:7},(e,t)=>{const i=r[t];return i?{name:i.name||`Zone ${t+1}`,color:i.color||Fe[t%Fe.length],sensitivity:i.sensitivity??1}:null})}_subscribeTargets(e){if(this._unsubscribeTargets(),!this.hass||!e)return;this.hass.connection.subscribeMessage(e=>{this._targets=(e.targets||[]).map(e=>({x:e.x,y:e.y,raw_x:e.raw_x??e.x,raw_y:e.raw_y??e.y,speed:0,active:e.active})),e.sensors&&(this._sensorState={occupancy:e.sensors.occupancy??!1,static_presence:e.sensors.static_presence??!1,pir_motion:e.sensors.pir_motion??!1,illuminance:e.sensors.illuminance??null,temperature:e.sensors.temperature??null,humidity:e.sensors.humidity??null,co2:e.sensors.co2??null}),e.zones&&(this._zoneState={occupancy:e.zones.occupancy??{},target_counts:e.zones.target_counts??{}})},{type:"everything_presence_pro/subscribe_targets",entry_id:e}).then(e=>{this._unsubTargets=e})}_unsubscribeTargets(){this._unsubTargets&&(this._unsubTargets(),this._unsubTargets=void 0),this._targets=[]}_onCellMouseDown(e){if("furniture"===this._sidebarTab)return void(this._selectedFurnitureId=null);if(null===this._activeZone)return;this._isPainting=!0,this._frozenBounds=this._getRoomBounds();const t=this._grid[e];if(0===this._activeZone){const e=_e(t)&&0===ke(t)&&1===we(t);this._paintAction=e?"clear":"set"}else if(-1===this._activeZone||-2===this._activeZone){const e=-1===this._activeZone?2:3;this._paintAction=we(t)===e?"clear":"set"}else this._paintAction=ke(t)===this._activeZone?"clear":"set";this._applyPaintToCell(e)}_onCellMouseEnter(e){this._isPainting&&this._applyPaintToCell(e)}_onCellMouseUp(){this._isPainting=!1,this._frozenBounds=null}_applyPaintToCell(e){if(null===this._activeZone)return;const t=this._grid[e];if(this._grid=new Uint8Array(this._grid),0===this._activeZone)"set"===this._paintAction?this._grid[e]=1:this._grid[e]=0;else if(-1===this._activeZone||-2===this._activeZone){if(!_e(t))return;const i=-1===this._activeZone?2:3;"set"===this._paintAction?this._grid[e]=$e(t,i):this._grid[e]=$e(t,1)}else{if(!_e(t))return;"set"===this._paintAction?this._grid[e]=ze(t,this._activeZone):this._grid[e]=ze(t,0)}this._dirty=!0,this.requestUpdate()}_addZone(){const e=this._zoneConfigs.findIndex(e=>null===e);if(-1===e)return;const t=new Set(this._zoneConfigs.filter(e=>null!==e).map(e=>e.color)),i=Fe.find(e=>!t.has(e))??Fe[e%Fe.length],r=[...this._zoneConfigs];r[e]={name:`Zone ${e+1}`,color:i,sensitivity:1},this._zoneConfigs=r,this._activeZone=e+1,this._dirty=!0}_removeZone(e){if(e<1||e>7||null===this._zoneConfigs[e-1])return;this._grid=new Uint8Array(this._grid);for(let t=0;t<Pe;t++)ke(this._grid[t])===e&&(this._grid[t]=ze(this._grid[t],0));const t=[...this._zoneConfigs];t[e-1]=null,this._zoneConfigs=t,this._activeZone===e&&(this._activeZone=null),this._dirty=!0,this.requestUpdate()}_clearOverlay(e){this._grid=new Uint8Array(this._grid);for(let t=0;t<Pe;t++)we(this._grid[t])===e&&(this._grid[t]=$e(this._grid[t],1));this._dirty=!0,this.requestUpdate()}_addFurniture(e){const t={id:`f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:e.type,icon:e.icon,label:e.label,x:Math.max(0,(this._roomWidth-e.defaultWidth)/2),y:Math.max(0,(this._roomDepth-e.defaultHeight)/2),width:e.defaultWidth,height:e.defaultHeight,rotation:0,lockAspect:e.lockAspect??"icon"===e.type};this._furniture=[...this._furniture,t],this._selectedFurnitureId=t.id,this._dirty=!0}_addCustomFurniture(e){this._addFurniture({type:"icon",icon:e,label:"Custom",defaultWidth:600,defaultHeight:600,lockAspect:!1})}_removeFurniture(e){this._furniture=this._furniture.filter(t=>t.id!==e),this._selectedFurnitureId===e&&(this._selectedFurnitureId=null),this._dirty=!0}_updateFurniture(e,t){this._furniture=this._furniture.map(i=>i.id===e?{...i,...t}:i),this._dirty=!0}_mmToPx(e,t){return e/Ee*(t+1)}_pxToMm(e,t){return e/(t+1)*Ee}_onFurniturePointerDown(e,t,i,r){e.preventDefault(),e.stopPropagation(),this._selectedFurnitureId=t;const o=this._furniture.find(e=>e.id===t);if(!o)return;let s=0,n=0,a=0;if("rotate"===i){const i=this.shadowRoot?.querySelector(`.furniture-item[data-id="${t}"]`);if(i){const t=i.getBoundingClientRect();s=t.left+t.width/2,n=t.top+t.height/2,a=Math.atan2(e.clientY-n,e.clientX-s)*(180/Math.PI)}}this._dragState={type:i,id:t,startX:e.clientX,startY:e.clientY,origX:o.x,origY:o.y,origW:o.width,origH:o.height,origRot:o.rotation,handle:r,centerX:s,centerY:n,startAngle:a};const l=e=>this._onFurnitureDrag(e),d=()=>{this._dragState=null,window.removeEventListener("pointermove",l),window.removeEventListener("pointerup",d)};window.addEventListener("pointermove",l),window.addEventListener("pointerup",d)}_onFurnitureDrag(e){if(!this._dragState)return;const t=this._dragState,i=this.shadowRoot?.querySelector(".grid");if(!i)return;const r=i.firstElementChild?i.firstElementChild.offsetWidth:28,o=e.clientX-t.startX,s=e.clientY-t.startY;if("move"===t.type){const e=this._furniture.find(e=>e.id===t.id),i=e?.width??0,n=e?.height??0;this._updateFurniture(t.id,{x:Math.max(-i/2,Math.min(this._roomWidth-i/2,t.origX+this._pxToMm(o,r))),y:Math.max(-n/2,Math.min(this._roomDepth-n/2,t.origY+this._pxToMm(s,r)))})}else if("resize"===t.type&&t.handle){const e=this._pxToMm(o,r),i=this._pxToMm(s,r);let{origX:n,origY:a,origW:l,origH:d}=t;const c=this._furniture.find(e=>e.id===t.id);if(c?.lockAspect??!1){const r=Math.abs(e)>Math.abs(i)?e:i,o=t.origW/t.origH,s=t.handle.includes("w")||t.handle.includes("n")?-1:1;l=Math.max(100,t.origW+s*r),d=Math.max(100,l/o),l=d*o,t.handle.includes("w")&&(n=t.origX+(t.origW-l)),t.handle.includes("n")&&(a=t.origY+(t.origH-d))}else t.handle.includes("e")&&(l=Math.max(100,l+e)),t.handle.includes("w")&&(l=Math.max(100,l-e),n+=e),t.handle.includes("s")&&(d=Math.max(100,d+i)),t.handle.includes("n")&&(d=Math.max(100,d-i),a+=i);this._updateFurniture(t.id,{x:n,y:a,width:l,height:d})}else if("rotate"===t.type){const i=Math.atan2(e.clientY-(t.centerY??0),e.clientX-(t.centerX??0))*(180/Math.PI)-(t.startAngle??0);this._updateFurniture(t.id,{rotation:Math.round((t.origRot+i+360)%360)})}}_getCellColor(e){const t=this._grid[e];if(!_e(t))return"var(--secondary-background-color, #e0e0e0)";const i=ke(t);if(i>0&&i<=7){const e=this._zoneConfigs[i-1];if(e)return e.color}return"var(--card-background-color, #fff)"}_getCellOverlayColor(e){const t=this._grid[e],i=we(t);return 2===i?"#00FFFF":3===i?"#FF0000":""}_getRoomBounds(){let e=Ae,t=0,i=Me,r=0;for(let o=0;o<Pe;o++)if(_e(this._grid[o])){const s=o%Ae,n=Math.floor(o/Ae);s<e&&(e=s),s>t&&(t=s),n<i&&(i=n),n>r&&(r=n)}return{minCol:Math.max(0,e-1),maxCol:Math.min(19,t+1),minRow:Math.max(0,i-1),maxRow:Math.min(19,r+1)}}async _applyLayout(){this._saving=!0;try{const e=await this.hass.callWS({type:"everything_presence_pro/set_room_layout",entry_id:this._selectedEntryId,grid_bytes:Array.from(this._grid),zone_slots:this._zoneConfigs.map(e=>null!==e?{name:e.name,color:e.color,sensitivity:e.sensitivity}:null),room_sensitivity:this._roomSensitivity,furniture:this._furniture.map(e=>({type:e.type,icon:e.icon,label:e.label,x:e.x,y:e.y,width:e.width,height:e.height,rotation:e.rotation,lockAspect:e.lockAspect}))});this._dirty=!1,this._view="live";const t=e?.entity_id_renames||[];t.length>0&&(this._pendingRenames=t,this._showRenameDialog=!0)}finally{this._saving=!1}}async _applyRenames(){if(this._pendingRenames.length)try{const e=await this.hass.callWS({type:"everything_presence_pro/rename_zone_entities",entry_id:this._selectedEntryId,renames:this._pendingRenames});e.errors?.length&&console.warn("Entity rename errors:",e.errors)}finally{this._showRenameDialog=!1,this._pendingRenames=[]}}_dismissRenameDialog(){this._showRenameDialog=!1,this._pendingRenames=[]}_getTemplates(){try{return JSON.parse(localStorage.getItem("epp_layout_templates")||"[]")}catch{return[]}}_saveTemplate(){const e=this._templateName.trim();if(!e)return;const t=this._getTemplates(),i=t.findIndex(t=>t.name===e),r={name:e,grid:Array.from(this._grid),zones:this._zoneConfigs.map(e=>null!==e?{...e}:null),roomWidth:this._roomWidth,roomDepth:this._roomDepth,roomSensitivity:this._roomSensitivity,furniture:this._furniture.map(e=>({...e}))};i>=0?t[i]=r:t.push(r),localStorage.setItem("epp_layout_templates",JSON.stringify(t)),this._showTemplateSave=!1,this._templateName=""}_loadTemplate(e){const t=this._getTemplates().find(t=>t.name===e);if(!t)return;this._grid=new Uint8Array(t.grid);const i=t.zones||[];this._zoneConfigs=Array.from({length:7},(e,t)=>i[t]??null),this._roomWidth=t.roomWidth,this._roomDepth=t.roomDepth,this._roomSensitivity=t.roomSensitivity??1,this._furniture=(t.furniture||[]).map(e=>({...e})),this._showTemplateLoad=!1}_deleteTemplate(e){const t=this._getTemplates().filter(t=>t.name!==e);localStorage.setItem("epp_layout_templates",JSON.stringify(t)),this.requestUpdate()}_initGridFromRoom(){const e=new Uint8Array(Pe),t=Math.ceil(this._roomWidth/Ee),i=Math.ceil(this._roomDepth/Ee),r=Math.floor((Ae-t)/2);for(let o=0;o<Me;o++)for(let s=0;s<Ae;s++){s>=r&&s<r+t&&o>=0&&o<0+i&&(e[o*Ae+s]=1)}this._grid=e}_mapTargetToPercent(e){if(this._roomWidth>0&&this._roomDepth>0){const t=Math.max(0,Math.min(e.x,this._roomWidth)),i=Math.max(0,Math.min(e.y,this._roomDepth));return{x:t/this._roomWidth*100,y:i/this._roomDepth*100}}return{x:e.x/De*100,y:e.y/De*100}}_mapTargetToGridCell(e){if(this._roomWidth<=0||this._roomDepth<=0)return null;const t=Math.max(0,Math.min(e.x,this._roomWidth)),i=Math.max(0,Math.min(e.y,this._roomDepth)),r=Math.ceil(this._roomWidth/Ee);return{col:Math.floor((Ae-r)/2)+t/Ee,row:i/Ee}}_guardNavigation(e){this._dirty?(this._pendingNavigation=e,this._showUnsavedDialog=!0):e()}_discardAndNavigate(){this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation&&(this._pendingNavigation(),this._pendingNavigation=null)}async _onDeviceChange(e){const t=e.target.value;this._guardNavigation(async()=>{this._unsubscribeTargets(),this._selectedEntryId=t,localStorage.setItem("epp_selected_entry",t),await this._loadEntryConfig(t)})}_getSmoothedRaw(){const e=this._targets.find(e=>e.active);if(!e)return null;const t=Date.now();for(this._smoothBuffer.push({x:e.raw_x,y:e.raw_y,t:t});this._smoothBuffer.length>0&&t-this._smoothBuffer[0].t>1e3;)this._smoothBuffer.shift();if(0===this._smoothBuffer.length)return{x:e.raw_x,y:e.raw_y};const i=e=>{const t=e.slice().sort((e,t)=>e-t),i=Math.floor(t.length/2);return t.length%2?t[i]:(t[i-1]+t[i])/2};return{x:i(this._smoothBuffer.map(e=>e.x)),y:i(this._smoothBuffer.map(e=>e.y))}}_wizardStartCapture(){const e=this._targets.find(e=>e.active);if(!e)return;this._wizardCapturing=!0,this._wizardCaptureProgress=0;const t=[],i=Date.now(),r=()=>{const e=Date.now()-i;this._wizardCaptureProgress=Math.min(e/5e3,1);const o=this._targets.find(e=>e.active);if(o&&t.push({x:o.raw_x,y:o.raw_y}),e<5e3)return void requestAnimationFrame(r);if(this._wizardCapturing=!1,0===t.length)return;const s=t.map(e=>e.x).sort((e,t)=>e-t),n=t.map(e=>e.y).sort((e,t)=>e-t),a=Math.floor(t.length/2),l=t.length%2?s[a]:(s[a-1]+s[a])/2,d=t.length%2?n[a]:(n[a-1]+n[a])/2,c=this._wizardCornerIndex;this._wizardCorners=[...this._wizardCorners],this._wizardCorners[c]={raw_x:l,raw_y:d,offset_side:0,offset_fb:0},c<3&&(this._wizardCornerIndex=c+1),this._wizardCorners.every(e=>null!==e)&&(this._autoComputeRoomDimensions(),this._computeWizardPerspective(),this._wizardFinish())};requestAnimationFrame(r)}_autoComputeRoomDimensions(){const e=this._wizardCorners,t=(e,t)=>Math.sqrt((e.raw_x-t.raw_x)**2+(e.raw_y-t.raw_y)**2);this._wizardRoomWidth=Math.round(t(e[0],e[1]));const i=t(e[0],e[3]),r=t(e[1],e[2]);this._wizardRoomDepth=Math.round((i+r)/2)}_solvePerspective(e,t){const i=[],r=[];for(let o=0;o<4;o++){const s=e[o].x,n=e[o].y,a=t[o].x,l=t[o].y;i.push([s,n,1,0,0,0,-s*a,-n*a]),r.push(a),i.push([0,0,0,s,n,1,-s*l,-n*l]),r.push(l)}const o=i.map((e,t)=>[...e,r[t]]);for(let e=0;e<8;e++){let t=Math.abs(o[e][e]),i=e;for(let r=e+1;r<8;r++)Math.abs(o[r][e])>t&&(t=Math.abs(o[r][e]),i=r);if(t<1e-12)return null;[o[e],o[i]]=[o[i],o[e]];for(let t=e+1;t<8;t++){const i=o[t][e]/o[e][e];for(let r=e;r<=8;r++)o[t][r]-=i*o[e][r]}}const s=new Array(8);for(let e=7;e>=0;e--){s[e]=o[e][8];for(let t=e+1;t<8;t++)s[e]-=o[e][t]*s[t];s[e]/=o[e][e]}return s}_computeWizardPerspective(){const e=this._wizardCorners;if(!e.every(e=>null!==e))return;const t=this._wizardRoomWidth,i=this._wizardRoomDepth,r=e.map(e=>({x:e.raw_x,y:e.raw_y})),o=[{x:e[0].offset_side,y:e[0].offset_fb},{x:t-e[1].offset_side,y:e[1].offset_fb},{x:t-e[2].offset_side,y:i-e[2].offset_fb},{x:e[3].offset_side,y:i-e[3].offset_fb}];this._perspective=this._solvePerspective(r,o),this._roomWidth=t,this._roomDepth=i}async _wizardFinish(){if(this._perspective){this._wizardSaving=!0;try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,perspective:this._perspective,room_width:this._wizardRoomWidth,room_depth:this._wizardRoomDepth}),this._roomWidth=this._wizardRoomWidth,this._roomDepth=this._wizardRoomDepth,this._initGridFromRoom(),this._setupStep=null,this._view="live"}finally{this._wizardSaving=!1}}}_rawToFovPct(e,t){const i=Re.FOV_X_EXTENT;return{xPct:(e+i)/(2*i)*100,yPct:t/De*100}}_getWizardTargetStyle(e){const{xPct:t,yPct:i}=this._rawToFovPct(e.raw_x,e.raw_y);return`left: ${t}%; top: ${i}%;`}render(){return this._loading?O`<div class="loading-container">Loading...</div>`:this._entries.length?null!==this._setupStep?this._renderWizard():"settings"===this._view?this._renderSettings():"editor"===this._view&&this._perspective?this._renderEditor():O`
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
    `:O`<div class="loading-container">Loading...</div>`}async _deleteCalibration(){this._showDeleteCalibrationDialog=!1,this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._grid=new Uint8Array(400),this._zoneConfigs=new Array(7).fill(null),this._furniture=[];try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,perspective:[0,0,0,0,0,0,0,0],room_width:0,room_depth:0}),await this.hass.callWS({type:"everything_presence_pro/set_room_layout",entry_id:this._selectedEntryId,grid_bytes:Array.from(this._grid),zone_slots:this._zoneConfigs.map(()=>null),room_sensitivity:1,furniture:[]})}catch(e){console.error("Failed to delete calibration",e)}this._dirty=!1,this._view="live"}_changePlacement(){this._guardNavigation(()=>{this._setupStep="guide",this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardRoomWidth=this._roomWidth,this._wizardRoomDepth=this._roomDepth})}_renderHeader(){const e=V;return O`
      <div class="panel-header">
        <select
          class="device-select"
          .value=${this._selectedEntryId}
          @change=${e=>{if("__add__"===e.target.value)return window.open("/config/integrations/integration/everything_presence_pro","_blank"),void(e.target.value=this._selectedEntryId);this._onDeviceChange(e)}}
        >
          ${this._entries.map(e=>O`
              <option value=${e.entry_id}>
                ${e.title}${e.room_name?` — ${e.room_name}`:""}
              </option>
            `)}
          <option value="__add__">+ Add another sensor</option>
        </select>
        ${e}
      </div>
    `}_renderWizard(){let e;switch(this._setupStep){case"guide":e=this._renderWizardGuide();break;case"corners":e=this._renderWizardCorners()}return O`
      <div class="wizard-container">
        ${this._renderHeader()} ${e}
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
    `}_renderWizardGuide(){const e=(e,t,i=!1,r=0)=>Z`
      <g transform="translate(${e}, ${t}) rotate(${r}) scale(${i?-.7:.7}, 0.7)">
        <circle cx="0" cy="-12" r="4" fill="var(--primary-color, #03a9f4)"/>
        <line x1="0" y1="-8" x2="0" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="-4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="-5" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="5" y2="-1" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
      </g>
    `,t=(e,t,i,r)=>{const o=i-e,s=r-t,n=Math.sqrt(o*o+s*s),a=o/n,l=s/n,d=i-40*a,c=r-40*l;return Z`
        <line x1="${e+40*a}" y1="${t+40*l}" x2="${d}" y2="${c}" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <polygon points="${d},${c} ${d-8*a+4*l},${c-8*l-4*a} ${d-8*a-4*l},${c-8*l+4*a}" fill="var(--primary-color, #03a9f4)" opacity="0.5"/>
      `},i=50,r=55,o=290,s=55,n=290,a=225,l=50,d=235,c=98,h=225,p=Z`
      <svg viewBox="0 0 360 290" width="360" height="290" style="display: block; margin: 0 auto;">
        <!-- Room with rounded corners, soft fill -->
        <rect x="30" y="35" width="280" height="210" rx="8"
              fill="var(--secondary-background-color, #f5f5f5)"
              stroke="var(--divider-color, #d0d0d0)" stroke-width="2.5"/>

        <!-- Wall labels -->
        <text x="170" y="28" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">Front wall (sensor side)</text>
        <text x="170" y="262" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">Back wall</text>

        <!-- Arrows with walking figures: 1→2→3→4 -->
        ${t(i,r,o,s)}
        ${e(170,72)}
        ${t(o,s,n,a)}
        ${e(265,145,!1,90)}
        <!-- 3rd arrow flat from 3 to 4 badge, same gap as arrow 1 has from 2 -->
        ${t(n,a,c-15,a)}
        ${e(190,a-17,!0)}

        <!-- Corner 4 badge: same height as 3, just past arrow end -->
        <circle cx="${c}" cy="${h}" r="14" fill="#FF9800" opacity="0.15"/>
        <circle cx="${c}" cy="${h}" r="14" fill="none" stroke="#FF9800" stroke-width="2.5" stroke-dasharray="5 3"/>
        <text x="${c}" y="${h+5}" font-size="14" fill="#FF9800" font-weight="bold" text-anchor="middle">4</text>

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
        <circle cx="${i}" cy="${r}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${i}" cy="${r}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${i}" y="${r+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">1</text>

        <!-- Corner 2: front-right (sensor here) -->
        <circle cx="${o}" cy="${s}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${o}" cy="${s}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${o}" y="${s+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">2</text>

        <!-- Corner 3: back-right -->
        <circle cx="${n}" cy="${a}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${n}" cy="${a}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${n}" y="${a+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">3</text>

        <!-- Sensor icon outside the top-right corner -->
        <g transform="translate(${o+18}, ${s-18}) rotate(-45)">
          <rect x="-5" y="-7" width="10" height="14" rx="3" fill="var(--primary-color, #03a9f4)"/>
          <circle cx="0" cy="-11" r="3.5" fill="var(--primary-color, #03a9f4)" opacity="0.4"/>
        </g>
        <text x="${o+24}" y="${s-24}" font-size="10" fill="var(--primary-color, #03a9f4)" font-weight="500">Sensor</text>
      </svg>
    `;return O`
      <div style="max-width: 560px; margin: 0 auto;">
        <div class="setting-group">
          <h4 style="text-align: center; margin-bottom: 16px;">How room calibration works</h4>

          ${p}

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
    `}_renderWizardCorners(){const e=this._wizardCornerIndex,t=this._targets.filter(e=>e.active),i=t.length>0,r=t.length>1,o=this._wizardCorners.every(e=>null!==e),s=Ce[e]||"",[n,a]=Se[e]||["",""];return O`
      <div class="wizard-card">
        <h2>Calibrate room size</h2>
        <p>
          Walk to each corner of the room and click Mark. The sensor will
          record your position over ${5} seconds.
        </p>

        ${o?V:O`
            <p class="corner-instruction">
              <strong>Corner ${e+1}/4:</strong> Walk to the
              <strong>${s.toLowerCase()}</strong> corner.
            </p>
        `}

        <div class="corner-progress">
          ${Ce.map((t,i)=>{const r=!!this._wizardCorners[i];return O`
                <span
                  class="corner-chip ${r?"done":""} ${i===e?"active":""}"
                  @click=${()=>{this._wizardCornerIndex=i}}
                >
                  ${t} ${r?"✓":""}
                </span>
                ${i<3?O`
                  <span class="corner-arrow ${i<e?"done":""}">›</span>
                `:V}
              `})}
        </div>

        ${o?V:O`

            <div class="corner-offsets" key="${e}">
              <span class="offset-label">Distance from:</span>
              <input
                type="number"
                class="offset-input"
                min="0"
                step="1"
                placeholder="${n} (cm)"
                .value=${this._wizardCorners[e]?.offset_side?String(this._wizardCorners[e].offset_side/10):""}
                @change=${t=>{const i=10*(parseFloat(t.target.value)||0),r=this._wizardCorners[e];r&&(r.offset_side=i)}}
              />
              <input
                type="number"
                class="offset-input"
                min="0"
                step="1"
                placeholder="${a} (cm)"
                .value=${this._wizardCorners[e]?.offset_fb?String(this._wizardCorners[e].offset_fb/10):""}
                @change=${t=>{const i=10*(parseFloat(t.target.value)||0),r=this._wizardCorners[e];r&&(r.offset_fb=i)}}
              />
            </div>

            ${this._renderMiniSensorView()}

            ${i?r?O`<p class="no-target-warning">
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
                ?disabled=${!i||r||this._wizardCapturing}
                @click=${()=>this._wizardStartCapture()}
              >
                Mark ${s}
              </button>
            </div>
          `}
      </div>
    `}_renderMiniSensorView(){const e=Re.FOV_X_EXTENT,t=De,i=200,r=-e,o=t*Math.cos(Re.FOV_HALF_ANGLE),s=`M 0 0 L ${r} ${o} A 6000 6000 0 0 0 ${e} ${o} Z`,n=[2e3,4e3].map(e=>{const t=e*Math.sin(Re.FOV_HALF_ANGLE),i=e*Math.cos(Re.FOV_HALF_ANGLE);return`M ${-t} ${i} A ${e} ${e} 0 0 0 ${t} ${i}`});return O`
      <div class="mini-grid-container">
        <div class="sensor-fov-view">
          <svg
            class="sensor-fov-svg"
            viewBox="${-e-i} ${-200} ${2*e+400} ${6400}"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="${s}"
              fill="rgba(3, 169, 244, 0.10)"
              stroke="rgba(3, 169, 244, 0.3)"
              stroke-width="30"
            />
            ${n.map(e=>Z`
                <path
                  d="${e}"
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
          ${this._wizardCorners.filter(e=>null!==e).map((e,t)=>{const{xPct:i,yPct:r}=this._rawToFovPct(e.raw_x,e.raw_y);return O`
                <div
                  class="mini-grid-captured"
                  style="left: ${i}%; top: ${r}%;"
                  title="${Ce[t]}"
                ></div>
              `})}
          <!-- Live targets (per-target colors) -->
          ${this._targets.map((e,t)=>e.active?O`
              <div
                class="mini-grid-target"
                style="${this._getWizardTargetStyle(e)} background: ${Te[t]||Te[0]};"
              ></div>
            `:V)}
        </div>
      </div>
    `}_renderSaveCancelButtons(){return O`
      <div class="save-cancel-bar">
        <button class="wizard-btn wizard-btn-back"
          @click=${()=>{this._dirty=!1,this._view="live",this._loadEntryConfig(this._selectedEntryId)}}
        >Cancel</button>
        <button class="wizard-btn wizard-btn-primary"
          ?disabled=${this._saving||!this._dirty}
          @click=${this._applyLayout}
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
    `}_renderLiveGrid(){const e=this._getRoomBounds(),t=e.minCol>e.maxCol,i=t?0:e.minCol,r=t?19:e.maxCol,o=t?0:e.minRow,s=t?19:e.maxRow,n=r-i+1,a=s-o+1,l=Math.min(480,.55*(this.offsetWidth||800)),d=Math.min(Math.floor(l/n),Math.floor(l/a),32);return O`
      <div
        class="grid"
        style="grid-template-columns: repeat(${n}, ${d}px); grid-template-rows: repeat(${a}, ${d}px);"
      >
        ${this._renderVisibleCells(i,r,o,s,d)}
      </div>
      ${this._renderFurnitureOverlay(d,i,o,n,a)}
      <div class="targets-overlay" style="pointer-events: none;">
        ${this._targets.map((e,t)=>{if(!e.active)return V;const r=this._mapTargetToGridCell(e);if(!r)return V;const s=(r.col-i)/n*100,l=(r.row-o)/a*100;return O`
            <div
              class="target-dot"
              style="left: ${s}%; top: ${l}%; background: ${Te[t]||Te[0]};"
            ></div>
          `})}
      </div>
    `}_renderUncalibratedFov(){const e=this._sensorState.occupancy,t=e?"#4CAF50":"var(--primary-color, #03a9f4)",i=150,r=10,o=180,s=30*Math.PI/180,n=150*Math.PI/180,a=i+o*Math.cos(s),l=r+o*Math.sin(s),d=i+o*Math.cos(n),c=r+o*Math.sin(n);return O`
      <div style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
        <svg viewBox="0 0 300 210" width="300" height="210" style="display: block;">
          <!-- Sensor at top center -->
          <rect x="${144}" y="0" width="12" height="8" rx="3" fill="${t}"/>
          <circle cx="${i}" cy="0" r="4" fill="${t}" opacity="0.4"/>

          <!-- 120° FOV wedge with rounded arc end -->
          <path d="M ${i} ${r} L ${a} ${l} A ${o} ${o} 0 0 1 ${d} ${c} Z"
                fill="${t}" fill-opacity="${e?.15:.06}"
                stroke="${t}" stroke-width="1" stroke-opacity="0.2"/>

          <!-- Range arcs -->
          ${[60,120,180].map(e=>{const o=i+e*Math.cos(s),a=r+e*Math.sin(s),l=i+e*Math.cos(n),d=r+e*Math.sin(n);return Z`
              <path d="M ${o} ${a} A ${e} ${e} 0 0 1 ${l} ${d}"
                    fill="none" stroke="${t}" stroke-width="1"
                    stroke-dasharray="4 3" opacity="0.2"/>
            `})}

          <!-- Edge lines -->
          <line x1="${i}" y1="${r}" x2="${a}" y2="${l}" stroke="${t}" stroke-width="0.5" opacity="0.2"/>
          <line x1="${i}" y1="${r}" x2="${d}" y2="${c}" stroke="${t}" stroke-width="0.5" opacity="0.2"/>

          <!-- Target dots -->
          ${this._targets.map((e,t)=>{if(!e.active)return V;const s=Math.sqrt(e.raw_x*e.raw_x+e.raw_y*e.raw_y),n=Math.atan2(e.raw_x,e.raw_y),a=Math.min(s/6e3,1)*o,l=Math.PI/2+n,d=i+a*Math.cos(l),c=r+a*Math.sin(l);return Z`<circle cx="${d}" cy="${c}" r="5" fill="${Te[t]||Te[0]}"/>`})}

          ${e?Z`
            <text x="${i}" y="120" font-size="13" fill="${t}" text-anchor="middle" font-weight="500">Detected</text>
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
    `}_renderNeedsCalibration(){const e=Z`
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
    `,t=(()=>{const e=28,t=28,i=180,r=-15*Math.PI/180,o=105*Math.PI/180,s=e+i*Math.cos(r),n=t+i*Math.sin(r),a=e+i*Math.cos(o),l=t+i*Math.sin(o),d=(i,s)=>{const n=e+i*Math.cos(r),a=t+i*Math.sin(r),l=e+i*Math.cos(o),d=t+i*Math.sin(o),c=45*Math.PI/180,h=e+(i-10)*Math.cos(c),p=t+(i-10)*Math.sin(c);return Z`
          <path d="M ${n} ${a} A ${i} ${i} 0 0 1 ${l} ${d}"
                fill="none" stroke="var(--primary-color, #03a9f4)" stroke-width="1"
                stroke-dasharray="4 3" opacity="0.35" clip-path="url(#room-clip)"/>
          <text x="${h}" y="${p}" font-size="8" fill="var(--secondary-text-color, #aaa)"
                text-anchor="middle" clip-path="url(#room-clip)">${s}</text>
        `};return Z`
        <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
          <defs>
            <clipPath id="room-clip"><rect x="20" y="20" width="160" height="120"/></clipPath>
          </defs>
          <!-- Room outline -->
          <rect x="20" y="20" width="160" height="120" fill="none" stroke="var(--divider-color, #ccc)" stroke-width="2" rx="2"/>
          <!-- 120° FOV wedge clipped to room -->
          <path d="M ${e} ${t} L ${a} ${l} A ${i} ${i} 0 0 0 ${s} ${n} Z"
                fill="var(--primary-color, #03a9f4)" opacity="0.08"
                clip-path="url(#room-clip)"/>
          <!-- Cone edge lines -->
          <line x1="${e}" y1="${t}" x2="${s}" y2="${n}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <line x1="${e}" y1="${t}" x2="${a}" y2="${l}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <!-- Range arcs -->
          ${d(60,"2m")}
          ${d(120,"4m")}
          ${d(180,"")}
          <!-- Sensor dot -->
          <circle cx="${e}" cy="${t}" r="6" fill="var(--primary-color, #03a9f4)"/>
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
                <div style="flex-shrink: 0;">${e}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">Mount height</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    Place the sensor <strong>1.5 to 2 meters</strong> from the floor
                  </div>
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 0;"/>

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${t}</div>
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
    `}_toggleAccordion(e){const t=new Set(this._openAccordions);t.has(e)?t.delete(e):t.add(e),this._openAccordions=t}_autoDetectionRange(){const e=Math.max(this._roomWidth,this._roomDepth);if(e<=0)return 0;const t=e/10;return 50*Math.ceil(t/50)}_renderSettings(){return O`
      <div class="panel">
        ${this._renderHeader()}
        <div class="settings-container">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500;">Settings</h2>
          ${[{id:"detection",label:"Detection Ranges",icon:"mdi:signal-distance-variant"},{id:"sensitivity",label:"Sensitivities and Timeout",icon:"mdi:tune-vertical"},{id:"reporting",label:"Reporting",icon:"mdi:format-list-checks"}].map(e=>{const t=this._openAccordions.has(e.id);return O`
              <div class="accordion">
                <button class="accordion-header" @click=${()=>this._toggleAccordion(e.id)}>
                  <ha-icon icon=${e.icon}></ha-icon>
                  <span class="accordion-title">${e.label}</span>
                  <ha-icon class="accordion-chevron" icon="mdi:chevron-down" ?data-open=${t}></ha-icon>
                </button>
                ${t?O`
                  <div class="accordion-body">
                    ${this._renderSettingsSection(e.id)}
                  </div>
                `:V}
              </div>
            `})}
        </div>
      </div>
    `}_renderSettingsSection(e){switch(e){case"detection":return this._renderDetectionRanges();case"sensitivity":return this._renderSensitivities();case"reporting":return this._renderReporting();default:return V}}_renderDetectionRanges(){const e=this._autoDetectionRange();return O`
      <div class="settings-section">
        <div class="setting-group">
          <h4>Target Sensor</h4>
          <div class="setting-row">
            <label>Detection range</label>
            <span class="setting-hint">Auto-set to furthest room point${e>0?` (${e} cm)`:""}</span>
            <input type="number" class="setting-input" .value=${String(e)} min="0" max="600" step="10" /> cm
          </div>
          <div class="setting-row">
            <label>Update rate</label>
            <select class="setting-input">
              <option value="5" selected>5 Hz (default)</option>
              <option value="10">10 Hz (fast)</option>
              <option value="2">2 Hz (low power)</option>
            </select>
          </div>
        </div>
        <div class="setting-group">
          <h4>Static Sensor</h4>
          <div class="setting-row">
            <label>Min distance</label>
            <input type="number" class="setting-input" value="0" min="0" max="2500" step="10" /> cm
          </div>
          <div class="setting-row">
            <label>Max distance</label>
            <span class="setting-hint">Auto-set to furthest room point${e>0?` (${e} cm)`:""}</span>
            <input type="number" class="setting-input" .value=${String(e)} min="0" max="2500" step="10" /> cm
          </div>
          <div class="setting-row">
            <label>Trigger distance</label>
            <input type="number" class="setting-input" .value=${String(e)} min="0" max="2500" step="10" /> cm
          </div>
        </div>
      </div>
    `}_renderSensitivities(){return O`
      <div class="settings-section">
        <div class="setting-group">
          <h4>Motion Sensor</h4>
          <div class="setting-row">
            <label>Presence timeout</label>
            <input type="number" class="setting-input" value="5" min="0" max="600" step="1" /> sec
          </div>
        </div>
        <div class="setting-group">
          <h4>Static Sensor</h4>
          <div class="setting-row">
            <label>Presence timeout</label>
            <input type="number" class="setting-input" value="30" min="0" max="600" step="1" /> sec
          </div>
          <div class="setting-row">
            <label>Trigger sensitivity</label>
            <input type="range" class="setting-range" min="0" max="9" value="7" />
            <span class="setting-value">7</span>
          </div>
          <div class="setting-row">
            <label>Sustain sensitivity</label>
            <input type="range" class="setting-range" min="0" max="9" value="5" />
            <span class="setting-value">5</span>
          </div>
        </div>
        <div class="setting-group">
          <h4>Target Sensor</h4>
          ${this._renderZoneTypeProfile("Entrance / Exit",5,1,1,!0)}
          ${this._renderZoneTypeProfile("Thoroughfare",3,1,1,!1)}
          ${this._renderZoneTypeProfile("Living area",15,3,3,!1)}
          ${this._renderZoneTypeProfile("Bed / Sofa",60,5,1,!1)}
        </div>
      </div>
    `}_renderZoneTypeProfile(e,t,i,r,o){return O`
      <div class="zone-type-group">
        <h5>${e}</h5>
        <div class="setting-row">
          <label>Presence timeout</label>
          <input type="number" class="setting-input" value=${t} min="0" max="600" step="1" /> sec
        </div>
        <div class="setting-row">
          <label>Trigger sensitivity</label>
          <input type="range" class="setting-range" min="0" max="9" value=${i} />
          <span class="setting-value">${i}</span>
        </div>
        <div class="setting-row">
          <label>Sustain sensitivity</label>
          <input type="range" class="setting-range" min="0" max="9" value=${r} />
          <span class="setting-value">${r}</span>
        </div>
        <div class="setting-row">
          <label>Expect appear/vanish</label>
          <input type="checkbox" class="setting-toggle" ?checked=${o} />
        </div>
      </div>
    `}_renderReporting(){return O`
      <div class="settings-section">
        <div class="setting-group">
          <h4>Room level</h4>
          <div class="setting-row">
            <label>Occupancy</label>
            <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Static presence</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Motion presence</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Target presence</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Target count</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
        </div>
        <div class="setting-group">
          <h4>Zone level</h4>
          <div class="setting-row">
            <label>Presence</label>
            <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Target count</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
        </div>
        <div class="setting-group">
          <h4>Target level</h4>
          <div class="setting-row">
            <label>XY position, relative to sensor</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>XY position, relative to grid</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Active</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Distance</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Angle</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Speed</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
          <div class="setting-row">
            <label>Resolution</label>
            <label class="toggle-switch"><input type="checkbox" /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>
    `}_renderEditor(){const e=this._frozenBounds??this._getRoomBounds(),t=e.minCol>e.maxCol,i=t?0:e.minCol,r=t?19:e.maxCol,o=t?0:e.minRow,s=t?19:e.maxRow,n=r-i+1,a=s-o+1,l=Math.min(520,.55*(this.offsetWidth||800)),d=Math.min(32,Math.floor(l/n),Math.floor(l/a));return O`
      <div class="panel" @click=${e=>{const t=e.target;t.closest(".grid")||t.closest(".zone-sidebar")||(this._activeZone=null)}}>
        ${this._renderHeader()}

        <div class="editor-layout">
          <div style="flex: 1; min-width: 0;">
            ${V}
            <!-- Grid -->
            <div class="grid-container" @click=${e=>{e.target.closest(".furniture-item")||(this._selectedFurnitureId=null)}}>
            <div
              class="grid"
              style="grid-template-columns: repeat(${n}, ${d}px); grid-template-rows: repeat(${a}, ${d}px);"
              @mouseup=${this._onCellMouseUp}
              @mouseleave=${this._onCellMouseUp}
            >
              ${this._renderVisibleCells(i,r,o,s,d)}
            </div>
            ${this._renderFurnitureOverlay(d,i,o,n,a)}
            <div class="targets-overlay" style="pointer-events: none;">
              ${this._targets.map((e,t)=>{if(!e.active)return V;const r=this._mapTargetToGridCell(e);if(!r)return V;const s=(r.col-i)/n*100,l=(r.row-o)/a*100;return O`
                    <div
                      class="target-dot"
                      style="left: ${s}%; top: ${l}%; background: ${Te[t]||Te[0]};"
                    ></div>
                  `})}
            </div>
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
                ${this._pendingRenames.map(e=>{const t=e.old_entity_id.split(".")[1]||e.old_entity_id,i=e.new_entity_id.split(".")[1]||e.new_entity_id,r=e.old_entity_id.split(".")[0]||"";return O`
                    <div style="
                      padding: 8px 12px; margin: 4px 0;
                      background: var(--secondary-background-color, #f5f5f5);
                      border-radius: 8px; font-size: 13px;
                    ">
                      <div style="color: var(--secondary-text-color, #888); font-size: 11px; margin-bottom: 2px;">
                        ${r}
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 12px;">
                        <span style="color: var(--secondary-text-color, #888); text-decoration: line-through;">${t}</span>
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
            @input=${e=>{this._templateName=e.target.value}}
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
    `}_renderTemplateLoadDialog(){const e=this._getTemplates();return O`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>Load template</h3>
          ${0===e.length?O`<p class="overlay-help">No saved templates.</p>`:e.map(e=>O`
              <div class="template-item">
                <span class="template-item-name">${e.name}</span>
                <span class="template-item-size">${(e.roomWidth/1e3).toFixed(1)}m x ${(e.roomDepth/1e3).toFixed(1)}m</span>
                <button
                  class="wizard-btn wizard-btn-primary template-item-btn"
                  @click=${()=>this._loadTemplate(e.name)}
                >Load</button>
                <button
                  class="zone-remove-btn"
                  @click=${()=>this._deleteTemplate(e.name)}
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
    `}_renderVisibleCells(e,t,i,r,o){const s=[];for(let n=i;n<=r;n++)for(let i=e;i<=t;i++){const e=n*Ae+i,t=this._getCellColor(e),r=this._getCellOverlayColor(e),a=r?`background: ${t}; width: ${o}px; height: ${o}px; outline: 2px solid ${r}; z-index: 1;`:`background: ${t}; width: ${o}px; height: ${o}px;`;s.push(O`
          <div
            class="cell"
            style=${a}
            @mousedown=${()=>this._onCellMouseDown(e)}
            @mouseenter=${()=>this._onCellMouseEnter(e)}
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
              @change=${e=>{this._roomSensitivity=parseInt(e.target.value)}}
              @click=${e=>e.stopPropagation()}
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
            @click=${e=>{e.stopPropagation(),this._clearOverlay(2)}}
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
            @click=${e=>{e.stopPropagation(),this._clearOverlay(3)}}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
      </div>

      <hr class="zone-separator"/>
      <div class="zone-scroll-area">
      <!-- Named zones 1..N -->
      ${this._zoneConfigs.map((e,t)=>{if(null===e)return V;const i=t+1;return O`
          <div
            class="zone-item ${this._activeZone===i?"active":""}"
            @click=${()=>{this._activeZone=i}}
          >
            <div class="zone-item-row">
              <div class="zone-color-dot" style="background: ${e.color};"></div>
              <input
                class="zone-name-input"
                type="text"
                .value=${e.name}
                @input=${i=>{const r=i.target.value,o=[...this._zoneConfigs];o[t]={...e,name:r},this._zoneConfigs=o}}
                @click=${e=>{e.stopPropagation(),this._activeZone=i}}
                @focus=${()=>{this._activeZone=i}}
              />
              <button
                class="zone-remove-btn"
                @click=${e=>{e.stopPropagation(),this._removeZone(i)}}
              >
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            </div>
            ${this._activeZone===i?O`
              <div class="zone-item-row zone-settings-row">
                <label class="zone-setting-label">Sensitivity</label>
                <select
                  class="sensitivity-select"
                  .value=${String(e.sensitivity)}
                  @change=${i=>{const r=parseInt(i.target.value),o=[...this._zoneConfigs];o[t]={...e,sensitivity:r},this._zoneConfigs=o}}
                  @click=${e=>e.stopPropagation()}
                >
                  <option value="0">Low</option>
                  <option value="1">Medium</option>
                  <option value="2">High</option>
                </select>
                <input
                  type="color"
                  class="zone-color-picker"
                  .value=${e.color}
                  @input=${i=>{const r=i.target.value,o=[...this._zoneConfigs];o[t]={...e,color:r},this._zoneConfigs=o}}
                  @click=${e=>e.stopPropagation()}
                />
              </div>
            `:V}
          </div>
        `})}

      ${this._zoneConfigs.some(e=>null===e)?O`
          <button class="add-zone-btn" @click=${this._addZone}>
            <ha-icon icon="mdi:plus"></ha-icon>
            Add zone
          </button>
        `:V}
      </div>
    `}_renderFurnitureOverlay(e,t,i,r,o){if(!this._furniture.length)return V;const s=Math.ceil(this._roomWidth/Ee),n=Math.floor((Ae-s)/2),a=e+1,l="furniture"===this._sidebarTab;return O`
      <div class="furniture-overlay ${l?"":"non-interactive"}">
        ${this._furniture.map(r=>{const o=(n-t)*a+this._mmToPx(r.x,e),s=(0-i)*a+this._mmToPx(r.y,e),l=this._mmToPx(r.width,e),d=this._mmToPx(r.height,e),c=this._selectedFurnitureId===r.id;return O`
            <div
              class="furniture-item ${c?"selected":""}"
              data-id="${r.id}"
              style="
                left: ${o}px; top: ${s}px;
                width: ${l}px; height: ${d}px;
                transform: rotate(${r.rotation}deg);
              "
              @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"move")}
            >
              ${"svg"===r.type&&me[r.icon]?Z`<svg viewBox="${me[r.icon].viewBox}" preserveAspectRatio="none" class="furn-svg">
                    ${ye(me[r.icon].content)}
                  </svg>`:O`<ha-icon icon="${r.icon}" style="--mdc-icon-size: ${.6*Math.min(l,d)}px;"></ha-icon>`}
              ${c?O`
                <!-- Resize handles -->
                <div class="furn-handle furn-handle-n" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","n")}></div>
                <div class="furn-handle furn-handle-s" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","s")}></div>
                <div class="furn-handle furn-handle-e" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","e")}></div>
                <div class="furn-handle furn-handle-w" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","w")}></div>
                <div class="furn-handle furn-handle-ne" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","ne")}></div>
                <div class="furn-handle furn-handle-nw" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","nw")}></div>
                <div class="furn-handle furn-handle-se" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","se")}></div>
                <div class="furn-handle furn-handle-sw" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"resize","sw")}></div>
                <!-- Rotate handle with stem -->
                <div class="furn-rotate-stem"></div>
                <div class="furn-rotate-handle" @pointerdown=${e=>this._onFurniturePointerDown(e,r.id,"rotate")}>
                  <ha-icon icon="mdi:rotate-right" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
                <!-- Delete button -->
                <div class="furn-delete-btn" @pointerdown=${e=>{e.stopPropagation(),this._removeFurniture(r.id)}}>
                  <ha-icon icon="mdi:close" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
              `:V}
            </div>
          `})}
      </div>
    `}_renderLiveSidebar(){const e=this._sensorState,t=this._zoneState,i=[{id:"occupancy",label:"Occupancy",on:e.occupancy,info:"Combined occupancy from all sources — PIR motion, static mmWave presence, and zone tracking. Shows detected if any source detects presence."},{id:"static",label:"Static presence",on:e.static_presence,info:"mmWave radar detects stationary people by measuring micro-movements like breathing. Works through furniture and blankets."},{id:"motion",label:"PIR motion",on:e.pir_motion,info:"Passive infrared sensor detects movement by sensing body heat. Fast response but only triggers on motion, not stationary presence."}];for(let e=0;e<7;e++){const r=this._zoneConfigs[e];if(!r)continue;const o=e+1,s=t.occupancy[o]??!1,n=t.target_counts[o]??0;i.push({id:`zone_${o}`,label:r.name,on:s,info:`Zone ${o} occupancy. Currently ${n} target${1!==n?"s":""} detected. Sensitivity determines how many consecutive frames are needed to confirm presence.`})}const r=[];null!==e.illuminance&&r.push({id:"illuminance",label:"Illuminance",value:`${e.illuminance.toFixed(1)} lux`}),null!==e.temperature&&r.push({id:"temperature",label:"Temperature",value:`${e.temperature.toFixed(1)} °C`}),null!==e.humidity&&r.push({id:"humidity",label:"Humidity",value:`${e.humidity.toFixed(1)} %`}),null!==e.co2&&r.push({id:"co2",label:"CO₂",value:`${Math.round(e.co2)} ppm`});const o=i.length>3;return O`
      <div style="padding: 8px 0;">
        <div class="live-section-header">Presence</div>
        ${i.slice(0,3).map(e=>O`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${e.on?"on":"off"}"></div>
            <span class="live-sensor-label">${e.label}</span>
            <span class="live-sensor-state ${e.on?"detected":""}">${e.on?"Detected":"Clear"}</span>
            <button class="live-sensor-info-btn"
              @click=${()=>{this._expandedSensorInfo=this._expandedSensorInfo===e.id?null:e.id}}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo===e.id?O`
            <div class="live-sensor-info-text">${e.info}</div>
          `:V}
        `)}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        <button class="live-section-header live-section-link" @click=${()=>{this._view="editor",this._sidebarTab="zones"}}>Detection zones</button>
        ${o?i.slice(3).map(e=>O`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${e.on?"on":"off"}"></div>
            <span class="live-sensor-label">${e.label}</span>
            <span class="live-sensor-state ${e.on?"detected":""}">${e.on?"Detected":"Clear"}</span>
            <button class="live-sensor-info-btn"
              @click=${()=>{this._expandedSensorInfo=this._expandedSensorInfo===e.id?null:e.id}}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo===e.id?O`
            <div class="live-sensor-info-text">${e.info}</div>
          `:V}
        `):O`
          <button class="live-nav-link" style="padding: 4px 12px;" @click=${()=>{this._view="editor",this._sidebarTab="zones"}}>
            <ha-icon icon="mdi:plus" style="--mdc-icon-size: 16px;"></ha-icon>
            Add zones
          </button>
        `}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        ${r.length?O`
          <div class="live-section-header">Environment</div>
          ${r.map(e=>O`
            <div class="live-sensor-row">
              <span class="live-sensor-label">${e.label}</span>
              <span class="live-sensor-value">${e.value}</span>
            </div>
          `)}
        `:V}

      </div>
    `}_renderFurnitureSidebar(){const e=this._furniture.find(e=>e.id===this._selectedFurnitureId);return O`
      ${e?O`
        <div class="furn-selected-info">
          <div class="zone-item-row">
            <ha-icon icon="${e.icon}" style="--mdc-icon-size: 20px;"></ha-icon>
            <strong>${e.label}</strong>
            <button class="zone-remove-btn" @click=${()=>this._removeFurniture(e.id)}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="furn-dims">
            <label>
              W (mm)
              <input type="number" min="100" step="50" .value=${String(Math.round(e.width))}
                @change=${t=>this._updateFurniture(e.id,{width:parseInt(t.target.value)})}
              />
            </label>
            <label>
              H (mm)
              <input type="number" min="100" step="50" .value=${String(Math.round(e.height))}
                @change=${t=>this._updateFurniture(e.id,{height:parseInt(t.target.value)})}
              />
            </label>
            <label>
              Rot
              <input type="number" step="5" .value=${String(Math.round(e.rotation))}
                @change=${t=>this._updateFurniture(e.id,{rotation:parseInt(t.target.value)%360})}
              />
            </label>
          </div>
        </div>
      `:V}

      <div class="furn-catalog">
        ${be.map(e=>O`
          <button class="furn-sticker" @click=${()=>this._addFurniture(e)}>
            ${"svg"===e.type&&me[e.icon]?Z`<svg viewBox="${me[e.icon].viewBox}" class="furn-sticker-svg">
                  ${ye(me[e.icon].content)}
                </svg>`:O`<ha-icon icon="${e.icon}" style="--mdc-icon-size: 24px;"></ha-icon>`}
            <span>${e.label}</span>
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
              @value-changed=${e=>{this._customIconValue=e.detail.value||""}}
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
    `}}Re.FOV_HALF_ANGLE=Math.PI/3,Re.FOV_X_EXTENT=De*Math.sin(Math.PI/3),Re.styles=((e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[r+1],e[0]);return new s(i,e,r)})`
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
    .settings-container {
      max-width: 560px;
      margin: 0 auto;
      padding: 0 16px;
    }

    .accordion {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      margin-bottom: 12px;
      overflow: hidden;
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
      width: 100%;
      text-align: left;
      font-size: 15px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
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

    .setting-row label {
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      flex: 1;
      min-width: 120px;
    }

    .setting-hint {
      font-size: 12px;
      color: var(--secondary-text-color, #757575);
      width: 100%;
      order: 3;
    }

    .setting-value {
      font-size: 14px;
      color: var(--secondary-text-color, #757575);
      font-weight: 500;
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

    select.setting-input {
      width: auto;
      text-align: left;
    }

    .setting-range {
      width: 120px;
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
      height: 22px;
      flex-shrink: 0;
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
  `,e([pe({attribute:!1})],Re.prototype,"hass",void 0),e([ue()],Re.prototype,"_grid",void 0),e([ue()],Re.prototype,"_zoneConfigs",void 0),e([ue()],Re.prototype,"_activeZone",void 0),e([ue()],Re.prototype,"_sidebarTab",void 0),e([ue()],Re.prototype,"_expandedSensorInfo",void 0),e([ue()],Re.prototype,"_showLiveMenu",void 0),e([ue()],Re.prototype,"_showDeleteCalibrationDialog",void 0),e([ue()],Re.prototype,"_showCustomIconPicker",void 0),e([ue()],Re.prototype,"_customIconValue",void 0),e([ue()],Re.prototype,"_furniture",void 0),e([ue()],Re.prototype,"_selectedFurnitureId",void 0),e([ue()],Re.prototype,"_pendingRenames",void 0),e([ue()],Re.prototype,"_showRenameDialog",void 0),e([ue()],Re.prototype,"_roomSensitivity",void 0),e([ue()],Re.prototype,"_targets",void 0),e([ue()],Re.prototype,"_sensorState",void 0),e([ue()],Re.prototype,"_zoneState",void 0),e([ue()],Re.prototype,"_isPainting",void 0),e([ue()],Re.prototype,"_paintAction",void 0),e([ue()],Re.prototype,"_saving",void 0),e([ue()],Re.prototype,"_dirty",void 0),e([ue()],Re.prototype,"_showUnsavedDialog",void 0),e([ue()],Re.prototype,"_showTemplateSave",void 0),e([ue()],Re.prototype,"_showTemplateLoad",void 0),e([ue()],Re.prototype,"_templateName",void 0),e([ue()],Re.prototype,"_entries",void 0),e([ue()],Re.prototype,"_selectedEntryId",void 0),e([ue()],Re.prototype,"_loading",void 0),e([ue()],Re.prototype,"_setupStep",void 0),e([ue()],Re.prototype,"_wizardSaving",void 0),e([ue()],Re.prototype,"_wizardCornerIndex",void 0),e([ue()],Re.prototype,"_wizardCorners",void 0),e([ue()],Re.prototype,"_wizardRoomWidth",void 0),e([ue()],Re.prototype,"_wizardRoomDepth",void 0),e([ue()],Re.prototype,"_wizardCapturing",void 0),e([ue()],Re.prototype,"_wizardCaptureProgress",void 0),e([ue()],Re.prototype,"_view",void 0),e([ue()],Re.prototype,"_openAccordions",void 0),e([ue()],Re.prototype,"_perspective",void 0),e([ue()],Re.prototype,"_roomWidth",void 0),e([ue()],Re.prototype,"_roomDepth",void 0),customElements.get("everything-presence-pro-panel")||customElements.define("everything-presence-pro-panel",Re);export{Re as EverythingPresenceProPanel};
