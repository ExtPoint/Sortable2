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