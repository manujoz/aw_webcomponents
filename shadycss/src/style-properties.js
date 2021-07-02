"use strict";import{removeCustomPropAssignment,StyleNode}from"./css-parse.js";import{nativeShadow}from"./style-settings.js";import StyleTransformer from"./style-transformer.js";import*as StyleUtil from"./style-util.js";import*as RX from"./common-regex.js";import StyleInfo from"./style-info.js";const matchesSelector=function(selector){const method=this.matches||this.matchesSelector||this.mozMatchesSelector||this.msMatchesSelector||this.oMatchesSelector||this.webkitMatchesSelector;return method&&method.call(this,selector)},IS_IE=navigator.userAgent.match("Trident"),XSCOPE_NAME="x-scope";class StyleProperties{get XSCOPE_NAME(){return XSCOPE_NAME}decorateStyles(rules){let self=this,props={},keyframes=[],ruleIndex=0;StyleUtil.forEachRule(rules,function(rule){self.decorateRule(rule);rule.index=ruleIndex++;self.collectPropertiesInCssText(rule.propertyInfo.cssText,props)},function onKeyframesRule(rule){keyframes.push(rule)});rules._keyframes=keyframes;let names=[];for(let i in props){names.push(i)}return names}decorateRule(rule){if(rule.propertyInfo){return rule.propertyInfo}let info={},properties={},hasProperties=this.collectProperties(rule,properties);if(hasProperties){info.properties=properties;rule.rules=null}info.cssText=this.collectCssText(rule);rule.propertyInfo=info;return info}collectProperties(rule,properties){let info=rule.propertyInfo;if(info){if(info.properties){Object.assign(properties,info.properties);return!0}}else{let m,rx=RX.VAR_ASSIGN,cssText=rule.parsedCssText,value,any;while(m=rx.exec(cssText)){value=(m[2]||m[3]).trim();if("inherit"!==value||"unset"!==value){properties[m[1].trim()]=value}any=!0}return any}}collectCssText(rule){return this.collectConsumingCssText(rule.parsedCssText)}collectConsumingCssText(cssText){return cssText.replace(RX.BRACKETED,"").replace(RX.VAR_ASSIGN,"")}collectPropertiesInCssText(cssText,props){let m;while(m=RX.VAR_CONSUMED.exec(cssText)){let name=m[1];if(":"!==m[2]){props[name]=!0}}}reify(props){let names=Object.getOwnPropertyNames(props);for(let i=0,n;i<names.length;i++){n=names[i];props[n]=this.valueForProperty(props[n],props)}}valueForProperty(property,props){if(property){if(0<=property.indexOf(";")){property=this.valueForProperties(property,props)}else{let self=this,fn=function(prefix,value,fallback,suffix){if(!value){return prefix+suffix}let propertyValue=self.valueForProperty(props[value],props);if(!propertyValue||"initial"===propertyValue){propertyValue=self.valueForProperty(props[fallback]||fallback,props)||fallback}else if("apply-shim-inherit"===propertyValue){propertyValue="inherit"}return prefix+(propertyValue||"")+suffix};property=StyleUtil.processVariableAndFallback(property,fn)}}return property&&property.trim()||""}valueForProperties(property,props){let parts=property.split(";");for(let i=0,p,m;i<parts.length;i++){if(p=parts[i]){RX.MIXIN_MATCH.lastIndex=0;m=RX.MIXIN_MATCH.exec(p);if(m){p=this.valueForProperty(props[m[1]],props)}else{let colon=p.indexOf(":");if(-1!==colon){let pp=p.substring(colon);pp=pp.trim();pp=this.valueForProperty(pp,props)||pp;p=p.substring(0,colon)+pp}}parts[i]=p&&p.lastIndexOf(";")===p.length-1?p.slice(0,-1):p||""}}return parts.join(";")}applyProperties(rule,props){let output="";if(!rule.propertyInfo){this.decorateRule(rule)}if(rule.propertyInfo.cssText){output=this.valueForProperties(rule.propertyInfo.cssText,props)}rule.cssText=output}applyKeyframeTransforms(rule,keyframeTransforms){let input=rule.cssText,output=rule.cssText;if(null==rule.hasAnimations){rule.hasAnimations=RX.ANIMATION_MATCH.test(input)}if(rule.hasAnimations){let transform;if(null==rule.keyframeNamesToTransform){rule.keyframeNamesToTransform=[];for(let keyframe in keyframeTransforms){transform=keyframeTransforms[keyframe];output=transform(input);if(input!==output){input=output;rule.keyframeNamesToTransform.push(keyframe)}}}else{for(let i=0;i<rule.keyframeNamesToTransform.length;++i){transform=keyframeTransforms[rule.keyframeNamesToTransform[i]];input=transform(input)}output=input}}rule.cssText=output}propertyDataFromStyles(rules,element){let props={},o=[];StyleUtil.forEachRule(rules,rule=>{if(!rule.propertyInfo){this.decorateRule(rule)}let selectorToMatch=rule.transformedSelector||rule.parsedSelector;if(element&&rule.propertyInfo.properties&&selectorToMatch){if(matchesSelector.call(element,selectorToMatch)){this.collectProperties(rule,props);addToBitMask(rule.index,o)}}},null,!0);return{properties:props,key:o}}whenHostOrRootRule(scope,rule,cssBuild,callback){if(!rule.propertyInfo){this.decorateRule(rule)}if(!rule.propertyInfo.properties){return}let{is,typeExtension}=StyleUtil.getIsExtends(scope),hostScope=is?StyleTransformer._calcHostScope(is,typeExtension):"html",parsedSelector=rule.parsedSelector,isRoot=":host > *"===parsedSelector||"html"===parsedSelector,isHost=0===parsedSelector.indexOf(":host")&&!isRoot;if("shady"===cssBuild){isRoot=parsedSelector===hostScope+" > *."+hostScope||-1!==parsedSelector.indexOf("html");isHost=!isRoot&&0===parsedSelector.indexOf(hostScope)}if(!isRoot&&!isHost){return}let selectorToMatch=hostScope;if(isHost){if(!rule.transformedSelector){rule.transformedSelector=StyleTransformer._transformRuleCss(rule,StyleTransformer._transformComplexSelector,StyleTransformer._calcElementScope(is),hostScope)}selectorToMatch=rule.transformedSelector||hostScope}callback({selector:selectorToMatch,isHost:isHost,isRoot:isRoot})}hostAndRootPropertiesForScope(scope,rules,cssBuild){let hostProps={},rootProps={};StyleUtil.forEachRule(rules,rule=>{this.whenHostOrRootRule(scope,rule,cssBuild,info=>{let element=scope._element||scope;if(matchesSelector.call(element,info.selector)){if(info.isHost){this.collectProperties(rule,hostProps)}else{this.collectProperties(rule,rootProps)}}})},null,!0);return{rootProps:rootProps,hostProps:hostProps}}transformStyles(element,properties,scopeSelector){let self=this,{is,typeExtension}=StyleUtil.getIsExtends(element),hostSelector=StyleTransformer._calcHostScope(is,typeExtension),rxHostSelector=element.extends?"\\"+hostSelector.slice(0,-1)+"\\]":hostSelector,hostRx=new RegExp(RX.HOST_PREFIX+rxHostSelector+RX.HOST_SUFFIX),{styleRules:rules,cssBuild}=StyleInfo.get(element),keyframeTransforms=this._elementKeyframeTransforms(element,rules,scopeSelector);return StyleTransformer.elementStyles(element,rules,function(rule){self.applyProperties(rule,properties);if(!nativeShadow&&!StyleUtil.isKeyframesSelector(rule)&&rule.cssText){self.applyKeyframeTransforms(rule,keyframeTransforms);self._scopeSelector(rule,hostRx,hostSelector,scopeSelector)}},cssBuild)}_elementKeyframeTransforms(element,rules,scopeSelector){let keyframesRules=rules._keyframes,keyframeTransforms={};if(!nativeShadow&&keyframesRules){for(let i=0,keyframesRule=keyframesRules[i];i<keyframesRules.length;keyframesRule=keyframesRules[++i]){this._scopeKeyframes(keyframesRule,scopeSelector);keyframeTransforms[keyframesRule.keyframesName]=this._keyframesRuleTransformer(keyframesRule)}}return keyframeTransforms}_keyframesRuleTransformer(keyframesRule){return function(cssText){return cssText.replace(keyframesRule.keyframesNameRx,keyframesRule.transformedKeyframesName)}}_scopeKeyframes(rule,scopeId){rule.keyframesNameRx=new RegExp(`\\b${rule.keyframesName}(?!\\B|-)`,"g");rule.transformedKeyframesName=rule.keyframesName+"-"+scopeId;rule.transformedSelector=rule.transformedSelector||rule.selector;rule.selector=rule.transformedSelector.replace(rule.keyframesName,rule.transformedKeyframesName)}_scopeSelector(rule,hostRx,hostSelector,scopeId){rule.transformedSelector=rule.transformedSelector||rule.selector;let selector=rule.transformedSelector,scope="."+scopeId,parts=StyleUtil.splitSelectorList(selector);for(let i=0,l=parts.length,p;i<l&&(p=parts[i]);i++){parts[i]=p.match(hostRx)?p.replace(hostSelector,scope):scope+" "+p}rule.selector=parts.join(",")}applyElementScopeSelector(element,selector,old){let c=element.getAttribute("class")||"",v=c;if(old){v=c.replace(new RegExp("\\s*"+XSCOPE_NAME+"\\s*"+old+"\\s*","g")," ")}v+=(v?" ":"")+XSCOPE_NAME+" "+selector;if(c!==v){StyleUtil.setElementClassRaw(element,v)}}applyElementStyle(element,properties,selector,style){let cssText=style?style.textContent||"":this.transformStyles(element,properties,selector),styleInfo=StyleInfo.get(element),s=styleInfo.customStyle;if(s&&!nativeShadow&&s!==style){s._useCount--;if(0>=s._useCount&&s.parentNode){s.parentNode.removeChild(s)}}if(nativeShadow){if(styleInfo.customStyle){styleInfo.customStyle.textContent=cssText;style=styleInfo.customStyle}else if(cssText){style=StyleUtil.applyCss(cssText,selector,element.shadowRoot,styleInfo.placeholder)}}else{if(!style){if(cssText){style=StyleUtil.applyCss(cssText,selector,null,styleInfo.placeholder)}}else if(!style.parentNode){if(IS_IE&&-1<cssText.indexOf("@media")){style.textContent=cssText}StyleUtil.applyStyle(style,null,styleInfo.placeholder)}}if(style){style._useCount=style._useCount||0;if(styleInfo.customStyle!=style){style._useCount++}styleInfo.customStyle=style}return style}applyCustomStyle(style,properties){let rules=StyleUtil.rulesForStyle(style),self=this;style.textContent=StyleUtil.toCssText(rules,function(rule){let css=rule.cssText=rule.parsedCssText;if(rule.propertyInfo&&rule.propertyInfo.cssText){css=removeCustomPropAssignment(css);rule.cssText=self.valueForProperties(css,properties)}})}}function addToBitMask(n,bits){let o=parseInt(n/32,10),v=1<<n%32;bits[o]=(bits[o]||0)|v}export default new StyleProperties;