"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/draw/page",{

/***/ "(app-pages-browser)/./app/draw/page.tsx":
/*!***************************!*\
  !*** ./app/draw/page.tsx ***!
  \***************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var _hooks_useDraw__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/hooks/useDraw */ \"(app-pages-browser)/./hooks/useDraw.tsx\");\n/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../components/ui/button */ \"(app-pages-browser)/./components/ui/button.tsx\");\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n // Ensure this path matches your project structure\n // Adjust the import path as needed\nconst Page = ()=>{\n    _s();\n    const color = \"#FFDF00\"; // Specify your desired color here\n    const { canvasRef, onMouseDown, clear } = (0,_hooks_useDraw__WEBPACK_IMPORTED_MODULE_1__.useDraw)(\"#000\", \"https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pinterest.com%2Fpin%2Ftraffic-cone-vector-illustration--755619643729356146%2F&psig=AOvVaw3sVpsfzYl8d7J9hQrYiwL8&ust=1709074638124000&source=images&cd=vfe&opi=89978449&ved=0CBMQjRxqFwoTCLi0-qeNyoQDFQAAAAAdAAAAABAD\");\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        id: \"canvas1\",\n        className: \"w-screen h-screen bg-white flex justify-center items-center\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"flex flex-col gap-10 pr-10\",\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__.Button, {\n                    type: \"button\",\n                    onClick: clear,\n                    children: \"Clear canvas\"\n                }, void 0, false, {\n                    fileName: \"/Users/arjungoray/Developer/datasetcolab/nextjswebsite/app/draw/page.tsx\",\n                    lineNumber: 13,\n                    columnNumber: 9\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"/Users/arjungoray/Developer/datasetcolab/nextjswebsite/app/draw/page.tsx\",\n                lineNumber: 12,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"canvas\", {\n                ref: canvasRef,\n                onMouseDown: onMouseDown,\n                width: 750,\n                height: 750,\n                className: \"border border-black rounded-md\"\n            }, void 0, false, {\n                fileName: \"/Users/arjungoray/Developer/datasetcolab/nextjswebsite/app/draw/page.tsx\",\n                lineNumber: 17,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/arjungoray/Developer/datasetcolab/nextjswebsite/app/draw/page.tsx\",\n        lineNumber: 11,\n        columnNumber: 5\n    }, undefined);\n};\n_s(Page, \"yPhruqSHWPRS8SLjdjucU4WGZ+k=\", false, function() {\n    return [\n        _hooks_useDraw__WEBPACK_IMPORTED_MODULE_1__.useDraw\n    ];\n});\n_c = Page;\n/* harmony default export */ __webpack_exports__[\"default\"] = (Page);\nvar _c;\n$RefreshReg$(_c, \"Page\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC9kcmF3L3BhZ2UudHN4IiwibWFwcGluZ3MiOiI7Ozs7OztBQUUwQyxDQUFDLGtEQUFrRDtBQUN6QyxDQUFDLG1DQUFtQztBQUV4RixNQUFNRSxPQUFlOztJQUNuQixNQUFNQyxRQUFRLFdBQVcsa0NBQWtDO0lBQzNELE1BQU0sRUFBRUMsU0FBUyxFQUFFQyxXQUFXLEVBQUVDLEtBQUssRUFBRSxHQUFHTix1REFBT0EsQ0FBQyxRQUFRO0lBRTFELHFCQUNFLDhEQUFDTztRQUFJQyxJQUFHO1FBQVVDLFdBQVU7OzBCQUMxQiw4REFBQ0Y7Z0JBQUlFLFdBQVU7MEJBQ2IsNEVBQUNSLHlEQUFNQTtvQkFBQ1MsTUFBSztvQkFBU0MsU0FBU0w7OEJBQU87Ozs7Ozs7Ozs7OzBCQUl4Qyw4REFBQ007Z0JBQ0NDLEtBQUtUO2dCQUNMQyxhQUFhQTtnQkFDYlMsT0FBTztnQkFDUEMsUUFBUTtnQkFDUk4sV0FBVTs7Ozs7Ozs7Ozs7O0FBSWxCO0dBcEJNUDs7UUFFc0NGLG1EQUFPQTs7O0tBRjdDRTtBQXNCTiwrREFBZUEsSUFBSUEsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi9hcHAvZHJhdy9wYWdlLnRzeD9jMjYzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGNsaWVudFwiXG5pbXBvcnQgeyBGQywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VEcmF3IH0gZnJvbSAnQC9ob29rcy91c2VEcmF3JzsgLy8gRW5zdXJlIHRoaXMgcGF0aCBtYXRjaGVzIHlvdXIgcHJvamVjdCBzdHJ1Y3R1cmVcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvdWkvYnV0dG9uJzsgLy8gQWRqdXN0IHRoZSBpbXBvcnQgcGF0aCBhcyBuZWVkZWRcblxuY29uc3QgUGFnZTogRkM8e30+ID0gKCkgPT4ge1xuICBjb25zdCBjb2xvciA9ICcjRkZERjAwJzsgLy8gU3BlY2lmeSB5b3VyIGRlc2lyZWQgY29sb3IgaGVyZVxuICBjb25zdCB7IGNhbnZhc1JlZiwgb25Nb3VzZURvd24sIGNsZWFyIH0gPSB1c2VEcmF3KCcjMDAwJywgJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vdXJsP3NhPWkmdXJsPWh0dHBzJTNBJTJGJTJGd3d3LnBpbnRlcmVzdC5jb20lMkZwaW4lMkZ0cmFmZmljLWNvbmUtdmVjdG9yLWlsbHVzdHJhdGlvbi0tNzU1NjE5NjQzNzI5MzU2MTQ2JTJGJnBzaWc9QU92VmF3M3NWcHNmellsOGQ3SjloUXJZaXdMOCZ1c3Q9MTcwOTA3NDYzODEyNDAwMCZzb3VyY2U9aW1hZ2VzJmNkPXZmZSZvcGk9ODk5Nzg0NDkmdmVkPTBDQk1RalJ4cUZ3b1RDTGkwLXFlTnlvUURGUUFBQUFBZEFBQUFBQkFEJyk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGlkPVwiY2FudmFzMVwiIGNsYXNzTmFtZT0ndy1zY3JlZW4gaC1zY3JlZW4gYmctd2hpdGUgZmxleCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXInPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2ZsZXggZmxleC1jb2wgZ2FwLTEwIHByLTEwJz5cbiAgICAgICAgPEJ1dHRvbiB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e2NsZWFyfT5cbiAgICAgICAgICBDbGVhciBjYW52YXNcbiAgICAgICAgPC9CdXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxjYW52YXNcbiAgICAgICAgcmVmPXtjYW52YXNSZWZ9XG4gICAgICAgIG9uTW91c2VEb3duPXtvbk1vdXNlRG93bn1cbiAgICAgICAgd2lkdGg9ezc1MH1cbiAgICAgICAgaGVpZ2h0PXs3NTB9XG4gICAgICAgIGNsYXNzTmFtZT0nYm9yZGVyIGJvcmRlci1ibGFjayByb3VuZGVkLW1kJ1xuICAgICAgLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBhZ2U7Il0sIm5hbWVzIjpbInVzZURyYXciLCJCdXR0b24iLCJQYWdlIiwiY29sb3IiLCJjYW52YXNSZWYiLCJvbk1vdXNlRG93biIsImNsZWFyIiwiZGl2IiwiaWQiLCJjbGFzc05hbWUiLCJ0eXBlIiwib25DbGljayIsImNhbnZhcyIsInJlZiIsIndpZHRoIiwiaGVpZ2h0Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/draw/page.tsx\n"));

/***/ })

});