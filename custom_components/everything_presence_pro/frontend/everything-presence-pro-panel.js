function t(t,e,i,r){var s,o=arguments.length,n=o<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,r);else for(var a=t.length-1;a>=0;a--)(s=t[a])&&(n=(o<3?s(n):o>3?s(e,i,n):s(e,i))||n);return o>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),s=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,r))(e)})(t):t,{is:a,defineProperty:d,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,_=u.trustedTypes,g=_?_.emptyScript:"",f=u.reactiveElementPolyfillSupport,m=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},b=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:b};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(t,i,e);void 0!==r&&d(this.prototype,t,r)}}static getPropertyDescriptor(t,e,i){const{get:r,set:s}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:r,set(e){const o=r?.call(this);s?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...c(t),...h(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,r)=>{if(i)t.adoptedStyleSheets=r.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of r){const r=document.createElement("style"),s=e.litNonce;void 0!==s&&r.setAttribute("nonce",s),r.textContent=i.cssText,t.appendChild(r)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,i);if(void 0!==r&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(e,i.type);this._$Em=t,null==s?this.removeAttribute(r):this.setAttribute(r,s),this._$Em=null}}_$AK(t,e){const i=this.constructor,r=i._$Eh.get(t);if(void 0!==r&&this._$Em!==r){const t=i.getPropertyOptions(r),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=r;const o=s.fromAttribute(e,t.type);this[r]=o??this._$Ej?.get(r)??o,this._$Em=null}}requestUpdate(t,e,i,r=!1,s){if(void 0!==t){const o=this.constructor;if(!1===r&&(s=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??b)(s,e)||i.useDefault&&i.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:r,wrapped:s},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==s||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===r&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,r=this[e];!0!==t||this._$AL.has(e)||void 0===r||this.C(e,void 0,i,r)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[m("elementProperties")]=new Map,$[m("finalized")]=new Map,f?.({ReactiveElement:$}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x=globalThis,w=t=>t,z=x.trustedTypes,k=z?z.createPolicy("lit-html",{createHTML:t=>t}):void 0,A="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+S,E=`<${P}>`,C=document,T=()=>C.createComment(""),M=t=>null===t||"object"!=typeof t&&"function"!=typeof t,B=Array.isArray,R="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,U=/>/g,H=RegExp(`>|${R}(?:([^\\s"'>=/]+)(${R}*=${R}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,W=/"/g,j=/^(?:script|style|textarea|title)$/i,L=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),Z=Symbol.for("lit-noChange"),D=Symbol.for("lit-nothing"),F=new WeakMap,V=C.createTreeWalker(C,129);function q(t,e){if(!B(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,r=[];let s,o=2===e?"<svg>":3===e?"<math>":"",n=O;for(let e=0;e<i;e++){const i=t[e];let a,d,l=-1,c=0;for(;c<i.length&&(n.lastIndex=c,d=n.exec(i),null!==d);)c=n.lastIndex,n===O?"!--"===d[1]?n=N:void 0!==d[1]?n=U:void 0!==d[2]?(j.test(d[2])&&(s=RegExp("</"+d[2],"g")),n=H):void 0!==d[3]&&(n=H):n===H?">"===d[0]?(n=s??O,l=-1):void 0===d[1]?l=-2:(l=n.lastIndex-d[2].length,a=d[1],n=void 0===d[3]?H:'"'===d[3]?W:I):n===W||n===I?n=H:n===N||n===U?n=O:(n=H,s=void 0);const h=n===H&&t[e+1].startsWith("/>")?" ":"";o+=n===O?i+E:l>=0?(r.push(a),i.slice(0,l)+A+i.slice(l)+S+h):i+S+(-2===l?e:h)}return[q(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),r]};class J{constructor({strings:t,_$litType$:e},i){let r;this.parts=[];let s=0,o=0;const n=t.length-1,a=this.parts,[d,l]=G(t,e);if(this.el=J.createElement(d,i),V.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=V.nextNode())&&a.length<n;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(A)){const e=l[o++],i=r.getAttribute(t).split(S),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:s,name:n[2],strings:i,ctor:"."===n[1]?tt:"?"===n[1]?et:"@"===n[1]?it:X}),r.removeAttribute(t)}else t.startsWith(S)&&(a.push({type:6,index:s}),r.removeAttribute(t));if(j.test(r.tagName)){const t=r.textContent.split(S),e=t.length-1;if(e>0){r.textContent=z?z.emptyScript:"";for(let i=0;i<e;i++)r.append(t[i],T()),V.nextNode(),a.push({type:2,index:++s});r.append(t[e],T())}}}else if(8===r.nodeType)if(r.data===P)a.push({type:2,index:s});else{let t=-1;for(;-1!==(t=r.data.indexOf(S,t+1));)a.push({type:7,index:s}),t+=S.length-1}s++}}static createElement(t,e){const i=C.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,r){if(e===Z)return e;let s=void 0!==r?i._$Co?.[r]:i._$Cl;const o=M(e)?void 0:e._$litDirective$;return s?.constructor!==o&&(s?._$AO?.(!1),void 0===o?s=void 0:(s=new o(t),s._$AT(t,i,r)),void 0!==r?(i._$Co??=[])[r]=s:i._$Cl=s),void 0!==s&&(e=K(t,s._$AS(t,e.values),s,r)),e}class Y{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,r=(t?.creationScope??C).importNode(e,!0);V.currentNode=r;let s=V.nextNode(),o=0,n=0,a=i[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new Q(s,s.nextSibling,this,t):1===a.type?e=new a.ctor(s,a.name,a.strings,this,t):6===a.type&&(e=new rt(s,this,t)),this._$AV.push(e),a=i[++n]}o!==a?.index&&(s=V.nextNode(),o++)}return V.currentNode=C,r}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,r){this.type=2,this._$AH=D,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),M(t)?t===D||null==t||""===t?(this._$AH!==D&&this._$AR(),this._$AH=D):t!==this._$AH&&t!==Z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>B(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==D&&M(this._$AH)?this._$AA.nextSibling.data=t:this.T(C.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,r="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(e);else{const t=new Y(r,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new J(t)),e}k(t){B(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,r=0;for(const s of t)r===e.length?e.push(i=new Q(this.O(T()),this.O(T()),this,this.options)):i=e[r],i._$AI(s),r++;r<e.length&&(this._$AR(i&&i._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,r,s){this.type=1,this._$AH=D,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=D}_$AI(t,e=this,i,r){const s=this.strings;let o=!1;if(void 0===s)t=K(this,t,e,0),o=!M(t)||t!==this._$AH&&t!==Z,o&&(this._$AH=t);else{const r=t;let n,a;for(t=s[0],n=0;n<s.length-1;n++)a=K(this,r[i+n],e,n),a===Z&&(a=this._$AH[n]),o||=!M(a)||a!==this._$AH[n],a===D?t=D:t!==D&&(t+=(a??"")+s[n+1]),this._$AH[n]=a}o&&!r&&this.j(t)}j(t){t===D?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends X{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===D?void 0:t}}class et extends X{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==D)}}class it extends X{constructor(t,e,i,r,s){super(t,e,i,r,s),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??D)===Z)return;const i=this._$AH,r=t===D&&i!==D||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,s=t!==D&&(i===D||r);r&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const st=x.litHtmlPolyfillSupport;st?.(J,Q),(x.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class nt extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const r=i?.renderBefore??e;let s=r._$litPart$;if(void 0===s){const t=i?.renderBefore??null;r._$litPart$=s=new Q(e.insertBefore(T(),t),t,void 0,i??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}}nt._$litElement$=!0,nt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:nt});const at=ot.litElementPolyfillSupport;at?.({LitElement:nt}),(ot.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const dt={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:b},lt=(t=dt,e,i)=>{const{kind:r,metadata:s}=i;let o=globalThis.litPropertyMetadata.get(s);if(void 0===o&&globalThis.litPropertyMetadata.set(s,o=new Map),"setter"===r&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===r){const{name:r}=i;return{set(i){const s=e.get.call(this);e.set.call(this,i),this.requestUpdate(r,s,t,!0,i)},init(e){return void 0!==e&&this.C(r,void 0,t,e),e}}}if("setter"===r){const{name:r}=i;return function(i){const s=this[r];e.call(this,i),this.requestUpdate(r,s,t,!0,i)}}throw Error("Unsupported decorator location: "+r)};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ct(t){return(e,i)=>"object"==typeof i?lt(t,e,i):((t,e,i)=>{const r=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),r?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ht(t){return ct({...t,state:!0,attribute:!1})}const pt=320,ut=579,_t=463,gt=Math.SQRT2/2,ft=["#4CAF50","#2196F3","#FF9800","#9C27B0","#F44336","#00BCD4","#FFEB3B","#795548"];let mt=class extends nt{constructor(){super(...arguments),this._activeTool="room",this._grid=new Array(pt).fill("room"),this._zones=[],this._activeZoneId=null,this._targets=[],this._isPainting=!1,this._paintValue="",this._entries=[],this._selectedEntryId="",this._loading=!0,this._setupStep=null,this._wizardRoomName="",this._wizardPlacement=null,this._wizardSaving=!1,this._wizardMirrored=!1,this._wizardBounds={far_y:0,left_x:0,right_x:0},this._wizardCapturedPoints=[],this._placement="",this._roomName="",this._mirrored=!1,this._roomBounds=null}connectedCallback(){super.connectedCallback(),this._initialize()}updated(t){t.has("hass")&&this.hass&&(this._updateTargets(),this._loading&&!this._entries.length&&this._initialize())}async _initialize(){this.hass&&(this._loading=!0,await this._loadEntries(),this._selectedEntryId&&await this._loadEntryConfig(this._selectedEntryId),this._loading=!1)}async _loadEntries(){try{const t=await this.hass.callWS({type:"everything_presence_pro/list_entries"});this._entries=t}catch{return void(this._entries=[])}const t=localStorage.getItem("epp_selected_entry"),e=t&&this._entries.find(e=>e.entry_id===t);this._selectedEntryId=e?t:this._entries[0]?.entry_id??""}async _loadEntryConfig(t){try{const e=await this.hass.callWS({type:"everything_presence_pro/get_config",entry_id:t});this._applyConfig(e)}catch{}}_applyConfig(t){const e=t.room_layout||{},i=e.room_cells||[],r=e.furniture||[],s=new Array(pt).fill("outside");for(const t of i)t>=0&&t<pt&&(s[t]="room");for(const t of r)for(const e of t.cells||[])e>=0&&e<pt&&(s[e]="furniture");this._grid=s;const o=(t.zones||[]).map((t,e)=>({id:t.id,name:t.name,color:ft[e%ft.length],sensitivity:t.sensitivity||"normal",cells:t.cells||[]}));this._zones=o;const n=t.placement||"",a=t.room_name||"",d=t.mirrored||!1,l=t.room_bounds;n?(this._setupStep=null,this._placement=n,this._roomName=a,this._mirrored=d,this._roomBounds=l&&l.far_y?{far_y:l.far_y,left_x:l.left_x,right_x:l.right_x}:null):(this._setupStep="placement",this._wizardRoomName=a,this._wizardPlacement=null,this._wizardMirrored=!1,this._wizardBounds={far_y:0,left_x:0,right_x:0},this._wizardCapturedPoints=[],this._placement="",this._roomName="",this._mirrored=!1,this._roomBounds=null)}_updateTargets(){if(!this.hass)return;const t=[];for(let e=1;e<=3;e++){const i=this._findEntity(`target_${e}_x`),r=this._findEntity(`target_${e}_y`),s=this._findEntity(`target_${e}_speed`);if(i&&r){const e=parseFloat(this.hass.states[i]?.state??"0"),o=parseFloat(this.hass.states[r]?.state??"0"),n=s?parseFloat(this.hass.states[s]?.state??"0"):0,a=0!==e||0!==o;t.push({x:e,y:o,speed:n,active:a})}}this._targets=t}_findEntity(t){if(this.hass?.states)return Object.keys(this.hass.states).find(e=>e.startsWith("sensor.everything_presence_pro")&&e.endsWith(t))}_selectTool(t){this._activeTool=t,this._activeZoneId=null}_onCellMouseDown(t){this._isPainting=!0,this._applyToolToCell(t)}_onCellMouseEnter(t){this._isPainting&&this._applyToolToCell(t)}_onCellMouseUp(){this._isPainting=!1}_applyToolToCell(t){switch(this._activeTool){case"room":this._grid=[...this._grid],this._grid[t]="room";break;case"outside":this._grid=[...this._grid],this._grid[t]="outside";break;case"furniture":this._grid=[...this._grid],this._grid[t]="furniture";break;case"zone":this._activeZoneId&&(this._zones=this._zones.map(e=>({...e,cells:e.id===this._activeZoneId?e.cells.includes(t)?e.cells.filter(e=>e!==t):[...e.cells,t]:e.cells.filter(e=>e!==t)})))}this.requestUpdate()}_addZone(){const t=`zone_${Date.now()}`,e=this._zones.length%ft.length,i={id:t,name:`Zone ${this._zones.length+1}`,color:ft[e],sensitivity:"normal",cells:[]};this._zones=[...this._zones,i],this._activeZoneId=t}_selectZone(t){this._activeZoneId=t}_removeZone(t){this._zones=this._zones.filter(e=>e.id!==t),this._activeZoneId===t&&(this._activeZoneId=null)}_getCellClass(t){const e=[this._grid[t]];for(const i of this._zones)if(i.cells.includes(t)){e.push("zone-cell");break}return e.join(" ")}_getCellZoneColor(t){for(const e of this._zones)if(e.cells.includes(t))return e.color;return""}_autoFillGrid(){this._grid=new Array(pt).fill("room")}_sensorToRoom(t,e,i,r){switch(i){case"left_corner":return{rx:e*gt+t*gt,ry:e*gt-t*gt};case"right_corner":return{rx:(r?.right_x??6e3)-e*gt+t*gt,ry:e*gt+t*gt};default:return{rx:(r?(r.left_x+r.right_x)/2:3e3)+t,ry:e}}}_mapTargetToPercent(t,e,i,r){const s=e?-t.x:t.x,{rx:o,ry:n}=this._sensorToRoom(s,t.y,i,r);if(r&&r.far_y>0&&r.right_x>r.left_x){return{x:(o-r.left_x)/(r.right_x-r.left_x)*100,y:n/r.far_y*100}}return{x:o/6e3*100,y:n/6e3*100}}_getTargetStyle(t){const{x:e,y:i}=this._mapTargetToPercent(t,this._mirrored,this._placement,this._roomBounds);return`left: ${e}%; top: ${i}%;`}async _onDeviceChange(t){const e=t.target.value;this._selectedEntryId=e,localStorage.setItem("epp_selected_entry",e),await this._loadEntryConfig(e)}_wizardGoToOrientation(){this._wizardPlacement&&this._wizardRoomName.trim()&&(this._placement=this._wizardPlacement,this._mirrored=!1,this._wizardMirrored=!1,this._setupStep="orientation")}_wizardGoToBounds(){this._mirrored=this._wizardMirrored,this._wizardBounds={far_y:0,left_x:0,right_x:0},this._wizardCapturedPoints=[],this._setupStep="bounds_far"}_markBoundsPoint(){const t=this._targets.find(t=>t.active);if(!t)return;const e=this._wizardMirrored?-t.x:t.x,i=this._wizardBounds.right_x>0?this._wizardBounds:null,{rx:r,ry:s}=this._sensorToRoom(e,t.y,this._wizardPlacement||"wall",i);switch(this._setupStep){case"bounds_far":this._wizardBounds={...this._wizardBounds,far_y:s},this._wizardCapturedPoints=[...this._wizardCapturedPoints,{x:r,y:s}],this._setupStep="bounds_left";break;case"bounds_left":this._wizardBounds={...this._wizardBounds,left_x:r},this._wizardCapturedPoints=[...this._wizardCapturedPoints,{x:r,y:s}],this._setupStep="bounds_right";break;case"bounds_right":if(this._wizardBounds={...this._wizardBounds,right_x:r},this._wizardCapturedPoints=[...this._wizardCapturedPoints,{x:r,y:s}],this._wizardBounds.left_x>this._wizardBounds.right_x){const t=this._wizardBounds.left_x;this._wizardBounds={...this._wizardBounds,left_x:this._wizardBounds.right_x,right_x:t}}this._roomBounds={...this._wizardBounds},this._autoFillGrid(),this._setupStep="preview"}}async _wizardFinish(){if(this._wizardPlacement&&this._wizardRoomName.trim()){this._wizardSaving=!0;try{await this.hass.callWS({type:"everything_presence_pro/set_setup",entry_id:this._selectedEntryId,room_name:this._wizardRoomName.trim(),placement:this._wizardPlacement,mirrored:this._wizardMirrored,room_bounds:this._wizardBounds}),this._placement=this._wizardPlacement,this._roomName=this._wizardRoomName.trim(),this._mirrored=this._wizardMirrored,this._roomBounds={...this._wizardBounds},this._setupStep=null,await this._loadEntryConfig(this._selectedEntryId),await this._loadEntries()}finally{this._wizardSaving=!1}}}_getSensorPosition(){switch(this._placement){case"wall":default:return{x:289.5,y:0};case"left_corner":return{x:0,y:0};case"right_corner":return{x:ut,y:0}}}_getFovAngles(){switch(this._placement){case"wall":default:return{start:-60,end:60};case"left_corner":return{start:-15,end:105};case"right_corner":return{start:-105,end:15}}}_getOrientationSensorStyle(){switch(this._wizardPlacement){case"left_corner":return"left: 0; top: 0; transform: translate(-50%, -50%);";case"right_corner":return"right: 0; top: 0; transform: translate(50%, -50%); left: auto;";default:return"left: 50%; top: 0; transform: translate(-50%, -50%);"}}_getWizardTargetStyle(t){const{x:e,y:i}=this._mapTargetToPercent(t,this._wizardMirrored,this._wizardPlacement||"wall",null);return`left: ${e}%; top: ${i}%;`}_getWizardCapturedStyle(t){return`left: ${t.x/6e3*100}%; top: ${t.y/6e3*100}%;`}render(){return this._loading?L`<div class="loading-container">Loading...</div>`:this._entries.length?null!==this._setupStep?this._renderWizard():this._renderEditor():L`<div class="loading-container">
        No Everything Presence Pro devices configured
      </div>`}_changePlacement(){this._setupStep="placement",this._wizardRoomName=this._roomName,this._wizardPlacement=this._placement||null,this._wizardMirrored=this._mirrored,this._wizardBounds=this._roomBounds?{...this._roomBounds}:{far_y:0,left_x:0,right_x:0},this._wizardCapturedPoints=[]}_renderHeader(){const t=null===this._setupStep?L`<button
            class="header-settings-btn"
            @click=${this._changePlacement}
            title="Change sensor placement"
          >
            <ha-icon icon="mdi:cog"></ha-icon>
          </button>`:D;if(this._entries.length>1)return L`
        <div class="panel-header">
          <select
            class="device-select"
            .value=${this._selectedEntryId}
            @change=${this._onDeviceChange}
          >
            ${this._entries.map(t=>L`
                <option value=${t.entry_id}>
                  ${t.title}${t.room_name?` — ${t.room_name}`:""}
                </option>
              `)}
          </select>
          ${t}
        </div>
      `;const e=this._entries[0],i=this._roomName?`${e?.title??"EP Pro"} — ${this._roomName}`:e?.title??"Everything Presence Pro";return L`<div class="panel-header">${i} ${t}</div>`}_renderStepIndicator(){const t=["placement","orientation","bounds_far","preview"],e=t.indexOf(this._setupStep),i="bounds_left"===this._setupStep||"bounds_right"===this._setupStep?2:e;return L`
      <div class="step-indicator">
        ${t.map((t,e)=>L`
            <div
              class="step-dot ${e===i?"active":e<i?"done":""}"
            ></div>
          `)}
      </div>
    `}_renderWizard(){let t;switch(this._setupStep){case"placement":t=this._renderWizardPlacement();break;case"orientation":t=this._renderWizardOrientation();break;case"bounds_far":case"bounds_left":case"bounds_right":t=this._renderWizardBounds();break;case"preview":t=this._renderWizardPreview()}return L`
      <div class="wizard-container">
        ${this._renderHeader()} ${this._renderStepIndicator()} ${t}
      </div>
    `}_renderWizardPlacement(){const t=!!this._wizardPlacement&&!!this._wizardRoomName.trim();return L`
      <div class="wizard-card">
        <h2>Sensor placement</h2>
        <p>Where is the sensor mounted? Choose the position and name the room.</p>

        <label>
          Room name
          <input
            type="text"
            .value=${this._wizardRoomName}
            @input=${t=>{this._wizardRoomName=t.target.value}}
            placeholder="e.g. Living Room"
          />
        </label>

        <div class="placement-options">
          <button
            class="placement-btn ${"left_corner"===this._wizardPlacement?"selected":""}"
            @click=${()=>{this._wizardPlacement="left_corner"}}
          >
            <div class="placement-diagram left-corner">
              <div class="sensor-dot"></div>
              <svg class="fov-cone" viewBox="0 0 80 56">
                <path d="M 0 0 L 56 0 L 0 56 Z" fill="rgba(3,169,244,0.15)" stroke="rgba(3,169,244,0.4)" stroke-width="1"/>
              </svg>
            </div>
            Left corner
          </button>
          <button
            class="placement-btn ${"wall"===this._wizardPlacement?"selected":""}"
            @click=${()=>{this._wizardPlacement="wall"}}
          >
            <div class="placement-diagram wall">
              <div class="sensor-dot"></div>
              <svg class="fov-cone" viewBox="0 0 80 56">
                <path d="M 40 0 L 72 56 L 8 56 Z" fill="rgba(3,169,244,0.15)" stroke="rgba(3,169,244,0.4)" stroke-width="1"/>
              </svg>
            </div>
            Wall (center)
          </button>
          <button
            class="placement-btn ${"right_corner"===this._wizardPlacement?"selected":""}"
            @click=${()=>{this._wizardPlacement="right_corner"}}
          >
            <div class="placement-diagram right-corner">
              <div class="sensor-dot"></div>
              <svg class="fov-cone" viewBox="0 0 80 56">
                <path d="M 80 0 L 80 56 L 24 0 Z" fill="rgba(3,169,244,0.15)" stroke="rgba(3,169,244,0.4)" stroke-width="1"/>
              </svg>
            </div>
            Right corner
          </button>
        </div>

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-primary"
            ?disabled=${!t}
            @click=${this._wizardGoToOrientation}
          >
            Next
          </button>
        </div>
      </div>
    `}_renderWizardOrientation(){return L`
      <div class="wizard-card">
        <h2>Verify orientation</h2>
        <p>
          Move to the <strong>left side</strong> of the room. The dot should
          appear on the <strong>left</strong> of the grid below. If it appears on
          the wrong side, click "Flip left/right".
        </p>

        ${this._renderMiniGrid()}

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${()=>{this._setupStep="placement"}}
          >
            Back
          </button>
          <button
            class="wizard-btn wizard-btn-secondary"
            @click=${()=>{this._wizardMirrored=!this._wizardMirrored,this._mirrored=this._wizardMirrored}}
          >
            Flip left/right
          </button>
          <button
            class="wizard-btn wizard-btn-primary"
            @click=${this._wizardGoToBounds}
          >
            Looks correct
          </button>
        </div>
      </div>
    `}_renderWizardBounds(){const t=this._targets.some(t=>t.active);let e,i;switch(this._setupStep){case"bounds_far":e="Walk to the <strong>wall furthest</strong> from the sensor and click Mark.",i="Far wall (1/3)";break;case"bounds_left":e="Walk to the <strong>left-most point</strong> of the room and click Mark.",i="Left extent (2/3)";break;case"bounds_right":e="Walk to the <strong>right-most point</strong> of the room and click Mark.",i="Right extent (3/3)";break;default:e="",i=""}return L`
      <div class="wizard-card">
        <h2>Define room bounds</h2>
        <p><strong>${i}</strong></p>
        <p>${this._unsafeHTML(e)}</p>

        ${this._renderMiniGrid(!0)}

        ${t?D:L`<p class="no-target-warning">
              No target detected. Make sure you are visible to the sensor.
            </p>`}

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${()=>{"bounds_far"===this._setupStep?this._setupStep="orientation":"bounds_left"===this._setupStep?(this._wizardCapturedPoints=this._wizardCapturedPoints.slice(0,-1),this._setupStep="bounds_far"):(this._wizardCapturedPoints=this._wizardCapturedPoints.slice(0,-1),this._setupStep="bounds_left")}}
          >
            Back
          </button>
          <button
            class="wizard-btn wizard-btn-primary"
            ?disabled=${!t}
            @click=${this._markBoundsPoint}
          >
            Mark position
          </button>
        </div>
      </div>
    `}_unsafeHTML(t){const e=document.createElement("span");return e.innerHTML=t,L`${e}`}_renderWizardPreview(){const t=this._wizardBounds,e=((t.right_x-t.left_x)/1e3).toFixed(1),i=(t.far_y/1e3).toFixed(1);return L`
      <div class="wizard-card">
        <h2>Room preview</h2>
        <p>
          Room size: approximately ${e}m wide x ${i}m deep. The grid
          below is now scaled to your room. Verify that targets appear in the
          correct positions.
        </p>

        <div class="mini-grid-container">
          <div class="mini-grid">
            <div class="mini-grid-sensor" style=${this._getOrientationSensorStyle()}></div>
            ${this._targets.filter(t=>t.active).map(t=>{const{x:e,y:i}=this._mapTargetToPercent(t,this._wizardMirrored,this._wizardPlacement||"wall",this._wizardBounds);return L`
                    <div
                      class="mini-grid-target"
                      style="left: ${e}%; top: ${i}%;"
                    ></div>
                  `})}
          </div>
        </div>

        <div class="wizard-actions">
          <button
            class="wizard-btn wizard-btn-back"
            @click=${()=>{this._wizardCapturedPoints=this._wizardCapturedPoints.slice(0,-1),this._roomBounds=null,this._setupStep="bounds_right"}}
          >
            Back
          </button>
          <button
            class="wizard-btn wizard-btn-primary"
            ?disabled=${this._wizardSaving}
            @click=${this._wizardFinish}
          >
            ${this._wizardSaving?"Saving...":"Finish"}
          </button>
        </div>
      </div>
    `}_renderMiniGrid(t=!1){return L`
      <div class="mini-grid-container">
        <div class="mini-grid">
          <div class="mini-grid-label left-label">Left</div>
          <div class="mini-grid-label right-label">Right</div>
          <div
            class="mini-grid-sensor"
            style=${this._getOrientationSensorStyle()}
          ></div>
          ${t?this._wizardCapturedPoints.map(t=>L`
                  <div
                    class="mini-grid-captured"
                    style=${this._getWizardCapturedStyle(t)}
                  ></div>
                `):D}
          ${this._targets.filter(t=>t.active).map(t=>L`
                <div
                  class="mini-grid-target"
                  style=${this._getWizardTargetStyle(t)}
                ></div>
              `)}
        </div>
      </div>
    `}_renderEditor(){return L`
      <div class="tools-sidebar">
        <button
          class="tool-btn ${"room"===this._activeTool?"active":""}"
          @click=${()=>this._selectTool("room")}
        >
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          Room
        </button>
        <button
          class="tool-btn ${"outside"===this._activeTool?"active":""}"
          @click=${()=>this._selectTool("outside")}
        >
          <ha-icon icon="mdi:tree"></ha-icon>
          Outside
        </button>
        <button
          class="tool-btn ${"furniture"===this._activeTool?"active":""}"
          @click=${()=>this._selectTool("furniture")}
        >
          <ha-icon icon="mdi:sofa"></ha-icon>
          Furniture
        </button>
        <button
          class="tool-btn ${"zone"===this._activeTool?"active":""}"
          @click=${()=>this._selectTool("zone")}
        >
          <ha-icon icon="mdi:select-group"></ha-icon>
          Zone
        </button>
        <button
          class="tool-btn ${"calibrate"===this._activeTool?"active":""}"
          @click=${()=>this._selectTool("calibrate")}
        >
          <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
          Calibrate
        </button>
      </div>

      <div class="main-area">
        ${this._renderHeader()}
        <div class="grid-container">
          <div
            class="grid"
            @mouseup=${this._onCellMouseUp}
            @mouseleave=${this._onCellMouseUp}
          >
            ${Array.from({length:pt},(t,e)=>{const i=this._getCellZoneColor(e),r=i?`background-color: ${i}`:"";return L`
                <div
                  class="cell ${this._getCellClass(e)}"
                  style=${r}
                  @mousedown=${()=>this._onCellMouseDown(e)}
                  @mouseenter=${()=>this._onCellMouseEnter(e)}
                ></div>
              `})}
          </div>
          ${this._renderSensorOverlay()}
          <div class="targets-overlay">
            ${this._targets.filter(t=>t.active).map(t=>L`
                  <div
                    class="target-dot ${0!==t.speed?"moving":"stationary"}"
                    style=${this._getTargetStyle(t)}
                  ></div>
                `)}
          </div>
        </div>
      </div>

      ${"zone"===this._activeTool?L`
            <div class="zone-sidebar">
              <h3>Zones</h3>
              ${this._zones.map(t=>L`
                  <div
                    class="zone-item ${this._activeZoneId===t.id?"active":""}"
                    @click=${()=>this._selectZone(t.id)}
                  >
                    <div
                      class="zone-color-dot"
                      style="background: ${t.color}"
                    ></div>
                    <span class="zone-name">${t.name}</span>
                    <button
                      class="zone-remove-btn"
                      @click=${e=>{e.stopPropagation(),this._removeZone(t.id)}}
                    >
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                `)}
              <button class="add-zone-btn" @click=${this._addZone}>
                <ha-icon icon="mdi:plus"></ha-icon>
                Add zone
              </button>
            </div>
          `:D}
    `}_renderSensorOverlay(){if(!this._placement)return D;const{x:t,y:e}=this._getSensorPosition(),{start:i,end:r}=this._getFovAngles(),s=Math.max(ut,_t),o=t=>t*Math.PI/180,n=t+s*Math.sin(o(i)),a=e+s*Math.cos(o(i)),d=t+s*Math.sin(o(r)),l=e+s*Math.cos(o(r));return L`
      <svg
        class="sensor-overlay"
        width="${583}"
        height="${467}"
        viewBox="-2 -2 ${583} ${467}"
      >
        <defs>
          <clipPath id="grid-clip">
            <rect x="0" y="0" width="${ut}" height="${_t}" />
          </clipPath>
        </defs>

        <path
          d="${`M ${t} ${e} L ${n} ${a} A ${s} ${s} 0 ${r-i>180?1:0} 1 ${d} ${l} Z`}"
          fill="rgba(3, 169, 244, 0.08)"
          stroke="rgba(3, 169, 244, 0.3)"
          stroke-width="1.5"
          clip-path="url(#grid-clip)"
        />

        <circle
          cx="${t}"
          cy="${e+2}"
          r="9"
          fill="var(--primary-color, #03a9f4)"
          stroke="#fff"
          stroke-width="2"
        />
        <circle cx="${t}" cy="${e+2}" r="3" fill="#fff" />
      </svg>
    `}};mt.styles=((t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,r)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[r+1],t[0]);return new o(i,t,r)})`
    :host {
      display: flex;
      height: 100%;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #212121);
      font-family: var(--paper-font-body1_-_font-family, "Roboto", sans-serif);
    }

    .tools-sidebar {
      width: 64px;
      background: var(--card-background-color, #fff);
      border-right: 1px solid var(--divider-color, #e0e0e0);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 8px;
    }

    .tool-btn {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      gap: 2px;
      transition: background 0.2s;
    }

    .tool-btn:hover {
      background: var(--secondary-background-color, #e0e0e0);
    }

    .tool-btn.active {
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .tool-btn ha-icon {
      --mdc-icon-size: 22px;
    }

    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: auto;
    }

    .grid-container {
      position: relative;
      display: inline-block;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(20, 28px);
      grid-template-rows: repeat(16, 28px);
      gap: 1px;
      background: var(--divider-color, #e0e0e0);
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      user-select: none;
    }

    .cell {
      width: 28px;
      height: 28px;
      background: var(--card-background-color, #fff);
      cursor: pointer;
      transition: background 0.1s;
      position: relative;
    }

    .cell:hover {
      opacity: 0.8;
    }

    .cell.room {
      background: var(--card-background-color, #fff);
    }

    .cell.outside {
      background: var(--secondary-background-color, #e0e0e0);
    }

    .cell.furniture {
      background: #bcaaa4;
    }

    .cell.zone-cell {
      opacity: 0.85;
    }

    .targets-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
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
      background: var(--card-background-color, #fff);
      border-left: 1px solid var(--divider-color, #e0e0e0);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }

    .zone-sidebar h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .zone-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }

    .zone-item:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .zone-item.active {
      border-color: var(--primary-color, #03a9f4);
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

    .placement-options {
      display: flex;
      gap: 12px;
    }

    .placement-btn {
      flex: 1;
      padding: 16px 12px;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 500;
      transition: border-color 0.2s, background 0.2s;
    }

    .placement-btn:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .placement-btn.selected {
      border-color: var(--primary-color, #03a9f4);
      background: rgba(3, 169, 244, 0.06);
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

    .placement-diagram {
      width: 80px;
      height: 56px;
      border: 2px solid var(--divider-color, #e0e0e0);
      border-radius: 6px;
      position: relative;
      background: var(--secondary-background-color, #f5f5f5);
    }

    .placement-diagram .sensor-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      position: absolute;
    }

    .placement-diagram .fov-cone {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .placement-diagram.wall .sensor-dot {
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
    }

    .placement-diagram.left-corner .sensor-dot {
      top: -5px;
      left: -5px;
    }

    .placement-diagram.right-corner .sensor-dot {
      top: -5px;
      right: -5px;
      left: auto;
    }

    .step-indicator {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .step-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--divider-color, #e0e0e0);
    }

    .step-dot.active {
      background: var(--primary-color, #03a9f4);
    }

    .step-dot.done {
      background: #4caf50;
    }

    .no-target-warning {
      color: var(--error-color, #f44336);
      font-size: 13px;
      text-align: center;
    }
  `,t([ct({attribute:!1})],mt.prototype,"hass",void 0),t([ht()],mt.prototype,"_activeTool",void 0),t([ht()],mt.prototype,"_grid",void 0),t([ht()],mt.prototype,"_zones",void 0),t([ht()],mt.prototype,"_activeZoneId",void 0),t([ht()],mt.prototype,"_targets",void 0),t([ht()],mt.prototype,"_isPainting",void 0),t([ht()],mt.prototype,"_paintValue",void 0),t([ht()],mt.prototype,"_entries",void 0),t([ht()],mt.prototype,"_selectedEntryId",void 0),t([ht()],mt.prototype,"_loading",void 0),t([ht()],mt.prototype,"_setupStep",void 0),t([ht()],mt.prototype,"_wizardRoomName",void 0),t([ht()],mt.prototype,"_wizardPlacement",void 0),t([ht()],mt.prototype,"_wizardSaving",void 0),t([ht()],mt.prototype,"_wizardMirrored",void 0),t([ht()],mt.prototype,"_wizardBounds",void 0),t([ht()],mt.prototype,"_wizardCapturedPoints",void 0),t([ht()],mt.prototype,"_placement",void 0),t([ht()],mt.prototype,"_roomName",void 0),t([ht()],mt.prototype,"_mirrored",void 0),t([ht()],mt.prototype,"_roomBounds",void 0),mt=t([(t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("everything-presence-pro-panel")],mt);export{mt as EverythingPresenceProPanel};
