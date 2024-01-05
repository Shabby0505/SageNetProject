sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "com/sagenet/zfunctionallocationlookup/utils/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, JSONModel, formatter) {
        "use strict";

        return Controller.extend("com.sagenet.zfunctionallocationlookup.controller.HomeView", {
            formatter: formatter,
            onInit: function () {
                var oList = this.byId("idSiteTable");
                this._mViewSettingsDialogs = {};
                this.oModel = new JSONModel({
                    isFilterBarVisible: false,
                    filterBarLabel: "",
                    delay: 0,
                    title: this.getResourceBundle().getText("masterTitleCount", [0]),
                    noDataText: this.getResourceBundle().getText("masterListNoDataText"),
                    sortBy: "None",
                    groupBy: "None"
                });
                this.oModel.setSizeLimit(1000);
                var that = this;
                this.getView().setModel(this.oModel);
                var fCountry = new Filter("Country", "EQ", "US");
                // filters.push(fCountry);
                this.getOwnerComponent().getModel("StateModel").read("/StateSet", {
                    filters: [fCountry],
                    success: function (res) {
                        sap.ui.core.BusyIndicator.hide();
                        that.oModel.setProperty("/StateData", res.results);
                        if (res.results.length === 0) {
                            sap.m.MessageToast.show("No records found for this selection criteria.!");
                        }

                    },
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("No Data Found.!");
                        // sap.m.MessageToast.show(error);
                        that.oModel.setProperty("/StateData", []);
                    }
                });

                this._oList = oList;
                // keeps the filter and search state
                this._oListFilterState = {
                    aFilter: [],
                    aSearch: []
                };


            },
            onValueHelpRequestState: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue();
                this.byId("idState").setValueState("None");
                this.inputId = oEvent.getSource().getId();
                // create value help dialog
                if (!this._valueHelpDialogS) {
                    this._valueHelpDialogS = sap.ui.xmlfragment(
                        "com.sagenet.zfunctionallocationlookup.view.stateDialog",
                        this
                    );
                    this.getView().addDependent(this._valueHelpDialogS);
                }

                // create a filter for the binding
                var oFilter = new Filter("RegionDescription", FilterOperator.Contains, sInputValue);
                this._valueHelpDialogS.getBinding("items").filter([oFilter]);

                // open value help dialog filtered by the input value
                this._valueHelpDialogS.open(sInputValue);


            },
            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var sTitle = oEvent.oSource.mProperties.title;
                var oFilter;

                if (sTitle === "State") {
                    oFilter = new Filter("RegionDescription", FilterOperator.Contains, sValue);
                }


                oEvent.getSource().getBinding("items").filter([oFilter]);

            },
            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                var sTitle = oEvent.oSource.mProperties.title;

                if (sTitle === "State") {
                    this.byId("idState").setValue(oSelectedItem.getTitle());
                }

            },
            /**
             * Event handler for refresh event. Keeps filter, sort
             * and group settings and refreshes the list binding.
             * @public
             */
            onRefresh: function () {
                this._oList.getBinding("items").refresh();
            },
            onSearch: function (oEvent) {
                if (oEvent.getParameters().refreshButtonPressed) {
                    // Search field's 'refresh' button has been pressed.
                    // This is visible if you select any master list item.
                    // In this case no new search is triggered, we only
                    // refresh the list binding.
                    this.onRefresh();
                    return;
                }


                this._applyFilterSearch();

            },
            /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @private
         */
            _applyFilterSearch: function () {


                var oFilterBar = this.getView().byId("filterbar");
                var aFilterItems = this.getView().byId("filterbar").getAllFilterItems();

                var aFilters = [];
                var that = this.getView();

                aFilterItems.map(function (oFilterItem) {
                    var sFilterName = oFilterItem.getName();
                    var oControl = oFilterBar.determineControlByFilterItem(oFilterItem);
                    var sValue;

                    if (oControl.getMetadata().getName() === "sap.m.Input") {
                        sValue = oControl.getValue();
                    }
                    else {
                        sValue = "";
                    }

                    if (sValue.length !== 0) {
                        if (sFilterName === "Program") {
                            sFilterName = "ProjectDefinition";
                        }

                        var oFilter = new Filter(sFilterName, "Contains", sValue);

                        // return oFilter;
                        aFilters.push(oFilter);
                    }

                });



                this.fetchSiteData(false, aFilters);

            },

            /**
            * Internal method to call odata service to load the data for list search
            * refreshes the list binding.
            * @public
            */
            fetchSiteData: function (isInitialLoad, aFilters) {
                var that = this;

                var oFinalFilter;
                if (!isInitialLoad) {
                    oFinalFilter = new sap.ui.model.Filter({
                        filters: aFilters,
                        and: true // we want and here
                    });
                }

                sap.ui.core.BusyIndicator.show();
                this.getOwnerComponent().getModel("SiteModel").read("/SiteList", {
                    filters: aFilters,
                    success: function (res) {
                        that.getView().getModel().setProperty("/SiteData", res.results);
                        var uniqueStatus = [];
                        var distinctStatus = [];
                        var modelStatus = [];

                        var uniqueFL = [];
                        var distinctFL = [];
                        var modelFunctionalLoc = [];

                        var uniqueName1 = [];
                        var distinctName1 = [];
                        var modelName1 = [];

                        for (let i = 0; i < res.results.length; i++) {
                            if (!uniqueStatus[res.results[i].Status]) {
                                distinctStatus.push(res.results[i].Status);
                                uniqueStatus[res.results[i].Status] = 1;
                                var obj = {
                                    "statusName": res.results[i].Status
                                }
                                modelStatus.push(obj);
                            }
                            if (!uniqueFL[res.results[i].FunctionalLocation]) {
                                distinctFL.push(res.results[i].FunctionalLocation);
                                uniqueFL[res.results[i].FunctionalLocation] = 1;
                                var obj = {
                                    "funcLocName": res.results[i].FunctionalLocation
                                }
                                modelFunctionalLoc.push(obj);
                            }

                            if (!uniqueName1[res.results[i].Name1]) {
                                distinctName1.push(res.results[i].Name1);
                                uniqueName1[res.results[i].Name1] = 1;
                                var obj = {
                                    "Name1": res.results[i].Name1
                                }
                                modelName1.push(obj);
                            }
                        }
                        that.getView().getModel().setProperty("/Status", modelStatus);
                        that.getView().getModel().setProperty("/FuncLoc", modelFunctionalLoc);
                        that.getView().getModel().setProperty("/Name1", modelName1);

                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (oError) {
                        
                            sap.m.MessageToast.show("No Site Details Found.!");
                        
                        sap.ui.core.BusyIndicator.hide();
                        that.getView().getModel().setProperty("/SiteData", "");

                    }
                });
            },
            /**
                * Sets the item count on the master list header
                * @param {integer} iTotalItems the total number of items in the list
                * @private
                */
            _updateListItemCount: function (iTotalItems) {
                var sTitle;
                // only update the counter if the length is final
                if (this._oList.getBinding("items").isLengthFinal()) {
                    sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
                    this.getView().byId("idTableHeader").setText(sTitle);
                    // this.getModel("masterView").setProperty("/title", sTitle);
                }
            },
            /**
            * After list data is available, this handler method updates the
            * master list counter
            * @param {sap.ui.base.Event} oEvent the update finished event
            * @public
            */
            onUpdateFinished: function (oEvent) {
                // update the master list object counter after new data is loaded
                this._updateListItemCount(oEvent.getParameter("total"));

            },
            /**
           * Convenience method for getting the resource bundle.
           * @public
           * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
           */
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            onExit: function () {
                sap.ui.core.BusyIndicator.hide();
            },

            openSiteDetailsDialog: function (oEvent) {
                var sFuncLoc = oEvent.oSource.getCells()[0].mProperties.title;
                this.getView().getModel().setProperty("/SitePartsData", []);
                this.fetchSitePartDetails(sFuncLoc);

                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("com.sagenet.zfunctionallocationlookup.view.siteDetailsDialog", this);
                }


                this.getView().addDependent(this._oDialog);

                this._oDialog.setContentWidth("70rem");
                this._oDialog.setTitle("Parts On Site for "+sFuncLoc);
                // toggle compact style
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
                this._oDialog.open();
            },
            fetchSitePartDetails: function (sFuncLoc) {
                sap.ui.core.BusyIndicator.show();
                var that = this;
                this.getOwnerComponent().getModel("SiteModel").read("/SiteList('" + sFuncLoc + "')/GetSiteParts", {

                    success: function (res) {
                        that.getView().getModel().setProperty("/SitePartsData", res.results);

                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (oError) {
                        sap.m.MessageToast.show("No Site Parts Details Found.!");
                        // sap.m.MessageToast.show(oError);
                        sap.ui.core.BusyIndicator.hide();
                        that.getView().getModel().setProperty("/SitePartsData", "");

                    }
                });
            },
            onSitePartsClose: function () {
                this._oDialog.close();
            },
            handleSitePartsDialogClose: function () {
                // this._oDialog.destroy();
            },
            getViewSettingsDialog: function (sDialogFragmentName) {
                var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

                if (!pDialog) {
                    pDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
                    this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
                }
                // toggle compact style
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), pDialog);

                pDialog.open();
                pDialog.setModel(
                    this.getView().getModel()
                );

                return pDialog;
            },
            handleSortButtonPressed: function () {
                this.getViewSettingsDialog("com.sagenet.zfunctionallocationlookup.view.viewSortDialog");

            },
            handleSortDialogConfirm: function (oEvent) {
                var oTable = this.byId("idSiteTable"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    sPath,
                    bDescending,
                    aSorters = [];

                sPath = mParams.sortItem.getKey();
                bDescending = mParams.sortDescending;
                aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));

                // apply the selected sort and group settings
                oBinding.sort(aSorters);
            },
            handleFilterButtonPressed: function () {
                this.getViewSettingsDialog("com.sagenet.zfunctionallocationlookup.view.viewFilterDialog");

            },
            handleFilterDialogConfirm: function (oEvent) {
                var oTable = this.byId("idSiteTable"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    aFilters = [];

                mParams.filterItems.forEach(function (oItem) {
                    if (oItem.getKey() === "Status") {
                        var oFilter = new Filter("Status", "EQ", oItem.getText());
                        aFilters.push(oFilter);
                    }
                    else if (oItem.getKey() === "FunctionalLocation") {
                        var oFilter = new Filter("FunctionalLocation", "EQ", oItem.getText());
                        aFilters.push(oFilter);
                    }
                    else if (oItem.getKey() === "Name1") {
                        var oFilter = new Filter("Name1", "EQ", oItem.getText());
                        aFilters.push(oFilter);
                    }

                });

                // apply filter settings
                oBinding.filter(aFilters);

                // update filter bar
                this.byId("vsdFilterBar").setVisible(aFilters.length > 0);
                this.byId("vsdFilterLabel").setText(mParams.filterString);
            },
            handleRemoveFilterButtonPressed: function () {
                var oBinding = this.byId("idSiteTable").getBinding("items");
                oBinding.filter([]);

                this.byId("vsdFilterBar").setVisible(false);
                this.byId("vsdFilterLabel").setText("");
            }




        });
    });
