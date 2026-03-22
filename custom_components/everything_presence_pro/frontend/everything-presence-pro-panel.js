function e(e,t,i,o){var r,n=arguments.length,s=n<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,i,o);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(n<3?r(s):n>3?r(t,i,s):r(t,i))||s);return n>3&&s&&Object.defineProperty(t,i,s),s}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),r=new WeakMap;let n=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=r.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(t,e))}return e}toString(){return this.cssText}};const s=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new n("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:a,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:d,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,f=g?g.emptyScript:"",_=u.reactiveElementPolyfillSupport,m=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},y=(e,t)=>!a(e,t),v={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=v){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&l(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:r}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const n=o?.call(this);r?.call(this,t),this.requestUpdate(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??v}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const e=this.properties,t=[...h(e),...d(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(s(e))}else void 0!==e&&t.push(s(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),r=t.litNonce;void 0!==r&&o.setAttribute("nonce",r),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),r="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=o;const n=r.fromAttribute(t,e.type);this[o]=n??this._$Ej?.get(o)??n,this._$Em=null}}requestUpdate(e,t,i,o=!1,r){if(void 0!==e){const n=this.constructor;if(!1===o&&(r=this[e]),i??=n.getPropertyOptions(e),!((i.hasChanged??y)(r,t)||i.useDefault&&i.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:r},n){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==r||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[m("elementProperties")]=new Map,x[m("finalized")]=new Map,_?.({ReactiveElement:x}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,$=e=>e,k=w.trustedTypes,z=k?k.createPolicy("lit-html",{createHTML:e=>e}):void 0,E="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,T="?"+C,S=`<${T}>`,A=document,M=()=>A.createComment(""),P=e=>null===e||"object"!=typeof e&&"function"!=typeof e,H=Array.isArray,L="[ \t\n\f\r]",B=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,R=/>/g,I=RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),N=/'/g,O=/"/g,F=/^(?:script|style|textarea|title)$/i,U=e=>(t,...i)=>({_$litType$:e,strings:t,values:i}),G=U(1),W=U(2),Z=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),j=new WeakMap,X=A.createTreeWalker(A,129);function Y(e,t){if(!H(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}const q=(e,t)=>{const i=e.length-1,o=[];let r,n=2===t?"<svg>":3===t?"<math>":"",s=B;for(let t=0;t<i;t++){const i=e[t];let a,l,c=-1,h=0;for(;h<i.length&&(s.lastIndex=h,l=s.exec(i),null!==l);)h=s.lastIndex,s===B?"!--"===l[1]?s=D:void 0!==l[1]?s=R:void 0!==l[2]?(F.test(l[2])&&(r=RegExp("</"+l[2],"g")),s=I):void 0!==l[3]&&(s=I):s===I?">"===l[0]?(s=r??B,c=-1):void 0===l[1]?c=-2:(c=s.lastIndex-l[2].length,a=l[1],s=void 0===l[3]?I:'"'===l[3]?O:N):s===O||s===N?s=I:s===D||s===R?s=B:(s=I,r=void 0);const d=s===I&&e[t+1].startsWith("/>")?" ":"";n+=s===B?i+S:c>=0?(o.push(a),i.slice(0,c)+E+i.slice(c)+C+d):i+C+(-2===c?t:d)}return[Y(e,n+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class K{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let r=0,n=0;const s=e.length-1,a=this.parts,[l,c]=q(e,t);if(this.el=K.createElement(l,i),X.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=X.nextNode())&&a.length<s;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(E)){const t=c[n++],i=o.getAttribute(e).split(C),s=/([.?@])?(.*)/.exec(t);a.push({type:1,index:r,name:s[2],strings:i,ctor:"."===s[1]?ie:"?"===s[1]?oe:"@"===s[1]?re:te}),o.removeAttribute(e)}else e.startsWith(C)&&(a.push({type:6,index:r}),o.removeAttribute(e));if(F.test(o.tagName)){const e=o.textContent.split(C),t=e.length-1;if(t>0){o.textContent=k?k.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],M()),X.nextNode(),a.push({type:2,index:++r});o.append(e[t],M())}}}else if(8===o.nodeType)if(o.data===T)a.push({type:2,index:r});else{let e=-1;for(;-1!==(e=o.data.indexOf(C,e+1));)a.push({type:7,index:r}),e+=C.length-1}r++}}static createElement(e,t){const i=A.createElement("template");return i.innerHTML=e,i}}function J(e,t,i=e,o){if(t===Z)return t;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const n=P(t)?void 0:t._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(e),r._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(t=J(e,r._$AS(e,t.values),r,o)),t}class Q{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??A).importNode(t,!0);X.currentNode=o;let r=X.nextNode(),n=0,s=0,a=i[0];for(;void 0!==a;){if(n===a.index){let t;2===a.type?t=new ee(r,r.nextSibling,this,e):1===a.type?t=new a.ctor(r,a.name,a.strings,this,e):6===a.type&&(t=new ne(r,this,e)),this._$AV.push(t),a=i[++s]}n!==a?.index&&(r=X.nextNode(),n++)}return X.currentNode=A,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class ee{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),P(e)?e===V||null==e||""===e?(this._$AH!==V&&this._$AR(),this._$AH=V):e!==this._$AH&&e!==Z&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>H(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==V&&P(this._$AH)?this._$AA.nextSibling.data=e:this.T(A.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=K.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new Q(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=j.get(e.strings);return void 0===t&&j.set(e.strings,t=new K(e)),t}k(e){H(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const r of e)o===t.length?t.push(i=new ee(this.O(M()),this.O(M()),this,this.options)):i=t[o],i._$AI(r),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class te{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,r){this.type=1,this._$AH=V,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=V}_$AI(e,t=this,i,o){const r=this.strings;let n=!1;if(void 0===r)e=J(this,e,t,0),n=!P(e)||e!==this._$AH&&e!==Z,n&&(this._$AH=e);else{const o=e;let s,a;for(e=r[0],s=0;s<r.length-1;s++)a=J(this,o[i+s],t,s),a===Z&&(a=this._$AH[s]),n||=!P(a)||a!==this._$AH[s],a===V?e=V:e!==V&&(e+=(a??"")+r[s+1]),this._$AH[s]=a}n&&!o&&this.j(e)}j(e){e===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ie extends te{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===V?void 0:e}}class oe extends te{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==V)}}class re extends te{constructor(e,t,i,o,r){super(e,t,i,o,r),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??V)===Z)return;const i=this._$AH,o=e===V&&i!==V||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==V&&(i===V||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ne{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const se=w.litHtmlPolyfillSupport;se?.(K,ee),(w.litHtmlVersions??=[]).push("3.3.2");const ae=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let le=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let r=o._$litPart$;if(void 0===r){const e=i?.renderBefore??null;o._$litPart$=r=new ee(t.insertBefore(M(),e),e,void 0,i??{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}};le._$litElement$=!0,le.finalized=!0,ae.litElementHydrateSupport?.({LitElement:le});const ce=ae.litElementPolyfillSupport;ce?.({LitElement:le}),(ae.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const he={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:y},de=(e=he,t,i)=>{const{kind:o,metadata:r}=i;let n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),n.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const r=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,r,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];t.call(this,i),this.requestUpdate(o,r,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};function pe(e){return(t,i)=>"object"==typeof i?de(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ue(e){return pe({...e,state:!0,attribute:!1})}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ge=2,fe=e=>(...t)=>({_$litDirective$:e,values:t});class _e{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class me extends _e{constructor(e){if(super(e),this.it=V,e.type!==ge)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===V||null==e)return this._t=void 0,this.it=e;if(e===Z)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}me.directiveName="unsafeHTML",me.resultType=1;const be=fe(me);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ye extends me{}ye.directiveName="unsafeSVG",ye.resultType=2;const ve=fe(ye),xe=20,we=20,$e=400,ke=300,ze=6e3,Ee=e=>!!(1&e),Ce=e=>e>>1&7,Te=(e,t)=>-15&e|(7&t)<<1;function Se(e){let t=xe,i=0,o=we,r=0;for(let n=0;n<$e;n++)if(Ee(e[n])){const e=n%xe,s=Math.floor(n/xe);e<t&&(t=e),e>i&&(i=e),s<o&&(o=s),s>r&&(r=s)}return{minCol:t,maxCol:i,minRow:o,maxRow:r}}function Ae(e,t){const i=new Uint8Array($e),o=Math.ceil(e/ke),r=Math.ceil(t/ke),n=Math.floor((xe-o)/2);for(let e=0;e<we;e++)for(let t=0;t<xe;t++){t>=n&&t<n+o&&e>=0&&e<0+r&&(i[e*xe+t]=1)}return i}const Me={normal:{trigger:5,renew:3,timeout:10,handoff_timeout:3},entrance:{trigger:3,renew:2,timeout:5,handoff_timeout:1},thoroughfare:{trigger:3,renew:2,timeout:3,handoff_timeout:1},rest:{trigger:7,renew:1,timeout:30,handoff_timeout:10}},Pe=["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7"];function He(e){const t=function(e){const t=e?.calibration;return t?.perspective&&t.room_width>0?{perspective:t.perspective,roomWidth:t.room_width||0,roomDepth:t.room_depth||0}:{perspective:null,roomWidth:0,roomDepth:0}}(e),i=e?.room_layout||{},o=(i.furniture||[]).map((e,t)=>({id:e.id||`f_load_${t}`,type:e.type||"icon",icon:e.icon||"mdi:help",label:e.label||"Item",x:e.x??0,y:e.y??0,width:e.width??600,height:e.height??600,rotation:e.rotation??0,lockAspect:e.lockAspect??"svg"!==e.type}));const r=function(e,t,i){return e?.grid_bytes&&Array.isArray(e.grid_bytes)?new Uint8Array(e.grid_bytes):t>0&&i>0?Ae(t,i):new Uint8Array($e)}(i,t.roomWidth,t.roomDepth),n=function(e){const t=e?.zone_slots||e?.zones||[];return Array.from({length:7},(e,i)=>{const o=t[i];return o?{name:o.name||`Zone ${i+1}`,color:o.color||Pe[i%Pe.length],type:o.type??"normal",trigger:o.trigger,renew:o.renew,timeout:o.timeout,handoff_timeout:o.handoff_timeout,entry_point:o.entry_point??!1}:null})}(i),s=function(e){const t=e?.room_type??"normal",i=Me[t]??Me.normal;return{roomType:t,roomTrigger:e?.room_trigger??i?.trigger??5,roomRenew:e?.room_renew??i?.renew??3,roomTimeout:e?.room_timeout??i?.timeout??10,roomHandoffTimeout:e?.room_handoff_timeout??i?.handoff_timeout??3,roomEntryPoint:e?.room_entry_point??!1}}(i);return{calibration:t,furniture:o,grid:r,zoneConfigs:n,roomThresholds:s,reportingConfig:e?.reporting||{},offsetsConfig:e?.offsets||{}}}const Le=ze*Math.sin(Math.PI/3);function Be(e,t){return e/(t+1)*ke}function De(e,t,i){const o=i-t;return Math.round((e+o+360)%360)}function Re(e){return{r:parseInt(e.slice(1,3),16),g:parseInt(e.slice(3,5),16),b:parseInt(e.slice(5,7),16)}}function Ie(e,t,i){const o=e[6]*t+e[7]*i+1;return{x:(e[0]*t+e[1]*i+e[2])/o,y:(e[3]*t+e[4]*i+e[5])/o}}function Ne(e){return e?Ie(e,0,0):null}function Oe(e){if(0===e.length)return 0;const t=[...e].sort((e,t)=>e-t),i=Math.floor(t.length/2);return t.length%2?t[i]:(t[i-1]+t[i])/2}function Fe(e,t){const i=t&&t.cache?t.cache:Xe,o=t&&t.serializer?t.serializer:Ve;return(t&&t.strategy?t.strategy:Ze)(e,{cache:i,serializer:o})}function Ue(e,t,i,o){const r=null==(n=o)||"number"==typeof n||"boolean"==typeof n?o:i(o);var n;let s=t.get(r);return void 0===s&&(s=e.call(this,o),t.set(r,s)),s}function Ge(e,t,i){const o=Array.prototype.slice.call(arguments,3),r=i(o);let n=t.get(r);return void 0===n&&(n=e.apply(this,o),t.set(r,n)),n}function We(e,t,i,o,r){return i.bind(t,e,o,r)}function Ze(e,t){return We(e,this,1===e.length?Ue:Ge,t.cache.create(),t.serializer)}const Ve=function(){return JSON.stringify(arguments)};class je{cache;constructor(){this.cache=Object.create(null)}get(e){return this.cache[e]}set(e,t){this.cache[e]=t}}const Xe={create:function(){return new je}},Ye={variadic:function(e,t){return We(e,this,Ge,t.cache.create(),t.serializer)}},qe=/(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;function Ke(e){const t={};return e.replace(qe,e=>{const i=e.length;switch(e[0]){case"G":t.era=4===i?"long":5===i?"narrow":"short";break;case"y":t.year=2===i?"2-digit":"numeric";break;case"Y":case"u":case"U":case"r":throw new RangeError("`Y/u/U/r` (year) patterns are not supported, use `y` instead");case"q":case"Q":throw new RangeError("`q/Q` (quarter) patterns are not supported");case"M":case"L":t.month=["numeric","2-digit","short","long","narrow"][i-1];break;case"w":case"W":throw new RangeError("`w/W` (week) patterns are not supported");case"d":t.day=["numeric","2-digit"][i-1];break;case"D":case"F":case"g":throw new RangeError("`D/F/g` (day) patterns are not supported, use `d` instead");case"E":t.weekday=4===i?"long":5===i?"narrow":"short";break;case"e":if(i<4)throw new RangeError("`e..eee` (weekday) patterns are not supported");t.weekday=["short","long","narrow","short"][i-4];break;case"c":if(i<4)throw new RangeError("`c..ccc` (weekday) patterns are not supported");t.weekday=["short","long","narrow","short"][i-4];break;case"a":t.hour12=!0;break;case"b":case"B":throw new RangeError("`b/B` (period) patterns are not supported, use `a` instead");case"h":t.hourCycle="h12",t.hour=["numeric","2-digit"][i-1];break;case"H":t.hourCycle="h23",t.hour=["numeric","2-digit"][i-1];break;case"K":t.hourCycle="h11",t.hour=["numeric","2-digit"][i-1];break;case"k":t.hourCycle="h24",t.hour=["numeric","2-digit"][i-1];break;case"j":case"J":case"C":throw new RangeError("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");case"m":t.minute=["numeric","2-digit"][i-1];break;case"s":t.second=["numeric","2-digit"][i-1];break;case"S":case"A":throw new RangeError("`S/A` (second) patterns are not supported, use `s` instead");case"z":t.timeZoneName=i<4?"short":"long";break;case"Z":case"O":case"v":case"V":case"X":case"x":throw new RangeError("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead")}return""}),t}const Je=/[\t-\r \x85\u200E\u200F\u2028\u2029]/i;function Qe(e){return e.replace(/^(.*?)-/,"")}const et=/^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g,tt=/^(@+)?(\+|#+)?[rs]?$/g,it=/(\*)(0+)|(#+)(0+)|(0+)/g,ot=/^(0+)$/;function rt(e){const t={};return"r"===e[e.length-1]?t.roundingPriority="morePrecision":"s"===e[e.length-1]&&(t.roundingPriority="lessPrecision"),e.replace(tt,function(e,i,o){return"string"!=typeof o?(t.minimumSignificantDigits=i.length,t.maximumSignificantDigits=i.length):"+"===o?t.minimumSignificantDigits=i.length:"#"===i[0]?t.maximumSignificantDigits=i.length:(t.minimumSignificantDigits=i.length,t.maximumSignificantDigits=i.length+("string"==typeof o?o.length:0)),""}),t}function nt(e){switch(e){case"sign-auto":return{signDisplay:"auto"};case"sign-accounting":case"()":return{currencySign:"accounting"};case"sign-always":case"+!":return{signDisplay:"always"};case"sign-accounting-always":case"()!":return{signDisplay:"always",currencySign:"accounting"};case"sign-except-zero":case"+?":return{signDisplay:"exceptZero"};case"sign-accounting-except-zero":case"()?":return{signDisplay:"exceptZero",currencySign:"accounting"};case"sign-never":case"+_":return{signDisplay:"never"}}}function st(e){let t;if("E"===e[0]&&"E"===e[1]?(t={notation:"engineering"},e=e.slice(2)):"E"===e[0]&&(t={notation:"scientific"},e=e.slice(1)),t){const i=e.slice(0,2);if("+!"===i?(t.signDisplay="always",e=e.slice(2)):"+?"===i&&(t.signDisplay="exceptZero",e=e.slice(2)),!ot.test(e))throw new Error("Malformed concise eng/scientific notation");t.minimumIntegerDigits=e.length}return t}function at(e){const t=nt(e);return t||{}}function lt(e){let t={};for(const i of e){switch(i.stem){case"percent":case"%":t.style="percent";continue;case"%x100":t.style="percent",t.scale=100;continue;case"currency":t.style="currency",t.currency=i.options[0];continue;case"group-off":case",_":t.useGrouping=!1;continue;case"precision-integer":case".":t.maximumFractionDigits=0;continue;case"measure-unit":case"unit":t.style="unit",t.unit=Qe(i.options[0]);continue;case"compact-short":case"K":t.notation="compact",t.compactDisplay="short";continue;case"compact-long":case"KK":t.notation="compact",t.compactDisplay="long";continue;case"scientific":t={...t,notation:"scientific",...i.options.reduce((e,t)=>({...e,...at(t)}),{})};continue;case"engineering":t={...t,notation:"engineering",...i.options.reduce((e,t)=>({...e,...at(t)}),{})};continue;case"notation-simple":t.notation="standard";continue;case"unit-width-narrow":t.currencyDisplay="narrowSymbol",t.unitDisplay="narrow";continue;case"unit-width-short":t.currencyDisplay="code",t.unitDisplay="short";continue;case"unit-width-full-name":t.currencyDisplay="name",t.unitDisplay="long";continue;case"unit-width-iso-code":t.currencyDisplay="symbol";continue;case"scale":t.scale=parseFloat(i.options[0]);continue;case"rounding-mode-floor":t.roundingMode="floor";continue;case"rounding-mode-ceiling":t.roundingMode="ceil";continue;case"rounding-mode-down":t.roundingMode="trunc";continue;case"rounding-mode-up":t.roundingMode="expand";continue;case"rounding-mode-half-even":t.roundingMode="halfEven";continue;case"rounding-mode-half-down":t.roundingMode="halfTrunc";continue;case"rounding-mode-half-up":t.roundingMode="halfExpand";continue;case"integer-width":if(i.options.length>1)throw new RangeError("integer-width stems only accept a single optional option");i.options[0].replace(it,function(e,i,o,r,n,s){if(i)t.minimumIntegerDigits=o.length;else{if(r&&n)throw new Error("We currently do not support maximum integer digits");if(s)throw new Error("We currently do not support exact integer digits")}return""});continue}if(ot.test(i.stem)){t.minimumIntegerDigits=i.stem.length;continue}if(et.test(i.stem)){if(i.options.length>1)throw new RangeError("Fraction-precision stems only accept a single optional option");i.stem.replace(et,function(e,i,o,r,n,s){return"*"===o?t.minimumFractionDigits=i.length:r&&"#"===r[0]?t.maximumFractionDigits=r.length:n&&s?(t.minimumFractionDigits=n.length,t.maximumFractionDigits=n.length+s.length):(t.minimumFractionDigits=i.length,t.maximumFractionDigits=i.length),""});const e=i.options[0];"w"===e?t={...t,trailingZeroDisplay:"stripIfInteger"}:e&&(t={...t,...rt(e)});continue}if(tt.test(i.stem)){t={...t,...rt(i.stem)};continue}const e=nt(i.stem);e&&(t={...t,...e});const o=st(i.stem);o&&(t={...t,...o})}return t}let ct=function(e){return e[e.literal=0]="literal",e[e.argument=1]="argument",e[e.number=2]="number",e[e.date=3]="date",e[e.time=4]="time",e[e.select=5]="select",e[e.plural=6]="plural",e[e.pound=7]="pound",e[e.tag=8]="tag",e}({}),ht=function(e){return e[e.number=0]="number",e[e.dateTime=1]="dateTime",e}({});function dt(e){return e.type===ct.literal}function pt(e){return e.type===ct.argument}function ut(e){return e.type===ct.number}function gt(e){return e.type===ct.date}function ft(e){return e.type===ct.time}function _t(e){return e.type===ct.select}function mt(e){return e.type===ct.plural}function bt(e){return e.type===ct.pound}function yt(e){return e.type===ct.tag}function vt(e){return!(!e||"object"!=typeof e||e.type!==ht.number)}function xt(e){return!(!e||"object"!=typeof e||e.type!==ht.dateTime)}let wt=function(e){return e[e.EXPECT_ARGUMENT_CLOSING_BRACE=1]="EXPECT_ARGUMENT_CLOSING_BRACE",e[e.EMPTY_ARGUMENT=2]="EMPTY_ARGUMENT",e[e.MALFORMED_ARGUMENT=3]="MALFORMED_ARGUMENT",e[e.EXPECT_ARGUMENT_TYPE=4]="EXPECT_ARGUMENT_TYPE",e[e.INVALID_ARGUMENT_TYPE=5]="INVALID_ARGUMENT_TYPE",e[e.EXPECT_ARGUMENT_STYLE=6]="EXPECT_ARGUMENT_STYLE",e[e.INVALID_NUMBER_SKELETON=7]="INVALID_NUMBER_SKELETON",e[e.INVALID_DATE_TIME_SKELETON=8]="INVALID_DATE_TIME_SKELETON",e[e.EXPECT_NUMBER_SKELETON=9]="EXPECT_NUMBER_SKELETON",e[e.EXPECT_DATE_TIME_SKELETON=10]="EXPECT_DATE_TIME_SKELETON",e[e.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE=11]="UNCLOSED_QUOTE_IN_ARGUMENT_STYLE",e[e.EXPECT_SELECT_ARGUMENT_OPTIONS=12]="EXPECT_SELECT_ARGUMENT_OPTIONS",e[e.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE=13]="EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE=14]="INVALID_PLURAL_ARGUMENT_OFFSET_VALUE",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR=15]="EXPECT_SELECT_ARGUMENT_SELECTOR",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR=16]="EXPECT_PLURAL_ARGUMENT_SELECTOR",e[e.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT=17]="EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT",e[e.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT=18]="EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT",e[e.INVALID_PLURAL_ARGUMENT_SELECTOR=19]="INVALID_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_PLURAL_ARGUMENT_SELECTOR=20]="DUPLICATE_PLURAL_ARGUMENT_SELECTOR",e[e.DUPLICATE_SELECT_ARGUMENT_SELECTOR=21]="DUPLICATE_SELECT_ARGUMENT_SELECTOR",e[e.MISSING_OTHER_CLAUSE=22]="MISSING_OTHER_CLAUSE",e[e.INVALID_TAG=23]="INVALID_TAG",e[e.INVALID_TAG_NAME=25]="INVALID_TAG_NAME",e[e.UNMATCHED_CLOSING_TAG=26]="UNMATCHED_CLOSING_TAG",e[e.UNCLOSED_TAG=27]="UNCLOSED_TAG",e}({});const $t=/[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,kt={"001":["H","h"],419:["h","H","hB","hb"],AC:["H","h","hb","hB"],AD:["H","hB"],AE:["h","hB","hb","H"],AF:["H","hb","hB","h"],AG:["h","hb","H","hB"],AI:["H","h","hb","hB"],AL:["h","H","hB"],AM:["H","hB"],AO:["H","hB"],AR:["h","H","hB","hb"],AS:["h","H"],AT:["H","hB"],AU:["h","hb","H","hB"],AW:["H","hB"],AX:["H"],AZ:["H","hB","h"],BA:["H","hB","h"],BB:["h","hb","H","hB"],BD:["h","hB","H"],BE:["H","hB"],BF:["H","hB"],BG:["H","hB","h"],BH:["h","hB","hb","H"],BI:["H","h"],BJ:["H","hB"],BL:["H","hB"],BM:["h","hb","H","hB"],BN:["hb","hB","h","H"],BO:["h","H","hB","hb"],BQ:["H"],BR:["H","hB"],BS:["h","hb","H","hB"],BT:["h","H"],BW:["H","h","hb","hB"],BY:["H","h"],BZ:["H","h","hb","hB"],CA:["h","hb","H","hB"],CC:["H","h","hb","hB"],CD:["hB","H"],CF:["H","h","hB"],CG:["H","hB"],CH:["H","hB","h"],CI:["H","hB"],CK:["H","h","hb","hB"],CL:["h","H","hB","hb"],CM:["H","h","hB"],CN:["H","hB","hb","h"],CO:["h","H","hB","hb"],CP:["H"],CR:["h","H","hB","hb"],CU:["h","H","hB","hb"],CV:["H","hB"],CW:["H","hB"],CX:["H","h","hb","hB"],CY:["h","H","hb","hB"],CZ:["H"],DE:["H","hB"],DG:["H","h","hb","hB"],DJ:["h","H"],DK:["H"],DM:["h","hb","H","hB"],DO:["h","H","hB","hb"],DZ:["h","hB","hb","H"],EA:["H","h","hB","hb"],EC:["h","H","hB","hb"],EE:["H","hB"],EG:["h","hB","hb","H"],EH:["h","hB","hb","H"],ER:["h","H"],ES:["H","hB","h","hb"],ET:["hB","hb","h","H"],FI:["H"],FJ:["h","hb","H","hB"],FK:["H","h","hb","hB"],FM:["h","hb","H","hB"],FO:["H","h"],FR:["H","hB"],GA:["H","hB"],GB:["H","h","hb","hB"],GD:["h","hb","H","hB"],GE:["H","hB","h"],GF:["H","hB"],GG:["H","h","hb","hB"],GH:["h","H"],GI:["H","h","hb","hB"],GL:["H","h"],GM:["h","hb","H","hB"],GN:["H","hB"],GP:["H","hB"],GQ:["H","hB","h","hb"],GR:["h","H","hb","hB"],GS:["H","h","hb","hB"],GT:["h","H","hB","hb"],GU:["h","hb","H","hB"],GW:["H","hB"],GY:["h","hb","H","hB"],HK:["h","hB","hb","H"],HN:["h","H","hB","hb"],HR:["H","hB"],HU:["H","h"],IC:["H","h","hB","hb"],ID:["H"],IE:["H","h","hb","hB"],IL:["H","hB"],IM:["H","h","hb","hB"],IN:["h","H"],IO:["H","h","hb","hB"],IQ:["h","hB","hb","H"],IR:["hB","H"],IS:["H"],IT:["H","hB"],JE:["H","h","hb","hB"],JM:["h","hb","H","hB"],JO:["h","hB","hb","H"],JP:["H","K","h"],KE:["hB","hb","H","h"],KG:["H","h","hB","hb"],KH:["hB","h","H","hb"],KI:["h","hb","H","hB"],KM:["H","h","hB","hb"],KN:["h","hb","H","hB"],KP:["h","H","hB","hb"],KR:["h","H","hB","hb"],KW:["h","hB","hb","H"],KY:["h","hb","H","hB"],KZ:["H","hB"],LA:["H","hb","hB","h"],LB:["h","hB","hb","H"],LC:["h","hb","H","hB"],LI:["H","hB","h"],LK:["H","h","hB","hb"],LR:["h","hb","H","hB"],LS:["h","H"],LT:["H","h","hb","hB"],LU:["H","h","hB"],LV:["H","hB","hb","h"],LY:["h","hB","hb","H"],MA:["H","h","hB","hb"],MC:["H","hB"],MD:["H","hB"],ME:["H","hB","h"],MF:["H","hB"],MG:["H","h"],MH:["h","hb","H","hB"],MK:["H","h","hb","hB"],ML:["H"],MM:["hB","hb","H","h"],MN:["H","h","hb","hB"],MO:["h","hB","hb","H"],MP:["h","hb","H","hB"],MQ:["H","hB"],MR:["h","hB","hb","H"],MS:["H","h","hb","hB"],MT:["H","h"],MU:["H","h"],MV:["H","h"],MW:["h","hb","H","hB"],MX:["h","H","hB","hb"],MY:["hb","hB","h","H"],MZ:["H","hB"],NA:["h","H","hB","hb"],NC:["H","hB"],NE:["H"],NF:["H","h","hb","hB"],NG:["H","h","hb","hB"],NI:["h","H","hB","hb"],NL:["H","hB"],NO:["H","h"],NP:["H","h","hB"],NR:["H","h","hb","hB"],NU:["H","h","hb","hB"],NZ:["h","hb","H","hB"],OM:["h","hB","hb","H"],PA:["h","H","hB","hb"],PE:["h","H","hB","hb"],PF:["H","h","hB"],PG:["h","H"],PH:["h","hB","hb","H"],PK:["h","hB","H"],PL:["H","h"],PM:["H","hB"],PN:["H","h","hb","hB"],PR:["h","H","hB","hb"],PS:["h","hB","hb","H"],PT:["H","hB"],PW:["h","H"],PY:["h","H","hB","hb"],QA:["h","hB","hb","H"],RE:["H","hB"],RO:["H","hB"],RS:["H","hB","h"],RU:["H"],RW:["H","h"],SA:["h","hB","hb","H"],SB:["h","hb","H","hB"],SC:["H","h","hB"],SD:["h","hB","hb","H"],SE:["H"],SG:["h","hb","H","hB"],SH:["H","h","hb","hB"],SI:["H","hB"],SJ:["H"],SK:["H"],SL:["h","hb","H","hB"],SM:["H","h","hB"],SN:["H","h","hB"],SO:["h","H"],SR:["H","hB"],SS:["h","hb","H","hB"],ST:["H","hB"],SV:["h","H","hB","hb"],SX:["H","h","hb","hB"],SY:["h","hB","hb","H"],SZ:["h","hb","H","hB"],TA:["H","h","hb","hB"],TC:["h","hb","H","hB"],TD:["h","H","hB"],TF:["H","h","hB"],TG:["H","hB"],TH:["H","h"],TJ:["H","h"],TL:["H","hB","hb","h"],TM:["H","h"],TN:["h","hB","hb","H"],TO:["h","H"],TR:["H","hB"],TT:["h","hb","H","hB"],TW:["hB","hb","h","H"],TZ:["hB","hb","H","h"],UA:["H","hB","h"],UG:["hB","hb","H","h"],UM:["h","hb","H","hB"],US:["h","hb","H","hB"],UY:["h","H","hB","hb"],UZ:["H","hB","h"],VA:["H","h","hB"],VC:["h","hb","H","hB"],VE:["h","H","hB","hb"],VG:["h","hb","H","hB"],VI:["h","hb","H","hB"],VN:["H","h"],VU:["h","H"],WF:["H","hB"],WS:["h","H"],XK:["H","hB","h"],YE:["h","hB","hb","H"],YT:["H","hB"],ZA:["H","h","hb","hB"],ZM:["h","hb","H","hB"],ZW:["H","h"],"af-ZA":["H","h","hB","hb"],"ar-001":["h","hB","hb","H"],"ca-ES":["H","h","hB"],"en-001":["h","hb","H","hB"],"en-HK":["h","hb","H","hB"],"en-IL":["H","h","hb","hB"],"en-MY":["h","hb","H","hB"],"es-BR":["H","h","hB","hb"],"es-ES":["H","h","hB","hb"],"es-GQ":["H","h","hB","hb"],"fr-CA":["H","h","hB"],"gl-ES":["H","h","hB"],"gu-IN":["hB","hb","h","H"],"hi-IN":["hB","h","H"],"it-CH":["H","h","hB"],"it-IT":["H","h","hB"],"kn-IN":["hB","h","H"],"ku-SY":["H","hB"],"ml-IN":["hB","h","H"],"mr-IN":["hB","hb","h","H"],"pa-IN":["hB","hb","h","H"],"ta-IN":["hB","h","hb","H"],"te-IN":["hB","h","H"],"zu-ZA":["H","hB","hb","h"]};function zt(e){let t=e.hourCycle;if(void 0===t&&e.hourCycles&&e.hourCycles.length&&(t=e.hourCycles[0]),t)switch(t){case"h24":return"k";case"h23":return"H";case"h12":return"h";case"h11":return"K";default:throw new Error("Invalid hourCycle")}const i=e.language;let o;"root"!==i&&(o=e.maximize().region);return(kt[o||""]||kt[i||""]||kt[`${i}-001`]||kt["001"])[0]}const Et=new RegExp(`^${$t.source}*`),Ct=new RegExp(`${$t.source}*$`);function Tt(e,t){return{start:e,end:t}}const St=!!Object.fromEntries,At=!!String.prototype.trimStart,Mt=!!String.prototype.trimEnd,Pt=St?Object.fromEntries:function(e){const t={};for(const[i,o]of e)t[i]=o;return t},Ht=At?function(e){return e.trimStart()}:function(e){return e.replace(Et,"")},Lt=Mt?function(e){return e.trimEnd()}:function(e){return e.replace(Ct,"")},Bt=new RegExp("([^\\p{White_Space}\\p{Pattern_Syntax}]*)","yu");class Dt{message;position;locale;ignoreTag;requiresOtherClause;shouldParseSkeletons;constructor(e,t={}){this.message=e,this.position={offset:0,line:1,column:1},this.ignoreTag=!!t.ignoreTag,this.locale=t.locale,this.requiresOtherClause=!!t.requiresOtherClause,this.shouldParseSkeletons=!!t.shouldParseSkeletons}parse(){if(0!==this.offset())throw Error("parser can only be used once");return this.parseMessage(0,"",!1)}parseMessage(e,t,i){let o=[];for(;!this.isEOF();){const r=this.char();if(123===r){const t=this.parseArgument(e,i);if(t.err)return t;o.push(t.val)}else{if(125===r&&e>0)break;if(35!==r||"plural"!==t&&"selectordinal"!==t){if(60===r&&!this.ignoreTag&&47===this.peek()){if(i)break;return this.error(wt.UNMATCHED_CLOSING_TAG,Tt(this.clonePosition(),this.clonePosition()))}if(60===r&&!this.ignoreTag&&Rt(this.peek()||0)){const i=this.parseTag(e,t);if(i.err)return i;o.push(i.val)}else{const i=this.parseLiteral(e,t);if(i.err)return i;o.push(i.val)}}else{const e=this.clonePosition();this.bump(),o.push({type:ct.pound,location:Tt(e,this.clonePosition())})}}}return{val:o,err:null}}parseTag(e,t){const i=this.clonePosition();this.bump();const o=this.parseTagName();if(this.bumpSpace(),this.bumpIf("/>"))return{val:{type:ct.literal,value:`<${o}/>`,location:Tt(i,this.clonePosition())},err:null};if(this.bumpIf(">")){const r=this.parseMessage(e+1,t,!0);if(r.err)return r;const n=r.val,s=this.clonePosition();if(this.bumpIf("</")){if(this.isEOF()||!Rt(this.char()))return this.error(wt.INVALID_TAG,Tt(s,this.clonePosition()));const e=this.clonePosition();return o!==this.parseTagName()?this.error(wt.UNMATCHED_CLOSING_TAG,Tt(e,this.clonePosition())):(this.bumpSpace(),this.bumpIf(">")?{val:{type:ct.tag,value:o,children:n,location:Tt(i,this.clonePosition())},err:null}:this.error(wt.INVALID_TAG,Tt(s,this.clonePosition())))}return this.error(wt.UNCLOSED_TAG,Tt(i,this.clonePosition()))}return this.error(wt.INVALID_TAG,Tt(i,this.clonePosition()))}parseTagName(){const e=this.offset();for(this.bump();!this.isEOF()&&It(this.char());)this.bump();return this.message.slice(e,this.offset())}parseLiteral(e,t){const i=this.clonePosition();let o="";for(;;){const i=this.tryParseQuote(t);if(i){o+=i;continue}const r=this.tryParseUnquoted(e,t);if(r){o+=r;continue}const n=this.tryParseLeftAngleBracket();if(!n)break;o+=n}const r=Tt(i,this.clonePosition());return{val:{type:ct.literal,value:o,location:r},err:null}}tryParseLeftAngleBracket(){return this.isEOF()||60!==this.char()||!this.ignoreTag&&(Rt(e=this.peek()||0)||47===e)?null:(this.bump(),"<");var e}tryParseQuote(e){if(this.isEOF()||39!==this.char())return null;switch(this.peek()){case 39:return this.bump(),this.bump(),"'";case 123:case 60:case 62:case 125:break;case 35:if("plural"===e||"selectordinal"===e)break;return null;default:return null}this.bump();const t=[this.char()];for(this.bump();!this.isEOF();){const e=this.char();if(39===e){if(39!==this.peek()){this.bump();break}t.push(39),this.bump()}else t.push(e);this.bump()}return String.fromCodePoint(...t)}tryParseUnquoted(e,t){if(this.isEOF())return null;const i=this.char();return 60===i||123===i||35===i&&("plural"===t||"selectordinal"===t)||125===i&&e>0?null:(this.bump(),String.fromCodePoint(i))}parseArgument(e,t){const i=this.clonePosition();if(this.bump(),this.bumpSpace(),this.isEOF())return this.error(wt.EXPECT_ARGUMENT_CLOSING_BRACE,Tt(i,this.clonePosition()));if(125===this.char())return this.bump(),this.error(wt.EMPTY_ARGUMENT,Tt(i,this.clonePosition()));let o=this.parseIdentifierIfPossible().value;if(!o)return this.error(wt.MALFORMED_ARGUMENT,Tt(i,this.clonePosition()));if(this.bumpSpace(),this.isEOF())return this.error(wt.EXPECT_ARGUMENT_CLOSING_BRACE,Tt(i,this.clonePosition()));switch(this.char()){case 125:return this.bump(),{val:{type:ct.argument,value:o,location:Tt(i,this.clonePosition())},err:null};case 44:return this.bump(),this.bumpSpace(),this.isEOF()?this.error(wt.EXPECT_ARGUMENT_CLOSING_BRACE,Tt(i,this.clonePosition())):this.parseArgumentOptions(e,t,o,i);default:return this.error(wt.MALFORMED_ARGUMENT,Tt(i,this.clonePosition()))}}parseIdentifierIfPossible(){const e=this.clonePosition(),t=this.offset(),i=function(e,t){return Bt.lastIndex=t,Bt.exec(e)[1]??""}(this.message,t),o=t+i.length;this.bumpTo(o);return{value:i,location:Tt(e,this.clonePosition())}}parseArgumentOptions(e,t,i,o){let r=this.clonePosition(),n=this.parseIdentifierIfPossible().value,s=this.clonePosition();switch(n){case"":return this.error(wt.EXPECT_ARGUMENT_TYPE,Tt(r,s));case"number":case"date":case"time":{this.bumpSpace();let e=null;if(this.bumpIf(",")){this.bumpSpace();const t=this.clonePosition(),i=this.parseSimpleArgStyleIfPossible();if(i.err)return i;const o=Lt(i.val);if(0===o.length)return this.error(wt.EXPECT_ARGUMENT_STYLE,Tt(this.clonePosition(),this.clonePosition()));e={style:o,styleLocation:Tt(t,this.clonePosition())}}const t=this.tryParseArgumentClose(o);if(t.err)return t;const r=Tt(o,this.clonePosition());if(e&&e.style.startsWith("::")){let t=Ht(e.style.slice(2));if("number"===n){const o=this.parseNumberSkeletonFromString(t,e.styleLocation);return o.err?o:{val:{type:ct.number,value:i,location:r,style:o.val},err:null}}{if(0===t.length)return this.error(wt.EXPECT_DATE_TIME_SKELETON,r);let o=t;this.locale&&(o=function(e,t){let i="";for(let o=0;o<e.length;o++){const r=e.charAt(o);if("j"===r){let n=0;for(;o+1<e.length&&e.charAt(o+1)===r;)n++,o++;let s=1+(1&n),a=n<2?1:3+(n>>1),l="a",c=zt(t);for("H"!=c&&"k"!=c||(a=0);a-- >0;)i+=l;for(;s-- >0;)i=c+i}else i+="J"===r?"H":r}return i}(t,this.locale));const s={type:ht.dateTime,pattern:o,location:e.styleLocation,parsedOptions:this.shouldParseSkeletons?Ke(o):{}};return{val:{type:"date"===n?ct.date:ct.time,value:i,location:r,style:s},err:null}}}return{val:{type:"number"===n?ct.number:"date"===n?ct.date:ct.time,value:i,location:r,style:e?.style??null},err:null}}case"plural":case"selectordinal":case"select":{const r=this.clonePosition();if(this.bumpSpace(),!this.bumpIf(","))return this.error(wt.EXPECT_SELECT_ARGUMENT_OPTIONS,Tt(r,{...r}));this.bumpSpace();let s=this.parseIdentifierIfPossible(),a=0;if("select"!==n&&"offset"===s.value){if(!this.bumpIf(":"))return this.error(wt.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,Tt(this.clonePosition(),this.clonePosition()));this.bumpSpace();const e=this.tryParseDecimalInteger(wt.EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,wt.INVALID_PLURAL_ARGUMENT_OFFSET_VALUE);if(e.err)return e;this.bumpSpace(),s=this.parseIdentifierIfPossible(),a=e.val}const l=this.tryParsePluralOrSelectOptions(e,n,t,s);if(l.err)return l;const c=this.tryParseArgumentClose(o);if(c.err)return c;const h=Tt(o,this.clonePosition());return"select"===n?{val:{type:ct.select,value:i,options:Pt(l.val),location:h},err:null}:{val:{type:ct.plural,value:i,options:Pt(l.val),offset:a,pluralType:"plural"===n?"cardinal":"ordinal",location:h},err:null}}default:return this.error(wt.INVALID_ARGUMENT_TYPE,Tt(r,s))}}tryParseArgumentClose(e){return this.isEOF()||125!==this.char()?this.error(wt.EXPECT_ARGUMENT_CLOSING_BRACE,Tt(e,this.clonePosition())):(this.bump(),{val:!0,err:null})}parseSimpleArgStyleIfPossible(){let e=0;const t=this.clonePosition();for(;!this.isEOF();){switch(this.char()){case 39:{this.bump();let e=this.clonePosition();if(!this.bumpUntil("'"))return this.error(wt.UNCLOSED_QUOTE_IN_ARGUMENT_STYLE,Tt(e,this.clonePosition()));this.bump();break}case 123:e+=1,this.bump();break;case 125:if(!(e>0))return{val:this.message.slice(t.offset,this.offset()),err:null};e-=1;break;default:this.bump()}}return{val:this.message.slice(t.offset,this.offset()),err:null}}parseNumberSkeletonFromString(e,t){let i=[];try{i=function(e){if(0===e.length)throw new Error("Number skeleton cannot be empty");const t=e.split(Je).filter(e=>e.length>0),i=[];for(const e of t){let t=e.split("/");if(0===t.length)throw new Error("Invalid number skeleton");const[o,...r]=t;for(const e of r)if(0===e.length)throw new Error("Invalid number skeleton");i.push({stem:o,options:r})}return i}(e)}catch{return this.error(wt.INVALID_NUMBER_SKELETON,t)}return{val:{type:ht.number,tokens:i,location:t,parsedOptions:this.shouldParseSkeletons?lt(i):{}},err:null}}tryParsePluralOrSelectOptions(e,t,i,o){let r=!1;const n=[],s=new Set;let{value:a,location:l}=o;for(;;){if(0===a.length){const e=this.clonePosition();if("select"===t||!this.bumpIf("="))break;{const t=this.tryParseDecimalInteger(wt.EXPECT_PLURAL_ARGUMENT_SELECTOR,wt.INVALID_PLURAL_ARGUMENT_SELECTOR);if(t.err)return t;l=Tt(e,this.clonePosition()),a=this.message.slice(e.offset,this.offset())}}if(s.has(a))return this.error("select"===t?wt.DUPLICATE_SELECT_ARGUMENT_SELECTOR:wt.DUPLICATE_PLURAL_ARGUMENT_SELECTOR,l);"other"===a&&(r=!0),this.bumpSpace();const o=this.clonePosition();if(!this.bumpIf("{"))return this.error("select"===t?wt.EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT:wt.EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT,Tt(this.clonePosition(),this.clonePosition()));const c=this.parseMessage(e+1,t,i);if(c.err)return c;const h=this.tryParseArgumentClose(o);if(h.err)return h;n.push([a,{value:c.val,location:Tt(o,this.clonePosition())}]),s.add(a),this.bumpSpace(),({value:a,location:l}=this.parseIdentifierIfPossible())}return 0===n.length?this.error("select"===t?wt.EXPECT_SELECT_ARGUMENT_SELECTOR:wt.EXPECT_PLURAL_ARGUMENT_SELECTOR,Tt(this.clonePosition(),this.clonePosition())):this.requiresOtherClause&&!r?this.error(wt.MISSING_OTHER_CLAUSE,Tt(this.clonePosition(),this.clonePosition())):{val:n,err:null}}tryParseDecimalInteger(e,t){let i=1;const o=this.clonePosition();this.bumpIf("+")||this.bumpIf("-")&&(i=-1);let r=!1,n=0;for(;!this.isEOF();){const e=this.char();if(!(e>=48&&e<=57))break;r=!0,n=10*n+(e-48),this.bump()}const s=Tt(o,this.clonePosition());return r?(n*=i,Number.isSafeInteger(n)?{val:n,err:null}:this.error(t,s)):this.error(e,s)}offset(){return this.position.offset}isEOF(){return this.offset()===this.message.length}clonePosition(){return{offset:this.position.offset,line:this.position.line,column:this.position.column}}char(){const e=this.position.offset;if(e>=this.message.length)throw Error("out of bound");const t=this.message.codePointAt(e);if(void 0===t)throw Error(`Offset ${e} is at invalid UTF-16 code unit boundary`);return t}error(e,t){return{val:null,err:{kind:e,message:this.message,location:t}}}bump(){if(this.isEOF())return;const e=this.char();10===e?(this.position.line+=1,this.position.column=1,this.position.offset+=1):(this.position.column+=1,this.position.offset+=e<65536?1:2)}bumpIf(e){if(this.message.startsWith(e,this.offset())){for(let t=0;t<e.length;t++)this.bump();return!0}return!1}bumpUntil(e){const t=this.offset(),i=this.message.indexOf(e,t);return i>=0?(this.bumpTo(i),!0):(this.bumpTo(this.message.length),!1)}bumpTo(e){if(this.offset()>e)throw Error(`targetOffset ${e} must be greater than or equal to the current offset ${this.offset()}`);for(e=Math.min(e,this.message.length);;){const t=this.offset();if(t===e)break;if(t>e)throw Error(`targetOffset ${e} is at invalid UTF-16 code unit boundary`);if(this.bump(),this.isEOF())break}}bumpSpace(){for(;!this.isEOF()&&Nt(this.char());)this.bump()}peek(){if(this.isEOF())return null;const e=this.char(),t=this.offset();return this.message.charCodeAt(t+(e>=65536?2:1))??null}}function Rt(e){return e>=97&&e<=122||e>=65&&e<=90}function It(e){return 45===e||46===e||e>=48&&e<=57||95===e||e>=97&&e<=122||e>=65&&e<=90||183==e||e>=192&&e<=214||e>=216&&e<=246||e>=248&&e<=893||e>=895&&e<=8191||e>=8204&&e<=8205||e>=8255&&e<=8256||e>=8304&&e<=8591||e>=11264&&e<=12271||e>=12289&&e<=55295||e>=63744&&e<=64975||e>=65008&&e<=65533||e>=65536&&e<=983039}function Nt(e){return e>=9&&e<=13||32===e||133===e||e>=8206&&e<=8207||8232===e||8233===e}function Ot(e){e.forEach(e=>{if(delete e.location,_t(e)||mt(e))for(const t in e.options)delete e.options[t].location,Ot(e.options[t].value);else ut(e)&&vt(e.style)||(gt(e)||ft(e))&&xt(e.style)?delete e.style.location:yt(e)&&Ot(e.children)})}function Ft(e,t={}){t={shouldParseSkeletons:!0,requiresOtherClause:!0,...t};const i=new Dt(e,t).parse();if(i.err){const e=SyntaxError(wt[i.err.kind]);throw e.location=i.err.location,e.originalMessage=i.err.message,e}return t?.captureLocation||Ot(i.val),i.val}let Ut=function(e){return e.MISSING_VALUE="MISSING_VALUE",e.INVALID_VALUE="INVALID_VALUE",e.MISSING_INTL_API="MISSING_INTL_API",e}({});class Gt extends Error{code;originalMessage;constructor(e,t,i){super(e),this.code=t,this.originalMessage=i}toString(){return`[formatjs Error: ${this.code}] ${this.message}`}}class Wt extends Gt{constructor(e,t,i,o){super(`Invalid values for "${e}": "${t}". Options are "${Object.keys(i).join('", "')}"`,Ut.INVALID_VALUE,o)}}class Zt extends Gt{constructor(e,t,i){super(`Value for "${e}" must be of type ${t}`,Ut.INVALID_VALUE,i)}}class Vt extends Gt{constructor(e,t){super(`The intl string context variable "${e}" was not provided to the string "${t}"`,Ut.MISSING_VALUE,t)}}let jt=function(e){return e[e.literal=0]="literal",e[e.object=1]="object",e}({});function Xt(e){return"function"==typeof e}function Yt(e,t,i,o,r,n,s){if(1===e.length&&dt(e[0]))return[{type:jt.literal,value:e[0].value}];const a=[];for(const l of e){if(dt(l)){a.push({type:jt.literal,value:l.value});continue}if(bt(l)){"number"==typeof n&&a.push({type:jt.literal,value:i.getNumberFormat(t).format(n)});continue}const{value:e}=l;if(!r||!(e in r))throw new Vt(e,s);let c=r[e];if(pt(l))c&&"string"!=typeof c&&"number"!=typeof c&&"bigint"!=typeof c||(c="string"==typeof c||"number"==typeof c||"bigint"==typeof c?String(c):""),a.push({type:"string"==typeof c?jt.literal:jt.object,value:c});else{if(gt(l)){const e="string"==typeof l.style?o.date[l.style]:xt(l.style)?l.style.parsedOptions:void 0;a.push({type:jt.literal,value:i.getDateTimeFormat(t,e).format(c)});continue}if(ft(l)){const e="string"==typeof l.style?o.time[l.style]:xt(l.style)?l.style.parsedOptions:o.time.medium;a.push({type:jt.literal,value:i.getDateTimeFormat(t,e).format(c)});continue}if(ut(l)){const e="string"==typeof l.style?o.number[l.style]:vt(l.style)?l.style.parsedOptions:void 0;if(e&&e.scale){const t=e.scale||1;if("bigint"==typeof c){if(!Number.isInteger(t))throw new TypeError(`Cannot apply fractional scale ${t} to bigint value. Scale must be an integer when formatting bigint.`);c*=BigInt(t)}else c*=t}a.push({type:jt.literal,value:i.getNumberFormat(t,e).format(c)});continue}if(yt(l)){const{children:e,value:c}=l,h=r[c];if(!Xt(h))throw new Zt(c,"function",s);let d=h(Yt(e,t,i,o,r,n).map(e=>e.value));Array.isArray(d)||(d=[d]),a.push(...d.map(e=>({type:"string"==typeof e?jt.literal:jt.object,value:e})))}if(_t(l)){const e=c,n=(Object.prototype.hasOwnProperty.call(l.options,e)?l.options[e]:void 0)||l.options.other;if(!n)throw new Wt(l.value,c,Object.keys(l.options),s);a.push(...Yt(n.value,t,i,o,r));continue}if(mt(l)){const e=`=${c}`;let n=Object.prototype.hasOwnProperty.call(l.options,e)?l.options[e]:void 0;if(!n){if(!Intl.PluralRules)throw new Gt('Intl.PluralRules is not available in this environment.\nTry polyfilling it using "@formatjs/intl-pluralrules"\n',Ut.MISSING_INTL_API,s);const e="bigint"==typeof c?Number(c):c,o=i.getPluralRules(t,{type:l.pluralType}).select(e-(l.offset||0));n=(Object.prototype.hasOwnProperty.call(l.options,o)?l.options[o]:void 0)||l.options.other}if(!n)throw new Wt(l.value,c,Object.keys(l.options),s);const h="bigint"==typeof c?Number(c):c;a.push(...Yt(n.value,t,i,o,r,h-(l.offset||0)));continue}}}return(l=a).length<2?l:l.reduce((e,t)=>{const i=e[e.length-1];return i&&i.type===jt.literal&&t.type===jt.literal?i.value+=t.value:e.push(t),e},[]);var l}function qt(e,t){return t?Object.keys(e).reduce((i,o)=>{var r,n;return i[o]=(r=e[o],(n=t[o])?{...r,...n,...Object.keys(r).reduce((e,t)=>(e[t]={...r[t],...n[t]},e),{})}:r),i},{...e}):e}function Kt(e){return{create:()=>({get:t=>e[t],set(t,i){e[t]=i}})}}class Jt{ast;locales;resolvedLocale;formatters;formats;message;formatterCache={number:{},dateTime:{},pluralRules:{}};constructor(e,t=Jt.defaultLocale,i,o){if(this.locales=t,this.resolvedLocale=Jt.resolveLocale(t),"string"==typeof e){if(this.message=e,!Jt.__parse)throw new TypeError("IntlMessageFormat.__parse must be set to process `message` of type `string`");const{...t}=o||{};this.ast=Jt.__parse(e,{...t,locale:this.resolvedLocale})}else this.ast=e;if(!Array.isArray(this.ast))throw new TypeError("A message must be provided as a String or AST.");this.formats=qt(Jt.formats,i),this.formatters=o&&o.formatters||function(e={number:{},dateTime:{},pluralRules:{}}){return{getNumberFormat:Fe((...e)=>new Intl.NumberFormat(...e),{cache:Kt(e.number),strategy:Ye.variadic}),getDateTimeFormat:Fe((...e)=>new Intl.DateTimeFormat(...e),{cache:Kt(e.dateTime),strategy:Ye.variadic}),getPluralRules:Fe((...e)=>new Intl.PluralRules(...e),{cache:Kt(e.pluralRules),strategy:Ye.variadic})}}(this.formatterCache)}format=e=>{const t=this.formatToParts(e);if(1===t.length)return t[0].value;const i=t.reduce((e,t)=>(e.length&&t.type===jt.literal&&"string"==typeof e[e.length-1]?e[e.length-1]+=t.value:e.push(t.value),e),[]);return i.length<=1?i[0]||"":i};formatToParts=e=>Yt(this.ast,this.locales,this.formatters,this.formats,e,void 0,this.message);resolvedOptions=()=>({locale:this.resolvedLocale?.toString()||Intl.NumberFormat.supportedLocalesOf(this.locales)[0]});getAst=()=>this.ast;static memoizedDefaultLocale=null;static get defaultLocale(){return Jt.memoizedDefaultLocale||(Jt.memoizedDefaultLocale=(new Intl.NumberFormat).resolvedOptions().locale),Jt.memoizedDefaultLocale}static resolveLocale=e=>{if(void 0===Intl.Locale)return;const t=Intl.NumberFormat.supportedLocalesOf(e);return t.length>0?new Intl.Locale(t[0]):new Intl.Locale("string"==typeof e?e:e[0])};static __parse=Ft;static formats={number:{integer:{maximumFractionDigits:0},currency:{style:"currency"},percent:{style:"percent"}},date:{short:{month:"numeric",day:"numeric",year:"2-digit"},medium:{month:"short",day:"numeric",year:"numeric"},long:{month:"long",day:"numeric",year:"numeric"},full:{weekday:"long",month:"long",day:"numeric",year:"numeric"}},time:{short:{hour:"numeric",minute:"numeric"},medium:{hour:"numeric",minute:"numeric",second:"numeric"},long:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"},full:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"}}}}const Qt={en:{common:{save:"Save",saving:"Saving...",cancel:"Cancel",delete:"Delete",close:"Close",add:"Add",remove:"Remove",skip:"Skip",rename:"Rename",discard:"Discard",apply:"Apply",load:"Load",loading:"Loading...",add_another_sensor:"+ Add another sensor"},furniture:{armchair:"Armchair",bath:"Bath",double_bed:"Double bed",single_bed:"Single bed",door_left_swing:"Door (left swing)",door_right_swing:"Door (right swing)",dining_table:"Dining table",round_table:"Round table",lamp:"Lamp",oven_stove:"Oven / stove",plant:"Plant",shower:"Shower",sofa_2_seat:"Sofa (2 seat)",sofa_3_seat:"Sofa (3 seat)",tv:"TV",toilet:"Toilet",counter:"Counter",cupboard:"Cupboard",desk:"Desk",fridge:"Fridge",speaker:"Speaker",window:"Window",custom_icon:"Custom icon",custom:"Custom"},corners:{front_left:"Front-left",front_right:"Front-right",back_right:"Back-right",back_left:"Back-left",left_wall:"left wall",right_wall:"right wall",front_wall:"front wall",back_wall:"back wall"},wizard:{how_calibration_works:"How room calibration works",calibrate_room_size:"Calibrate room size",start_calibration:"Start room size calibration",begin_marking:"Begin marking corners",mark_corner:"Mark {corner}",recording:"Recording... {current}s / {total}s",paused:"Paused — need exactly one target visible",stand_still:"Stand still",no_target:"No target detected. Make sure you are visible to the sensor.",multiple_targets:"Multiple targets detected. Only one person should be in the room during calibration.",save_prompt:"Click Save to store this room's calibration, or click a corner above to re-mark it.",walk_instruction_full:"<strong>Walk to each corner</strong> in order (1 → 2 → 3 → 4) and click Mark. Stand still for a few seconds so the sensor can lock on.",cant_reach:"<strong>Can't reach a corner?</strong> Stand as close as you can and enter the distance from each wall in the offset fields — like corner 4 in the diagram above, where a plant is in the way.",corner_sensor_hint:"Corner 2 is where your sensor is mounted. You can stand right under it.",walk_instruction:"Walk to each corner of the room and click Mark. The sensor will record your position over {duration} seconds.",corner_step:"Corner {index}/4: Walk to the {corner}",distance_from:"Distance from:",distance_from_side:"Distance from {wall} (cm)",how_to_position:"How to position your sensor",mount_height:"Mount height",mount_height_desc:"Place the sensor <strong>1.5 to 2 meters</strong> from the floor",placement:"Placement",placement_desc:"Place in a <strong>corner or on a wall</strong>, pointing toward the most distant opposite corner",beam_direction:"Beam direction",beam_direction_desc:"Keep the beam <strong>horizontal</strong> — not angled up or down",front_wall_label:"Front wall (sensor side)",back_wall_label:"Back wall",sensor:"Sensor",horizontal_correct:"Horizontal ✓",angled_wrong:"Angled ✗",no_presence:"No presence"},dialogs:{delete_calibration_title:"Delete room calibration?",delete_calibration_body:"This will also delete all detection zones and furniture. This cannot be undone.",unsaved_changes:"You have unsaved changes",unsaved_changes_body:"Your changes will be lost if you navigate away without applying.",update_entity_ids:"Update entity IDs?",update_entity_ids_body:"Zone names changed. Would you like to update the entity IDs to match?",save_template:"Save template",load_template:"Load template",no_templates:"No saved templates.",template_name:"Template name"},menu:{settings:"Settings",room_calibration:"Room size calibration",delete_calibration:"Delete room calibration",detection_zones:"Detection zones",furniture:"Furniture"},settings:{title:"Settings",detection_ranges:"Detection Ranges",sensor_calibration:"Sensor Calibration",entities:"Entities",target_sensor:"Target Sensor",static_sensor:"Static Sensor",motion_sensor:"Motion Sensor",environmental:"Environmental",auto:"Auto",max_distance:"Max distance",min_distance:"Min distance",presence_timeout:"Presence timeout",trigger_threshold:"Trigger threshold",renew_threshold:"Renew threshold",illuminance_offset:"Illuminance offset",humidity_offset:"Humidity offset",temperature_offset:"Temperature offset",furthest_point:"Current furthest point from sensor: {distance}m"},sidebar:{detection_zones:"Detection zones",furniture:"Furniture",live_overview:"Live overview",add_zone:"Add zone",rest_of_room:"Rest of room",room:"Room"},zones:{zone_name:"Zone name",type:"Type",normal:"Normal",entrance:"Entrance",thoroughfare:"Thoroughfare",rest_area:"Rest area",custom:"Custom",trigger:"Trigger",renew:"Renew",presence_timeout:"Presence timeout",handoff_timeout:"Handoff timeout",entry_point:"Entry point",seconds_suffix:"s"},live:{presence:"Presence",detected:"Detected",clear:"Clear",environment:"Environment",occupancy:"Occupancy",static_presence:"Static presence",motion_presence:"Motion presence",target_presence:"Target presence",target_count:"Target count"},entities:{room_level:"Room level",zone_level:"Zone level",target_level:"Target level",occupancy:"Occupancy",static_presence:"Static presence",motion_presence:"Motion presence",target_presence:"Target presence",target_count:"Target count",zone_presence:"Presence",zone_target_count:"Target count",xy_sensor:"XY position, relative to sensor",xy_grid:"XY position, relative to grid",active:"Active",distance:"Distance",angle:"Angle",speed:"Speed",resolution:"Resolution",illuminance:"Illuminance",humidity:"Humidity",temperature:"Temperature",co2:"CO₂"},info:{occupancy:"Combined occupancy from all sources — PIR motion, static mmWave presence, and zone tracking. Shows detected if any source detects presence.",static_presence:"mmWave radar detects stationary people by measuring micro-movements like breathing. Works through furniture and blankets.",motion_presence:"Passive infrared sensor detects movement by sensing body heat. Fast response but only triggers on motion, not stationary presence.",target_presence:"Whether any target is actively tracked by the mmWave radar. Detected when at least one target point is being reported.",zone_occupancy:"Zone {slot} occupancy. Currently {count} {count, plural, one {target} other {targets}} detected. Sensitivity determines how many consecutive frames are needed to confirm presence.",rest_of_room_occupancy:"Covers the entire room outside of any defined zones. Currently {count} {count, plural, one {target} other {targets}} detected.",target_auto_range:"Automatically set max distance from room dimensions.",target_max_distance:"Maximum detection distance for the target sensor (LD2450). Hardware limit: 6m.",static_min_distance:"Minimum detection distance for the static sensor.",static_max_distance:"Maximum detection distance for the static sensor. Hardware limit: 16m.",motion_timeout:"Time after last motion before the motion sensor clears.",static_timeout:"Time after last static detection before the sensor clears.",trigger_threshold:"Minimum signal strength needed to initially detect static presence. Higher = harder to trigger.",renew_threshold:"Minimum signal strength needed to maintain static presence detection. Higher = harder to renew.",illuminance_offset:"Adjust the illuminance reading by a fixed amount.",humidity_offset:"Adjust the humidity reading by a fixed amount.",temperature_offset:"Adjust the temperature reading by a fixed amount.",room_occupancy:"Combined room occupancy from all sensors.",room_static:"mmWave static presence detection.",room_motion:"PIR motion detection.",room_target_presence:"Whether any target is actively tracked.",room_target_count:"Number of targets detected in the room.",zone_presence:"Per-zone occupancy based on target tracking.",zone_target_count:"Number of targets in each zone.",xy_sensor:"Raw XY coordinates from the sensor.",xy_grid:"XY coordinates mapped to the room grid.",active:"Whether each target slot is actively tracking.",distance:"Distance from sensor to each target.",angle:"Angle from sensor to each target.",speed:"Movement speed of each target.",resolution:"Detection resolution for each target.",illuminance:"BH1750 illuminance sensor.",humidity:"SHTC3 humidity sensor.",temperature:"SHTC3 temperature sensor.",co2:"SCD40 CO₂ sensor (optional module)."},dimensions:{width_mm:"W (mm)",height_mm:"H (mm)",rotation:"Rot"}}};function ei(e,t){const i=t.split(".");let o=e;for(const e of i){if(null==o||"object"!=typeof o)return;o=o[e]}return"string"==typeof o?o:void 0}const ti={armchair:{viewBox:"0 0 256 256",content:'<rect x="16" y="16" width="224" height="224" rx="16" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="16" width="224" height="48" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="16" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="192" y="64" width="48" height="176" rx="8" stroke="black" stroke-width="12" fill="none"/><rect x="64" y="64" width="128" height="176" rx="8" stroke="black" stroke-width="8" fill="none"/>'},bath:{viewBox:"0 0 600 300",content:'<rect x="50" y="50" width="500" height="200" rx="40" stroke="black" stroke-width="8" fill="none"/><path d="M 100 220 C 100 240, 500 240, 500 220" stroke="black" stroke-width="8" fill="none"/><rect x="70" y="70" width="30" height="20" stroke="black" stroke-width="8" fill="none"/><rect x="80" y="90" width="10" height="20" stroke="black" stroke-width="8" fill="none"/><circle cx="510" cy="150" r="10" stroke="black" stroke-width="8" fill="none"/>'},"bed-double":{viewBox:"0 0 512 512",content:'<rect x="0" y="0" width="512" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H480C497.673 32 512 46.3269 512 64V128C512 145.673 497.673 160 480 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="272" y="32" width="208" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="480" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="496" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="496" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"bed-single":{viewBox:"0 0 256 512",content:'<rect x="0" y="0" width="256" height="512" rx="16" stroke="black" stroke-width="16" fill="none"/><path d="M0 64C0 46.3269 16.3269 32 32 32H224C241.673 32 256 46.3269 256 64V128C256 145.673 241.673 160 224 160H32C16.3269 160 0 145.673 0 128V64Z" stroke="black" stroke-width="16" fill="none"/><rect x="32" y="32" width="192" height="96" rx="8" stroke="black" stroke-width="16" fill="none"/><rect x="16" y="144" width="224" height="336" rx="8" stroke="black" stroke-width="16" fill="none"/><line x1="16" y1="256" x2="240" y2="256" stroke="#D0D0D0" stroke-width="8"/><line x1="16" y1="368" x2="240" y2="368" stroke="#D0D0D0" stroke-width="8"/>'},"door-left":{viewBox:"0 0 256 256",content:'<rect x="0" y="210" width="80" height="20" fill="black"/><rect x="60" y="60" width="20" height="150" fill="black"/><rect x="200" y="210" width="56" height="20" fill="black"/><path d="M 80 60 A 150 150 0 0 1 200 210" stroke="black" stroke-width="3" fill="none"/>'},"door-right":{viewBox:"0 0 256 256",content:'<rect x="176" y="210" width="80" height="20" fill="black"/><rect x="176" y="60" width="20" height="150" fill="black"/><rect x="0" y="210" width="56" height="20" fill="black"/><path d="M 176 60 A 150 150 0 0 0 56 210" stroke="black" stroke-width="3" fill="none"/>'},"floor-lamp":{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" stroke="black" stroke-width="8" fill="none"/><circle cx="128" cy="128" r="16" fill="black"/><line x1="128" y1="112" x2="128" y2="48" stroke="black" stroke-width="8"/><circle cx="128" cy="48" r="8" fill="black"/><path d="M 64 64 A 128 128 0 0 1 192 64" stroke="black" stroke-width="8" stroke-dasharray="8 8"/>'},oven:{viewBox:"0 0 256 256",content:'<rect x="0" y="0" width="256" height="256" rx="16" stroke="black" stroke-width="16" fill="none"/><line x1="0" y1="224" x2="256" y2="224" stroke="black" stroke-width="16"/><circle cx="64" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="64" r="16" fill="black"/><circle cx="192" cy="64" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="64" r="16" fill="black"/><circle cx="64" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="64" cy="192" r="16" fill="black"/><circle cx="192" cy="192" r="40" stroke="black" stroke-width="16" fill="none"/><circle cx="192" cy="192" r="16" fill="black"/><rect x="32" y="240" width="192" height="16" rx="4" stroke="black" stroke-width="8" fill="black"/>'},plant:{viewBox:"0 0 256 256",content:'<circle cx="128" cy="128" r="96" stroke="black" stroke-width="16" fill="none"/><circle cx="128" cy="128" r="80" fill="none"/><g transform="translate(128 128)"><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(72)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(144)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(216)" fill="none" stroke="black" stroke-width="12"/><path d="M 0 0 C 0 -64, 40 -80, 0 -96 C -40 -80, 0 -64, 0 0 Z" transform="rotate(288)" fill="none" stroke="black" stroke-width="12"/></g>'},shower:{viewBox:"0 0 256 256",content:'<path d="M 32 32 H 224 V 224 H 32 Z" stroke="black" stroke-width="16" fill="none"/><line x1="32" y1="32" x2="224" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><line x1="224" y1="32" x2="32" y2="224" stroke="black" stroke-width="8" stroke-dasharray="8 8"/><circle cx="128" cy="200" r="16" stroke="black" stroke-width="16" fill="none"/>'},"sofa-two-seater":{viewBox:"0 0 400 200",content:'<rect x="8" y="8" width="384" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="384" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="204" y="56" width="172" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"sofa-three-seater":{viewBox:"0 0 560 200",content:'<rect x="8" y="8" width="544" height="184" rx="12" stroke="black" stroke-width="10" fill="none"/><rect x="8" y="8" width="544" height="48" rx="8" stroke="black" stroke-width="10" fill="none"/><rect x="24" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="200" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/><rect x="376" y="56" width="160" height="128" rx="8" stroke="black" stroke-width="8" fill="none"/>'},"table-dining-room":{viewBox:"0 0 600 400",content:'<rect x="150" y="100" width="300" height="200" stroke="black" stroke-width="8" fill="none" rx="10"/><rect x="80" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="460" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="175" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="325" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/>'},"table-dining-room-round":{viewBox:"0 0 400 400",content:'<circle cx="200" cy="200" r="100" stroke="black" stroke-width="8" fill="none"/><rect x="150" y="30" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="150" y="310" width="100" height="60" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="30" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/><rect x="310" y="150" width="60" height="100" stroke="black" stroke-width="8" fill="none" rx="5"/>'},television:{viewBox:"0 0 256 64",content:'<line x1="0" y1="56" x2="256" y2="56" stroke="black" stroke-width="16"/><rect x="32" y="16" width="192" height="40" rx="4" stroke="black" stroke-width="16" fill="none"/><rect x="40" y="24" width="176" height="24" rx="2" stroke="black" stroke-width="8" fill="none"/>'},toilet:{viewBox:"0 0 300 400",content:'<rect x="75" y="30" width="150" height="80" rx="10" stroke="black" stroke-width="8" fill="none"/><path d="M 75 110 C 75 110, 50 160, 50 210 C 50 310, 125 360, 150 360 C 175 360, 250 310, 250 210 C 250 160, 225 110, 225 110 Z" stroke="black" stroke-width="8" fill="none"/><path d="M 100 150 C 100 150, 75 190, 75 220 C 75 300, 125 340, 150 340 C 175 340, 225 300, 225 220 C 225 190, 200 150, 200 150 Z" stroke="black" stroke-width="8" fill="none"/><circle cx="150" cy="70" r="15" stroke="black" stroke-width="8" fill="none"/>'}},ii=[{type:"svg",icon:"armchair",label:"furniture.armchair",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"bath",label:"furniture.bath",defaultWidth:1700,defaultHeight:700},{type:"svg",icon:"bed-double",label:"furniture.double_bed",defaultWidth:1600,defaultHeight:2e3},{type:"svg",icon:"bed-single",label:"furniture.single_bed",defaultWidth:900,defaultHeight:2e3},{type:"svg",icon:"door-left",label:"furniture.door_left_swing",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"door-right",label:"furniture.door_right_swing",defaultWidth:800,defaultHeight:800},{type:"svg",icon:"table-dining-room",label:"furniture.dining_table",defaultWidth:1600,defaultHeight:900},{type:"svg",icon:"table-dining-room-round",label:"furniture.round_table",defaultWidth:1e3,defaultHeight:1e3},{type:"svg",icon:"floor-lamp",label:"furniture.lamp",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"oven",label:"furniture.oven_stove",defaultWidth:600,defaultHeight:600},{type:"svg",icon:"plant",label:"furniture.plant",defaultWidth:400,defaultHeight:400},{type:"svg",icon:"shower",label:"furniture.shower",defaultWidth:900,defaultHeight:900},{type:"svg",icon:"sofa-two-seater",label:"furniture.sofa_2_seat",defaultWidth:1600,defaultHeight:800},{type:"svg",icon:"sofa-three-seater",label:"furniture.sofa_3_seat",defaultWidth:2400,defaultHeight:800},{type:"svg",icon:"television",label:"furniture.tv",defaultWidth:1200,defaultHeight:200},{type:"svg",icon:"toilet",label:"furniture.toilet",defaultWidth:400,defaultHeight:700},{type:"icon",icon:"mdi:countertop",label:"furniture.counter",defaultWidth:2e3,defaultHeight:600,lockAspect:!1},{type:"icon",icon:"mdi:cupboard",label:"furniture.cupboard",defaultWidth:1e3,defaultHeight:500,lockAspect:!1},{type:"icon",icon:"mdi:desk",label:"furniture.desk",defaultWidth:1400,defaultHeight:700,lockAspect:!1},{type:"icon",icon:"mdi:fridge",label:"furniture.fridge",defaultWidth:700,defaultHeight:700,lockAspect:!0},{type:"icon",icon:"mdi:speaker",label:"furniture.speaker",defaultWidth:300,defaultHeight:300,lockAspect:!0},{type:"icon",icon:"mdi:window-open-variant",label:"furniture.window",defaultWidth:1e3,defaultHeight:150,lockAspect:!1}],oi=["corners.front_left","corners.front_right","corners.back_right","corners.back_left"],ri=[["corners.left_wall","corners.front_wall"],["corners.right_wall","corners.front_wall"],["corners.right_wall","corners.back_wall"],["corners.left_wall","corners.back_wall"]],ni=["#2196F3","#FF5722","#4CAF50"];class si extends le{constructor(){super(...arguments),this._localize=e=>e,this._currentLang="",this._grid=new Uint8Array($e),this._zoneConfigs=new Array(7).fill(null),this._activeZone=null,this._roomType="normal",this._roomTrigger=Me.normal.trigger,this._roomRenew=Me.normal.renew,this._roomTimeout=Me.normal.timeout,this._roomHandoffTimeout=Me.normal.handoff_timeout,this._roomEntryPoint=!1,this._targetAutoRange=!0,this._targetMaxDistance=6,this._staticAutoRange=!0,this._staticMinDistance=.3,this._staticMaxDistance=16,this._sidebarTab="zones",this._expandedSensorInfo=null,this._showLiveMenu=!1,this._showDeleteCalibrationDialog=!1,this._showCustomIconPicker=!1,this._customIconValue="",this._furniture=[],this._selectedFurnitureId=null,this._dragState=null,this._pendingRenames=[],this._showRenameDialog=!1,this._targets=[],this._sensorState={occupancy:!1,static_presence:!1,motion_presence:!1,target_presence:!1,illuminance:null,temperature:null,humidity:null,co2:null},this._zoneState={occupancy:{},target_counts:{},frame_count:0},this._showHitCounts=!1,this._showDebugLog=!1,this._debugLogLines=[],this._debugLogPrev=null,this._showBackendDebugLog=!1,this._backendDebugLogLines=[],this._backendDebugLogPrev=null,this._localZoneState=new Map,this._targetPrev=[null,null,null],this._targetGateCount=[0,0,0],this._isPainting=!1,this._paintAction="set",this._frozenBounds=null,this._saving=!1,this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation=null,this._showTemplateSave=!1,this._showTemplateLoad=!1,this._templateName="",this._entries=[],this._selectedEntryId="",this._loading=!0,this._setupStep=null,this._wizardSaving=!1,this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardRoomWidth=0,this._wizardRoomDepth=0,this._wizardCapturing=!1,this._wizardCaptureProgress=0,this._wizardOffsetSide="",this._wizardOffsetFb="",this._view="live",this._openAccordions=new Set,this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._beforeUnloadHandler=e=>{this._dirty&&(e.preventDefault(),e.returnValue="")},this._originalPushState=null,this._originalReplaceState=null,this._interceptNavigation=()=>!!this._dirty&&(this._showUnsavedDialog=!0,this._pendingNavigation=null,!0),this._dismissTooltips=()=>{this.shadowRoot.querySelectorAll(".setting-info-tooltip").forEach(e=>{e.style.display="none"})},this._fovCache=null,this._fovPerspective=null,this._smoothBuffer=[],this._wizardCapturePaused=!1,this._wizardCaptureCancelled=!1}_syncCornerOffsets(){const e=this._wizardCorners[this._wizardCornerIndex];this._wizardOffsetSide=e?.offset_side?String(e.offset_side/10):"",this._wizardOffsetFb=e?.offset_fb?String(e.offset_fb/10):""}connectedCallback(){super.connectedCallback(),this._initialize(),window.addEventListener("beforeunload",this._beforeUnloadHandler),window.addEventListener("click",this._dismissTooltips),this._originalPushState=history.pushState.bind(history),this._originalReplaceState=history.replaceState.bind(history),history.pushState=(...e)=>{this._interceptNavigation()?this._pendingNavigation=()=>{this._originalPushState(...e),window.dispatchEvent(new PopStateEvent("popstate"))}:this._originalPushState(...e)},history.replaceState=(...e)=>{this._interceptNavigation()?this._pendingNavigation=()=>{this._originalReplaceState(...e),window.dispatchEvent(new PopStateEvent("popstate"))}:this._originalReplaceState(...e)}}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeTargets(),window.removeEventListener("beforeunload",this._beforeUnloadHandler),window.removeEventListener("click",this._dismissTooltips),this._originalPushState&&(history.pushState=this._originalPushState),this._originalReplaceState&&(history.replaceState=this._originalReplaceState)}willUpdate(e){if(e.has("hass")){const e=this.hass?.locale?.language??this.hass?.language;e!==this._currentLang&&(this._currentLang=e,this._localize=function(e){const t=e?.locale?.language??e?.language??"en",i=Qt[t]??Qt.en,o=Qt.en,r=new Map;return(e,n)=>{const s=ei(i,e)??ei(o,e)??e;if(!n)return s;let a=r.get(s);return a||(a=new Jt(s,t),r.set(s,a)),a.format(n)}}(this.hass))}}updated(e){if(e.has("hass")&&this.hass&&this._loading&&!this._entries.length&&this._initialize(),this._showDebugLog){const e=this.shadowRoot?.getElementById("debug-log-scroll");e&&(e.scrollTop=e.scrollHeight)}if(this._showBackendDebugLog){const e=this.shadowRoot?.getElementById("backend-debug-log-scroll");e&&(e.scrollTop=e.scrollHeight)}}async _initialize(){this.hass&&(this._loading=!0,await this._loadEntries(),this._selectedEntryId&&await this._loadEntryConfig(this._selectedEntryId),this._loading=!1)}async _loadEntries(){try{const e=await this.hass.callWS({type:"everything_presence_pro/list_entries"});this._entries=e.sort((e,t)=>(e.title||"").localeCompare(t.title||""))}catch{return void(this._entries=[])}const e=localStorage.getItem("epp_selected_entry"),t=e&&this._entries.find(t=>t.entry_id===e);this._selectedEntryId=t?e:this._entries[0]?.entry_id??""}async _loadEntryConfig(e){try{const t=await this.hass.callWS({type:"everything_presence_pro/get_config",entry_id:e});this._applyConfig(t)}catch{}this._subscribeTargets(e)}_applyConfig(e){const t=He(e);this._perspective=t.calibration.perspective,this._roomWidth=t.calibration.roomWidth,this._roomDepth=t.calibration.roomDepth,this._setupStep=null,this._furniture=t.furniture,this._grid=t.grid,this._zoneConfigs=t.zoneConfigs,this._roomType=t.roomThresholds.roomType,this._roomTrigger=t.roomThresholds.roomTrigger,this._roomRenew=t.roomThresholds.roomRenew,this._roomTimeout=t.roomThresholds.roomTimeout,this._roomHandoffTimeout=t.roomThresholds.roomHandoffTimeout,this._roomEntryPoint=t.roomThresholds.roomEntryPoint,this._reportingConfig=t.reportingConfig,this._offsetsConfig=t.offsetsConfig}_subscribeTargets(e){if(this._unsubscribeTargets(),!this.hass||!e)return;this.hass.connection.subscribeMessage(e=>{const t=(e.targets||[]).map((e,t)=>({x:e.x,y:e.y,raw_x:this._targets[t]?.raw_x??e.x,raw_y:this._targets[t]?.raw_y??e.y,speed:0,status:e.status??"inactive",signal:e.signal??0}));if(this._targets=t,e.sensors&&(this._sensorState={occupancy:e.sensors.occupancy??!1,static_presence:e.sensors.static_presence??!1,motion_presence:e.sensors.motion_presence??!1,target_presence:e.sensors.target_presence??!1,illuminance:e.sensors.illuminance??null,temperature:e.sensors.temperature??null,humidity:e.sensors.humidity??null,co2:e.sensors.co2??null}),e.zones&&(this._zoneState={occupancy:e.zones.occupancy??{},target_counts:e.zones.target_counts??{},frame_count:e.zones.frame_count??0},this._showBackendDebugLog&&e.zones.debug_log)){const t=e.zones.debug_log;if(t!==this._backendDebugLogPrev){this._backendDebugLogPrev=t;const e=(new Date).toLocaleTimeString("en-GB",{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:1});this._backendDebugLogLines.push(`${e} ${t}`),this._backendDebugLogLines.length>si._DEBUG_LOG_MAX&&(this._backendDebugLogLines=this._backendDebugLogLines.slice(-si._DEBUG_LOG_MAX)),this.requestUpdate()}}},{type:"everything_presence_pro/subscribe_grid_targets",entry_id:e}).then(e=>{this._unsubTargets=e}),this._subscribeDisplay(e)}_unsubscribeTargets(){this._unsubscribeDisplay(),this._unsubTargets&&(this._unsubTargets(),this._unsubTargets=void 0),this._targets=[]}_subscribeDisplay(e){if(this._unsubscribeDisplay(),!this.hass||!e)return;this.hass.connection.subscribeMessage(e=>{const t=e.targets||[];this._targets=this._targets.map((e,i)=>{const o=t[i];return o?{...e,raw_x:o.raw_x,raw_y:o.raw_y}:e})},{type:"everything_presence_pro/subscribe_raw_targets",entry_id:e}).then(e=>{this._unsubDisplay=e})}_unsubscribeDisplay(){this._unsubDisplay&&(this._unsubDisplay(),this._unsubDisplay=void 0)}_onCellMouseDown(e){"furniture"!==this._sidebarTab?null!==this._activeZone&&(this._isPainting=!0,this._frozenBounds=this._getRoomBounds(),this._paintAction=function(e,t){if(0===t)return Ee(e)&&0===Ce(e)?"clear":"set";return Ce(e)===t?"clear":"set"}(this._grid[e],this._activeZone),this._applyPaintToCell(e)):this._selectedFurnitureId=null}_onCellMouseEnter(e){this._isPainting&&this._applyPaintToCell(e)}_onCellMouseUp(){this._isPainting=!1,this._frozenBounds=null}_applyPaintToCell(e){if(null===this._activeZone)return;const t=(i=this._grid[e],o=this._activeZone,r=this._paintAction,0===o?"set"===r?1:0:Ee(i)?"set"===r?Te(1|i,o):Te(i,0):null);var i,o,r;null!==t&&(this._grid=new Uint8Array(this._grid),this._grid[e]=t,this._dirty=!0,0===this._activeZone&&this._updateRoomDimensionsFromGrid(),this.requestUpdate())}_updateRoomDimensionsFromGrid(){const{roomWidth:e,roomDepth:t}=function(e){const t=Se(e);return t.minCol>t.maxCol?{roomWidth:0,roomDepth:0}:{roomWidth:(t.maxCol-t.minCol+1)*ke,roomDepth:(t.maxRow-t.minRow+1)*ke}}(this._grid);this._roomWidth=e,this._roomDepth=t}_addZone(){const e=this._zoneConfigs.findIndex(e=>null===e);if(-1===e)return;const t=new Set(this._zoneConfigs.filter(e=>null!==e).map(e=>e.color)),i=Pe.find(e=>!t.has(e))??Pe[e%Pe.length],o=[...this._zoneConfigs];o[e]={name:`Zone ${e+1}`,color:i,type:"normal"},this._zoneConfigs=o,this._activeZone=e+1,this._dirty=!0}_removeZone(e){if(e<1||e>7||null===this._zoneConfigs[e-1])return;const t=function(e,t){if(t<1||t>7)return null;const i=new Uint8Array(e);let o=!1;for(let e=0;e<$e;e++)Ce(i[e])===t&&(i[e]=Te(i[e],0),o=!0);return o?i:new Uint8Array(e)}(this._grid,e);t&&(this._grid=t);const i=[...this._zoneConfigs];i[e-1]=null,this._zoneConfigs=i,this._activeZone===e&&(this._activeZone=null),this._dirty=!0,this.requestUpdate()}_addFurniture(e){const t=`f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,i=function(e,t,i,o){return{id:o,type:e.type,icon:e.icon,label:e.label,x:Math.max(0,(t-e.defaultWidth)/2),y:Math.max(0,(i-e.defaultHeight)/2),width:e.defaultWidth,height:e.defaultHeight,rotation:0,lockAspect:e.lockAspect??"icon"===e.type}}(e,this._roomWidth,this._roomDepth,t);this._furniture=[...this._furniture,i],this._selectedFurnitureId=i.id,this._dirty=!0}_addCustomFurniture(e){this._addFurniture({type:"icon",icon:e,label:"furniture.custom",defaultWidth:600,defaultHeight:600,lockAspect:!1})}_removeFurniture(e){this._furniture=function(e,t){return e.filter(e=>e.id!==t)}(this._furniture,e),this._selectedFurnitureId===e&&(this._selectedFurnitureId=null),this._dirty=!0}_updateFurniture(e,t){this._furniture=function(e,t,i){return e.map(e=>e.id===t?{...e,...i}:e)}(this._furniture,e,t),this._dirty=!0}_mmToPx(e,t){return function(e,t){return e/ke*(t+1)}(e,t)}_pxToMm(e,t){return Be(e,t)}_onFurniturePointerDown(e,t,i,o){e.preventDefault(),e.stopPropagation(),this._selectedFurnitureId=t;const r=this._furniture.find(e=>e.id===t);if(!r)return;let n=0,s=0,a=0;if("rotate"===i){const i=this.shadowRoot?.querySelector(`.furniture-item[data-id="${t}"]`);if(i){const t=i.getBoundingClientRect();n=t.left+t.width/2,s=t.top+t.height/2,a=Math.atan2(e.clientY-s,e.clientX-n)*(180/Math.PI)}}this._dragState={type:i,id:t,startX:e.clientX,startY:e.clientY,origX:r.x,origY:r.y,origW:r.width,origH:r.height,origRot:r.rotation,handle:o,centerX:n,centerY:s,startAngle:a};const l=e=>this._onFurnitureDrag(e),c=()=>{this._dragState=null,window.removeEventListener("pointermove",l),window.removeEventListener("pointerup",c)};window.addEventListener("pointermove",l),window.addEventListener("pointerup",c)}_onFurnitureDrag(e){if(!this._dragState)return;const t=this._dragState,i=this.shadowRoot?.querySelector(".grid");if(!i)return;const o=i.firstElementChild?i.firstElementChild.offsetWidth:28,r=e.clientX-t.startX,n=e.clientY-t.startY;if("move"===t.type){const e=this._furniture.find(e=>e.id===t.id),i=function(e,t,i,o,r,n,s,a,l){const c=Be(i,r),h=Be(o,r);return{x:Math.max(-n/2,Math.min(a-n/2,e+c)),y:Math.max(-s/2,Math.min(l-s/2,t+h))}}(t.origX,t.origY,r,n,o,e?.width??0,e?.height??0,this._roomWidth,this._roomDepth);this._updateFurniture(t.id,i)}else if("resize"===t.type&&t.handle){const e=this._furniture.find(e=>e.id===t.id),i=function(e,t,i,o,r,n,s,a,l){const c=Be(t,o),h=Be(i,o);let d=r,p=n,u=s,g=a;if(l){const t=Math.abs(c)>Math.abs(h)?c:h,i=s/a,o=e.includes("w")||e.includes("n")?-1:1;u=Math.max(100,s+o*t),g=Math.max(100,u/i),u=g*i,e.includes("w")&&(d=r+(s-u)),e.includes("n")&&(p=n+(a-g))}else e.includes("e")&&(u=Math.max(100,u+c)),e.includes("w")&&(u=Math.max(100,u-c),d+=c),e.includes("s")&&(g=Math.max(100,g+h)),e.includes("n")&&(g=Math.max(100,g-h),p+=h);return{x:d,y:p,width:u,height:g}}(t.handle,r,n,o,t.origX,t.origY,t.origW,t.origH,e?.lockAspect??!1);this._updateFurniture(t.id,i)}else if("rotate"===t.type){const i=Math.atan2(e.clientY-(t.centerY??0),e.clientX-(t.centerX??0))*(180/Math.PI);this._updateFurniture(t.id,{rotation:De(t.origRot,t.startAngle??0,i)})}}_getCellColor(e){return function(e,t){if(!Ee(e))return"var(--secondary-background-color, #e0e0e0)";const i=Ce(e);if(i>0&&i<=7){const e=t[i-1];if(e)return e.color}return"var(--card-background-color, #fff)"}(this._grid[e],this._zoneConfigs)}_getRoomBounds(){return function(e){let t=xe,i=0,o=we,r=0;for(let n=0;n<$e;n++)if(Ee(e[n])){const e=n%xe,s=Math.floor(n/xe);e<t&&(t=e),e>i&&(i=e),s<o&&(o=s),s>r&&(r=s)}return{minCol:Math.max(0,t-1),maxCol:Math.min(19,i+1),minRow:Math.max(0,o-1),maxRow:Math.min(19,r+1)}}(this._grid)}async _applyLayout(){const e=new Map;for(let t=0;t<this._grid.length;t++)if(Ee(this._grid[t])){const i=Ce(this._grid[t]);i>0&&e.set(i,(e.get(i)??0)+1)}for(let t=0;t<this._zoneConfigs.length;t++)null!==this._zoneConfigs[t]&&0===(e.get(t+1)??0)&&(this._zoneConfigs[t]=null);this._saving=!0;try{const e=await this.hass.callWS({type:"everything_presence_pro/set_room_layout",entry_id:this._selectedEntryId,grid_bytes:Array.from(this._grid),room_type:this._roomType,room_trigger:this._roomTrigger,room_renew:this._roomRenew,room_timeout:this._roomTimeout,room_handoff_timeout:this._roomHandoffTimeout,room_entry_point:this._roomEntryPoint,zone_slots:this._zoneConfigs.map(e=>null!==e?{name:e.name,color:e.color,type:e.type,trigger:e.trigger,renew:e.renew,timeout:e.timeout,handoff_timeout:e.handoff_timeout,entry_point:e.entry_point}:null),furniture:this._furniture.map(e=>({type:e.type,icon:e.icon,label:e.label,x:e.x,y:e.y,width:e.width,height:e.height,rotation:e.rotation,lockAspect:e.lockAspect}))});this._dirty=!1,this._view="live";const t=e?.entity_id_renames||[];t.length>0&&(this._pendingRenames=t,this._showRenameDialog=!0)}finally{this._saving=!1}}async _saveSettings(){this._saving=!0;try{const e=this.shadowRoot.querySelector(".settings-container");if(!e)return;const t={};e.querySelectorAll("[data-report-key]").forEach(e=>{t[e.dataset.reportKey]=e.checked});const i={};e.querySelectorAll("[data-offset-key]").forEach(e=>{i[e.dataset.offsetKey]=parseFloat(e.value)}),await this.hass.callWS({type:"everything_presence_pro/set_reporting",entry_id:this._selectedEntryId,reporting:t,offsets:i}),this._reportingConfig=t,this._offsetsConfig=i,this._dirty=!1,this._view="live"}finally{this._saving=!1}}async _applyRenames(){if(this._pendingRenames.length)try{const e=await this.hass.callWS({type:"everything_presence_pro/rename_zone_entities",entry_id:this._selectedEntryId,renames:this._pendingRenames});e.errors?.length&&console.warn("Entity rename errors:",e.errors)}finally{this._showRenameDialog=!1,this._pendingRenames=[]}}_dismissRenameDialog(){this._showRenameDialog=!1,this._pendingRenames=[]}_getTemplates(){try{return JSON.parse(localStorage.getItem("epp_layout_templates")||"[]")}catch{return[]}}_saveTemplate(){const e=this._templateName.trim();if(!e)return;const t=this._getTemplates(),i=t.findIndex(t=>t.name===e),o={name:e,grid:Array.from(this._grid),zones:this._zoneConfigs.map(e=>null!==e?{...e}:null),roomWidth:this._roomWidth,roomDepth:this._roomDepth,furniture:this._furniture.map(e=>({...e}))};i>=0?t[i]=o:t.push(o),localStorage.setItem("epp_layout_templates",JSON.stringify(t)),this._showTemplateSave=!1,this._templateName=""}_loadTemplate(e){const t=this._getTemplates().find(t=>t.name===e);if(!t)return;this._grid=new Uint8Array(t.grid);const i=t.zones||[];this._zoneConfigs=Array.from({length:7},(e,t)=>i[t]??null),this._roomWidth=t.roomWidth,this._roomDepth=t.roomDepth,this._furniture=(t.furniture||[]).map(e=>({...e})),this._showTemplateLoad=!1}_deleteTemplate(e){const t=this._getTemplates().filter(t=>t.name!==e);localStorage.setItem("epp_layout_templates",JSON.stringify(t)),this.requestUpdate()}_initGridFromRoom(){this._grid=Ae(this._roomWidth,this._roomDepth)}_mapTargetToPercent(e){return function(e,t,i,o){if(i>0&&o>0)return{x:Math.max(0,Math.min(e,i))/i*100,y:Math.max(0,Math.min(t,o))/o*100};return{x:e/ze*100,y:t/ze*100}}(e.x,e.y,this._roomWidth,this._roomDepth)}_getInversePerspective(){return function(e){if(!e||e.length<8)return null;const t=[e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7],1],i=t[0]*(t[4]*t[8]-t[5]*t[7])-t[1]*(t[3]*t[8]-t[5]*t[6])+t[2]*(t[3]*t[7]-t[4]*t[6]);if(Math.abs(i)<1e-10)return null;const o=[(t[4]*t[8]-t[5]*t[7])/i,(t[2]*t[7]-t[1]*t[8])/i,(t[1]*t[5]-t[2]*t[4])/i,(t[5]*t[6]-t[3]*t[8])/i,(t[0]*t[8]-t[2]*t[6])/i,(t[2]*t[3]-t[0]*t[5])/i,(t[3]*t[7]-t[4]*t[6])/i,(t[1]*t[6]-t[0]*t[7])/i,(t[0]*t[4]-t[1]*t[3])/i],r=o[8];return Math.abs(r)<1e-10?null:[o[0]/r,o[1]/r,o[2]/r,o[3]/r,o[4]/r,o[5]/r,o[6]/r,o[7]/r]}(this._perspective)}_applyPerspective(e,t,i){return Ie(e,t,i)}_getSensorFov(){return this._perspective?(this._fovCache&&this._fovPerspective===this._perspective||(this._fovCache=function(e){const t=Ie(e,0,0),i=Ie(e,0,1e3),o=i.x-t.x,r=i.y-t.y,n=Math.sqrt(o*o+r*r);return{sensorPos:t,dirX:o/n,dirY:r/n}}(this._perspective),this._fovPerspective=this._perspective),this._fovCache):null}_isCellInSensorRange(e,t){const i=this._getSensorFov(),o=this._autoDetectionRange(),r=function(e,t,i){return 1e3*(e?t>0?Math.min(t,6):6:i)}(this._targetAutoRange,o,this._targetMaxDistance);return function(e,t,i,o,r){if(!i)return!0;const n=Math.ceil(o/ke),s=Math.floor((xe-n)/2),a=(t+.5)*ke,l=(e-s+.5)*ke-i.sensorPos.x,c=a-i.sensorPos.y,h=Math.sqrt(l*l+c*c);if(h<1)return!0;const d=l/h*i.dirX+c/h*i.dirY;return!(Math.acos(Math.max(-1,Math.min(1,d)))>Math.PI/3||h>r)}(e,t,i,this._roomWidth,r)}_getGridRoomMetrics(){return function(e,t,i){const o=Se(e);if(o.minCol>o.maxCol)return null;const r=o.maxCol-o.minCol+1,n=o.maxRow-o.minRow+1,s=r*ke,a=n*ke,l=Ne(i),c=Math.ceil(t/ke),h=Math.floor((xe-c)/2),d=l?l.x:s/2,p=l?l.y:0;let u=0;for(let t=0;t<$e;t++){if(!Ee(e[t]))continue;const i=t%xe,o=Math.floor(t/xe),r=(i-h+.5)*ke-d,n=(o+.5)*ke-p,s=r*r+n*n;s>u&&(u=s)}return{widthM:(s/1e3).toFixed(1),depthM:(a/1e3).toFixed(1),furthestM:(Math.sqrt(u)/1e3).toFixed(1)}}(this._grid,this._roomWidth,this._perspective)}_getRawRoomBounds(){return Se(this._grid)}_mapTargetToGridCell(e){return function(e,t,i,o){if(i<=0||o<=0)return null;const r=Math.ceil(i/ke);return{col:Math.floor((xe-r)/2)+e/ke,row:t/ke}}(e.x,e.y,this._roomWidth,this._roomDepth)}_guardNavigation(e){this._dirty?(this._pendingNavigation=e,this._showUnsavedDialog=!0):e()}_discardAndNavigate(){this._dirty=!1,this._showUnsavedDialog=!1,this._pendingNavigation&&(this._pendingNavigation(),this._pendingNavigation=null)}async _onDeviceChange(e){const t=e.target.value;this._guardNavigation(async()=>{this._unsubscribeTargets(),this._selectedEntryId=t,localStorage.setItem("epp_selected_entry",t),await this._loadEntryConfig(t)})}_getSmoothedRaw(){const e=this._targets.find(e=>null!=e.raw_x&&null!=e.raw_y);if(!e)return null;const t=function(e,t,i,o){const r=[...e,{x:t,y:i,t:o}];let n=0;for(;n<r.length&&o-r[n].t>1e3;)n++;const s=r.slice(n);if(0===s.length)return{x:t,y:i,buffer:s};const a=e=>{const t=e.slice().sort((e,t)=>e-t),i=Math.floor(t.length/2);return t.length%2?t[i]:(t[i-1]+t[i])/2};return{x:a(s.map(e=>e.x)),y:a(s.map(e=>e.y)),buffer:s}}(this._smoothBuffer,e.raw_x,e.raw_y,Date.now());return this._smoothBuffer=t.buffer,{x:t.x,y:t.y}}_wizardCancelCapture(){this._wizardCaptureCancelled=!0,this._wizardCapturing=!1,this._wizardCapturePaused=!1}_wizardStartCapture(){const e=this._targets.find(e=>null!=e.raw_x&&null!=e.raw_y);if(!e)return;this._wizardCapturing=!0,this._wizardCaptureProgress=0,this._wizardCapturePaused=!1,this._wizardCaptureCancelled=!1;const t=[];let i=0,o=Date.now();const r=()=>{if(this._wizardCaptureCancelled)return;const e=Date.now(),n=e-o;o=e;const s=this._targets.filter(e=>null!=e.raw_x&&null!=e.raw_y),a=1===s.length;if(this._wizardCapturePaused=!a,a&&(i+=n,t.push({x:s[0].raw_x,y:s[0].raw_y})),this._wizardCaptureProgress=Math.min(i/5e3,1),i<5e3)return void requestAnimationFrame(r);if(this._wizardCapturing=!1,this._wizardCapturePaused=!1,0===t.length)return;const l=function(e){return 0===e.length?null:{x:Oe(e.map(e=>e.x)),y:Oe(e.map(e=>e.y))}}(t);if(!l)return;const c=this._wizardCornerIndex;this._wizardCorners=[...this._wizardCorners],this._wizardCorners[c]={raw_x:l.x,raw_y:l.y,offset_side:10*(parseFloat(this._wizardOffsetSide)||0),offset_fb:10*(parseFloat(this._wizardOffsetFb)||0)},c<3&&(this._wizardCornerIndex=c+1),this._syncCornerOffsets(),this._wizardCorners.every(e=>null!==e)&&this._autoComputeRoomDimensions()};requestAnimationFrame(r)}_autoComputeRoomDimensions(){const e=function(e){const t=(e,t)=>Math.sqrt((e.raw_x-t.raw_x)**2+(e.raw_y-t.raw_y)**2),i=Math.round(t(e[0],e[1])),o=t(e[0],e[3]),r=t(e[1],e[2]);return{width:i,depth:Math.round((o+r)/2)}}(this._wizardCorners);this._wizardRoomWidth=e.width,this._wizardRoomDepth=e.depth}_solvePerspective(e,t){return function(e,t){const i=[],o=[];for(let r=0;r<4;r++){const n=e[r].x,s=e[r].y,a=t[r].x,l=t[r].y;i.push([n,s,1,0,0,0,-n*a,-s*a]),o.push(a),i.push([0,0,0,n,s,1,-n*l,-s*l]),o.push(l)}const r=i.map((e,t)=>[...e,o[t]]);for(let e=0;e<8;e++){let t=Math.abs(r[e][e]),i=e;for(let o=e+1;o<8;o++)Math.abs(r[o][e])>t&&(t=Math.abs(r[o][e]),i=o);if(t<1e-12)return null;[r[e],r[i]]=[r[i],r[e]];for(let t=e+1;t<8;t++){const i=r[t][e]/r[e][e];for(let o=e;o<=8;o++)r[t][o]-=i*r[e][o]}}const n=new Array(8);for(let e=7;e>=0;e--){n[e]=r[e][8];for(let t=e+1;t<8;t++)n[e]-=r[e][t]*n[t];n[e]/=r[e][e]}return n}(e,t)}_computeWizardPerspective(){const e=this._wizardCorners;if(!e.every(e=>null!==e))return;const t=this._wizardRoomWidth,i=this._wizardRoomDepth,o=e.map(e=>({x:e.raw_x,y:e.raw_y})),r=[{x:e[0].offset_side,y:e[0].offset_fb},{x:t-e[1].offset_side,y:e[1].offset_fb},{x:t-e[2].offset_side,y:i-e[2].offset_fb},{x:e[3].offset_side,y:i-e[3].offset_fb}];this._perspective=this._solvePerspective(o,r),this._roomWidth=t,this._roomDepth=i}async _wizardFinish(){if(this._perspective){this._wizardSaving=!0;try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,perspective:this._perspective,room_width:this._wizardRoomWidth,room_depth:this._wizardRoomDepth}),this._roomWidth=this._wizardRoomWidth,this._roomDepth=this._wizardRoomDepth,this._initGridFromRoom(),this._setupStep=null,this._view="live"}finally{this._wizardSaving=!1}}}_rawToFovPct(e,t){return function(e,t){return{xPct:(e+Le)/(2*Le)*100,yPct:t/ze*100}}(e,t)}_getWizardTargetStyle(e){const{xPct:t,yPct:i}=this._rawToFovPct(e.raw_x,e.raw_y);return`left: ${t}%; top: ${i}%;`}render(){return this._loading?G`<div class="loading-container">${this._localize("common.loading")}</div>`:this._entries.length?null!==this._setupStep?this._renderWizard():"settings"===this._view?this._renderSettings():"editor"===this._view&&this._perspective?this._renderEditor():G`
      ${this._renderLiveOverview()}
      ${this._showDeleteCalibrationDialog?G`
        <div class="template-dialog">
          <div class="template-dialog-card">
            <h3>${this._localize("dialogs.delete_calibration_title")}</h3>
            <p class="overlay-help">${this._localize("dialogs.delete_calibration_body")}</p>
            <div class="template-dialog-actions">
              <button class="wizard-btn wizard-btn-back"
                @click=${()=>{this._showDeleteCalibrationDialog=!1}}
              >${this._localize("common.cancel")}</button>
              <button class="wizard-btn wizard-btn-primary" style="background: var(--error-color, #f44336);"
                @click=${this._deleteCalibration}
              >${this._localize("common.delete")}</button>
            </div>
          </div>
        </div>
      `:V}
    `:G`<div class="loading-container">${this._localize("common.loading")}</div>`}async _deleteCalibration(){this._showDeleteCalibrationDialog=!1,this._perspective=null,this._roomWidth=0,this._roomDepth=0,this._grid=new Uint8Array(400),this._zoneConfigs=new Array(7).fill(null),this._roomType="normal",this._roomTrigger=Me.normal.trigger,this._roomRenew=Me.normal.renew,this._roomTimeout=Me.normal.timeout,this._roomHandoffTimeout=Me.normal.handoff_timeout,this._roomEntryPoint=!1,this._furniture=[];try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,perspective:[0,0,0,0,0,0,0,0],room_width:0,room_depth:0}),await this.hass.callWS({type:"everything_presence_pro/set_room_layout",entry_id:this._selectedEntryId,grid_bytes:Array.from(this._grid),zone_slots:this._zoneConfigs.map(()=>null),furniture:[]})}catch(e){console.error("Failed to delete calibration",e)}this._dirty=!1,this._view="live"}_changePlacement(){this._guardNavigation(()=>{this._setupStep="guide",this._wizardCornerIndex=0,this._wizardCorners=[null,null,null,null],this._wizardOffsetSide="",this._wizardOffsetFb="",this._wizardRoomWidth=this._roomWidth,this._wizardRoomDepth=this._roomDepth})}_renderHeader(){const e=V;return G`
      <div class="panel-header">
        <select
          class="device-select"
          .value=${this._selectedEntryId}
          @change=${e=>{if("__add__"===e.target.value)return window.open("/config/integrations/integration/everything_presence_pro","_blank"),void(e.target.value=this._selectedEntryId);this._onDeviceChange(e)}}
        >
          ${this._entries.map(e=>G`
              <option value=${e.entry_id}>
                ${e.title}${e.room_name?` — ${e.room_name}`:""}
              </option>
            `)}
          <option value="__add__">${this._localize("common.add_another_sensor")}</option>
        </select>
        ${e}
      </div>
    `}_renderWizard(){let e;switch(this._setupStep){case"guide":e=this._renderWizardGuide();break;case"corners":e=this._renderWizardCorners()}return G`
      <div class="wizard-container">
        ${this._renderHeader()} ${e}
        ${this._wizardCapturing?G`
          <div class="capture-overlay">
            <div class="capture-overlay-content">
              <div class="capture-progress" style="width: 200px;">
                <div class="capture-bar">
                  <div class="capture-fill" style="width: ${100*this._wizardCaptureProgress}%"></div>
                </div>
                <span>${this._localize("wizard.recording",{current:Math.round(5*this._wizardCaptureProgress),total:5})}</span>
              </div>
              <p style="margin: 8px 0 0; font-size: 13px; color: ${this._wizardCapturePaused?"var(--error-color, #e53935)":"var(--secondary-text-color)"};">
                ${this._wizardCapturePaused?this._localize("wizard.paused"):this._localize("wizard.stand_still")}
              </p>
              <button
                class="wizard-btn wizard-btn-back"
                style="margin-top: 12px;"
                @click=${()=>this._wizardCancelCapture()}
              >${this._localize("common.cancel")}</button>
            </div>
          </div>
        `:V}
      </div>
    `}_renderWizardGuide(){const e=(e,t,i=!1,o=0)=>W`
      <g transform="translate(${e}, ${t}) rotate(${o}) scale(${i?-.7:.7}, 0.7)">
        <circle cx="0" cy="-12" r="4" fill="var(--primary-color, #03a9f4)"/>
        <line x1="0" y1="-8" x2="0" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="-4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="2" x2="4" y2="10" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="-5" y2="2" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
        <line x1="0" y1="-4" x2="5" y2="-1" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round"/>
      </g>
    `,t=(e,t,i,o)=>{const r=i-e,n=o-t,s=Math.sqrt(r*r+n*n),a=r/s,l=n/s,c=i-40*a,h=o-40*l;return W`
        <line x1="${e+40*a}" y1="${t+40*l}" x2="${c}" y2="${h}" stroke="var(--primary-color, #03a9f4)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <polygon points="${c},${h} ${c-8*a+4*l},${h-8*l-4*a} ${c-8*a-4*l},${h-8*l+4*a}" fill="var(--primary-color, #03a9f4)" opacity="0.5"/>
      `},i=50,o=55,r=290,n=55,s=290,a=225,l=50,c=235,h=98,d=225,p=W`
      <svg viewBox="0 0 360 290" width="360" height="290" style="display: block; margin: 0 auto;">
        <!-- Room with rounded corners, soft fill -->
        <rect x="30" y="35" width="280" height="210" rx="8"
              fill="var(--secondary-background-color, #f5f5f5)"
              stroke="var(--divider-color, #d0d0d0)" stroke-width="2.5"/>

        <!-- Wall labels -->
        <text x="170" y="28" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">${this._localize("wizard.front_wall_label")}</text>
        <text x="170" y="262" font-size="9" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">${this._localize("wizard.back_wall_label")}</text>

        <!-- Arrows with walking figures: 1→2→3→4 -->
        ${t(i,o,r,n)}
        ${e(170,72)}
        ${t(r,n,s,a)}
        ${e(265,145,!1,90)}
        <!-- 3rd arrow flat from 3 to 4 badge, same gap as arrow 1 has from 2 -->
        ${t(s,a,h-15,a)}
        ${e(190,a-17,!0)}

        <!-- Corner 4 badge: same height as 3, just past arrow end -->
        <circle cx="${h}" cy="${d}" r="14" fill="#FF9800" opacity="0.15"/>
        <circle cx="${h}" cy="${d}" r="14" fill="none" stroke="#FF9800" stroke-width="2.5" stroke-dasharray="5 3"/>
        <text x="${h}" y="${d+5}" font-size="14" fill="#FF9800" font-weight="bold" text-anchor="middle">4</text>

        <!-- Pot plant in the corner (BL) -->
        <g transform="translate(${l+5}, ${c-5})">
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
        <line x1="30" y1="${c+18}" x2="${h}" y2="${c+18}" stroke="#FF9800" stroke-width="1.5"/>
        <line x1="30" y1="${c+12}" x2="30" y2="${c+24}" stroke="#FF9800" stroke-width="1.5"/>
        <line x1="${h}" y1="${c+12}" x2="${h}" y2="${c+24}" stroke="#FF9800" stroke-width="1.5"/>
        <text x="${(30+h)/2}" y="${c+32}" font-size="9" fill="#FF9800" text-anchor="middle" font-weight="500">65cm</text>

        <!-- Corner 1: front-left -->
        <circle cx="${i}" cy="${o}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${i}" cy="${o}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${i}" y="${o+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">1</text>

        <!-- Corner 2: front-right (sensor here) -->
        <circle cx="${r}" cy="${n}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${r}" cy="${n}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${r}" y="${n+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">2</text>

        <!-- Corner 3: back-right -->
        <circle cx="${s}" cy="${a}" r="14" fill="#4CAF50" opacity="0.15"/>
        <circle cx="${s}" cy="${a}" r="14" fill="none" stroke="#4CAF50" stroke-width="2.5"/>
        <text x="${s}" y="${a+5}" font-size="14" fill="#4CAF50" font-weight="bold" text-anchor="middle">3</text>

        <!-- Sensor icon outside the top-right corner -->
        <g transform="translate(${r+18}, ${n-18}) rotate(-45)">
          <rect x="-5" y="-7" width="10" height="14" rx="3" fill="var(--primary-color, #03a9f4)"/>
          <circle cx="0" cy="-11" r="3.5" fill="var(--primary-color, #03a9f4)" opacity="0.4"/>
        </g>
        <text x="${r+24}" y="${n-24}" font-size="10" fill="var(--primary-color, #03a9f4)" font-weight="500">${this._localize("wizard.sensor")}</text>
      </svg>
    `;return G`
      <div style="max-width: 560px; margin: 0 auto;">
        <div class="setting-group">
          <h4 style="text-align: center; margin-bottom: 16px;">${this._localize("wizard.how_calibration_works")}</h4>

          ${p}

          <div style="display: flex; flex-direction: column; gap: 14px; padding: 16px 4px 0;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="min-width: 22px; height: 22px; border-radius: 50%; background: #4CAF50; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">1</div>
              <div style="font-size: 13px;">
                ${be(this._localize("wizard.walk_instruction_full"))}
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="min-width: 22px; height: 22px; border-radius: 50%; background: #FF9800; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white;">!</div>
              <div style="font-size: 13px;">
                ${be(this._localize("wizard.cant_reach"))}
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 20px; color: var(--primary-color); flex-shrink: 0; margin-top: 1px;"></ha-icon>
              <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                ${this._localize("wizard.corner_sensor_hint")}
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <button class="wizard-btn wizard-btn-back"
            @click=${()=>{this._setupStep=null,this._wizardCorners=[null,null,null,null],this._wizardCornerIndex=0,this._wizardOffsetSide="",this._wizardOffsetFb=""}}
          >${this._localize("common.cancel")}</button>
          <button class="wizard-btn wizard-btn-primary"
            @click=${()=>{this._setupStep="corners"}}
          >${this._localize("wizard.begin_marking")}</button>
        </div>
      </div>
    `}_renderWizardCorners(){const e=this._wizardCornerIndex,t=this._targets.filter(e=>null!=e.raw_x&&null!=e.raw_y),i=t.length>0,o=t.length>1,r=this._wizardCorners.every(e=>null!==e),n=oi[e]||"",[s,a]=ri[e]||["",""];return G`
      <div class="wizard-card">
        <h2>${this._localize("wizard.calibrate_room_size")}</h2>
        <p>
          ${this._localize("wizard.walk_instruction",{duration:5})}
        </p>

        ${r?V:G`
            <p class="corner-instruction">
              ${this._localize("wizard.corner_step",{index:e+1,corner:this._localize(n)})}
            </p>
        `}

        <div class="corner-progress">
          ${oi.map((t,i)=>{const o=!!this._wizardCorners[i],r=i<3,n=i<e;return G`
                <span
                  class="corner-chip ${o?"done":""} ${i===e?"active":""}"
                  @click=${()=>{const e=this._wizardCorners[i];this._wizardCornerIndex=i,this._wizardCorners=[...this._wizardCorners],this._wizardCorners[i]=null,this._wizardOffsetSide=e?.offset_side?String(e.offset_side/10):"",this._wizardOffsetFb=e?.offset_fb?String(e.offset_fb/10):""}}
                >
                  ${this._localize(t)} ${o?"✓":""}
                </span>
                ${r?G`
                  <span class="corner-arrow ${n?"done":""}">›</span>
                `:V}
              `})}
        </div>

        <div class="corner-offsets" key="${e}">
          <span class="offset-label">${this._localize("wizard.distance_from")}</span>
          <input
            type="number"
            class="offset-input"
            min="0"
            step="1"
            placeholder="${this._localize("wizard.distance_from_side",{wall:this._localize(s)})}"
            .value=${this._wizardOffsetSide}
            @input=${t=>{this._wizardOffsetSide=t.target.value;const i=10*(parseFloat(this._wizardOffsetSide)||0),o=this._wizardCorners[e];o&&(o.offset_side=i)}}
          />
          <input
            type="number"
            class="offset-input"
            min="0"
            step="1"
            placeholder="${this._localize("wizard.distance_from_side",{wall:this._localize(a)})}"
            .value=${this._wizardOffsetFb}
            @input=${t=>{this._wizardOffsetFb=t.target.value;const i=10*(parseFloat(this._wizardOffsetFb)||0),o=this._wizardCorners[e];o&&(o.offset_fb=i)}}
          />
        </div>

        ${this._renderMiniSensorView()}

        ${r?G`
          <p style="font-size: 13px; color: var(--secondary-text-color); margin: 12px 0 4px;">
            ${this._localize("wizard.save_prompt")}
          </p>
        `:G`
          <p class="no-target-warning" style="visibility: ${!i||o?"visible":"hidden"};">
            ${i?this._localize("wizard.multiple_targets"):this._localize("wizard.no_target")}
          </p>
        `}

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${()=>{this._setupStep=null,this._wizardCorners=[null,null,null,null],this._wizardCornerIndex=0,this._wizardOffsetSide="",this._wizardOffsetFb=""}}
          >${this._localize("common.cancel")}</button>
          ${r?G`
            <button
              class="wizard-btn wizard-btn-primary"
              ?disabled=${this._wizardSaving}
              @click=${()=>{this._computeWizardPerspective(),this._wizardFinish()}}
            >
              ${this._wizardSaving?this._localize("common.saving"):this._localize("common.save")}
            </button>
          `:G`
            <button
              class="wizard-btn wizard-btn-primary"
              ?disabled=${!i||o||this._wizardCapturing}
              @click=${()=>this._wizardStartCapture()}
            >
              ${this._localize("wizard.mark_corner",{corner:this._localize(n)})}
            </button>
          `}
        </div>
      </div>
    `}_renderMiniSensorView(){const e=si.FOV_X_EXTENT,t=ze,i=200,o=-e,r=t*Math.cos(si.FOV_HALF_ANGLE),n=`M 0 0 L ${o} ${r} A 6000 6000 0 0 0 ${e} ${r} Z`,s=[2e3,4e3].map(e=>{const t=e*Math.sin(si.FOV_HALF_ANGLE),i=e*Math.cos(si.FOV_HALF_ANGLE);return`M ${-t} ${i} A ${e} ${e} 0 0 0 ${t} ${i}`});return G`
      <div class="mini-grid-container">
        <div class="sensor-fov-view">
          <svg
            class="sensor-fov-svg"
            viewBox="${-e-i} ${-200} ${2*e+400} ${6400}"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="${n}"
              fill="rgba(3, 169, 244, 0.10)"
              stroke="rgba(3, 169, 244, 0.3)"
              stroke-width="30"
            />
            ${s.map(e=>W`
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
          ${this._wizardCorners.filter(e=>null!==e).map((e,t)=>{const{xPct:i,yPct:o}=this._rawToFovPct(e.raw_x,e.raw_y);return G`
                <div
                  class="mini-grid-captured"
                  style="left: ${i}%; top: ${o}%;"
                  title="${this._localize(oi[t])}"
                ></div>
              `})}
          <!-- Live targets (per-target colors) -->
          ${this._targets.map((e,t)=>null!=e.raw_x&&null!=e.raw_y?G`
              <div
                class="mini-grid-target"
                style="${this._getWizardTargetStyle(e)} background: ${ni[t]||ni[0]};"
              ></div>
            `:V)}
        </div>
      </div>
    `}_renderSaveCancelButtons(){const e="settings"===this._view?this._saveSettings:this._applyLayout;return G`
      <div class="save-cancel-bar">
        <button class="wizard-btn wizard-btn-back"
          @click=${()=>{this._dirty=!1,this._view="live",this._loadEntryConfig(this._selectedEntryId)}}
        >${this._localize("common.cancel")}</button>
        <button class="wizard-btn wizard-btn-primary"
          ?disabled=${this._saving||!this._dirty}
          @click=${e}
        >${this._saving?this._localize("common.saving"):this._localize("common.save")}</button>
      </div>
    `}_renderLiveOverview(){return G`
      <div class="panel" @click=${e=>{this._showLiveMenu&&!e.target.closest(".sidebar-menu-wrapper")&&(this._showLiveMenu=!1)}}>
        ${this._renderHeader()}
        <div class="editor-layout">
          <div style="flex: 1; min-width: 0;">
            ${V}
            <div class="grid-container">
              ${this._perspective?this._renderLiveGrid():this._renderUncalibratedFov()}
            </div>
            ${this._perspective?this._renderBackendDebugLog():V}
          </div>
          <div class="zone-sidebar">
            <div class="sidebar-header">
              <span class="sidebar-title" style="margin-right: auto;">${this._localize("sidebar.live_overview")}</span>
              <div class="sidebar-menu-wrapper">
                <button class="sidebar-menu-btn" @click=${()=>{this._showLiveMenu=!this._showLiveMenu}}>
                  <ha-icon icon="mdi:dots-vertical" style="--mdc-icon-size: 20px;"></ha-icon>
                </button>
                ${this._showLiveMenu?G`
                  <div class="sidebar-menu" @click=${()=>{this._showLiveMenu=!1}}>
                    ${this._perspective?G`
                      <button class="sidebar-menu-item" @click=${()=>{this._view="editor",this._sidebarTab="zones"}}>
                        <ha-icon icon="mdi:vector-square" style="--mdc-icon-size: 18px;"></ha-icon> ${this._localize("menu.detection_zones")}
                      </button>
                      <button class="sidebar-menu-item" @click=${()=>{this._view="editor",this._sidebarTab="furniture"}}>
                        <ha-icon icon="mdi:sofa" style="--mdc-icon-size: 18px;"></ha-icon> ${this._localize("menu.furniture")}
                      </button>
                    `:V}
                    <button class="sidebar-menu-item" @click=${()=>{this._view="settings"}}>
                      <ha-icon icon="mdi:cog" style="--mdc-icon-size: 18px;"></ha-icon> ${this._localize("menu.settings")}
                    </button>
                    <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 4px 0;"/>
                    <button class="sidebar-menu-item" @click=${this._changePlacement}>
                      <ha-icon icon="mdi:target" style="--mdc-icon-size: 18px;"></ha-icon> ${this._localize("menu.room_calibration")}
                    </button>
                    ${this._perspective?G`
                      <button class="sidebar-menu-item" style="color: var(--error-color, #f44336);" @click=${()=>{this._showDeleteCalibrationDialog=!0}}>
                        <ha-icon icon="mdi:delete" style="--mdc-icon-size: 18px;"></ha-icon> ${this._localize("menu.delete_calibration")}
                      </button>
                    `:V}
                    <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 4px 0;"/>
                    <button class="sidebar-menu-item" @click=${()=>{this._showTemplateSave=!0}}>
                      <ha-icon icon="mdi:content-save" style="--mdc-icon-size: 18px;"></ha-icon> ${this._localize("dialogs.save_template")}
                    </button>
                    <button class="sidebar-menu-item" @click=${()=>{this._showTemplateLoad=!0}}>
                      <ha-icon icon="mdi:folder-open" style="--mdc-icon-size: 18px;"></ha-icon> ${this._localize("dialogs.load_template")}
                    </button>
                  </div>
                `:V}
              </div>
            </div>
            ${this._renderLiveSidebar()}
          </div>
        </div>
      </div>
    `}_renderLiveGrid(){const e=this._getRoomBounds(),t=e.minCol>e.maxCol,i=t?0:e.minCol,o=t?19:e.maxCol,r=t?0:e.minRow,n=t?19:e.maxRow,s=o-i+1,a=n-r+1,l=Math.min(480,.55*(this.offsetWidth||800)),c=Math.min(Math.floor(l/s),Math.floor(l/a),32);return G`
      <div
        class="grid"
        style="grid-template-columns: repeat(${s}, ${c}px); grid-template-rows: repeat(${a}, ${c}px);"
      >
        ${this._renderVisibleCells(i,o,r,n,c,!0)}
      </div>
      ${this._renderFurnitureOverlay(c,i,r,s,a)}
      <div class="targets-overlay" style="pointer-events: none;">
        ${this._targets.map((e,t)=>{if("inactive"===e.status)return V;const o=this._mapTargetToGridCell(e);if(!o)return V;const n=(o.col-i)/s*100,l=(o.row-r)/a*100;return G`
            <div
              class="target-dot"
              style="left: ${n}%; top: ${l}%; background: ${ni[t]||ni[0]}; opacity: ${"pending"===e.status?.3:1}; transition: opacity 0.5s ease;"
            ></div>
          `})}
      </div>
      ${this._renderGridDimensions()}
    `}_renderGridDimensions(){const e=this._getGridRoomMetrics();return e?G`
      <div class="grid-dimensions">
        ${e.widthM}m × ${e.depthM}m · Furthest point: ${e.furthestM}m
      </div>
    `:V}_renderUncalibratedFov(){const e=this._sensorState.occupancy,t=e?"#4CAF50":"var(--primary-color, #03a9f4)",i=160,o=14,r=150,n=30*Math.PI/180,s=150*Math.PI/180,a=i+r*Math.cos(n),l=o+r*Math.sin(n),c=i+r*Math.cos(s),h=o+r*Math.sin(s);return G`
      <div style="display: flex; flex-direction: column; align-items: center; padding: 24px;">
        <svg viewBox="0 0 320 180" width="320" height="180" style="display: block;">
          <!-- Sensor at top center -->
          <rect x="${154}" y="0" width="12" height="8" rx="3" fill="${t}"/>
          <circle cx="${i}" cy="0" r="4" fill="${t}" opacity="0.4"/>

          <!-- 120° FOV wedge with rounded arc end -->
          <path d="M ${i} ${o} L ${a} ${l} A ${r} ${r} 0 0 1 ${c} ${h} Z"
                fill="${t}" fill-opacity="${e?.15:.06}"
                stroke="${t}" stroke-width="1" stroke-opacity="0.2"/>

          <!-- Range arcs -->
          ${[60,120,180].map(e=>{const r=i+e*Math.cos(n),a=o+e*Math.sin(n),l=i+e*Math.cos(s),c=o+e*Math.sin(s);return W`
              <path d="M ${r} ${a} A ${e} ${e} 0 0 1 ${l} ${c}"
                    fill="none" stroke="${t}" stroke-width="1"
                    stroke-dasharray="4 3" opacity="0.2"/>
            `})}

          <!-- Edge lines -->
          <line x1="${i}" y1="${o}" x2="${a}" y2="${l}" stroke="${t}" stroke-width="0.5" opacity="0.2"/>
          <line x1="${i}" y1="${o}" x2="${c}" y2="${h}" stroke="${t}" stroke-width="0.5" opacity="0.2"/>

          <!-- Target dots -->
          ${this._targets.map((e,t)=>{if(null==e.raw_x||null==e.raw_y)return V;const n=i+e.raw_x/6e3*r*Math.sin(Math.PI/3),s=o+e.raw_y/6e3*r;return W`<circle cx="${n}" cy="${s}" r="5" fill="${ni[t]||ni[0]}"/>`})}

          ${e?W`
            <text x="${i}" y="120" font-size="13" fill="${t}" text-anchor="middle" font-weight="500">${this._localize("live.detected")}</text>
          `:W`
            <text x="${i}" y="120" font-size="13" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">${this._localize("wizard.no_presence")}</text>
          `}
        </svg>

        <button
          class="live-nav-link" style="margin-top: 16px;"
          @click=${()=>{this._setupStep="guide",this._wizardCorners=[null,null,null,null],this._wizardCornerIndex=0,this._wizardOffsetSide="",this._wizardOffsetFb="",this._view="live"}}
        >
          <ha-icon icon="mdi:target" style="--mdc-icon-size: 16px;"></ha-icon>
          ${this._localize("wizard.calibrate_room_size")}
        </button>
      </div>
    `}_renderNeedsCalibration(){const e=W`
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
    `,t=(()=>{const e=28,t=28,i=180,o=-15*Math.PI/180,r=105*Math.PI/180,n=e+i*Math.cos(o),s=t+i*Math.sin(o),a=e+i*Math.cos(r),l=t+i*Math.sin(r),c=(i,n)=>{const s=e+i*Math.cos(o),a=t+i*Math.sin(o),l=e+i*Math.cos(r),c=t+i*Math.sin(r),h=45*Math.PI/180,d=e+(i-10)*Math.cos(h),p=t+(i-10)*Math.sin(h);return W`
          <path d="M ${s} ${a} A ${i} ${i} 0 0 1 ${l} ${c}"
                fill="none" stroke="var(--primary-color, #03a9f4)" stroke-width="1"
                stroke-dasharray="4 3" opacity="0.35" clip-path="url(#room-clip)"/>
          <text x="${d}" y="${p}" font-size="8" fill="var(--secondary-text-color, #aaa)"
                text-anchor="middle" clip-path="url(#room-clip)">${n}</text>
        `};return W`
        <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
          <defs>
            <clipPath id="room-clip"><rect x="20" y="20" width="160" height="120"/></clipPath>
          </defs>
          <!-- Room outline -->
          <rect x="20" y="20" width="160" height="120" fill="none" stroke="var(--divider-color, #ccc)" stroke-width="2" rx="2"/>
          <!-- 120° FOV wedge clipped to room -->
          <path d="M ${e} ${t} L ${a} ${l} A ${i} ${i} 0 0 0 ${n} ${s} Z"
                fill="var(--primary-color, #03a9f4)" opacity="0.08"
                clip-path="url(#room-clip)"/>
          <!-- Cone edge lines -->
          <line x1="${e}" y1="${t}" x2="${n}" y2="${s}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <line x1="${e}" y1="${t}" x2="${a}" y2="${l}" stroke="var(--primary-color, #03a9f4)" stroke-width="0.5" opacity="0.3" clip-path="url(#room-clip)"/>
          <!-- Range arcs -->
          ${c(60,"2m")}
          ${c(120,"4m")}
          ${c(180,"")}
          <!-- Sensor dot -->
          <circle cx="${e}" cy="${t}" r="6" fill="var(--primary-color, #03a9f4)"/>
          <!-- Labels -->
          <text x="30" y="16" font-size="10" fill="var(--primary-color, #03a9f4)">${this._localize("wizard.sensor")}</text>
          <text x="152" y="136" font-size="8" fill="var(--secondary-text-color, #aaa)" text-anchor="end">6m</text>
        </svg>
      `})(),i=W`
      <svg viewBox="0 0 200 160" width="200" height="160" style="display: block;">
        <!-- Wall -->
        <line x1="20" y1="10" x2="20" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <line x1="20" y1="150" x2="180" y2="150" stroke="var(--divider-color, #ccc)" stroke-width="2"/>
        <!-- Sensor -->
        <rect x="14" y="56" width="12" height="8" rx="2" fill="var(--primary-color, #03a9f4)"/>
        <!-- Correct: horizontal beam -->
        <line x1="26" y1="60" x2="170" y2="60" stroke="var(--primary-color, #03a9f4)" stroke-width="1.5"/>
        <polygon points="170,60 162,56 162,64" fill="var(--primary-color, #03a9f4)"/>
        <text x="70" y="52" font-size="10" fill="var(--primary-color, #03a9f4)">${this._localize("wizard.horizontal_correct")}</text>
        <!-- Wrong: angled down -->
        <line x1="26" y1="60" x2="140" y2="140" stroke="var(--error-color, #f44336)" stroke-width="1" stroke-dasharray="4 2" opacity="0.6"/>
        <text x="90" y="118" font-size="10" fill="var(--error-color, #f44336)" opacity="0.7">${this._localize("wizard.angled_wrong")}</text>
        <!-- Wrong: angled up -->
        <line x1="26" y1="60" x2="120" y2="22" stroke="var(--error-color, #f44336)" stroke-width="1" stroke-dasharray="4 2" opacity="0.6"/>
        <text x="75" y="18" font-size="10" fill="var(--error-color, #f44336)" opacity="0.7">${this._localize("wizard.angled_wrong")}</text>
      </svg>
    `;return G`
      <div class="panel">
        ${this._renderHeader()}
        <div style="max-width: 560px; margin: 0 auto; padding: 0 24px;">
          <div class="setting-group">
            <h4>${this._localize("wizard.how_to_position")}</h4>
            <div style="display: flex; flex-direction: column; gap: 20px; padding: 8px 0;">

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${e}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">${this._localize("wizard.mount_height")}</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    ${be(this._localize("wizard.mount_height_desc"))}
                  </div>
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 0;"/>

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${t}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">${this._localize("wizard.placement")}</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    ${be(this._localize("wizard.placement_desc"))}
                  </div>
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 0;"/>

              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="flex-shrink: 0;">${i}</div>
                <div>
                  <div style="font-weight: 500; margin-bottom: 4px;">${this._localize("wizard.beam_direction")}</div>
                  <div style="font-size: 13px; color: var(--secondary-text-color, #757575);">
                    ${be(this._localize("wizard.beam_direction_desc"))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <button
              class="wizard-btn wizard-btn-primary"
              @click=${()=>{this._setupStep="guide",this._wizardCorners=[null,null,null,null],this._wizardCornerIndex=0,this._wizardOffsetSide="",this._wizardOffsetFb=""}}
            >
              ${this._localize("wizard.start_calibration")}
            </button>
          </div>
        </div>
      </div>
    `}_toggleAccordion(e){const t=new Set(this._openAccordions);t.has(e)?t.delete(e):t.add(e),this._openAccordions=t}_getSensorRoomPosition(){return Ne(this._perspective)}_autoDetectionRange(){return function(e,t,i,o){if(e<=0||t<=0)return 0;const r=Ne(i);if(r){const t=Math.ceil(e/ke),i=Math.floor((xe-t)/2);let n=0;const s=Se(o);for(let e=s.minRow;e<=s.maxRow;e++)for(let t=s.minCol;t<=s.maxCol;t++){if(!Ee(o[e*xe+t]))continue;const s=(e+.5)*ke,a=(t-i+.5)*ke-r.x,l=s-r.y,c=Math.sqrt(a*a+l*l);c>n&&(n=c)}if(n>0){const e=n/1e3;return Math.ceil(2*e)/2}}const n=Math.max(e,t)/1e3;return Math.ceil(2*n)/2}(this._roomWidth,this._roomDepth,this._perspective,this._grid)}_renderSettings(){return G`
      <div class="panel">
        ${this._renderHeader()}
        <div class="settings-container" @input=${()=>{this._dirty=!0}} @change=${()=>{this._dirty=!0}}>
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500;">${this._localize("settings.title")}</h2>
          ${[{id:"detection",label:"settings.detection_ranges",icon:"mdi:signal-distance-variant"},{id:"sensitivity",label:"settings.sensor_calibration",icon:"mdi:tune-vertical"},{id:"reporting",label:"settings.entities",icon:"mdi:format-list-checks"}].map(e=>{const t=this._openAccordions.has(e.id);return G`
              <div class="accordion">
                <button class="accordion-header" ?data-open=${t} @click=${()=>this._toggleAccordion(e.id)}>
                  <ha-icon icon=${e.icon}></ha-icon>
                  <span class="accordion-title">${this._localize(e.label)}</span>
                  <ha-icon class="accordion-chevron" icon="mdi:chevron-down" ?data-open=${t}></ha-icon>
                </button>
                ${t?G`
                  <div class="accordion-body">
                    ${this._renderSettingsSection(e.id)}
                  </div>
                `:V}
              </div>
            `})}
          ${this._renderSaveCancelButtons()}
        </div>
      </div>
    `}_renderSettingsSection(e){switch(e){case"detection":return this._renderDetectionRanges();case"sensitivity":return this._renderSensitivities();case"reporting":return this._renderReporting();default:return V}}_renderEnvOffset(e,t,i,o,r,n,s,a,l){const c=(this._offsetsConfig||{})[i]??0,h=null!=t?t-c:null,d=null!=h?(h+c).toFixed(a):"—";return G`
      <div class="setting-row">
        <label>${e}</label>
        <span class="setting-input-unit"><input type="range" class="setting-range" data-offset-key=${i} .value=${String(c)} min=${o} max=${r} step=${n} @input=${e=>{const t=e.target,i=parseFloat(t.value),o=null!=h?(h+i).toFixed(a):"—";t.nextElementSibling.textContent=o}} /><span class="setting-value">${d}</span> ${s}</span>
        ${this._infoTip(l)}
      </div>
    `}_infoTip(e){return G`<span class="setting-info"
      @click=${e=>{e.stopPropagation();const t=e.currentTarget,i=t.querySelector(".setting-info-tooltip");if(!i)return;const o="block"===i.style.display;if(this.shadowRoot.querySelectorAll(".setting-info-tooltip").forEach(e=>{e.style.display="none"}),o)return;const r=t.getBoundingClientRect();i.style.display="block",i.style.left=`${Math.max(8,Math.min(r.right-240,window.innerWidth-256))}px`,i.style.top=`${r.bottom+6}px`}}
    ><ha-icon icon="mdi:help-circle-outline"></ha-icon><span class="setting-info-tooltip">${e}</span></span>`}_renderDetectionRanges(){const e=this._autoDetectionRange(),t=this._getGridRoomMetrics(),i=this._targetAutoRange?e>0?Math.min(e,6):6:this._targetMaxDistance,o=this._staticAutoRange?e>0?Math.min(e,16):16:this._staticMaxDistance,r="opacity: 0.5; pointer-events: none;";return G`
      <div class="settings-section">
        ${t?G`<p style="font-size: 13px; color: var(--secondary-text-color, #757575); margin: 0 0 12px;">${this._localize("settings.furthest_point",{distance:t.furthestM})}</p>`:V}
        <div class="setting-group">
          <h4>${this._localize("settings.target_sensor")}</h4>
          <div class="setting-row">
            <label>${this._localize("settings.auto")}</label>
            <label class="toggle-switch">
              <input type="checkbox" ?checked=${this._targetAutoRange}
                @change=${e=>{this._targetAutoRange=e.target.checked}} />
              <span class="toggle-slider"></span>
            </label>
            ${this._infoTip(this._localize("info.target_auto_range"))}
          </div>
          <div class="setting-row" style="${this._targetAutoRange?r:""}">
            <label>${this._localize("settings.max_distance")}</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(i)} min="0.5" max="6" step="0.1"
              @input=${e=>{const t=e.target;this._targetMaxDistance=Number(t.value),t.nextElementSibling.textContent=t.value}} /><span class="setting-value">${i}</span><span class="setting-unit">m</span></span>
            ${this._infoTip(this._localize("info.target_max_distance"))}
          </div>
        </div>
        <div class="setting-group">
          <h4>${this._localize("settings.static_sensor")}</h4>
          <div class="setting-row">
            <label>${this._localize("settings.auto")}</label>
            <label class="toggle-switch">
              <input type="checkbox" ?checked=${this._staticAutoRange}
                @change=${e=>{this._staticAutoRange=e.target.checked}} />
              <span class="toggle-slider"></span>
            </label>
            ${this._infoTip(this._localize("info.target_auto_range"))}
          </div>
          <div class="setting-row" style="${this._staticAutoRange?r:""}">
            <label>${this._localize("settings.min_distance")}</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(this._staticAutoRange?.3:this._staticMinDistance)} min="0.3" max="16" step="0.1"
              @input=${e=>{const t=e.target;let i=Number(t.value);i>=this._staticMaxDistance&&(i=this._staticMaxDistance-.1,t.value=String(i)),this._staticMinDistance=i,t.nextElementSibling.textContent=String(i)}} /><span class="setting-value">${this._staticAutoRange?.3:this._staticMinDistance}</span><span class="setting-unit">m</span></span>
            ${this._infoTip(this._localize("info.static_min_distance"))}
          </div>
          <div class="setting-row" style="${this._staticAutoRange?r:""}">
            <label>${this._localize("settings.max_distance")}</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" .value=${String(o)} min="2.4" max="16" step="0.1"
              @input=${e=>{const t=e.target;let i=Number(t.value);i<=this._staticMinDistance&&(i=this._staticMinDistance+.1,t.value=String(i)),this._staticMaxDistance=i,t.nextElementSibling.textContent=String(i)}} /><span class="setting-value">${o}</span><span class="setting-unit">m</span></span>
            ${this._infoTip(this._localize("info.static_max_distance"))}
          </div>
        </div>
      </div>
    `}_renderSensitivities(){return G`
      <div class="settings-section">
        <div class="setting-group">
          <h4>${this._localize("settings.motion_sensor")}</h4>
          <div class="setting-row">
            <label>${this._localize("settings.presence_timeout")}</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="5" min="0" max="120" step="1" @input=${e=>{const t=e.target;t.nextElementSibling.textContent=t.value}} /><span class="setting-value">5</span><span class="setting-unit">s</span></span>
            ${this._infoTip(this._localize("info.motion_timeout"))}
          </div>
        </div>
        <div class="setting-group">
          <h4>${this._localize("settings.static_sensor")}</h4>
          <div class="setting-row">
            <label>${this._localize("settings.presence_timeout")}</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" value="30" min="0" max="120" step="1" @input=${e=>{const t=e.target;t.nextElementSibling.textContent=t.value}} /><span class="setting-value">30</span><span class="setting-unit">s</span></span>
            ${this._infoTip(this._localize("info.static_timeout"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("settings.trigger_threshold")}</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value="3" @input=${e=>{const t=e.target;t.nextElementSibling.textContent=t.value}} /><span class="setting-value">3</span><span class="setting-unit"></span></span>
            ${this._infoTip(this._localize("info.trigger_threshold"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("settings.renew_threshold")}</label>
            <span class="setting-input-unit"><input type="range" class="setting-range" min="0" max="9" value="3" @input=${e=>{const t=e.target;t.nextElementSibling.textContent=t.value}} /><span class="setting-value">3</span><span class="setting-unit"></span></span>
            ${this._infoTip(this._localize("info.renew_threshold"))}
          </div>
        </div>
        <div class="setting-group">
          <h4>${this._localize("settings.environmental")}</h4>
          ${this._renderEnvOffset(this._localize("settings.illuminance_offset"),this._sensorState.illuminance,"illuminance",-500,500,1,"lux",0,this._localize("info.illuminance_offset"))}
          ${this._renderEnvOffset(this._localize("settings.humidity_offset"),this._sensorState.humidity,"humidity",-50,50,.1,"%",1,this._localize("info.humidity_offset"))}
          ${this._renderEnvOffset(this._localize("settings.temperature_offset"),this._sensorState.temperature,"temperature",-20,20,.1,"°C",1,this._localize("info.temperature_offset"))}
        </div>
      </div>
    `}_renderReporting(){const e=this._reportingConfig||{},t=(t,i)=>e[t]??i;return G`
      <div class="settings-section">
        <div class="setting-group">
          <h4>${this._localize("entities.room_level")}</h4>
          <div class="setting-row">
            <label>${this._localize("entities.occupancy")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_occupancy" ?checked=${t("room_occupancy",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.room_occupancy"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.static_presence")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_static_presence" ?checked=${t("room_static_presence",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.room_static"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.motion_presence")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_motion_presence" ?checked=${t("room_motion_presence",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.room_motion"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.target_presence")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_target_presence" ?checked=${t("room_target_presence",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.room_target_presence"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.target_count")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="room_target_count" ?checked=${t("room_target_count",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.room_target_count"))}
          </div>
        </div>
        <div class="setting-group">
          <h4>${this._localize("entities.zone_level")}</h4>
          <div class="setting-row">
            <label>${this._localize("entities.zone_presence")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="zone_presence" ?checked=${t("zone_presence",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.zone_presence"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.target_count")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="zone_target_count" ?checked=${t("zone_target_count",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.zone_target_count"))}
          </div>
        </div>
        <div class="setting-group">
          <h4>${this._localize("entities.target_level")}</h4>
          <div class="setting-row">
            <label>${this._localize("entities.xy_sensor")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_xy_sensor" ?checked=${t("target_xy_sensor",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.xy_sensor"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.xy_grid")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_xy_grid" ?checked=${t("target_xy_grid",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.xy_grid"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.active")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_active" ?checked=${t("target_active",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.active"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.distance")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_distance" ?checked=${t("target_distance",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.distance"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.angle")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_angle" ?checked=${t("target_angle",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.angle"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.speed")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_speed" ?checked=${t("target_speed",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.speed"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.resolution")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="target_resolution" ?checked=${t("target_resolution",!1)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.resolution"))}
          </div>
        </div>
        <div class="setting-group">
          <h4>${this._localize("settings.environmental")}</h4>
          <div class="setting-row">
            <label>${this._localize("entities.illuminance")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_illuminance" ?checked=${t("env_illuminance",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.illuminance"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.humidity")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_humidity" ?checked=${t("env_humidity",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.humidity"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.temperature")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_temperature" ?checked=${t("env_temperature",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.temperature"))}
          </div>
          <div class="setting-row">
            <label>${this._localize("entities.co2")}</label>
            <label class="toggle-switch"><input type="checkbox" data-report-key="env_co2" ?checked=${t("env_co2",!0)} /><span class="toggle-slider"></span></label>
            ${this._infoTip(this._localize("info.co2"))}
          </div>
        </div>
      </div>
    `}_renderEditor(){const e=this._frozenBounds??this._getRoomBounds(),t=e.minCol>e.maxCol,i=t?0:e.minCol,o=t?19:e.maxCol,r=t?0:e.minRow,n=t?19:e.maxRow,s=o-i+1,a=n-r+1,l=Math.min(520,.55*(this.offsetWidth||800)),c=Math.min(32,Math.floor(l/s),Math.floor(l/a));return G`
      <div class="panel" @click=${e=>{const t=e.target;t.closest(".grid")||t.closest(".zone-sidebar")||(this._activeZone=null)}}>
        ${this._renderHeader()}

        <div class="editor-layout">
          <div style="flex: 1; min-width: 0;">
            ${V}
            <!-- Grid -->
            <div class="grid-container" @click=${e=>{e.target.closest(".furniture-item")||(this._selectedFurnitureId=null)}}>
            <div
              class="grid"
              style="grid-template-columns: repeat(${s}, ${c}px); grid-template-rows: repeat(${a}, ${c}px);"
              @mouseup=${this._onCellMouseUp}
              @mouseleave=${this._onCellMouseUp}
            >
              ${this._renderVisibleCells(i,o,r,n,c)}
            </div>
            ${this._renderFurnitureOverlay(c,i,r,s,a)}
            <div class="targets-overlay" style="pointer-events: none;">
              ${this._targets.map((e,t)=>{if(null==e.x||null==e.y)return V;const o=this._mapTargetToGridCell(e);if(!o)return V;const n=(o.col-i)/s*100,l=(o.row-r)/a*100;return G`
                    <div
                      class="target-dot"
                      style="left: ${n}%; top: ${l}%; background: ${ni[t]||ni[0]}; opacity: ${"pending"===e.status?.3:1}; transition: opacity 0.5s ease;"
                    ></div>
                    ${e.signal>0?G`
                      <div style="position: absolute; left: ${n}%; top: ${l}%; transform: translate(-50%, -280%); background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; font-weight: bold; padding: 0 4px; border-radius: 6px; pointer-events: none;">
                        ${e.signal}
                      </div>
                    `:V}
                  `})}
            </div>
            ${this._renderGridDimensions()}
            ${"zones"===this._sidebarTab?this._renderDebugLog():V}
          </div>
          </div>

          <!-- Sidebar -->
          <div class="zone-sidebar">
            <div class="sidebar-title">${"furniture"===this._sidebarTab?this._localize("sidebar.furniture"):this._localize("sidebar.detection_zones")}</div>
            ${"zones"===this._sidebarTab?this._renderZoneSidebar():this._renderFurnitureSidebar()}
            ${this._renderSaveCancelButtons()}
          </div>
        </div>


        ${this._showTemplateSave?this._renderTemplateSaveDialog():V}
        ${this._showTemplateLoad?this._renderTemplateLoadDialog():V}
        ${this._showRenameDialog?G`
          <div class="template-dialog">
            <div class="template-dialog-card" style="max-width: 520px;">
              <h3>${this._localize("dialogs.update_entity_ids")}</h3>
              <p class="overlay-help">${this._localize("dialogs.update_entity_ids_body")}</p>
              <div style="max-height: 300px; overflow-y: auto; margin: 12px 0;">
                ${this._pendingRenames.map(e=>{const t=e.old_entity_id.split(".")[1]||e.old_entity_id,i=e.new_entity_id.split(".")[1]||e.new_entity_id,o=e.old_entity_id.split(".")[0]||"";return G`
                    <div style="
                      padding: 8px 12px; margin: 4px 0;
                      background: var(--secondary-background-color, #f5f5f5);
                      border-radius: 8px; font-family: monospace; font-size: 12px;
                    ">
                      <div style="color: var(--secondary-text-color, #888); font-size: 11px; margin-bottom: 4px; font-family: var(--paper-font-body1_-_font-family, sans-serif);">
                        ${o}
                      </div>
                      <div style="text-decoration: line-through; color: var(--secondary-text-color, #888); word-break: break-all;">
                        ${t}
                      </div>
                      <div style="font-weight: 500; word-break: break-all; margin-top: 2px;">
                        → ${i}
                      </div>
                    </div>
                  `})}
              </div>
              <div class="template-dialog-actions">
                <button class="wizard-btn wizard-btn-back"
                  @click=${this._dismissRenameDialog}
                >${this._localize("common.skip")}</button>
                <button class="wizard-btn wizard-btn-primary"
                  @click=${this._applyRenames}
                >${this._localize("common.rename")}</button>
              </div>
            </div>
          </div>
        `:V}
        ${this._showUnsavedDialog?G`
          <div class="template-dialog">
            <div class="template-dialog-card">
              <h3>${this._localize("dialogs.unsaved_changes")}</h3>
              <p class="overlay-help">${this._localize("dialogs.unsaved_changes_body")}</p>
              <div class="template-dialog-actions">
                <button class="wizard-btn wizard-btn-back"
                  @click=${()=>{this._showUnsavedDialog=!1,this._pendingNavigation=null}}
                >${this._localize("common.cancel")}</button>
                <button class="wizard-btn wizard-btn-primary" style="background: var(--error-color, #f44336);"
                  @click=${this._discardAndNavigate}
                >${this._localize("common.discard")}</button>
              </div>
            </div>
          </div>
        `:V}
      </div>
    `}_renderTemplateSaveDialog(){return G`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>${this._localize("dialogs.save_template")}</h3>
          <input
            type="text"
            class="template-name-input"
            placeholder="${this._localize("dialogs.template_name")}"
            .value=${this._templateName}
            @input=${e=>{this._templateName=e.target.value}}
          />
          <div class="template-dialog-actions">
            <button
              class="wizard-btn wizard-btn-back"
              @click=${()=>{this._showTemplateSave=!1}}
            >${this._localize("common.cancel")}</button>
            <button
              class="wizard-btn wizard-btn-primary"
              ?disabled=${!this._templateName.trim()}
              @click=${()=>this._saveTemplate()}
            >${this._localize("common.save")}</button>
          </div>
        </div>
      </div>
    `}_renderTemplateLoadDialog(){const e=this._getTemplates();return G`
      <div class="template-dialog">
        <div class="template-dialog-card">
          <h3>${this._localize("dialogs.load_template")}</h3>
          ${0===e.length?G`<p class="overlay-help">${this._localize("dialogs.no_templates")}</p>`:e.map(e=>G`
              <div class="template-item">
                <span class="template-item-name">${e.name}</span>
                <span class="template-item-size">${(e.roomWidth/1e3).toFixed(1)}m x ${(e.roomDepth/1e3).toFixed(1)}m</span>
                <button
                  class="wizard-btn wizard-btn-primary template-item-btn"
                  @click=${()=>this._loadTemplate(e.name)}
                >${this._localize("common.load")}</button>
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
            >${this._localize("common.close")}</button>
          </div>
        </div>
      </div>
    `}_renderVisibleCells(e,t,i,o,r,n=!1){const s=this._showHitCounts?this._computeHeatmapColors():null;let a;if(n){a={};for(const[e,t]of Object.entries(this._zoneState.occupancy))a[Number(e)]=t}else a=this._runLocalZoneEngine();const l=[];for(let n=i;n<=o;n++)for(let i=e;i<=t;i++){const e=n*xe+i,t=this._grid[e];let o=this._getCellColor(e),c="";if(Ee(t)){const e=Ce(t);if(s){const t=s.get(e);t&&(o=`linear-gradient(${t}, ${t}), linear-gradient(${o}, ${o})`)}a[e]&&(c="box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4);")}l.push(G`
          <div
            class="cell"
            style="background: ${o}; width: ${r}px; height: ${r}px; ${c}"
            @mousedown=${()=>{this._onCellMouseDown(e)}}
            @mouseenter=${()=>{this._onCellMouseEnter(e)}}
          ></div>
        `)}return l}_runLocalZoneEngine(){const e=Date.now()/1e3,t=new Map,i=new Map,o=[null,null,null],r=[null,null,null];for(let e=0;e<3&&e<this._targets.length;e++){const n=this._targets[e];if("active"!==n.status){this._targetPrev[e]=null,this._targetGateCount[e]=0;continue}const s=n.signal;if(s<=0)continue;const a=this._mapTargetToGridCell(n);if(!a){this._targetPrev[e]=null,this._targetGateCount[e]=0;continue}const l=Math.floor(a.col),c=Math.floor(a.row);if(l<0||l>=xe||c<0||c>=we){this._targetPrev[e]=null,this._targetGateCount[e]=0;continue}const h=c*xe+l,d=this._grid[h];if(!Ee(d)){this._targetPrev[e]=null,this._targetGateCount[e]=0;continue}const p=Ce(d);r[e]=p;const u=this._targetPrev[e];if(null!==u){const t=u.row*xe+u.col;t>=0&&t<$e&&Ee(this._grid[t])&&(o[e]=Ce(this._grid[t]))}let g=!1;if(null!==u){g=Math.max(Math.abs(l-u.col),Math.abs(c-u.row))<=5}i.set(p,Math.max(i.get(p)??0,s));const{trigger:f,renew:_,entryPoint:m}=this._getZoneThresholds(p),b=this._localZoneState.get(p),y=!(b?.occupied??!1),v=y?f:_;if(!m&&!g&&y){s>=Math.min(v+2,8)?(this._targetGateCount[e]++,this._targetGateCount[e]>=2?(t.set(p,!0),b&&b.confirmedTargets.add(e),this._targetPrev[e]={col:l,row:c},this._targetGateCount[e]=0):this._targetPrev[e]={col:l,row:c}):(this._targetPrev[e]=null,this._targetGateCount[e]=0)}else s>=v?(t.set(p,!0),b&&b.confirmedTargets.add(e),this._targetPrev[e]={col:l,row:c},this._targetGateCount[e]=0):this._targetPrev[e]={col:l,row:c}}for(let t=0;t<3;t++){const i=o[t],n=r[t];if(null===i||null===n||i===n)continue;const s=this._localZoneState.get(i);if(s&&(s.confirmedTargets.delete(t),0===s.confirmedTargets.size&&s.occupied&&null===s.pendingSince)){const{timeout:t,handoffTimeout:o}=this._getZoneThresholds(i);s.pendingSince=e-(t-o)}}const n={},s=new Set;for(let e=0;e<this._grid.length;e++)Ee(this._grid[e])&&s.add(Ce(this._grid[e]));for(const i of s){let o=this._localZoneState.get(i);o||(o={occupied:!1,pendingSince:null,confirmedTargets:new Set},this._localZoneState.set(i,o));const{timeout:r}=this._getZoneThresholds(i),s=t.get(i)??!1;o.occupied?null===o.pendingSince?s||(o.pendingSince=e):s?o.pendingSince=null:e-o.pendingSince>=r&&(o.occupied=!1,o.pendingSince=null,o.confirmedTargets.clear()):s&&(o.occupied=!0,o.pendingSince=null),n[i]=o.occupied}for(let e=0;e<3&&e<this._targets.length;e++)if("active"!==this._targets[e].status)for(const t of this._localZoneState.values())null===t.pendingSince&&t.confirmedTargets.delete(e);if(this._showDebugLog){const e=e=>{if(0===e)return"Room";const t=this._zoneConfigs[e-1];return t?t.name:`Zone ${e}`},i=[];for(let o=0;o<3&&o<this._targets.length;o++){const n=this._targets[o];if("active"!==n.status)continue;const s=n.signal;if(s<=0)continue;const a=r[o],l=null!==a?e(a):"outside",c=null!==a&&t.get(a)?"Y":"N";i.push(`T${o}: signal=${s} zone='${l}' confirmed=${c}`)}const o=[];for(const t of s){const i=this._localZoneState.get(t);if(i?.occupied){const r=null!==i.pendingSince?"pending":"occupied",n=i.confirmedTargets.size;o.push(`${e(t)}: ${r} (${n})`)}}const a=`${i.length?i.join(", "):"no targets"} | ${o.length?o.join(", "):"all clear"}`;if(a===this._debugLogPrev)return n;this._debugLogPrev=a;const l=(new Date).toLocaleTimeString("en-GB",{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:1});this._debugLogLines.push(`${l} ${a}`),this._debugLogLines.length>si._DEBUG_LOG_MAX&&(this._debugLogLines=this._debugLogLines.slice(-si._DEBUG_LOG_MAX)),this.requestUpdate()}return n}_computeHeatmapColors(){return function(e,t){const i=new Map;for(const[o,r]of Object.entries(e)){const e=Number(o);if(r<=0)continue;const n=Math.min(r,9)/9*.6;let s=100,a=180,l=255;if(e>0&&e<=7){const i=t[e-1];if(i){const e=Re(i.color);s=e.r,a=e.g,l=e.b}}i.set(e,`rgba(${s}, ${a}, ${l}, ${n})`)}return i}(this._zoneState.target_counts,this._zoneConfigs)}_getZoneThresholds(e){return function(e,t,i,o,r,n,s,a){if(0===e){const e=Me[i]||Me.normal;return"custom"===i?{trigger:o,renew:r,timeout:n,handoffTimeout:s,entryPoint:a}:{trigger:e.trigger,renew:e.renew,timeout:e.timeout,handoffTimeout:e.handoff_timeout,entryPoint:!1}}if(e>0&&e<=t.length){const i=t[e-1];if(i){const e=Me[i.type]||Me.normal;return"custom"===i.type?{trigger:i.trigger??e.trigger,renew:i.renew??e.renew,timeout:i.timeout??e.timeout,handoffTimeout:i.handoff_timeout??e.handoff_timeout,entryPoint:i.entry_point??!1}:{trigger:e.trigger,renew:e.renew,timeout:e.timeout,handoffTimeout:e.handoff_timeout,entryPoint:"entrance"===i.type}}}return{trigger:5,renew:3,timeout:10,handoffTimeout:3,entryPoint:!1}}(e,this._zoneConfigs,this._roomType,this._roomTrigger,this._roomRenew,this._roomTimeout,this._roomHandoffTimeout,this._roomEntryPoint)}_renderBoundaryTypeControls(){const e="custom"===this._roomType,t=Me[this._roomType]||Me.normal,i=e?this._roomTrigger:t.trigger,o=e?this._roomRenew:t.renew,r=e?this._roomTimeout:t.timeout,n=e?this._roomHandoffTimeout:t.handoff_timeout,s=`width: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; opacity: ${e?1:.5};`;return G`
      <div class="zone-item-row zone-settings-row" style="flex-wrap: wrap; gap: 3px; padding: 4px 8px;">
        <div style="width: 100%; display: flex; align-items: center; gap: 4px;">
          <label style="width: 80px; flex-shrink: 0; font-size: 12px;">${this._localize("zones.type")}</label>
          <select
            class="sensitivity-select" style="flex: 1; min-width: 0;"
            .value=${this._roomType}
            @change=${e=>{const t=e.target.value,i=Me[t]||Me.normal;this._roomType=t,this._roomTrigger=i.trigger,this._roomRenew=i.renew,this._roomTimeout=i.timeout,this._roomHandoffTimeout=i.handoff_timeout,this._dirty=!0}}
            @click=${e=>e.stopPropagation()}
          >
            <option value="normal">${this._localize("zones.normal")}</option>
            <option value="entrance">${this._localize("zones.entrance")}</option>
            <option value="thoroughfare">${this._localize("zones.thoroughfare")}</option>
            <option value="rest">${this._localize("zones.rest_area")}</option>
            <option value="custom">${this._localize("zones.custom")}</option>
          </select>
        </div>
        <div style="${s}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.trigger")}</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(i)} ?disabled=${!e}
            @input=${e=>{this._roomTrigger=Number(e.target.value),this._dirty=!0}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${i}</span>
        </div>
        <div style="${s}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.renew")}</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(o)} ?disabled=${!e}
            @input=${e=>{this._roomRenew=Number(e.target.value),this._dirty=!0}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${o}</span>
        </div>
        <div style="${s}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.presence_timeout")}</label>
          <span style="flex: 1;"></span>
          <input type="number" min="1" max="300" style="width: 48px; text-align: right; font: inherit; font-size: 12px;" .value=${String(r)} ?disabled=${!e}
            @input=${e=>{const t=Number(e.target.value);t>0&&(this._roomTimeout=t,this._dirty=!0)}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0; font-size: 12px;">${this._localize("zones.seconds_suffix")}</span>
        </div>
        <div style="${s}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.handoff_timeout")}</label>
          <span style="flex: 1;"></span>
          <input type="number" min="1" max="300" style="width: 48px; text-align: right; font: inherit; font-size: 12px;" .value=${String(n)} ?disabled=${!e}
            @input=${e=>{const t=Number(e.target.value);t>0&&(this._roomHandoffTimeout=t,this._dirty=!0)}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0; font-size: 12px;">${this._localize("zones.seconds_suffix")}</span>
        </div>
        <div style="width: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; opacity: ${e?1:.5};">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.entry_point")}</label>
          <span style="flex: 1;"></span>
          <label class="toggle-switch">
            <input type="checkbox" ?checked=${!!e&&this._roomEntryPoint} ?disabled=${!e}
              @change=${e=>{this._roomEntryPoint=e.target.checked,this._dirty=!0}}
              @click=${e=>e.stopPropagation()}
            />
            <span class="toggle-slider"></span>
          </label>
          <span style="width: 10px;"></span>
        </div>
      </div>
    `}_renderZoneTypeControls(e,t){const i="custom"===e.type,o=Me[e.type]||Me.normal,r=e.trigger??o.trigger,n=e.renew??o.renew,s=e.timeout??o.timeout,a=e.handoff_timeout??o.handoff_timeout,l=`width: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; opacity: ${i?1:.5};`;return G`
      <div class="zone-item-row zone-settings-row" style="flex-wrap: wrap; gap: 3px; padding: 4px 8px;">
        <div style="width: 100%; display: flex; align-items: center; gap: 4px;">
          <label style="width: 80px; flex-shrink: 0; font-size: 12px;">${this._localize("zones.type")}</label>
          <select
            class="sensitivity-select" style="flex: 1; min-width: 0;"
            .value=${e.type}
            @change=${i=>{const o=i.target.value,r=Me[o]||Me.normal,n=[...this._zoneConfigs];n[t]={...e,type:o,trigger:r.trigger,renew:r.renew,timeout:r.timeout,handoff_timeout:r.handoff_timeout},this._zoneConfigs=n,this._dirty=!0}}
            @click=${e=>e.stopPropagation()}
          >
            <option value="normal">${this._localize("zones.normal")}</option>
            <option value="entrance">${this._localize("zones.entrance")}</option>
            <option value="thoroughfare">${this._localize("zones.thoroughfare")}</option>
            <option value="rest">${this._localize("zones.rest_area")}</option>
            <option value="custom">${this._localize("zones.custom")}</option>
          </select>
        </div>
        <div style="${l}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.trigger")}</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(r)} ?disabled=${!i}
            @input=${i=>{const o=[...this._zoneConfigs];o[t]={...e,trigger:Number(i.target.value)},this._zoneConfigs=o,this._dirty=!0}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${r}</span>
        </div>
        <div style="${l}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.renew")}</label>
          <input type="range" min="1" max="9" style="flex: 1; min-width: 0;" .value=${String(n)} ?disabled=${!i}
            @input=${i=>{const o=[...this._zoneConfigs];o[t]={...e,renew:Number(i.target.value)},this._zoneConfigs=o,this._dirty=!0}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0;">${n}</span>
        </div>
        <div style="${l}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.presence_timeout")}</label>
          <span style="flex: 1;"></span>
          <input type="number" min="1" max="300" style="width: 48px; text-align: right; font: inherit; font-size: 12px; margin-right: 0;" .value=${String(s)} ?disabled=${!i}
            @input=${i=>{const o=Number(i.target.value);if(o>0){const i=[...this._zoneConfigs];i[t]={...e,timeout:o},this._zoneConfigs=i,this._dirty=!0}}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0; font-size: 12px;">${this._localize("zones.seconds_suffix")}</span>
        </div>
        <div style="${l}">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.handoff_timeout")}</label>
          <span style="flex: 1;"></span>
          <input type="number" min="1" max="300" style="width: 48px; text-align: right; font: inherit; font-size: 12px; margin-right: 0;" .value=${String(a)} ?disabled=${!i}
            @input=${i=>{const o=Number(i.target.value);if(o>0){const i=[...this._zoneConfigs];i[t]={...e,handoff_timeout:o},this._zoneConfigs=i,this._dirty=!0}}}
            @click=${e=>e.stopPropagation()} />
          <span style="width: 10px; text-align: right; flex-shrink: 0; font-size: 12px;">${this._localize("zones.seconds_suffix")}</span>
        </div>
        <div style="width: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; opacity: ${i?1:.5};">
          <label style="width: 80px; flex-shrink: 0;">${this._localize("zones.entry_point")}</label>
          <span style="flex: 1;"></span>
          <label class="toggle-switch">
            <input type="checkbox" ?checked=${i?e.entry_point??!1:"entrance"===e.type} ?disabled=${!i}
              @change=${i=>{const o=[...this._zoneConfigs];o[t]={...e,entry_point:i.target.checked},this._zoneConfigs=o,this._dirty=!0}}
              @click=${e=>e.stopPropagation()}
            />
            <span class="toggle-slider"></span>
          </label>
          <span style="width: 10px;"></span>
        </div>
      </div>
    `}_renderBackendDebugLog(){return G`
      <div style="margin-top: 8px;">
        <button
          class="live-section-header live-section-link"
          style="font-size: 12px; gap: 4px;"
          @click=${()=>{this._showBackendDebugLog=!this._showBackendDebugLog,this._showBackendDebugLog||(this._backendDebugLogLines=[],this._backendDebugLogPrev=null)}}
        >
          <ha-icon icon=${this._showBackendDebugLog?"mdi:chevron-down":"mdi:chevron-right"} style="--mdc-icon-size: 14px;"></ha-icon>
          Detection events
        </button>
        ${this._showBackendDebugLog?G`
          <div style="display: flex; justify-content: flex-end; margin-bottom: 4px; gap: 4px;">
            <button
              class="debug-log-btn"
              @click=${()=>{navigator.clipboard.writeText(this._backendDebugLogLines.join("\n"))}}
            >Copy all</button>
            <button
              class="debug-log-btn"
              @click=${()=>{this._backendDebugLogLines=[],this._backendDebugLogPrev=null,this.requestUpdate()}}
            >Clear</button>
          </div>
          <div class="debug-log-container" id="backend-debug-log-scroll">
            ${0===this._backendDebugLogLines.length?G`<div style="color: var(--secondary-text-color, #999); font-style: italic;">Waiting for events...</div>`:this._backendDebugLogLines.map(e=>G`<div class="debug-log-line">${e}</div>`)}
          </div>
        `:V}
      </div>
    `}_renderDebugLog(){return G`
      <div style="padding: 0 16px; margin-top: 8px;">
        <button
          class="live-section-header live-section-link"
          style="font-size: 12px; gap: 4px;"
          @click=${()=>{this._showDebugLog=!this._showDebugLog,this._showDebugLog||(this._debugLogLines=[],this._debugLogPrev=null)}}
        >
          <ha-icon icon=${this._showDebugLog?"mdi:chevron-down":"mdi:chevron-right"} style="--mdc-icon-size: 14px;"></ha-icon>
          Detection events
        </button>
        ${this._showDebugLog?G`
          <div style="display: flex; justify-content: flex-end; margin-bottom: 4px; gap: 4px;">
            <button
              class="debug-log-btn"
              @click=${()=>{navigator.clipboard.writeText(this._debugLogLines.join("\n"))}}
            >Copy all</button>
            <button
              class="debug-log-btn"
              @click=${()=>{this._debugLogLines=[],this._debugLogPrev=null,this.requestUpdate()}}
            >Clear</button>
          </div>
          <div class="debug-log-container" id="debug-log-scroll">
            ${0===this._debugLogLines.length?G`<div style="color: var(--secondary-text-color, #999); font-style: italic;">Waiting for events...</div>`:this._debugLogLines.map(e=>G`<div class="debug-log-line">${e}</div>`)}
          </div>
        `:V}
      </div>
    `}_renderZoneSidebar(){return G`
      <div class="zone-scroll-area">
      <!-- Room -->
      <div
        class="zone-item ${0===this._activeZone?"active":""}"
        @click=${()=>{this._activeZone=0}}
      >
        <div class="zone-item-row">
          <div class="zone-color-dot" style="background: #fff; border: 1px solid #ccc;${this._localZoneState.get(0)?.occupied?" box-shadow: 0 0 6px 2px #999;":""}"></div>
          <span class="zone-name">${this._localize("sidebar.room")}</span>
        </div>
        ${0===this._activeZone?G`
          ${this._renderBoundaryTypeControls()}
        `:V}
      </div>

      <hr class="zone-separator"/>
      <!-- Named zones 1..N -->
      ${this._zoneConfigs.map((e,t)=>{if(null===e)return V;const i=t+1;return G`
          <div
            class="zone-item ${this._activeZone===i?"active":""}"
            @click=${()=>{this._activeZone=i}}
          >
            <div class="zone-item-row">
              ${this._activeZone===i?G`
                <input
                  type="color"
                  class="zone-color-picker"
                  style="width: 16px; height: 16px; border-radius: 50%;${this._localZoneState.get(i)?.occupied?` box-shadow: 0 0 6px 2px ${e.color};`:""}"
                  .value=${e.color}
                  @input=${i=>{const o=i.target.value,r=[...this._zoneConfigs];r[t]={...e,color:o},this._zoneConfigs=r,this._dirty=!0}}
                  @click=${e=>e.stopPropagation()}
                />
              `:G`
                <div class="zone-color-dot" style="background: ${e.color};${this._localZoneState.get(i)?.occupied?` box-shadow: 0 0 6px 2px ${e.color};`:""}"></div>
              `}
              <input
                class="zone-name-input"
                type="text"
                .value=${e.name}
                @input=${i=>{const o=i.target.value,r=[...this._zoneConfigs];r[t]={...e,name:o},this._zoneConfigs=r}}
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
            ${this._activeZone===i?G`
              ${this._renderZoneTypeControls(e,t)}
            `:V}
          </div>
        `})}

      ${this._zoneConfigs.some(e=>null===e)?G`
          <button class="add-zone-btn" @click=${this._addZone}>
            <ha-icon icon="mdi:plus"></ha-icon>
            ${this._localize("sidebar.add_zone")}
          </button>
        `:V}
      </div>
    `}_renderFurnitureOverlay(e,t,i,o,r){if(!this._furniture.length)return V;const n=Math.ceil(this._roomWidth/ke),s=Math.floor((xe-n)/2),a=e+1,l="furniture"===this._sidebarTab;return G`
      <div class="furniture-overlay ${l?"":"non-interactive"}">
        ${this._furniture.map(o=>{const r=(s-t)*a+this._mmToPx(o.x,e),n=(0-i)*a+this._mmToPx(o.y,e),l=this._mmToPx(o.width,e),c=this._mmToPx(o.height,e),h=this._selectedFurnitureId===o.id;return G`
            <div
              class="furniture-item ${h?"selected":""}"
              data-id="${o.id}"
              style="
                left: ${r}px; top: ${n}px;
                width: ${l}px; height: ${c}px;
                transform: rotate(${o.rotation}deg);
              "
              @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"move")}
            >
              ${"svg"===o.type&&ti[o.icon]?W`<svg viewBox="${ti[o.icon].viewBox}" preserveAspectRatio="none" class="furn-svg">
                    ${ve(ti[o.icon].content)}
                  </svg>`:G`<ha-icon icon="${o.icon}" style="--mdc-icon-size: ${.6*Math.min(l,c)}px;"></ha-icon>`}
              ${h?G`
                <!-- Resize handles -->
                <div class="furn-handle furn-handle-n" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","n")}></div>
                <div class="furn-handle furn-handle-s" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","s")}></div>
                <div class="furn-handle furn-handle-e" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","e")}></div>
                <div class="furn-handle furn-handle-w" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","w")}></div>
                <div class="furn-handle furn-handle-ne" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","ne")}></div>
                <div class="furn-handle furn-handle-nw" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","nw")}></div>
                <div class="furn-handle furn-handle-se" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","se")}></div>
                <div class="furn-handle furn-handle-sw" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"resize","sw")}></div>
                <!-- Rotate handle with stem -->
                <div class="furn-rotate-stem"></div>
                <div class="furn-rotate-handle" @pointerdown=${e=>this._onFurniturePointerDown(e,o.id,"rotate")}>
                  <ha-icon icon="mdi:rotate-right" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
                <!-- Delete button -->
                <div class="furn-delete-btn" @pointerdown=${e=>{e.stopPropagation(),this._removeFurniture(o.id)}}>
                  <ha-icon icon="mdi:close" style="--mdc-icon-size: 14px;"></ha-icon>
                </div>
              `:V}
            </div>
          `})}
      </div>
    `}_renderLiveSidebar(){const e=this._sensorState,t=this._zoneState,i=[{id:"occupancy",label:this._localize("live.occupancy"),on:e.occupancy,info:this._localize("info.occupancy")},{id:"static",label:this._localize("live.static_presence"),on:e.static_presence,info:this._localize("info.static_presence")},{id:"motion",label:this._localize("live.motion_presence"),on:e.motion_presence,info:this._localize("info.motion_presence")},{id:"target",label:this._localize("live.target_presence"),on:e.target_presence,info:this._localize("info.target_presence")}],o=[];for(let e=0;e<7;e++){const i=this._zoneConfigs[e];if(!i)continue;const r=e+1,n=t.occupancy[r]??!1,s=t.target_counts[r]??0;o.push({id:`zone_${r}`,label:i.name,on:n,info:this._localize("info.zone_occupancy",{slot:r,count:s})})}const r=t.occupancy[0]??!1,n=t.target_counts[0]??0;o.push({id:"zone_0",label:this._localize("sidebar.rest_of_room"),on:r,info:this._localize("info.rest_of_room_occupancy",{count:n})});const s=[];return null!==e.illuminance&&s.push({id:"illuminance",label:this._localize("entities.illuminance"),value:`${e.illuminance.toFixed(1)} lux`}),null!==e.temperature&&s.push({id:"temperature",label:this._localize("entities.temperature"),value:`${e.temperature.toFixed(1)} °C`}),null!==e.humidity&&s.push({id:"humidity",label:this._localize("entities.humidity"),value:`${e.humidity.toFixed(1)} %`}),null!==e.co2&&s.push({id:"co2",label:this._localize("entities.co2"),value:`${Math.round(e.co2)} ppm`}),G`
      <div style="padding: 8px 0;">
        <div class="live-section-header">${this._localize("live.presence")}</div>
        ${i.map(e=>G`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${e.on?"on":"off"}"></div>
            <span class="live-sensor-label">${e.label}</span>
            <span class="live-sensor-state ${e.on?"detected":""}">${e.on?this._localize("live.detected"):this._localize("live.clear")}</span>
            <button class="live-sensor-info-btn"
              @click=${()=>{this._expandedSensorInfo=this._expandedSensorInfo===e.id?null:e.id}}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo===e.id?G`
            <div class="live-sensor-info-text">${e.info}</div>
          `:V}
        `)}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        <button class="live-section-header live-section-link" @click=${()=>{this._view="editor",this._sidebarTab="zones"}}>${this._localize("sidebar.detection_zones")}</button>
        ${o.map(e=>G`
          <div class="live-sensor-row">
            <div class="live-sensor-dot ${e.on?"on":"off"}"></div>
            <span class="live-sensor-label">${e.label}</span>
            <span class="live-sensor-state ${e.on?"detected":""}">${e.on?this._localize("live.detected"):this._localize("live.clear")}</span>
            <button class="live-sensor-info-btn"
              @click=${()=>{this._expandedSensorInfo=this._expandedSensorInfo===e.id?null:e.id}}
            >
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 16px;"></ha-icon>
            </button>
          </div>
          ${this._expandedSensorInfo===e.id?G`
            <div class="live-sensor-info-text">${e.info}</div>
          `:V}
        `)}

        <hr style="border: none; border-top: 1px solid var(--divider-color, #eee); margin: 10px 12px;"/>

        ${s.length?G`
          <div class="live-section-header">${this._localize("live.environment")}</div>
          ${s.map(e=>G`
            <div class="live-sensor-row">
              <span class="live-sensor-label">${e.label}</span>
              <span class="live-sensor-value">${e.value}</span>
            </div>
          `)}
        `:V}

      </div>
    `}_renderFurnitureSidebar(){const e=this._furniture.find(e=>e.id===this._selectedFurnitureId);return G`
      ${e?G`
        <div class="furn-selected-info">
          <div class="zone-item-row">
            <ha-icon icon="${e.icon}" style="--mdc-icon-size: 20px;"></ha-icon>
            <strong>${this._localize(e.label)}</strong>
            <button class="zone-remove-btn" @click=${()=>this._removeFurniture(e.id)}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="furn-dims">
            <label>
              ${this._localize("dimensions.width_mm")}
              <input type="number" min="100" step="50" .value=${String(Math.round(e.width))}
                @change=${t=>this._updateFurniture(e.id,{width:parseInt(t.target.value)})}
              />
            </label>
            <label>
              ${this._localize("dimensions.height_mm")}
              <input type="number" min="100" step="50" .value=${String(Math.round(e.height))}
                @change=${t=>this._updateFurniture(e.id,{height:parseInt(t.target.value)})}
              />
            </label>
            <label>
              ${this._localize("dimensions.rotation")}
              <input type="number" step="5" .value=${String(Math.round(e.rotation))}
                @change=${t=>this._updateFurniture(e.id,{rotation:parseInt(t.target.value)%360})}
              />
            </label>
          </div>
        </div>
      `:V}

      <div class="furn-catalog">
        ${ii.map(e=>G`
          <button class="furn-sticker" @click=${()=>this._addFurniture(e)}>
            ${"svg"===e.type&&ti[e.icon]?W`<svg viewBox="${ti[e.icon].viewBox}" class="furn-sticker-svg">
                  ${ve(ti[e.icon].content)}
                </svg>`:G`<ha-icon icon="${e.icon}" style="--mdc-icon-size: 24px;"></ha-icon>`}
            <span>${this._localize(e.label)}</span>
          </button>
        `)}
        <button class="furn-sticker furn-custom" @click=${()=>{this._showCustomIconPicker=!this._showCustomIconPicker}}>
          <ha-icon icon="mdi:plus" style="--mdc-icon-size: 24px;"></ha-icon>
          <span>${this._localize("furniture.custom_icon")}</span>
        </button>
      </div>
      ${this._showCustomIconPicker?G`
        <div class="template-dialog">
          <div class="template-dialog-card">
            <h3>${this._localize("furniture.custom_icon")}</h3>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._customIconValue}
              @value-changed=${e=>{this._customIconValue=e.detail.value||""}}
            ></ha-icon-picker>
            ${this._customIconValue.trim()?G`
              <div style="text-align: center;">
                <ha-icon icon="${this._customIconValue.trim()}" style="--mdc-icon-size: 48px;"></ha-icon>
              </div>
            `:V}
            <div class="template-dialog-actions">
              <button class="wizard-btn wizard-btn-back"
                @click=${()=>{this._showCustomIconPicker=!1,this._customIconValue=""}}
              >${this._localize("common.cancel")}</button>
              <button class="wizard-btn wizard-btn-primary"
                ?disabled=${!this._customIconValue.trim()}
                @click=${()=>{this._addCustomFurniture(this._customIconValue.trim()),this._customIconValue="",this._showCustomIconPicker=!1}}
              >${this._localize("common.add")}</button>
            </div>
          </div>
        </div>
      `:V}
    `}}si._DEBUG_LOG_MAX=100,si.FOV_HALF_ANGLE=Math.PI/3,si.FOV_X_EXTENT=ze*Math.sin(Math.PI/3),si.styles=((e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new n(i,e,o)})`
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
      overflow: hidden;
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
      padding: 5px 11px;
      border-radius: 16px;
      font-size: 13px;
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color, #757575);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      border: 2px solid transparent;
    }

    .corner-chip.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border-color: var(--primary-color, #03a9f4);
    }

    .corner-chip.done {
      background: #4caf50;
      color: #fff;
    }

    .corner-chip.done.active {
      border-color: var(--primary-color, #03a9f4);
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

    .debug-log-container {
      max-height: 200px;
      overflow-y: auto;
      background: var(--card-background-color, #1e1e1e);
      border: 1px solid var(--divider-color, #333);
      border-radius: 6px;
      padding: 6px 8px;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.5;
    }

    .debug-log-line {
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--primary-text-color, #e0e0e0);
    }

    .debug-log-btn {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--secondary-text-color, #999);
      font-size: 10px;
      padding: 2px 8px;
      cursor: pointer;
    }

    .debug-log-btn:hover {
      color: var(--primary-text-color);
      border-color: var(--primary-text-color, #ccc);
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
  `,e([pe({attribute:!1})],si.prototype,"hass",void 0),e([ue()],si.prototype,"_grid",void 0),e([ue()],si.prototype,"_zoneConfigs",void 0),e([ue()],si.prototype,"_activeZone",void 0),e([ue()],si.prototype,"_roomType",void 0),e([ue()],si.prototype,"_roomTrigger",void 0),e([ue()],si.prototype,"_roomRenew",void 0),e([ue()],si.prototype,"_roomTimeout",void 0),e([ue()],si.prototype,"_roomHandoffTimeout",void 0),e([ue()],si.prototype,"_roomEntryPoint",void 0),e([ue()],si.prototype,"_targetAutoRange",void 0),e([ue()],si.prototype,"_targetMaxDistance",void 0),e([ue()],si.prototype,"_staticAutoRange",void 0),e([ue()],si.prototype,"_staticMinDistance",void 0),e([ue()],si.prototype,"_staticMaxDistance",void 0),e([ue()],si.prototype,"_sidebarTab",void 0),e([ue()],si.prototype,"_expandedSensorInfo",void 0),e([ue()],si.prototype,"_showLiveMenu",void 0),e([ue()],si.prototype,"_showDeleteCalibrationDialog",void 0),e([ue()],si.prototype,"_showCustomIconPicker",void 0),e([ue()],si.prototype,"_customIconValue",void 0),e([ue()],si.prototype,"_furniture",void 0),e([ue()],si.prototype,"_selectedFurnitureId",void 0),e([ue()],si.prototype,"_pendingRenames",void 0),e([ue()],si.prototype,"_showRenameDialog",void 0),e([ue()],si.prototype,"_targets",void 0),e([ue()],si.prototype,"_sensorState",void 0),e([ue()],si.prototype,"_zoneState",void 0),e([ue()],si.prototype,"_showHitCounts",void 0),e([ue()],si.prototype,"_showDebugLog",void 0),e([ue()],si.prototype,"_showBackendDebugLog",void 0),e([ue()],si.prototype,"_isPainting",void 0),e([ue()],si.prototype,"_paintAction",void 0),e([ue()],si.prototype,"_saving",void 0),e([ue()],si.prototype,"_dirty",void 0),e([ue()],si.prototype,"_showUnsavedDialog",void 0),e([ue()],si.prototype,"_showTemplateSave",void 0),e([ue()],si.prototype,"_showTemplateLoad",void 0),e([ue()],si.prototype,"_templateName",void 0),e([ue()],si.prototype,"_entries",void 0),e([ue()],si.prototype,"_selectedEntryId",void 0),e([ue()],si.prototype,"_loading",void 0),e([ue()],si.prototype,"_setupStep",void 0),e([ue()],si.prototype,"_wizardSaving",void 0),e([ue()],si.prototype,"_wizardCornerIndex",void 0),e([ue()],si.prototype,"_wizardCorners",void 0),e([ue()],si.prototype,"_wizardRoomWidth",void 0),e([ue()],si.prototype,"_wizardRoomDepth",void 0),e([ue()],si.prototype,"_wizardCapturing",void 0),e([ue()],si.prototype,"_wizardCaptureProgress",void 0),e([ue()],si.prototype,"_wizardOffsetSide",void 0),e([ue()],si.prototype,"_wizardOffsetFb",void 0),e([ue()],si.prototype,"_view",void 0),e([ue()],si.prototype,"_openAccordions",void 0),e([ue()],si.prototype,"_perspective",void 0),e([ue()],si.prototype,"_roomWidth",void 0),e([ue()],si.prototype,"_roomDepth",void 0),e([ue()],si.prototype,"_wizardCapturePaused",void 0),customElements.get("everything-presence-pro-panel")||customElements.define("everything-presence-pro-panel",si);export{si as EverythingPresenceProPanel};
