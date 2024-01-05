/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comsagenet/z_functional_location_lookup/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
