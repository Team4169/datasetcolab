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

/***/ "(app-pages-browser)/./hooks/useDraw.tsx":
/*!***************************!*\
  !*** ./hooks/useDraw.tsx ***!
  \***************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   useDraw: function() { return /* binding */ useDraw; }\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n/* __next_internal_client_entry_do_not_use__ useDraw auto */ var _s = $RefreshSig$();\n\nconst useDraw = (color)=>{\n    _s();\n    const [isDrawing, setIsDrawing] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);\n    const [startPoint, setStartPoint] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({\n        x: 0,\n        y: 0\n    });\n    const canvasRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);\n    const drawBox = (start, end)=>{\n        const canvas = canvasRef.current;\n        const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext(\"2d\");\n        if (!ctx) return;\n        const width = end.x - start.x;\n        const height = end.y - start.y;\n        // Clear previous box before drawing a new one\n        if (canvas) {\n            ctx.clearRect(0, 0, canvas.width, canvas.height);\n            ctx.beginPath();\n            ctx.rect(start.x, start.y, width, height);\n            ctx.strokeStyle = color; // Use the specified color\n            ctx.stroke();\n        }\n    };\n    const onMouseDown = (e)=>{\n        var _canvasRef_current;\n        const rect = (_canvasRef_current = canvasRef.current) === null || _canvasRef_current === void 0 ? void 0 : _canvasRef_current.getBoundingClientRect();\n        if (rect) {\n            const x = e.clientX - rect.left;\n            const y = e.clientY - rect.top;\n            setStartPoint({\n                x,\n                y\n            });\n            setIsDrawing(true);\n        }\n    };\n    const onMouseMove = (e)=>{\n        var _canvasRef_current;\n        if (!isDrawing) return;\n        const rect = (_canvasRef_current = canvasRef.current) === null || _canvasRef_current === void 0 ? void 0 : _canvasRef_current.getBoundingClientRect();\n        if (rect) {\n            const x = e.clientX - rect.left;\n            const y = e.clientY - rect.top;\n            drawBox(startPoint, {\n                x,\n                y\n            });\n        }\n    };\n    const onMouseUp = ()=>{\n        setIsDrawing(false);\n    };\n    const clear = ()=>{\n        const canvas = canvasRef.current;\n        const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext(\"2d\");\n        if (ctx) {\n            ctx.clearRect(0, 0, canvas.width, canvas.height);\n        }\n    };\n    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{\n        const canvas = canvasRef.current;\n        if (!canvas) return;\n        canvas.addEventListener(\"mousemove\", onMouseMove);\n        canvas.addEventListener(\"mouseup\", onMouseUp);\n        return ()=>{\n            canvas.removeEventListener(\"mousemove\", onMouseMove);\n            canvas.removeEventListener(\"mouseup\", onMouseUp);\n        };\n    }, [\n        isDrawing,\n        startPoint\n    ]); // Removed e parameter from dependencies\n    return {\n        canvasRef,\n        onMouseDown,\n        clear\n    };\n};\n_s(useDraw, \"79GtRddMblYsTl9tXqX8N5fQGQg=\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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azovL19OX0UvLi9ob29rcy91c2VEcmF3LnRzeD82NTYyIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGNsaWVudFwiXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5cbmV4cG9ydCBjb25zdCB1c2VEcmF3ID0gKGNvbG9yOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgW2lzRHJhd2luZywgc2V0SXNEcmF3aW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N0YXJ0UG9pbnQsIHNldFN0YXJ0UG9pbnRdID0gdXNlU3RhdGUoeyB4OiAwLCB5OiAwIH0pO1xuICBjb25zdCBjYW52YXNSZWYgPSB1c2VSZWY8SFRNTENhbnZhc0VsZW1lbnQ+KG51bGwpO1xuXG4gIGNvbnN0IGRyYXdCb3ggPSAoc3RhcnQ6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSwgZW5kOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0pID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBjb25zdCBjdHggPSBjYW52YXM/LmdldENvbnRleHQoJzJkJyk7XG4gICAgaWYgKCFjdHgpIHJldHVybjtcblxuICAgIGNvbnN0IHdpZHRoID0gZW5kLnggLSBzdGFydC54O1xuICAgIGNvbnN0IGhlaWdodCA9IGVuZC55IC0gc3RhcnQueTtcblxuICAgIC8vIENsZWFyIHByZXZpb3VzIGJveCBiZWZvcmUgZHJhd2luZyBhIG5ldyBvbmVcbiAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjdHgucmVjdChzdGFydC54LCBzdGFydC55LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gY29sb3I7IC8vIFVzZSB0aGUgc3BlY2lmaWVkIGNvbG9yXG4gICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25Nb3VzZURvd24gPSAoZTogUmVhY3QuTW91c2VFdmVudDxIVE1MQ2FudmFzRWxlbWVudCwgTW91c2VFdmVudD4pID0+IHtcbiAgICBjb25zdCByZWN0ID0gY2FudmFzUmVmLmN1cnJlbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChyZWN0KSB7XG4gICAgICBjb25zdCB4ID0gZS5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgICAgY29uc3QgeSA9IGUuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgc2V0U3RhcnRQb2ludCh7IHgsIHkgfSk7XG4gICAgICBzZXRJc0RyYXdpbmcodHJ1ZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICBpZiAoIWlzRHJhd2luZykgcmV0dXJuO1xuICAgIGNvbnN0IHJlY3QgPSBjYW52YXNSZWYuY3VycmVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIGNvbnN0IHggPSBlLmNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgICBjb25zdCB5ID0gZS5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICBkcmF3Qm94KHN0YXJ0UG9pbnQsIHsgeCwgeSB9KTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25Nb3VzZVVwID0gKCkgPT4ge1xuICAgIHNldElzRHJhd2luZyhmYWxzZSk7XG4gIH07XG5cbiAgY29uc3QgY2xlYXIgPSAoKSA9PiB7XG4gICAgY29uc3QgY2FudmFzID0gY2FudmFzUmVmLmN1cnJlbnQ7XG4gICAgY29uc3QgY3R4ID0gY2FudmFzPy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGlmIChjdHgpIHtcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBjYW52YXMgPSBjYW52YXNSZWYuY3VycmVudDtcbiAgICBpZiAoIWNhbnZhcykgcmV0dXJuO1xuXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgIGNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICB9O1xuICB9LCBbaXNEcmF3aW5nLCBzdGFydFBvaW50XSk7IC8vIFJlbW92ZWQgZSBwYXJhbWV0ZXIgZnJvbSBkZXBlbmRlbmNpZXNcblxuICByZXR1cm4geyBjYW52YXNSZWYsIG9uTW91c2VEb3duLCBjbGVhciB9O1xufTsiXSwibmFtZXMiOlsidXNlRWZmZWN0IiwidXNlUmVmIiwidXNlU3RhdGUiLCJ1c2VEcmF3IiwiY29sb3IiLCJpc0RyYXdpbmciLCJzZXRJc0RyYXdpbmciLCJzdGFydFBvaW50Iiwic2V0U3RhcnRQb2ludCIsIngiLCJ5IiwiY2FudmFzUmVmIiwiZHJhd0JveCIsInN0YXJ0IiwiZW5kIiwiY2FudmFzIiwiY3VycmVudCIsImN0eCIsImdldENvbnRleHQiLCJ3aWR0aCIsImhlaWdodCIsImNsZWFyUmVjdCIsImJlZ2luUGF0aCIsInJlY3QiLCJzdHJva2VTdHlsZSIsInN0cm9rZSIsIm9uTW91c2VEb3duIiwiZSIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImNsaWVudFgiLCJsZWZ0IiwiY2xpZW50WSIsInRvcCIsIm9uTW91c2VNb3ZlIiwib25Nb3VzZVVwIiwiY2xlYXIiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./hooks/useDraw.tsx\n"));

/***/ })

});