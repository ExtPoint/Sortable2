(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * @namespace
 * @name Sortable2
 * @global Sortable2
 */
var Sortable2 = module.exports = window.Sortable2 = {};

require('./Container.js');
require('./ContainersCollection');
require('./Draggable');
require('./PositionHelper');
},{"./Container.js":2,"./ContainersCollection":3,"./Draggable":4,"./PositionHelper":5}],2:[function(require,module,exports){
'use strict';

/**
 *
 * @param {string|Node|jQuery} element
 * @param {object} options
 * @constructor
 * @class Sortable2.Container
 */
Sortable2.Container = function(element, options) {
	options = options || {};

	this._items = null;
	this._eventObject = {};

	this.element = $(element);
	this.element.addClass(Sortable2.Container.CSS_CLASS_CONTAINER);
	this.element.data(Sortable2.Container.DATA_CONTAINER_ID, this);

	this.isFloating = options.hasOwnProperty('isFloating') ? !!options.isFloating : null;
	this.itemsContainerSelector = options.itemsContainerSelector || 'ul';
	this.coordinates = null;
	this.paddings = null;

	// Events in options
	var events = [
		Sortable2.Container.EVENT_RECEIVE,
		Sortable2.Container.EVENT_CHANGE
	];
	$.each(events, function(i, eventName) {
		var optionEventName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
		if (options[optionEventName]) {
			this.on(eventName, options[optionEventName]);
		}
	}.bind(this));
};

$.extend(Sortable2.Container, /** @lends Sortable2.Container */{

	CSS_CLASS_CONTAINER: 'sortable-2-container',
	DATA_CONTAINER_ID: '__sortable-2-container',

	EVENT_RECEIVE: 'receive',
	EVENT_CHANGE: 'change',

	/**
	 *
	 * @param {string|Node|jQuery} el
	 * @returns {Sortable2.Container|null}
	 */
	findOrCreate: function(el) {
		var $el = $(el);
		if ($el.length === 0) {
			return null;
		}

		return $el.data(Sortable2.Container.DATA_CONTAINER_ID) || new Sortable2.Container($el);
	},

	/**
	 *
	 * @param {string|Node|jQuery} el
	 * @returns {Sortable2.Container|null}
	 */
	find: function(el) {
		return $(el).data(Sortable2.Container.DATA_CONTAINER_ID) || null;
	}

});

$.extend(Sortable2.Container.prototype, /** @lends Sortable2.Container.prototype */{

	/**
	 *
	 * @param {string} event
	 * @param {function} handler
	 */
	on: function (event, handler) {
		$(this._eventObject).on(event, handler);
	},

	/**
	 *
	 * @param {string} event
	 * @param {function} [handler]
	 */
	off: function (event, handler) {
		$(this._eventObject).off(event, handler);
	},

	/**
	 *
	 * @returns {jQuery|null}
	 * @private
	 */
	getItemsWrapperElement: function() {
		if (!this.itemsContainerSelector) {
			return this.element;
		}

		var container = this.element.find(this.itemsContainerSelector).eq(0);
		return container.length > 0 ? container : null;
	},

	refresh: function() {
		// Refresh floating state
		if (this.isFloating === null) {
			this.isFloating = !!this.element.attr('data-floating');
		}

		// Refresh coordinates
		this.coordinates = Sortable2.PositionHelper.calcCoordinates(this.element);

		// Reset state
		this._items = [];
		this.paddings = {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		};

		var itemsContainer = this.getItemsWrapperElement();
		if (itemsContainer) {
			// Refresh padding
			this.paddings = {
				top: parseInt(itemsContainer.css('paddingTop').replace(/[^0-9.]/g, ''), 10),
				right: parseInt(itemsContainer.css('paddingRight').replace(/[^0-9.]/g, ''), 10),
				bottom: parseInt(itemsContainer.css('paddingBottom').replace(/[^0-9.]/g, ''), 10),
				left: parseInt(itemsContainer.css('paddingLeft').replace(/[^0-9.]/g, ''), 10)
			};

			// Refresh items list
			itemsContainer.find('> *').each($.proxy(function(i, el) {
				var container = Sortable2.Container.findOrCreate(el);
				if (container) {
					container.refresh();
					this._items.push(container);
				}
			}, this));
		}
	},

	/**
	 *
	 * @param {boolean} value
	 */
	setActive: function(value) {
		this.element.css('background-color', value ? 'rgba(255, 222, 118, .8)' : '');
	},

	/**
	 *
	 * @param x
	 * @param y
	 * @returns {boolean}
	 */
	isEntryPoint: function(x, y) {
		return this.coordinates.x1 <= x && x < this.coordinates.x2
			&& this.coordinates.y1 <= y && y < this.coordinates.y2;
	},

	/**
	 *
	 * @param x
	 * @param y
	 * @param isParentFloating
	 * @returns {boolean}
	 */
	isEntryPointNearEdge: function(x, y, isParentFloating) {
		if (isParentFloating) {
			var width = this.coordinates.x2 - this.coordinates.x1;
			return this.coordinates.y1 <= y && y < this.coordinates.y2 && (
					(this.coordinates.x1 <= x && x < this.coordinates.x1 + (width * 0.3)) ||
					(this.coordinates.x1 + (width * 0.7) <= x && x < this.coordinates.x2)
				);
		} else {
			var height = this.coordinates.y2 - this.coordinates.y1;
			return this.coordinates.x1 <= x && x < this.coordinates.x2 && (
					(this.coordinates.y1 <= y && y < this.coordinates.y1 + (height * 0.3)) ||
					(this.coordinates.y1 + (height * 0.7) <= y && y < this.coordinates.y2)
				);
		}
	},

	findNearEdge: function(x, y) {
		// Default container - self
		var container = null;
		var paddingStart = 0;
		var paddingEnd = 0;

		var value = this.isFloating ? x : y;
		var axis = this.isFloating ? 'x' : 'y';
		var betweenChildValue = null;

		// Find edge child
		for (var i = 0, l = this._items.length; i < l; i++) {
			var child = this._items[i];
			var width = child.coordinates[axis+2] - child.coordinates[axis+1];

			// Point before children
			if (value < child.coordinates[axis+1] + (width / 2)) {
				break;
			}

			container = child;

			// Check child before next
			var nextChild = this._items[i+1];
			if (nextChild) {
				betweenChildValue = nextChild.coordinates[axis+1] - ((nextChild.coordinates[axis+1] - child.coordinates[axis+2]) / 2);
			} else {
				container = null;
				betweenChildValue = null;
			}
		}

		// Set parent container and it padding
		if (!container) {
			container = this;
			paddingStart = this.isFloating ? this.paddings.left : this.paddings.top;
			paddingEnd = this.isFloating ? this.paddings.right : this.paddings.bottom;
		}

		// Default coordinates - container + paddings
		var isStartDirection = false;
		var coordinates = {
			x1: container.coordinates.x1 + paddingStart,
			x2: container.coordinates.x2 - paddingEnd,
			y1: container.coordinates.y1 + paddingStart,
			y2: container.coordinates.y2 - paddingEnd
		};

		// Overwrite axis coordinates - start or end container
		if (betweenChildValue) {
			coordinates[axis+1] = coordinates[axis+2] = betweenChildValue;
		} else {
			isStartDirection = this._items.length === 0 || value < container.coordinates[axis+1] + ((container.coordinates[axis+2] - container.coordinates[axis+1]) / 2);
			coordinates[axis+1] = coordinates[axis+2] = isStartDirection ?
			container.coordinates[axis+1] + paddingStart :
			container.coordinates[axis+2] - paddingEnd;
		}

		return {
			coordinates: coordinates,
			place: {
				element: container === this ? container.getItemsWrapperElement() : container.element,
				method: container === this ?
					(isStartDirection ? 'prependTo' : 'appendTo') :
					(isStartDirection ? 'insertBefore' : 'insertAfter')
			}
		};
	},

	receive: function(originalElement, placeholder) {
		this._trigger(Sortable2.Container.EVENT_RECEIVE, [originalElement, placeholder]);
		this._trigger(Sortable2.Container.EVENT_CHANGE);
	},

	/**
	 *
	 * @param {string} event
	 * @param {object} [params]
	 * @private
	 */
	_trigger: function(event, params) {
		$(this._eventObject).trigger(event, params);
	}

});
},{}],3:[function(require,module,exports){
'use strict';

/**
 *
 * @class ContainersCollection
 * @param {string} selector
 * @constructor
 * @class Sortable2.ContainersCollection
 */
Sortable2.ContainersCollection = function(selector) {
	this._selector = selector;
	this._items = [];
};

$.extend(Sortable2.ContainersCollection, /** @lends Sortable2.ContainersCollection */{

	DATA_CONTAINER_ID: '__sortable-2-container',

	_bySelector: {},

	getCollection: function(selector) {
		if (!this._bySelector[selector]) {
			this._bySelector[selector] = new Sortable2.ContainersCollection(selector);
		}
		return this._bySelector[selector];
	}

});

$.extend(Sortable2.ContainersCollection.prototype, /** @lends Sortable2.ContainersCollection.prototype */{

	/**
	 */
	findAndStore: function() {
		this._items = [];
		$(this._selector).each($.proxy(function(i, el) {
			var container = Sortable2.Container.find(el);
			if (container) {
				container.refresh();
				this._items.push(container);
			}
		}, this));
	},

	/**
	 *
	 * @param x
	 * @param y
	 * @returns {Sortable2.Container}
	 */
	findEntryPointContainer: function(x, y) {
		var child = null;

		// Find child
		// Revert each items for get child container
		for (var i = this._items.length - 1; i >= 0; i--) {
			if (this._items[i].isEntryPoint(x, y)) {
				if (child) {
					return child.isEntryPointNearEdge(x, y, this._items[i].isFloating) ?
						this._items[i] :
						child;
				}
				child = this._items[i];
				break;
			}
		}

		return child;
	}

});
},{}],4:[function(require,module,exports){
'use strict';

/**
 *
 * @param {string|Node|jQuery} element
 * @param {object} [options]
 * @constructor
 * @class Sortable2.Draggable
 */
Sortable2.Draggable = function(element, options) {
	this._element = $(element);
	this._helperElement = null;
	this._placeholderElement = null;

	this._isDrag = false;
	this._isDragMove = false;
	this._startPoint = null;
	this._startElementCoordinates = null;
	this._activeContainer = null;
	this._nearEdge = null;

	options = $.extend(true, {
		containersSelector: 'ul, ol'
	}, options || {});

	this._init();
	this.setContainersSelector(options.containersSelector);
};

$.extend(Sortable2.Draggable, /** @lends Sortable2.Draggable */{

	DATA_ID: '__sortable-2'

});

$.extend(Sortable2.Draggable.prototype, /** @lends Sortable2.Draggable.prototype */{

	setContainersSelector: function(selector) {
		this._containers = Sortable2.ContainersCollection.getCollection(selector);
	},

	_init: function() {
		this._element.on('mousedown', $.proxy(this._dragStart, this));
		$(window)
			.on('mousemove', $.proxy(this._dragMove, this))
			.on('mouseup', $.proxy(this._dragEnd, this));
	},

	/**
	 *
	 * @param event
	 * @private
	 */
	_dragStart: function(event) {
		if (this._isDrag) {
			return;
		}
		this._isDrag = true;
	},

	/**
	 *
	 * @param event
	 * @private
	 */
	_dragMove: function(event) {
		if (!this._isDrag) {
			return;
		}

		// Disable selection and other handles
		event.preventDefault();

		if (!this._isDragMove) {
			// Drag only top-level element
			event.stopPropagation();

			// Store start coordinates
			this._startElementCoordinates = Sortable2.PositionHelper.calcCoordinates(this._element);
			this._startPoint = Sortable2.PositionHelper.calcPointFromEvent(event);

			// Refresh containers collection
			this._containers.findAndStore();

			// Create helper elements
			this._helperElement = this._element.clone().appendTo('body');
			this._placeholderElement = $('<div />').hide().appendTo('body').css({
				position: 'absolute',
				outline: 'solid 2px #006c9e'
			});
		}
		this._isDragMove = true;

		// Current cursor (mouse) coordinates
		var point = Sortable2.PositionHelper.calcPointFromEvent(event);

		// Move helper
		this._helperElement.css({
			position: 'absolute',
			left: this._startElementCoordinates.x1 - (this._startPoint.x - point.x),
			top: this._startElementCoordinates.y1 - (this._startPoint.y - point.y)
		});

		// Find entry container
		var container = this._containers.findEntryPointContainer(point.x, point.y);

		// Update active state
		if (this._activeContainer) {
			this._activeContainer.setActive(false);
		}
		this._activeContainer = container;
		if (this._activeContainer) {
			this._activeContainer.setActive(true);
		}

		// Place placeholder
		if (container) {
			this._nearEdge = container.findNearEdge(point.x, point.y);
			this._placeholderElement.show().css({
				left: this._nearEdge.coordinates.x1,
				top: this._nearEdge.coordinates.y1,
				width: this._nearEdge.coordinates.x2 - this._nearEdge.coordinates.x1,
				height: this._nearEdge.coordinates.y2 - this._nearEdge.coordinates.y1
			});
		} else {
			this._nearEdge = null;
			this._placeholderElement.hide();
		}
	},

	/**
	 *
	 * @param event
	 * @private
	 */
	_dragEnd: function(event) {
		if (!this._isDrag) {
			return;
		}
		this._isDrag = false;

		if (!this._isDragMove) {
			return;
		}
		this._isDragMove = false;

		if (this._activeContainer && this._nearEdge) {
			var placeholder = $('<div />')[this._nearEdge.place.method](this._nearEdge.place.element);
			this._activeContainer.receive(this._element, placeholder);
		}

		if (this._nearEdge) {
			this._nearEdge = null;
		}
		if (this._activeContainer) {
			this._activeContainer.setActive(false);
			this._activeContainer = null;
		}

		this._helperElement.remove();
		this._placeholderElement.remove();
	}

});
},{}],5:[function(require,module,exports){
'use strict';

/**
 * @class Sortable2.PositionHelper
 */
Sortable2.PositionHelper = /** @lends Sortable2.PositionHelper */{

	calcPointFromEvent: function(event) {
		return {
			x: event.pageX,
			y: event.pageY
		};
	},

	calcCoordinates: function(el) {
		var offset = el.offset();
		return {
			x1: offset.left,
			x2: offset.left + el.outerWidth(),
			y1: offset.top,
			y2: offset.top + el.outerHeight()
		};
	}

};
},{}]},{},[1]);
