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