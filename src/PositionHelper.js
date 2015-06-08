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