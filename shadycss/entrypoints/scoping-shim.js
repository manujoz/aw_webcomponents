"use strict";import ScopingShim from"../src/scoping-shim.js";import{nativeCssVariables,nativeShadow,cssBuild}from"../src/style-settings.js";const scopingShim=new ScopingShim;let ApplyShim,CustomStyleInterface;if(window.ShadyCSS){ApplyShim=window.ShadyCSS.ApplyShim;CustomStyleInterface=window.ShadyCSS.CustomStyleInterface}window.ShadyCSS={ScopingShim:scopingShim,prepareTemplate(template,elementName,elementExtends){scopingShim.flushCustomStyles();scopingShim.prepareTemplate(template,elementName,elementExtends)},prepareTemplateDom(template,elementName){scopingShim.prepareTemplateDom(template,elementName)},prepareTemplateStyles(template,elementName,elementExtends){scopingShim.flushCustomStyles();scopingShim.prepareTemplateStyles(template,elementName,elementExtends)},styleSubtree(element,properties){scopingShim.flushCustomStyles();scopingShim.styleSubtree(element,properties)},styleElement(element){scopingShim.flushCustomStyles();scopingShim.styleElement(element)},styleDocument(properties){scopingShim.flushCustomStyles();scopingShim.styleDocument(properties)},flushCustomStyles(){scopingShim.flushCustomStyles()},getComputedStyleValue(element,property){return scopingShim.getComputedStyleValue(element,property)},nativeCss:nativeCssVariables,nativeShadow:nativeShadow,cssBuild:cssBuild};if(ApplyShim){window.ShadyCSS.ApplyShim=ApplyShim}if(CustomStyleInterface){window.ShadyCSS.CustomStyleInterface=CustomStyleInterface}