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