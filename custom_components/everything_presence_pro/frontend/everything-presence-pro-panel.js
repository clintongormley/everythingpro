function t(t,e,i,r){var o,s=arguments.length,n=s<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,r);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(s<3?o(n):s>3?o(e,i,n):o(e,i))||n);return s>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),o=new WeakMap;let s=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(e,t))}return t}toString(){return this.cssText}};const n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new s("string"==typeof t?t:t+"",void 0,r))(e)})(t):t,{is:a,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,v=g?g.emptyScript:"",f=u.reactiveElementPolyfillSupport,m=(t,e)=>t,_={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!a(t,e),b={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(t,i,e);void 0!==r&&l(this.prototype,t,r)}}static getPropertyDescriptor(t,e,i){const{get:r,set:o}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:r,set(e){const s=r?.call(this);o?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...c(t),...h(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,r)=>{if(i)t.adoptedStyleSheets=r.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of r){const r=document.createElement("style"),o=e.litNonce;void 0!==o&&r.setAttribute("nonce",o),r.textContent=i.cssText,t.appendChild(r)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,i);if(void 0!==r&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:_).toAttribute(e,i.type);this._$Em=t,null==o?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,e){const i=this.constructor,r=i._$Eh.get(t);if(void 0!==r&&this._$Em!==r){const t=i.getPropertyOptions(r),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:_;this._$Em=r;const s=o.fromAttribute(e,t.type);this[r]=s??this._$Ej?.get(r)??s,this._$Em=null}}requestUpdate(t,e,i,r=!1,o){if(void 0!==t){const s=this.constructor;if(!1===r&&(o=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??y)(o,e)||i.useDefault&&i.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:r,wrapped:o},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==o||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===r&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,r=this[e];!0!==t||this._$AL.has(e)||void 0===r||this.C(e,void 0,i,r)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[m("elementProperties")]=new Map,x[m("finalized")]=new Map,f?.({ReactiveElement:x}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,k=t=>t,$=w.trustedTypes,z=$?$.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,A="?"+C,M=`<${A}>`,P=document,E=()=>P.createComment(""),T=t=>null===t||"object"!=typeof t&&"function"!=typeof t,D=Array.isArray,R="[ \t\n\f\r]",W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,F=/-->/g,I=/>/g,H=RegExp(`>|${R}(?:([^\\s"'>=/]+)(${R}*=${R}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),N=/'/g,U=/"/g,O=/^(?:script|style|textarea|title)$/i,B=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),L=B(1),Z=B(2),V=Symbol.for("lit-noChange"),j=Symbol.for("lit-nothing"),X=new WeakMap,Y=P.createTreeWalker(P,129);function q(t,e){if(!D(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,r=[];let o,s=2===e?"<svg>":3===e?"<math>":"",n=W;for(let e=0;e<i;e++){const i=t[e];let a,l,d=-1,c=0;for(;c<i.length&&(n.lastIndex=c,l=n.exec(i),null!==l);)c=n.lastIndex,n===W?"!--"===l[1]?n=F:void 0!==l[1]?n=I:void 0!==l[2]?(O.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=H):void 0!==l[3]&&(n=H):n===H?">"===l[0]?(n=o??W,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?H:'"'===l[3]?U:N):n===U||n===N?n=H:n===F||n===I?n=W:(n=H,o=void 0);const h=n===H&&t[e+1].startsWith("/>")?" ":"";s+=n===W?i+M:d>=0?(r.push(a),i.slice(0,d)+S+i.slice(d)+C+h):i+C+(-2===d?e:h)}return[q(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),r]};class J{constructor({strings:t,_$litType$:e},i){let r;this.parts=[];let o=0,s=0;const n=t.length-1,a=this.parts,[l,d]=G(t,e);if(this.el=J.createElement(l,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=Y.nextNode())&&a.length<n;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(S)){const e=d[s++],i=r.getAttribute(t).split(C),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?it:"?"===n[1]?rt:"@"===n[1]?ot:et}),r.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:o}),r.removeAttribute(t));if(O.test(r.tagName)){const t=r.textContent.split(C),e=t.length-1;if(e>0){r.textContent=$?$.emptyScript:"";for(let i=0;i<e;i++)r.append(t[i],E()),Y.nextNode(),a.push({type:2,index:++o});r.append(t[e],E())}}}else if(8===r.nodeType)if(r.data===A)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=r.data.indexOf(C,t+1));)a.push({type:7,index:o}),t+=C.length-1}o++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,r){if(e===V)return e;let o=void 0!==r?i._$Co?.[r]:i._$Cl;const s=T(e)?void 0:e._$litDirective$;return o?.constructor!==s&&(o?._$AO?.(!1),void 0===s?o=void 0:(o=new s(t),o._$AT(t,i,r)),void 0!==r?(i._$Co??=[])[r]=o:i._$Cl=o),void 0!==o&&(e=K(t,o._$AS(t,e.values),o,r)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,r=(t?.creationScope??P).importNode(e,!0);Y.currentNode=r;let o=Y.nextNode(),s=0,n=0,a=i[0];for(;void 0!==a;){if(s===a.index){let e;2===a.type?e=new tt(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new st(o,this,t)),this._$AV.push(e),a=i[++n]}s!==a?.index&&(o=Y.nextNode(),s++)}return Y.currentNode=P,r}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,r){this.type=2,this._$AH=j,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),T(t)?t===j||null==t||""===t?(this._$AH!==j&&this._$AR(),this._$AH=j):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>D(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==j&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,r="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(e);else{const t=new Q(r,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=X.get(t.strings);return void 0===e&&X.set(t.strings,e=new J(t)),e}k(t){D(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,r=0;for(const o of t)r===e.length?e.push(i=new tt(this.O(E()),this.O(E()),this,this.options)):i=e[r],i._$AI(o),r++;r<e.length&&(this._$AR(i&&i._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,r,o){this.type=1,this._$AH=j,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=j}_$AI(t,e=this,i,r){const o=this.strings;let s=!1;if(void 0===o)t=K(this,t,e,0),s=!T(t)||t!==this._$AH&&t!==V,s&&(this._$AH=t);else{const r=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=K(this,r[i+n],e,n),a===V&&(a=this._$AH[n]),s||=!T(a)||a!==this._$AH[n],a===j?t=j:t!==j&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}s&&!r&&this.j(t)}j(t){t===j?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===j?void 0:t}}class rt extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==j)}}class ot extends et{constructor(t,e,i,r,o){super(t,e,i,r,o),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??j)===V)return;const i=this._$AH,r=t===j&&i!==j||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,o=t!==j&&(i===j||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class st{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(J,tt),(w.litHtmlVersions??=[]).push("3.3.2");const at=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let lt=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const r=i?.renderBefore??e;let o=r._$litPart$;if(void 0===o){const t=i?.renderBefore??null;r._$litPart$=o=new tt(e.insertBefore(E(),t),t,void 0,i??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}};lt._$litElement$=!0,lt.finalized=!0,at.litElementHydrateSupport?.({LitElement:lt});const dt=at.litElementPolyfillSupport;dt?.({LitElement:lt}),(at.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ct={attribute:!0,type:String,converter:_,reflect:!1,hasChanged:y},ht=(t=ct,e,i)=>{const{kind:r,metadata:o}=i;let s=globalThis.litPropertyMetadata.get(o);if(void 0===s&&globalThis.litPropertyMetadata.set(o,s=new Map),"setter"===r&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===r){const{name:r}=i;return{set(i){const o=e.get.call(this);e.set.call(this,i),this.requestUpdate(r,o,t,!0,i)},init(e){return void 0!==e&&this.C(r,void 0,t,e),e}}}if("setter"===r){const{name:r}=i;return function(i){const o=this[r];e.call(this,i),this.requestUpdate(r,o,t,!0,i)}}throw Error("Unsupported decorator location: "+r)};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function pt(t){return(e,i)=>"object"==typeof i?ht(t,e,i):((t,e,i)=>{const r=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),r?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ut(t){return pt({...t,state:!0,attribute:!1})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const gt=2;class vt{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ft extends vt{constructor(t){if(super(t),this.it=j,t.type!==gt)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===j||null==t)return this._t=void 0,this.it=t;if(t===V)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const e=[t];return e.raw=e,this._t={_$litType$:this.constructor.resultType,strings:e,values:[]}}}ft.directiveName="unsafeHTML",ft.resultType=1;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class mt extends ft{}mt.directiveName="unsafeSVG",mt.resultType=2;const _t=(t=>(...e)=>({_$litDirective$:t,values:e}))(mt);var yt;const bt={armchair:{viewBox:"0 0 256 256",content:'<rect x="16" y="16" width="224" height="224" rx="16" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="16" width="224" height="48" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="192" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="64" y="64" width="128" height="176" rx="8" stroke="black" stroke-width="8" fill="none"/>'},bath:{viewBox:"0 0 600 300",content:'<rect x="50" y="50" width="500" height="200" rx="40" stroke="black" stroke-width="8" fill="none"/><path d="M 100 220 C 100 240, 500 240, 500 220" stroke="black" stroke-width="8" fill="none"/><rect x="70" y="70" width="30" height="20" stroke="black" stroke-width="8" fill="none"/><rect x="80" y="90" width="10" height="20" stroke="black" stroke-width="8" fill="none"/><circle cx="510" cy="150" r="10" stroke="black" stroke-width="8" fill="none"/>'},"bed-double":{viewBox:"0 0 512 512",content:'<rect x="0" y="0" width="512" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H480C497.673 32 512 46.3269 512 64V128C512 145.673 497.673 160 480 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="272" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="480" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="496" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="496" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"bed-single":{viewBox:"0 0 256 512",content:'<rect x="0" y="0" width="256" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H224C241.673 32 256 46.3269 256 64V128C256 145.673 241.673 160 224 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="192" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="224" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="240" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="240" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"door-left":{viewBox:"0 0 256 256",content:'<rect x="0" y="210" width="80" height="20" fill="black"/><rect x="60" y="60" width="20" height="150" fill="black"/><rect x="200" y="210" width="56" height="20" fill="black"/><path d="M 80 60 A 150 150 0 0 1 200 210" stroke="black" stroke-width="3" fill="none"/>'},"door-right":{viewBox:"0 0 256 256",content:'<rect x="176" y="210" width="80" height="20" fill="black"/><rect x="176" y="60" width="20" height="150" fill="black"/><rect x="0" y="210" width="56" height="20" fill="black"/><path d="M 176 60 A 150 150 0 0 0 56 210" stroke="black" stroke-width="3" fill="none"/>'},"floor-lamp":{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" stroke="black" stroke-width="8" fill="none"/><circle cx="128" cy="128" r="16" fill="black"/><line x1="128" y1="112" x2="128" y2="48" stroke="black" stroke-width="8"/><circle cx="128" cy="48" r="8" fill="black"/><path d="M 64 64 A 128 128 0 0 1 192 64" stroke="black" stroke-width="8" stroke-dasharray="8 8"/>'},oven:{viewBox:"0 0 256 256",content:'<rect x="0" y="0" width="256" height="256" rx="16" stroke="black" stroke-width="16" fill="none"/><line x1="0" y1="224" x2="256" y2="224" stroke="black" stroke-width="16"/><circle cx="64" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="64" r="16" fill="black"/><circle cx="192" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="64" r="16" fill="black"/><circle cx="64" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="192" r="16" fill="black"/><circle cx="192" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="192" r="16" fill="black"/><rect x="32" y="240" width="192" height="16" rx="4" stroke="black" stroke-width="8" fill="black"/>'},plant:{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" fill="none"/><g transform="translate(128 128)"><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(72)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(144)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(216)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(288)" fill="none" stroke="black" stroke-width="12"/></g>'},shower:{viewBox:"0 0 256 256",content:'<path d="M 32 32 H 224 V 224 H 32 Z" stroke="black" stroke-width="16" fill="none"/><line x1="32" y1="32" x2="224" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><line x1="224" y1="32" x2="32" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><circle cx="128" cy="200" r="16" stroke="black" stroke-width="16" fill="none"/>'},"sofa-two-seater":{viewBox:"0 0 400 200",content:'<rect x="8" y="8" width="384" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="384" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="204" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"sofa-three-seater":{viewBox:"0 0 560 200",content:'<rect x="8" y="8" width="544" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="544" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="200" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="376" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"table-dining-room":{viewBox:"0 0 600 400",content:'<rect x="150" y="100" width="300" height="200" stroke="black" stroke-width="8" fill="none" rx="10"/><rect x="80" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="460" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/>'},"table-dining-room-round":{viewBox:"0 0 400 400",content:'<circle cx="200" cy="200" r="100" stroke="black" stroke-width="8" fill="none"/><rect x="150" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="150" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="30" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="310" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/>'},television:{viewBox:"0 0 256 64",content:'<line x1="0" y1="56" x2="256" y2="56" stroke="black" stroke-width="16"/><rect x="32" y="16" width="192" height="40" rx="4" stroke="black" stroke-width="16" fill="none"/><rect x="40" y="24" width="176" height="24" rx="2" stroke="black" stroke-width="8" fill="none"/>'},toilet:{viewBox:"0 0 300 400",content:'<rect x="75" y="30" width="150" height="80" rx="10" stroke="black" stroke-width="8" fill="none"/><path d="M 75 110 C 75 110, 50 160, 50 210 C 50 310, 125 360, 150 360 C 175 360, 250 310, 250 210 C 250 160, 225 110, 225 110 Z" stroke="black" stroke-width="8" fill="none"/><path d="M 100 150 C 100 150, 75 190, 75 220 C 75 300, 125 340, 150 340 C 175 340, 225 300, 225 220 C 225 190, 200 150, 200 150 Z" stroke="black" stroke-width="8" fill="none"/><circle cx="150" cy="70" r="15" stroke="black" stroke-width="8" fill="none"/>'}},xt=[{type:"svg",icon:"armchair",label:"Armchair",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"bath",label:"Bath",defaultWidth:1700,defaultHeight:700},{type:"svg",icon:"bed-double",label:"Double bed",defaultWidth:1600,defaultHeight:2e3},{type:"svg",icon:"bed-single",label:"Single bed",defaultWidth:900,defaultHeight:2e3},{type:"svg",icon:"door-left",label:"Door (left swing)",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"door-right",label:"Door (right swing)",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"table-dining-room",label:"Dining table",defaultWidth:1600,defaultHeight:900},{type:"svg",icon:"table-dining-room-round",label:"Round table",defaultWidth:1e3,defaultHeight:1e3},{type:"svg",icon:"floor-lamp",label:"Lamp",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"oven",label:"Oven / stove",defaultWidth:600,defaultHeight:600},{type:"svg",icon:"plant",label:"Plant",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"shower",label:"Shower",defaultWidth:900,defaultHeight:900},{type:"svg",icon:"sofa-two-seater",label:"Sofa (2 seat)",defaultWidth:1600,defaultHeight:800},{type:"svg",icon:"sofa-three-seater",label:"Sofa (3 seat)",defaultWidth:2400,defaultHeight:800},{type:"svg",icon:"television",label:"TV",defaultWidth:1200,defaultHeight:200},{type:"svg",icon:"toilet",label:"Toilet",defaultWidth:400,defaultHeight:700},{type:"icon",icon:"mdi:countertop",label:"Counter",defaultWidth:2e3,defaultHeight:600,lockAspect:!1},{type:"icon",icon:"mdi:cupboard",label:"Cupboard",defaultWidth:1e3,defaultHeight:500,lockAspect:!1},{type:"icon",icon:"mdi:desk",label:"Desk",defaultWidth:1400,defaultHeight:700,lockAspect:!1},{type:"icon",icon:"mdi:fridge",label:"Fridge",defaultWidth:700,defaultHeight:700,lockAspect:!0},{type:"icon",icon:"mdi:speaker",label:"Speaker",defaultWidth:300,defaultHeight:300,lockAspect:!0},{type:"icon",icon:"mdi:window-open-variant",label:"Window",defaultWidth:1e3,defaultHeight:150,lockAspect:!1}],wt=t=>!!(3&t),kt=t=>3&t,$t=t=>t>>2&7,zt=(t,e)=>-4&t|3&e,St=(t,e)=>-29&t|(7&e)<<2,Ct=["Front-left","Front-right","Back-right","Back-left"],At=[["from left wall","from front wall"],["from right wall","from front wall"],["from right wall","from back wall"],["from left wall","from back wall"]],Mt=20,Pt=320,Et=300,Tt=6e3,Dt=["#2196F3","#FF5722","#4CAF50"],Rt=["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7"];let Wt=yt=class extends lt{constructor(){super(...arguments),this._grid=new Uint8Array(Pt),this._zoneConfigs=new Array(7).fill(null),this._activeZone=null,this._sidebarTab="zones",this._expandedSensorInfo=null,this._showCustomIconPicker=!1,this._customIconValue="",this._furniture=[],this._selectedFurnitureId=null,this._dragState=null,this._pendingRenames=[],this._showRenameDialog=!1,this._roomSensitivity=1,this._targets=[],this._isPainting=!1,this._paintAction="set",this._frozenBounds=null,this._saving=!1,this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation=null,this._showTemplateSave=!1,this._showTemplateLoad=!1,this._templateName="",this._entries=[],this._selectedEntryId="",this._loading=!0,this._setupStep=null,this._wizardSaving=!1,this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardRoomWidth=0,this._wizardRoomDepth=0,this._wizardCapturing=!1,this._wizardCaptureProgress=0,this._view="editor",this._settingsSection="tracking",this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._beforeUnloadHandler=t=>{this._dirty&&(t.preventDefault(),t.returnValue="")},this._originalPushState=null,this._originalReplaceState=null,this._interceptNavigation=()=>!!this._dirty&&(this._showUnsavedDialog=!0,this._pendingNavigation=null,!0),this._smoothBuffer=[]}connectedCallback(){super.connectedCallback(),this._initialize(),window.addEventListener("beforeunload",this._beforeUnloadHandler),this._originalPushState=history.pushState.bind(history),this._originalReplaceState=history.replaceState.bind(history);const t=this;history.pushState=function(...e){t._interceptNavigation()?t._pendingNavigation=()=>{t._originalPushState(...e),window.dispatchEvent(new PopStateEvent("popstate"))}:t._originalPushState(...e)},history.replaceState=function(...e){t._interceptNavigation()?t._pendingNavigation=()=>{t._originalReplaceState(...e),window.dispatchEvent(new PopStateEvent("popstate"))}:t._originalReplaceState(...e)}}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeTargets(),window.removeEventListener("beforeunload",this._beforeUnloadHandler),this._originalPushState&&(history.pushState=this._originalPushState),this._originalReplaceState&&(history.replaceState=this._originalReplaceState)}updated(t){t.has("hass")&&this.hass&&this._loading&&!this._entries.length&&this._initialize()}async _initialize(){this.hass&&(this._loading=!0,await this._loadEntries(),this._selectedEntryId&&await this._loadEntryConfig(this._selectedEntryId),this._loading=!1)}async _loadEntries(){try{const t=await this.hass.callWS({type:"everything_presence_pro/list_entries"});this._entries=t.sort((t,e)=>(t.title||"").localeCompare(e.title||""))}catch{return void(this._entries=[])}const t=localStorage.getItem("epp_selected_entry"),e=t&&this._entries.find(e=>e.entry_id===t);this._selectedEntryId=e?t:this._entries[0]?.entry_id??""}async _loadEntryConfig(t){try{const e=await this.hass.callWS({type:"everything_presence_pro/get_config",entry_id:t});this._applyConfig(e)}catch{}this._subscribeTargets(t)}_applyConfig(t){const e=t.calibration;e?.perspective?(this._perspective=e.perspective,this._roomWidth=e.room_width||0,this._roomDepth=e.room_depth||0,this._setupStep=null):(this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._setupStep=null);const i=t.room_layout||{};this._roomSensitivity=i.room_sensitivity??1,this._furniture=(i.furniture||[]).map((t,e)=>({id:t.id||`f_load_${e}`,type:t.type||"icon",icon:t.icon||"mdi:help",label:t.label||"Item",x:t.x??0,y:t.y??0,width:t.width??600,height:t.height??600,rotation:t.rotation??0,lockAspect:t.lockAspect??"svg"!==t.type})),i.grid_bytes&&Array.isArray(i.grid_bytes)?this._grid=new Uint8Array(i.grid_bytes):this._roomWidth>0&&this._roomDepth>0?this._initGridFromRoom():this._grid=new Uint8Array(Pt);const r=i.zone_slots||i.zones||[];this._zoneConfigs=Array.from({length:7},(t,e)=>{const i=r[e];return i?{name:i.name||`Zone ${e+1}`,color:i.color||Rt[e%Rt.length],sensitivity:i.sensitivity??1}:null})}_subscribeTargets(t){if(this._unsubscribeTargets(),!this.hass||!t)return;this.hass.connection.subscribeMessage(t=>{const e=(t.targets||[]).map(t=>({x:t.x,y:t.y,raw_x:t.raw_x??t.x,raw_y:t.raw_y??t.y,speed:0,active:t.active}));this._targets=e},{type:"everything_presence_pro/subscribe_targets",entry_id:t}).then(t=>{this._unsubTargets=t})}_unsubscribeTargets(){this._unsubTargets&&(this._unsubTargets(),this._unsubTargets=void 0),this._targets=[]}_onCellMouseDown(t){if("furniture"===this._sidebarTab)return void(this._selectedFurnitureId=null);if(null===this._activeZone)return;this._isPainting=!0,this._frozenBounds=this._getRoomBounds();const e=this._grid[t];if(0===this._activeZone){const t=wt(e)&&0===$t(e)&&1===kt(e);this._paintAction=t?"clear":"set"}else if(-1===this._activeZone||-2===this._activeZone){const t=-1===this._activeZone?2:3;this._paintAction=kt(e)===t?"clear":"set"}else this._paintAction=$t(e)===this._activeZone?"clear":"set";this._applyPaintToCell(t)}_onCellMouseEnter(t){this._isPainting&&this._applyPaintToCell(t)}_onCellMouseUp(){this._isPainting=!1,this._frozenBounds=null}_applyPaintToCell(t){if(null===this._activeZone)return;const e=this._grid[t];if(this._grid=new Uint8Array(this._grid),0===this._activeZone)"set"===this._paintAction?this._grid[t]=1:this._grid[t]=0;else if(-1===this._activeZone||-2===this._activeZone){if(!wt(e))return;const i=-1===this._activeZone?2:3;"set"===this._paintAction?this._grid[t]=zt(e,i):this._grid[t]=zt(e,1)}else{if(!wt(e))return;"set"===this._paintAction?this._grid[t]=St(e,this._activeZone):this._grid[t]=St(e,0)}this._dirty=!0,this.requestUpdate()}_addZone(){const t=this._zoneConfigs.findIndex(t=>null===t);if(-1===t)return;const e=new Set(this._zoneConfigs.filter(t=>null!==t).map(t=>t.color)),i=Rt.find(t=>!e.has(t))??Rt[t%Rt.length],r=[...this._zoneConfigs];r[t]={name:`Zone ${t+1}`,color:i,sensitivity:1},this._zoneConfigs=r,this._activeZone=t+1,this._dirty=!0}_removeZone(t){if(t<1||t>7||null===this._zoneConfigs[t-1])return;this._grid=new Uint8Array(this._grid);for(let e=0;e<Pt;e++)$t(this._grid[e])===t&&(this._grid[e]=St(this._grid[e],0));const e=[...this._zoneConfigs];e[t-1]=null,this._zoneConfigs=e,this._activeZone===t&&(this._activeZone=null),this._dirty=!0,this.requestUpdate()}_clearOverlay(t){this._grid=new Uint8Array(this._grid);for(let e=0;e<Pt;e++)kt(this._grid[e])===t&&(this._grid[e]=zt(this._grid[e],1));this._dirty=!0,this.requestUpdate()}_addFurniture(t){const e={id:`f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,type:t.type,icon:t.icon,label:t.label,x:Math.max(0,(this._roomWidth-t.defaultWidth)/2),y:Math.max(0,(this._roomDepth-t.defaultHeight)/2),width:t.defaultWidth,height:t.defaultHeight,rotation:0,lockAspect:t.lockAspect??"icon"===t.type};this._furniture=[...this._furniture,e],this._selectedFurnitureId=e.id,this._dirty=!0}_addCustomFurniture(t){this._addFurniture({type:"icon",icon:t,label:"Custom",defaultWidth:600,defaultHeight:600,lockAspect:!1})}_removeFurniture(t){this._furniture=this._furniture.filter(e=>e.id!==t),this._selectedFurnitureId===t&&(this._selectedFurnitureId=null),this._dirty=!0}_updateFurniture(t,e){this._furniture=this._furniture.map(i=>i.id===t?{...i,...e}:i),this._dirty=!0}_mmToPx(t,e){return t/Et*(e+1)}_pxToMm(t,e){return t/(e+1)*Et}_onFurniturePointerDown(t,e,i,r){t.preventDefault(),t.stopPropagation(),this._selectedFurnitureId=e;const o=this._furniture.find(t=>t.id===e);if(!o)return;let s=0,n=0,a=0;if("rotate"===i){const i=this.shadowRoot?.querySelector(`.furniture-item[data-id="${e}"]`);if(i){const e=i.getBoundingClientRect();s=e.left+e.width/2,n=e.top+e.height/2,a=Math.atan2(t.clientY-n,t.clientX-s)*(180/Math.PI)}}this._dragState={type:i,id:e,startX:t.clientX,startY:t.clientY,origX:o.x,origY:o.y,origW:o.width,origH:o.height,origRot:o.rotation,handle:r,centerX:s,centerY:n,startAngle:a};const l=t=>this._onFurnitureDrag(t),d=()=>{this._dragState=null,window.removeEventListener("pointermove",l),window.removeEventListener("pointerup",d)};window.addEventListener("pointermove",l),window.addEventListener("pointerup",d)}_onFurnitureDrag(t){if(!this._dragState)return;const e=this._dragState,i=this.shadowRoot?.querySelector(".grid");if(!i)return;const r=i.firstElementChild?i.firstElementChild.offsetWidth:28,o=t.clientX-e.startX,s=t.clientY-e.startY;if("move"===e.type){const t=this._furniture.find(t=>t.id===e.id),i=t?.width??0,n=t?.height??0;this._updateFurniture(e.id,{x:Math.max(-i/2,Math.min(this._roomWidth-i/2,e.origX+this._pxToMm(o,r))),y:Math.max(-n/2,Math.min(this._roomDepth-n/2,e.origY+this._pxToMm(s,r)))})}else if("resize"===e.type&&e.handle){const t=this._pxToMm(o,r),i=this._pxToMm(s,r);let{origX:n,origY:a,origW:l,origH:d}=e;const c=this._furniture.find(t=>t.id===e.id);if(c?.lockAspect??!1){const r=Math.abs(t)>Math.abs(i)?t:i,o=e.origW/e.origH,s=e.handle.includes("w")||e.handle.includes("n")?-1:1;l=Math.max(100,e.origW+s*r),d=Math.max(100,l/o),l=d*o,e.handle.includes("w")&&(n=e.origX+(e.origW-l)),e.handle.includes("n")&&(a=e.origY+(e.origH-d))}else e.handle.includes("e")&&(l=Math.max(100,l+t)),e.handle.includes("w")&&(l=Math.max(100,l-t),n+=t),e.handle.includes("s")&&(d=Math.max(100,d+i)),e.handle.includes("n")&&(d=Math.max(100,d-i),a+=i);this._updateFurniture(e.id,{x:n,y:a,width:l,height:d})}else if("rotate"===e.type){const i=Math.atan2(t.clientY-(e.centerY??0),t.clientX-(e.centerX??0))*(180/Math.PI)-(e.startAngle??0);this._updateFurniture(e.id,{rotation:Math.round((e.origRot+i+360)%360)})}}_getCellColor(t){const e=this._grid[t];if(!wt(e))return"var(--secondary-background-color, #e0e0e0)";const i=$t(e);if(i>0&&i<=7){const t=this._zoneConfigs[i-1];if(t)return t.color}return"var(--card-background-color, #fff)"}_getCellOverlayColor(t){const e=this._grid[t],i=kt(e);return 2===i?"#00FFFF":3===i?"#FF0000":""}_getRoomBounds(){let t=Mt,e=0,i=16,r=0;for(let o=0;o<Pt;o++)if(wt(this._grid[o])){const s=o%Mt,n=Math.floor(o/Mt);s<t&&(t=s),s>e&&(e=s),n<i&&(i=n),n>r&&(r=n)}return{minCol:Math.max(0,t-1),maxCol:Math.min(19,e+1),minRow:Math.max(0,i-1),maxRow:Math.min(15,r+1)}}async _applyLayout(){this._saving=!0;try{const t=await this.hass.callWS({type:"everything_presence_pro/set_room_layout",entry_id:this._selectedEntryId,grid_bytes:Array.from(this._grid),zone_slots:this._zoneConfigs.map(t=>null!==t?{name:t.name,color:t.color,sensitivity:t.sensitivity}:null),room_sensitivity:this._roomSensitivity,furniture:this._furniture.map(t=>({type:t.type,icon:t.icon,label:t.label,x:t.x,y:t.y,width:t.width,height:t.height,rotation:t.rotation,lockAspect:t.lockAspect}))});this._dirty=!1;const e=t?.entity_id_renames||[];e.length>0&&(this._pendingRenames=e,this._showRenameDialog=!0)}finally{this._saving=!1}}async _applyRenames(){if(this._pendingRenames.length)try{const t=await this.hass.callWS({type:"everything_presence_pro/rename_zone_entities",entry_id:this._selectedEntryId,renames:this._pendingRenames});t.errors?.length&&console.warn("Entity rename errors:",t.errors)}finally{this._showRenameDialog=!1,this._pendingRenames=[]}}_dismissRenameDialog(){this._showRenameDialog=!1,this._pendingRenames=[]}_getTemplates(){try{return JSON.parse(localStorage.getItem("epp_layout_templates")||"[]")}catch{return[]}}_saveTemplate(){const t=this._templateName.trim();if(!t)return;const e=this._getTemplates(),i=e.findIndex(e=>e.name===t),r={name:t,grid:Array.from(this._grid),zones:this._zoneConfigs.map(t=>null!==t?{...t}:null),roomWidth:this._roomWidth,roomDepth:this._roomDepth,roomSensitivity:this._roomSensitivity,furniture:this._furniture.map(t=>({...t}))};i>=0?e[i]=r:e.push(r),localStorage.setItem("epp_layout_templates",JSON.stringify(e)),this._showTemplateSave=!1,this._templateName=""}_loadTemplate(t){const e=this._getTemplates().find(e=>e.name===t);if(!e)return;this._grid=new Uint8Array(e.grid);const i=e.zones||[];this._zoneConfigs=Array.from({length:7},(t,e)=>i[e]??null),this._roomWidth=e.roomWidth,this._roomDepth=e.roomDepth,this._roomSensitivity=e.roomSensitivity??1,this._furniture=(e.furniture||[]).map(t=>({...t})),this._showTemplateLoad=!1}_deleteTemplate(t){const e=this._getTemplates().filter(e=>e.name!==t);localStorage.setItem("epp_layout_templates",JSON.stringify(e)),this.requestUpdate()}_initGridFromRoom(){const t=new Uint8Array(Pt),e=Math.ceil(this._roomWidth/Et),i=Math.ceil(this._roomDepth/Et),r=Math.floor((Mt-e)/2);for(let o=0;o<16;o++)for(let s=0;s<Mt;s++){s>=r&&s<r+e&&o>=0&&o<0+i&&(t[o*Mt+s]=1)}this._grid=t}_applyPerspective(t,e,i){const[r,o,s,n,a,l,d,c]=i,h=d*t+c*e+1;return Math.abs(h)<1e-10?{rx:t,ry:e}:{rx:(r*t+o*e+s)/h,ry:(n*t+a*e+l)/h}}_sensorToRoom(t,e){if(!this._perspective)return{rx:t,ry:e};const{rx:i,ry:r}=this._applyPerspective(t,e,this._perspective);return{rx:Math.max(0,Math.min(i,this._roomWidth)),ry:Math.max(0,Math.min(r,this._roomDepth))}}_mapTargetToPreviewPercent(t){if(this._perspective&&this._roomWidth>0&&this._roomDepth>0){const{rx:e,ry:i}=this._sensorToRoom(t.raw_x,t.raw_y);return{x:e/this._roomWidth*100,y:i/this._roomDepth*100}}return{x:50,y:50}}_mapTargetToPercent(t){if(this._roomWidth>0&&this._roomDepth>0){const e=Math.max(0,Math.min(t.x,this._roomWidth)),i=Math.max(0,Math.min(t.y,this._roomDepth));return{x:e/this._roomWidth*100,y:i/this._roomDepth*100}}return{x:t.x/Tt*100,y:t.y/Tt*100}}_mapTargetToGridCell(t){if(this._roomWidth<=0||this._roomDepth<=0)return null;const e=Math.max(0,Math.min(t.x,this._roomWidth)),i=Math.max(0,Math.min(t.y,this._roomDepth)),r=Math.ceil(this._roomWidth/Et);return{col:Math.floor((Mt-r)/2)+e/Et,row:i/Et}}_guardNavigation(t){this._dirty?(this._pendingNavigation=t,this._showUnsavedDialog=!0):t()}_discardAndNavigate(){this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation&&(this._pendingNavigation(),this._pendingNavigation=null)}async _onDeviceChange(t){const e=t.target.value;this._guardNavigation(async()=>{this._unsubscribeTargets(),this._selectedEntryId=e,localStorage.setItem("epp_selected_entry",e),await this._loadEntryConfig(e)})}_getSmoothedRaw(){const t=this._targets.find(t=>t.active);if(!t)return null;const e=Date.now();for(this._smoothBuffer.push({x:t.raw_x,y:t.raw_y,t:e});this._smoothBuffer.length>0&&e-this._smoothBuffer[0].t>1e3;)this._smoothBuffer.shift();if(0===this._smoothBuffer.length)return{x:t.raw_x,y:t.raw_y};const i=t=>{const e=t.slice().sort((t,e)=>t-e),i=Math.floor(e.length/2);return e.length%2?e[i]:(e[i-1]+e[i])/2};return{x:i(this._smoothBuffer.map(t=>t.x)),y:i(this._smoothBuffer.map(t=>t.y))}}_wizardStartCapture(){const t=this._targets.find(t=>t.active);if(!t)return;const e=this._wizardCornerIndex;this._wizardCorners=[...this._wizardCorners],this._wizardCorners[e]={raw_x:t.raw_x,raw_y:t.raw_y,offset_side:0,offset_fb:0},e<3&&(this._wizardCornerIndex=e+1),this._wizardCorners.every(t=>null!==t)&&(this._autoComputeRoomDimensions(),this._computeWizardPerspective(),this._setupStep="preview")}_autoComputeRoomDimensions(){const t=this._wizardCorners,e=(t,e)=>Math.sqrt((t.raw_x-e.raw_x)**2+(t.raw_y-e.raw_y)**2);this._wizardRoomWidth=Math.round(e(t[0],t[1]));const i=e(t[0],t[3]),r=e(t[1],t[2]);this._wizardRoomDepth=Math.round((i+r)/2)}_solvePerspective(t,e){const i=[],r=[];for(let o=0;o<4;o++){const s=t[o].x,n=t[o].y,a=e[o].x,l=e[o].y;i.push([s,n,1,0,0,0,-s*a,-n*a]),r.push(a),i.push([0,0,0,s,n,1,-s*l,-n*l]),r.push(l)}const o=i.map((t,e)=>[...t,r[e]]);for(let t=0;t<8;t++){let e=Math.abs(o[t][t]),i=t;for(let r=t+1;r<8;r++)Math.abs(o[r][t])>e&&(e=Math.abs(o[r][t]),i=r);if(e<1e-12)return null;[o[t],o[i]]=[o[i],o[t]];for(let e=t+1;e<8;e++){const i=o[e][t]/o[t][t];for(let r=t;r<=8;r++)o[e][r]-=i*o[t][r]}}const s=new Array(8);for(let t=7;t>=0;t--){s[t]=o[t][8];for(let e=t+1;e<8;e++)s[t]-=o[t][e]*s[e];s[t]/=o[t][t]}return s}_computeWizardPerspective(){const t=this._wizardCorners;if(!t.every(t=>null!==t))return;const e=this._wizardRoomWidth,i=this._wizardRoomDepth,r=t.map(t=>({x:t.raw_x,y:t.raw_y})),o=[{x:t[0].offset_side,y:t[0].offset_fb},{x:e-t[1].offset_side,y:t[1].offset_fb},{x:e-t[2].offset_side,y:i-t[2].offset_fb},{x:t[3].offset_side,y:i-t[3].offset_fb}];this._perspective=this._solvePerspective(r,o),this._roomWidth=e,this._roomDepth=i}async _wizardFinish(){if(this._perspective){this._wizardSaving=!0;try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,perspective:this._perspective,room_width:this._wizardRoomWidth,room_depth:this._wizardRoomDepth}),this._roomWidth=this._wizardRoomWidth,this._roomDepth=this._wizardRoomDepth,this._initGridFromRoom(),this._setupStep=null}finally{this._wizardSaving=!1}}}_rawToFovPct(t,e){const i=yt.FOV_X_EXTENT;return{xPct:(t+i)/(2*i)*100,yPct:e/Tt*100}}_getWizardTargetStyle(t){const{xPct:e,yPct:i}=this._rawToFovPct(t.raw_x,t.raw_y);return`left: ${e}%; top: ${i}%;`}render(){return this._loading?L`<div class="loading-container">Loading...</div>`:this._entries.length?null!==this._setupStep?this._renderWizard():this._perspective?"settings"===this._view?this._renderSettings():this._renderEditor():this._renderNeedsCalibration():L`<div class="loading-container">Loading...</div>`}_changePlacement(){this._guardNavigation(()=>{this._setupStep="corners",this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardRoomWidth=this._roomWidth,this._wizardRoomDepth=this._roomDepth,this._perspective=null})}_renderHeader(){const t=null===this._setupStep?L`
      <button
        class="header-settings-btn"
        @click=${()=>{this._view="settings"===this._view?"editor":"settings"}}
        title=${"settings"===this._view?"Room layout":"Settings"}
      >
        <ha-icon icon=${"settings"===this._view?"mdi:grid":"mdi:cog"}></ha-icon>
      </button>
    `:j;return L`
      <div class="panel-header">
        <select
          class="device-select"
          .value=${this._selectedEntryId}
          @change=${t=>{if("__add__"===t.target.value)return window.open("/config/integrations/integration/everything_presence_pro","_blank"),void(t.target.value=this._selectedEntryId);this._onDeviceChange(t)}}
        >
          ${this._entries.map(t=>L`
              <option value=${t.entry_id}>
                ${t.title}${t.room_name?` — ${t.room_name}`:""}
              </option>
            `)}
          <option value="__add__">+ Add another sensor</option>
        </select>
        ${t}
      </div>
    `}_renderWizard(){let t;switch(this._setupStep){case"corners":t=this._renderWizardCorners();break;case"preview":t=this._renderWizardPreview()}return L`
      <div class="wizard-container">
        ${this._renderHeader()} ${t}
      </div>
    `}_renderWizardCorners(){const t=this._wizardCornerIndex,e=this._targets.some(t=>t.active),i=this._wizardCorners.every(t=>null!==t),r=Ct[t]||"",[o,s]=At[t]||["",""];return L`
      <div class="wizard-card">
        <h2>Mark room corners</h2>
        <p>
          Walk to each corner of the room and click Mark. The sensor will
          record your position over ${5} seconds.
        </p>

        <div class="corner-progress">
          ${Ct.map((e,i)=>L`
              <span
                class="corner-chip ${this._wizardCorners[i]?"done":""} ${i===t?"active":""}"
                @click=${()=>{this._wizardCornerIndex=i}}
              >
                ${e} ${this._wizardCorners[i]?"✓":""}
              </span>
            `)}
        </div>

        ${i?j:L`
            <p class="corner-instruction">
              <strong>Corner ${t+1}/4:</strong> Walk to the
              <strong>${r.toLowerCase()}</strong> corner.
            </p>

            <div class="corner-offsets">
              <label>
                ${o} (m)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  .value=${"0"}
                  @change=${e=>{const i=1e3*parseFloat(e.target.value),r=this._wizardCorners[t];r&&(r.offset_side=i)}}
                />
              </label>
              <label>
                ${s} (m)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  .value=${"0"}
                  @change=${e=>{const i=1e3*parseFloat(e.target.value),r=this._wizardCorners[t];r&&(r.offset_fb=i)}}
                />
              </label>
            </div>

            ${this._renderMiniSensorView()}

            ${e?j:L`<p class="no-target-warning">
                  No target detected. Make sure you are visible to the sensor.
                </p>`}

            <div class="wizard-actions">
              ${this._wizardCapturing?L`
                  <div class="capture-progress">
                    <div class="capture-bar">
                      <div
                        class="capture-fill"
                        style="width: ${100*this._wizardCaptureProgress}%"
                      ></div>
                    </div>
                    <span>Recording... ${Math.round(5*this._wizardCaptureProgress)}s / ${5}s</span>
                  </div>
                `:L`
                  <button
                    class="wizard-btn wizard-btn-primary"
                    ?disabled=${!e}
                    @click=${()=>this._wizardStartCapture()}
                  >
                    Mark ${r}
                  </button>
                `}
            </div>
          `}
      </div>
    `}_renderWizardPreview(){const t=(this._wizardRoomWidth/1e3).toFixed(1),e=(this._wizardRoomDepth/1e3).toFixed(1),i=Math.ceil(this._wizardRoomWidth/300),r=Math.ceil(this._wizardRoomDepth/300),o=i*r,s=Math.min(Math.floor(480/i),Math.floor(480/r),32);return L`
      <div class="wizard-card">
        <h2>Room preview</h2>
        <p>
          Room size: approximately ${t}m wide x ${e}m deep. Walk
          around the room to verify the target dot tracks your position correctly.
        </p>

        <div class="dimension-inputs">
          <label>
            Width (m)
            <input
              type="number"
              step="0.1"
              min="0.5"
              .value=${t}
              @change=${t=>{this._wizardRoomWidth=1e3*parseFloat(t.target.value),this._computeWizardPerspective()}}
            />
          </label>
          <label>
            Depth (m)
            <input
              type="number"
              step="0.1"
              min="0.5"
              .value=${e}
              @change=${t=>{this._wizardRoomDepth=1e3*parseFloat(t.target.value),this._computeWizardPerspective()}}
            />
          </label>
        </div>

        <div class="preview-grid-container">
          <div
            class="preview-grid-wrapper"
            style="width: ${i*(s+1)-1}px; height: ${r*(s+1)-1}px;"
          >
            <div
              class="preview-grid"
              style="
                grid-template-columns: repeat(${i}, ${s}px);
                grid-template-rows: repeat(${r}, ${s}px);
              "
            >
              ${Array.from({length:o},()=>L`
                <div class="preview-cell"></div>
              `)}
            </div>
            ${this._targets.filter(t=>t.active).map(t=>{const{x:e,y:i}=this._mapTargetToPreviewPercent(t);return L`
                  <div
                    class="target-dot"
                    style="left: ${e}%; top: ${i}%;"
                  ></div>
                `})}
          </div>
        </div>

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${()=>{this._setupStep="corners",this._perspective=null}}
          >
            Back
          </button>
          <button
            class="wizard-btn wizard-btn-primary"
            ?disabled=${this._wizardSaving||!this._perspective}
            @click=${this._wizardFinish}
          >
            ${this._wizardSaving?"Saving...":"Finish"}
          </button>
        </div>
      </div>
    `}_renderMiniSensorView(){const t=yt.FOV_X_EXTENT,e=Tt,i=200,r=-t,o=e*Math.cos(yt.FOV_HALF_ANGLE),s=`M 0 0 L ${r} ${o} A 6000 6000 0 0 0 ${t} ${o} Z`,n=[2e3,4e3].map(t=>{const e=t*Math.sin(yt.FOV_HALF_ANGLE),i=t*Math.cos(yt.FOV_HALF_ANGLE);return`M ${-e} ${i} A ${t} ${t} 0 0 0 ${e} ${i}`});return L`
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
          ${this._wizardCorners.filter(t=>null!==t).map((t,e)=>{const{xPct:i,yPct:r}=this._rawToFovPct(t.raw_x,t.raw_y);return L`
                <div
                  class="mini-grid-captured"
                  style="left: ${i}%; top: ${r}%;"
                  title="${Ct[e]}"
                ></div>
              `})}
          <!-- Live targets -->
          ${this._targets.filter(t=>t.active).map(t=>L`
                <div
                  class="mini-grid-target"
                  style=${this._getWizardTargetStyle(t)}
                ></div>
              `)}
        </div>
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
    `,e=(()=>{const t=28,e=28,i=180,r=-15*Math.PI/180,o=105*Math.PI/180,s=t+i*Math.cos(r),n=e+i*Math.sin(r),a=t+i*Math.cos(o),l=e+i*Math.sin(o),d=(i,s)=>{const n=t+i*Math.cos(r),a=e+i*Math.sin(r),l=t+i*Math.cos(o),d=e+i*Math.sin(o),c=45*Math.PI/180,h=t+(i-10)*Math.cos(c),p=e+(i-10)*Math.sin(c);return Z`
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
          <path d="M ${t} ${e} L ${a} ${l} A ${i} ${i} 0 0 0 ${s} ${n} Z"
                fill="var(--primary-color, #03a9f4)" opacity="0.08"
                clip-path="url(#room-clip)"/>
          <!-- Cone edge lines -->
          <line x1="${t}" y1="${e}" x2="${s}" y2="${n}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <line x1="${t}" y1="${e}" x2="${a}" y2="${l}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <!-- Range arcs -->
          ${d(64,"2m")}
          ${d(128,"4m")}
          <!-- Sensor dot -->
          <circle cx="${t}" cy="${e}" r="6" fill="var(--primary-color, #03a9f4)"/>
          <!-- Labels -->
          <text x="30" y="16" font-size="10" fill="var(--primary-color, #03a9f4)">Sensor</text>
          <text x="152" y="136" font-size="8" fill="var(--secondary-text-color, #aaa)" text-anchor="end">6m max</text>
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
    `;return L`
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

          <div style="display: flex; justify-content: center; margin-top: 24px;">
            <button
              class="wizard-btn wizard-btn-primary"
              @click=${()=>{this._setupStep="corners"}}
            >
              Start room size calibration
            </button>
          </div>
        </div>
      </div>
    `}_renderSettings(){return L`
      <div class="panel">
        ${this._renderHeader()}
        <div class="settings-container">
          <select
            class="settings-section-select"
            .value=${this._settingsSection}
            @change=${t=>{this._settingsSection=t.target.value}}
          >
            ${[{id:"tracking",label:"Tracking sensor",icon:"mdi:crosshairs-gps"},{id:"static",label:"Static sensor",icon:"mdi:motion-sensor"},{id:"pir",label:"PIR sensor",icon:"mdi:motion"},{id:"occupancy",label:"Occupancy & timeouts",icon:"mdi:account-clock"},{id:"environment",label:"Environmental sensors",icon:"mdi:thermometer"},{id:"entities",label:"Entities & data",icon:"mdi:format-list-checks"},{id:"setup",label:"Room setup",icon:"mdi:floor-plan"}].map(t=>L`
              <option value=${t.id}>${t.label}</option>
            `)}
          </select>

          <div class="settings-section">
            ${this._renderSettingsSection()}
          </div>
        </div>
      </div>
    `}_renderSettingsSection(){switch(this._settingsSection){case"tracking":return L`
          <div class="setting-group">
            <h4>Detection</h4>
            <div class="setting-row">
              <label>Detection range</label>
              <span class="setting-hint">Auto-configured from room dimensions</span>
              <span class="setting-value">${this._roomWidth>0&&this._roomDepth>0?`${(Math.max(this._roomWidth,this._roomDepth)/1e3).toFixed(1)}m`:"Not set"}</span>
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
            <h4>Target data</h4>
            <div class="setting-row">
              <label>Report target XY coordinates</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Report target speed</label>
              <input type="checkbox" class="setting-toggle" />
            </div>
            <div class="setting-row">
              <label>Report target resolution</label>
              <input type="checkbox" class="setting-toggle" />
            </div>
          </div>
        `;case"static":return L`
          <div class="setting-group">
            <h4>Sensitivity</h4>
            <div class="setting-row">
              <label>Trigger sensitivity</label>
              <span class="setting-hint">How easily presence is detected</span>
              <input type="range" class="setting-range" min="0" max="9" value="5" />
            </div>
            <div class="setting-row">
              <label>Sustain sensitivity</label>
              <span class="setting-hint">How long presence is held after last detection</span>
              <input type="range" class="setting-range" min="0" max="9" value="5" />
            </div>
          </div>
          <div class="setting-group">
            <h4>Range</h4>
            <div class="setting-row">
              <label>Minimum distance</label>
              <input type="number" class="setting-input" value="0" min="0" max="600" step="10" /> cm
            </div>
            <div class="setting-row">
              <label>Maximum distance</label>
              <input type="number" class="setting-input" value="600" min="0" max="600" step="10" /> cm
            </div>
            <div class="setting-row">
              <label>Trigger distance</label>
              <span class="setting-hint">Distance at which presence triggers</span>
              <input type="number" class="setting-input" value="250" min="0" max="600" step="10" /> cm
            </div>
          </div>
        `;case"pir":return L`
          <div class="setting-group">
            <h4>PIR motion sensor</h4>
            <div class="setting-row">
              <label>Enabled</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Cooldown period</label>
              <span class="setting-hint">Time after last motion before clearing</span>
              <input type="number" class="setting-input" value="3" min="1" max="60" step="1" /> sec
            </div>
          </div>
        `;case"occupancy":return L`
          <div class="setting-group">
            <h4>Room occupancy</h4>
            <div class="setting-row">
              <label>Occupancy timeout</label>
              <span class="setting-hint">Time after last detection before room clears</span>
              <input type="number" class="setting-input" value="15" min="0" max="600" step="1" /> sec
            </div>
            <div class="setting-row">
              <label>Motion timeout</label>
              <span class="setting-hint">Time after last motion before motion sensor clears</span>
              <input type="number" class="setting-input" value="5" min="0" max="120" step="1" /> sec
            </div>
          </div>
          <div class="setting-group">
            <h4>Zone timeouts</h4>
            <div class="setting-row">
              <label>Zone occupancy timeout</label>
              <span class="setting-hint">Per-zone clear delay after target leaves</span>
              <input type="number" class="setting-input" value="10" min="0" max="300" step="1" /> sec
            </div>
            <div class="setting-row">
              <label>Assumed presence hysteresis</label>
              <span class="setting-hint">Extra hold time when sustained presence detected</span>
              <input type="number" class="setting-input" value="30" min="0" max="600" step="5" /> sec
            </div>
          </div>
          <div class="setting-group">
            <h4>AI learning</h4>
            <div class="setting-row">
              <label>Continuous learning</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <button class="wizard-btn wizard-btn-back" style="width: auto;">
                <ha-icon icon="mdi:brain"></ha-icon>
                Run empty room calibration
              </button>
            </div>
          </div>
        `;case"environment":return L`
          <div class="setting-group">
            <h4>Illuminance (BH1750)</h4>
            <div class="setting-row">
              <label>Offset</label>
              <span class="setting-hint">Adjust reading by fixed amount</span>
              <input type="number" class="setting-input" value="0" step="1" /> lux
            </div>
          </div>
          <div class="setting-group">
            <h4>Humidity (SHTC3)</h4>
            <div class="setting-row">
              <label>Offset</label>
              <input type="number" class="setting-input" value="0" step="0.1" /> %
            </div>
          </div>
          <div class="setting-group">
            <h4>Temperature (SHTC3)</h4>
            <div class="setting-row">
              <label>Offset</label>
              <input type="number" class="setting-input" value="0" step="0.1" /> °C
            </div>
          </div>
        `;case"entities":return L`
          <div class="setting-group">
            <h4>Tracked entities</h4>
            <p class="setting-hint" style="margin: 0 0 12px;">Choose which data the sensor reports to Home Assistant</p>
            <div class="setting-row">
              <label>Zone occupancy</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Zone target counts</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Target XY positions</label>
              <input type="checkbox" class="setting-toggle" />
            </div>
            <div class="setting-row">
              <label>PIR motion</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Static presence</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Illuminance</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Temperature</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>Humidity</label>
              <input type="checkbox" class="setting-toggle" checked />
            </div>
            <div class="setting-row">
              <label>CO₂</label>
              <input type="checkbox" class="setting-toggle" />
            </div>
          </div>
        `;case"setup":return L`
          <div class="setting-group">
            <h4>Room calibration</h4>
            <div class="setting-row">
              <label>Room dimensions</label>
              <span class="setting-value">${this._roomWidth>0?`${(this._roomWidth/1e3).toFixed(1)}m × ${(this._roomDepth/1e3).toFixed(1)}m`:"Not calibrated"}</span>
            </div>
            <div class="setting-row">
              <button class="wizard-btn wizard-btn-back" style="width: auto;"
                @click=${this._changePlacement}
              >
                <ha-icon icon="mdi:target"></ha-icon>
                Re-run room calibration
              </button>
            </div>
          </div>
        `;default:return j}}_renderEditor(){const t=this._frozenBounds??this._getRoomBounds(),e=t.minCol>t.maxCol,i=e?0:t.minCol,r=e?19:t.maxCol,o=e?0:t.minRow,s=e?15:t.maxRow,n=r-i+1,a=s-o+1,l=Math.min(32,Math.floor(520/Math.max(n,a)));return L`
      <div class="main-area">
        ${this._renderHeader()}

        <!-- Mode tabs -->
        <div class="mode-tabs">
          <button
            class="mode-tab"
            @click=${()=>{this._showTemplateLoad=!0,this._showTemplateSave=!1}}
          >Load</button>
          <button
            class="mode-tab"
            @click=${()=>{this._showTemplateSave=!0,this._showTemplateLoad=!1}}
          >Save</button>
          <button
            class="mode-tab apply-btn"
            ?disabled=${this._saving}
            @click=${this._applyLayout}
          >${this._saving?"Applying...":"Apply"}</button>
        </div>

        <div class="editor-layout">
          <!-- Grid -->
          <div class="grid-container">
            <div
              class="grid"
              style="grid-template-columns: repeat(${n}, ${l}px); grid-template-rows: repeat(${a}, ${l}px);"
              @mouseup=${this._onCellMouseUp}
              @mouseleave=${this._onCellMouseUp}
            >
              ${this._renderVisibleCells(i,r,o,s,l)}
            </div>
            ${this._renderFurnitureOverlay(l,i,o,n,a)}
            <div class="targets-overlay" style="pointer-events: none;">
              ${this._targets.map((t,e)=>{if(!t.active)return j;const r=this._mapTargetToGridCell(t);if(!r)return j;const s=(r.col-i)/n*100,l=(r.row-o)/a*100;return L`
                    <div
                      class="target-dot"
                      style="left: ${s}%; top: ${l}%; background: ${Dt[e]||Dt[0]};"
                    ></div>
                  `})}
            </div>
          </div>

          <!-- Sidebar -->
          <div class="zone-sidebar">
            <div class="sidebar-tabs">
              <button
                class="sidebar-tab ${"zones"===this._sidebarTab?"active":""}"
                @click=${()=>{this._sidebarTab="zones",this._selectedFurnitureId=null}}
              >Zones</button>
              <button
                class="sidebar-tab ${"furniture"===this._sidebarTab?"active":""}"
                @click=${()=>{this._sidebarTab="furniture"}}
              >Furniture</button>
              <button
                class="sidebar-tab ${"live"===this._sidebarTab?"active":""}"
                @click=${()=>{this._sidebarTab="live",this._selectedFurnitureId=null}}
              >Live</button>
            </div>
            ${"zones"===this._sidebarTab?this._renderZoneSidebar():"furniture"===this._sidebarTab?this._renderFurnitureSidebar():this._renderLiveSidebar()}
          </div>
        </div>

        ${this._showTemplateSave?this._renderTemplateSaveDialog():j}
        ${this._showTemplateLoad?this._renderTemplateLoadDialog():j}
        ${this._showRenameDialog?L`
          <div class="template-dialog">
            <div class="template-dialog-card" style="max-width: 520px;">
              <h3>Update entity IDs?</h3>
              <p class="overlay-help">Zone names changed. Would you like to update the entity IDs to match?</p>
              <div style="max-height: 240px; overflow-y: auto; margin: 12px 0;">
                ${this._pendingRenames.map(t=>{const e=t.old_entity_id.split(".")[1]||t.old_entity_id,i=t.new_entity_id.split(".")[1]||t.new_entity_id,r=t.old_entity_id.split(".")[0]||"";return L`
                    <div style="
                      padding: 8px 12px; margin: 4px 0;
                      background: var(--secondary-background-color, #f5f5f5);
                      border-radius: 8px; font-size: 13px;
                    ">
                      <div style="color: var(--secondary-text-color, #888); font-size: 11px; margin-bottom: 2px;">
                        ${r}
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
        `:j}
        ${this._showUnsavedDialog?L`
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
        `:j}
      </div>
    `}_renderTemplateSaveDialog(){return L`
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
    `}_renderTemplateLoadDialog(){const t=this._getTemplates();return L`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>Load template</h3>
          ${0===t.length?L`<p class="overlay-help">No saved templates.</p>`:t.map(t=>L`
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
    `}_renderVisibleCells(t,e,i,r,o){const s=[];for(let n=i;n<=r;n++)for(let i=t;i<=e;i++){const t=n*Mt+i,e=this._getCellColor(t),r=this._getCellOverlayColor(t),a=r?`background: ${e}; width: ${o}px; height: ${o}px; outline: 2px solid ${r}; z-index: 1;`:`background: ${e}; width: ${o}px; height: ${o}px;`;s.push(L`
          <div
            class="cell"
            style=${a}
            @mousedown=${()=>this._onCellMouseDown(t)}
            @mouseenter=${()=>this._onCellMouseEnter(t)}
          ></div>
        `)}return s}_renderZoneSidebar(){return L`
      <!-- Boundary -->
      <div
        class="zone-item ${0===this._activeZone?"active":""}"
        @click=${()=>{this._activeZone=0}}
      >
        <div class="zone-item-row">
          <div class="zone-color-dot" style="background: #fff; border: 1px solid #ccc;"></div>
          <span class="zone-name">Boundary</span>
        </div>
        ${0===this._activeZone?L`
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
        `:j}
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
      ${this._zoneConfigs.map((t,e)=>{if(null===t)return j;const i=e+1;return L`
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
                @input=${i=>{const r=i.target.value,o=[...this._zoneConfigs];o[e]={...t,name:r},this._zoneConfigs=o}}
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
            ${this._activeZone===i?L`
              <div class="zone-item-row zone-settings-row">
                <label class="zone-setting-label">Sensitivity</label>
                <select
                  class="sensitivity-select"
                  .value=${String(t.sensitivity)}
                  @change=${i=>{const r=parseInt(i.target.value),o=[...this._zoneConfigs];o[e]={...t,sensitivity:r},this._zoneConfigs=o}}
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
                  @input=${i=>{const r=i.target.value,o=[...this._zoneConfigs];o[e]={...t,color:r},this._zoneConfigs=o}}
                  @click=${t=>t.stopPropagation()}
                />
              </div>
            `:j}
          </div>
        `})}

      ${this._zoneConfigs.some(t=>null===t)?L`
          <button class="add-zone-btn" @click=${this._addZone}>
            <ha-icon icon="mdi:plus"></ha-icon>
            Add zone
          </button>
        `:j}
      </div>
    `}_renderFurnitureOverlay(t,e,i,r,o){if(!this._furniture.length)return j;const s=Math.ceil(this._roomWidth/Et),n=Math.floor((Mt-s)/2),a=t+1,l="furniture"===this._sidebarTab;return L`
      <div class="furniture-overlay ${l?"":"non-interactive"}">
        ${this._furniture.map(r=>{const o=(n-e)*a+this._mmToPx(r.x,t),s=(0-i)*a+this._mmToPx(r.y,t),l=this._mmToPx(r.width,t),d=this._mmToPx(r.height,t),c=this._selectedFurnitureId===r.id;return L`
            <div
              class="furniture-item ${c?"selected":""}"
              data-id="${r.id}"
              style="
                left: ${o}px; top: ${s}px;
                width: ${l}px; height: ${d}px;
                transform: rotate(${r.rotation}deg);
              "
              @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"move")}
            >
              ${"svg"===r.type&&bt[r.icon]?Z`<svg viewBox="${bt[r.icon].viewBox}" preserveAspectRatio="none" class="furn-svg">
                    ${_t(bt[r.icon].content)}
                  </svg>`:L`<ha-icon icon="${r.icon}" style="--mdc-icon-size: ${.6*Math.min(l,d)}px;"></ha-icon>`}
              ${c?L`
                <!-- Resize handles -->
                <div class="furn-handle furn-handle-n" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","n")}></div>
                <div class="furn-handle furn-handle-s" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","s")}></div>
                <div class="furn-handle furn-handle-e" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","e")}></div>
                <div class="furn-handle furn-handle-w" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","w")}></div>
                <div class="furn-handle furn-handle-ne" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","ne")}></div>
                <div class="furn-handle furn-handle-nw" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","nw")}></div>
                <div class="furn-handle furn-handle-se" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","se")}></div>
                <div class="furn-handle furn-handle-sw" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"resize","sw")}></div>
                <!-- Rotate handle with stem -->
                <div class="furn-rotate-stem"></div>
                <div class="furn-rotate-handle" @pointerdown=${t=>this._onFurniturePointerDown(t,r.id,"rotate")}>
                  <ha-icon icon="mdi:rotate-right" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
                <!-- Delete button -->
                <div class="furn-delete-btn" @pointerdown=${t=>{t.stopPropagation(),this._removeFurniture(r.id)}}>
                  <ha-icon icon="mdi:close" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
              `:j}
            </div>
          `})}
      </div>
    `}_entityState(t){if(!this.hass||!this._selectedEntryId)return null;const e=`${this._selectedEntryId}_${t}`,i=this.hass.entities||{};for(const t of Object.keys(i))if(i[t].unique_id===e)return this.hass.states?.[t]??null;return null}_renderLiveSidebar(){const t=t=>{const e=this._entityState(t);return"on"===e?.state},e=t=>{const e=this._entityState(t);return void 0!==e?.state&&"unavailable"!==e.state&&"unknown"!==e.state?e.state:null},i=[{id:"occupancy",label:"Occupancy",on:t("occupancy"),info:"Combined occupancy from all sources — PIR motion, static mmWave presence, and zone tracking. Shows detected if any source detects presence."},{id:"static",label:"Static presence",on:t("static_presence"),info:"mmWave radar detects stationary people by measuring micro-movements like breathing. Works through furniture and blankets."},{id:"motion",label:"PIR motion",on:t("motion"),info:"Passive infrared sensor detects movement by sensing body heat. Fast response but only triggers on motion, not stationary presence."}];for(let r=0;r<7;r++){const o=this._zoneConfigs[r];if(!o)continue;const s=r+1,n=t(`zone_${s}`),a=e(`zone_${s}_count`),l=null!==a?parseInt(a):0;i.push({id:`zone_${s}`,label:o.name,on:n,info:`Zone ${s} occupancy. Currently ${l} target${1!==l?"s":""} detected. Sensitivity determines how many consecutive frames are needed to confirm presence.`})}const r=[],o=e("illuminance");null!==o&&r.push({id:"illuminance",label:"Illuminance",value:`${parseFloat(o).toFixed(1)} lux`});const s=e("temperature");null!==s&&r.push({id:"temperature",label:"Temperature",value:`${parseFloat(s).toFixed(1)} °C`});const n=e("humidity");null!==n&&r.push({id:"humidity",label:"Humidity",value:`${parseFloat(n).toFixed(1)} %`});const a=e("co2");return null!==a&&r.push({id:"co2",label:"CO₂",value:`${parseInt(a)} ppm`}),L`
      <div style="padding: 8px 0;">
        <div class="live-section-header">Presence</div>
        ${i.map(t=>L`
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
          ${this._expandedSensorInfo===t.id?L`
            <div class="live-sensor-info-text">${t.info}</div>
          `:j}
        `)}

        ${r.length?L`
          <div class="live-section-header" style="padding-top: 16px;">Environment</div>
          ${r.map(t=>L`
            <div class="live-sensor-row">
              <span class="live-sensor-label">${t.label}</span>
              <span class="live-sensor-value">${t.value}</span>
            </div>
          `)}
        `:j}

        <div class="live-section-header" style="padding-top: 16px;">Targets</div>
        ${this._targets.map((t,e)=>L`
          <div class="live-sensor-row">
            <div class="live-sensor-dot" style="background: ${t.active?Dt[e]||Dt[0]:"var(--disabled-text-color, #bbb)"};"></div>
            <span class="live-sensor-label">Target ${e+1}</span>
            <span class="live-sensor-state">${t.active?`(${Math.round(t.x)}, ${Math.round(t.y)})`:"Inactive"}</span>
          </div>
        `)}

        <div class="live-nav-links">
          <button class="live-nav-link" @click=${()=>{this._sidebarTab="zones"}}>
            <ha-icon icon="mdi:vector-square" style="--mdc-icon-size: 16px;"></ha-icon>
            Detection zones
          </button>
          <button class="live-nav-link" @click=${()=>{this._view="settings"}}>
            <ha-icon icon="mdi:cog" style="--mdc-icon-size: 16px;"></ha-icon>
            Configuration
          </button>
          <button class="live-nav-link" @click=${this._changePlacement}>
            <ha-icon icon="mdi:target" style="--mdc-icon-size: 16px;"></ha-icon>
            Redo room calibration
          </button>
        </div>
      </div>
    `}_renderFurnitureSidebar(){const t=this._furniture.find(t=>t.id===this._selectedFurnitureId);return L`
      ${t?L`
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
      `:j}

      <div class="furn-catalog">
        ${xt.map(t=>L`
          <button class="furn-sticker" @click=${()=>this._addFurniture(t)}>
            ${"svg"===t.type&&bt[t.icon]?Z`<svg viewBox="${bt[t.icon].viewBox}" class="furn-sticker-svg">
                  ${_t(bt[t.icon].content)}
                </svg>`:L`<ha-icon icon="${t.icon}" style="--mdc-icon-size: 24px;"></ha-icon>`}
            <span>${t.label}</span>
          </button>
        `)}
        <button class="furn-sticker furn-custom" @click=${()=>{this._showCustomIconPicker=!this._showCustomIconPicker}}>
          <ha-icon icon="mdi:plus" style="--mdc-icon-size: 24px;"></ha-icon>
          <span>Custom icon</span>
        </button>
      </div>
      ${this._showCustomIconPicker?L`
        <div class="template-dialog">
          <div class="template-dialog-card">
            <h3>Custom icon</h3>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._customIconValue}
              @value-changed=${t=>{this._customIconValue=t.detail.value||""}}
            ></ha-icon-picker>
            ${this._customIconValue.trim()?L`
              <div style="text-align: center;">
                <ha-icon icon="${this._customIconValue.trim()}" style="--mdc-icon-size: 48px;"></ha-icon>
              </div>
            `:j}
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
      `:j}
    `}};Wt.FOV_HALF_ANGLE=Math.PI/3,Wt.FOV_X_EXTENT=Tt*Math.sin(Math.PI/3),Wt.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,r)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[r+1],t[0]);return new s(i,t,r)})`
    :host {
      display: flex;
      height: 100%;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #212121);
      font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
    }

    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      overflow: auto;
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
      justify-content: flex-end;
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

    .corner-instruction {
      font-size: 15px;
      color: var(--primary-text-color, #212121);
    }

    .corner-offsets {
      display: flex;
      gap: 16px;
    }

    .corner-offsets label {
      flex: 1;
    }

    .corner-offsets input {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
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

    .settings-section-select {
      width: 100%;
      padding: 10px 12px;
      font-size: 15px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      margin-bottom: 20px;
      cursor: pointer;
      appearance: auto;
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
  `,t([pt({attribute:!1})],Wt.prototype,"hass",void 0),t([ut()],Wt.prototype,"_grid",void 0),t([ut()],Wt.prototype,"_zoneConfigs",void 0),t([ut()],Wt.prototype,"_activeZone",void 0),t([ut()],Wt.prototype,"_sidebarTab",void 0),t([ut()],Wt.prototype,"_expandedSensorInfo",void 0),t([ut()],Wt.prototype,"_showCustomIconPicker",void 0),t([ut()],Wt.prototype,"_customIconValue",void 0),t([ut()],Wt.prototype,"_furniture",void 0),t([ut()],Wt.prototype,"_selectedFurnitureId",void 0),t([ut()],Wt.prototype,"_pendingRenames",void 0),t([ut()],Wt.prototype,"_showRenameDialog",void 0),t([ut()],Wt.prototype,"_roomSensitivity",void 0),t([ut()],Wt.prototype,"_targets",void 0),t([ut()],Wt.prototype,"_isPainting",void 0),t([ut()],Wt.prototype,"_paintAction",void 0),t([ut()],Wt.prototype,"_saving",void 0),t([ut()],Wt.prototype,"_dirty",void 0),t([ut()],Wt.prototype,"_showUnsavedDialog",void 0),t([ut()],Wt.prototype,"_showTemplateSave",void 0),t([ut()],Wt.prototype,"_showTemplateLoad",void 0),t([ut()],Wt.prototype,"_templateName",void 0),t([ut()],Wt.prototype,"_entries",void 0),t([ut()],Wt.prototype,"_selectedEntryId",void 0),t([ut()],Wt.prototype,"_loading",void 0),t([ut()],Wt.prototype,"_setupStep",void 0),t([ut()],Wt.prototype,"_wizardSaving",void 0),t([ut()],Wt.prototype,"_wizardCornerIndex",void 0),t([ut()],Wt.prototype,"_wizardCorners",void 0),t([ut()],Wt.prototype,"_wizardRoomWidth",void 0),t([ut()],Wt.prototype,"_wizardRoomDepth",void 0),t([ut()],Wt.prototype,"_wizardCapturing",void 0),t([ut()],Wt.prototype,"_wizardCaptureProgress",void 0),t([ut()],Wt.prototype,"_view",void 0),t([ut()],Wt.prototype,"_settingsSection",void 0),t([ut()],Wt.prototype,"_perspective",void 0),t([ut()],Wt.prototype,"_roomWidth",void 0),t([ut()],Wt.prototype,"_roomDepth",void 0),Wt=yt=t([(t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("everything-presence-pro-panel")],Wt);export{Wt as EverythingPresenceProPanel};
