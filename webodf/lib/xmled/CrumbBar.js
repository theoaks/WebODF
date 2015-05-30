/**
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, xmled, NodeFilter */

/**
 * @constructor
 * @param {!Element} htmlelement in which to draw the crumbs 
 * @param {!Element} root root element of document
 * @param {!xmled.ValidationModel} validationModel
 * @param {?NodeFilter} filter
 * @return {?}
 **/
xmled.CrumbBar = function CrumbBar(htmlelement, root, validationModel, filter) {
    "use strict";
    var doc = htmlelement.ownerDocument,
        htmlns = htmlelement.namespaceURI,
        cursorns = "urn:webodf:names:cursor";
    function clean() {
        while (htmlelement.firstChild) {
            htmlelement.removeChild(htmlelement.firstChild);
        }
    }
    /**
     * @return {!HTMLSpanElement}
     */
    function createArrow() {
        var span = /**@type{!HTMLSpanElement}*/(doc.createElementNS(htmlns, "span"));
        span.appendChild(doc.createTextNode(" ▸ "));
        span.style.color = "#FF8A00";
        span.style.padding = "2px";
        span.style.fontFamily = "sans";
        return span;
    }

    /**
     * @param {!HTMLDivElement} menu
     * @param {string} text
     */
    function createMenuItem(menu, text) {
        var item = doc.createElementNS(htmlns, "div");
        item.appendChild(doc.createTextNode(text));
        item.style.position = "relative";
        item.className = 'hoveropaque';
        menu.appendChild(item);
//        item.setAttribute("tabindex", "1");
    }

    /**
     * @param {!Node} node
     * @return {number}
     */
    function getNodePosition(node) {
        var n = node.parentNode.firstChild,
            pos = 0;
        while (n !== node) {
            pos += 1;
            n = n.nextSibling;
        }
        return pos;
    }

    /**
     * @param {!Node} node
     * @return {!Range}
     */
    function getRangeAroundNode(node) {
        var range = node.ownerDocument.createRange(),
            pos = getNodePosition(node);
        range.setStart(node.parentNode, pos);
        range.setEnd(node.parentNode, pos + 1);
        return range;
    }

    /**
     * @param {!Node} node
     * @return {!Range}
     */
    function getRangeAtStartOfNode(node) {
        var range = node.ownerDocument.createRange();
        range.setStart(node, 0);
        range.setEnd(node, 0);
        return range;
    }

    /**
     * @param {!Node} node
     * @return {!Range}
     */
    function getRangeAtEndOfNode(node) {
        var range = node.ownerDocument.createRange(),
            count = node.childNodes.length;
        range.setStart(node, count);
        range.setEnd(node, count);
        return range;
    }

    /**
     * @param {!Element} element
     * @return {!HTMLDivElement}
     */
    function createMenu(element) {
        var menu = /**@type{!HTMLDivElement}*/(doc.createElementNS(htmlns, "div")),
            range = getRangeAroundNode(element),
            range2,
            allowed = validationModel.getPossibleReplacements(root, range, filter),
            i;
        range.detach();
        // replace
        for (i = 0; i < allowed.length; i += 1) {
            createMenuItem(menu, 'Replace with ' + allowed[i].desc);
        }
        // prepend
        range = getRangeAtStartOfNode(element);
        allowed = validationModel.getPossibleReplacements(root, range, filter);
        range.detach();
        for (i = 0; i < allowed.length; i += 1) {
            createMenuItem(menu, 'Prepend ' + allowed[i].desc);
        }
        range2 = getRangeAtEndOfNode(element);
        range2.detach();
        menu.style.display = "none";
        menu.style.position = "absolute";
        menu.style.background = "black";
        menu.style.color = "white";
        menu.style.whiteSpace = "nowrap";
        menu.style.padding = "5px";
        menu.style.minWidth = "100%";
        menu.style.top = "100%";
        menu.style.left = "-1em";//element.offsetLeft + "px";
//        menu.style.height = "100%";
//        menu.setAttribute("tabindex", "1");
        return menu;
    }

    /**
     * @param {?Element} element
     */
    function hideMenus(element) {
        var e = element.firstElementChild;
        while (e) {
            if (e.style.display === "block") {
                e.style.display = "none";
            }
            hideMenus(e);
            e = e.nextElementSibling;
        }
    }
 
    /**
     * @param {!Element} element
     * @return {!HTMLSpanElement}
     */
    function createCrumb(element) {
        var span = createArrow(),
            crumb = /**@type{!HTMLSpanElement}*/(doc.createElementNS(htmlns, "span")),
            menu = createMenu(element);
        span.className = 'hoveropaque';
        span.appendChild(crumb);
        //crumb.setAttribute("tabindex", "1");
        crumb.appendChild(doc.createTextNode(element.localName));
        crumb.style.color = "#FFFFFF";
        crumb.style.cursor = "pointer";
        crumb.style.position = "relative";
        span.onmouseover = function () {
            element.setAttributeNS(cursorns, "hover", "1");
        };
        span.onmouseout = function () {
            element.removeAttributeNS(cursorns, "hover");
        };
        crumb.appendChild(menu);
        span.onclick = function () {
            var d = menu.style.display;
            hideMenus(crumb.parentElement.parentElement);
            menu.style.display = d === "none" ? "block" : "none";
        };
        return span;
    }
    /**
     * @param {!Element} newRoot
     * @return {undefined}
     */
    this.setDocumentRoot = function (newRoot) {
        root = newRoot;
    };
    /**
     * @param {!Element} element in which to draw the crumbs
     */
    this.setElement = function (element) {
        clean();
        if (!root || !root.contains(element)) {
            return;
        }
        var e = element,
            empty = true;
        while (e && e !== root.parentNode) {
            htmlelement.insertBefore(createCrumb(e), htmlelement.firstChild);
            empty = false;
            e = e.parentElement;
        }
        if (empty) {
            htmlelement.appendChild(createArrow());
        }
    };
    htmlelement.appendChild(createArrow());
};
