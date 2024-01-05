jQuery.sap.declare("com.sagenet.zfunctionallocationlookup.utils.formatter");

jQuery.sap.require("sap.ui.core.format.DateFormat");

com.sagenet.zfunctionallocationlookup.utils.formatter = {

    stringToDate :function(value) {
			
            if (value) {
                // var year = value.substring(0, 4);
                // var month = value.substring(4, 6);
                // var day = value.substring(6, 8);

                // var date = new Date(year, month - 1, day);
                var oDateFormat = sap.ui.core.format.DateFormat
                    .getDateTimeInstance({
                        pattern: "MM/dd/yyyy"
                    });

                var dateFormatted = oDateFormat.format(value);
                return dateFormatted;
            } else {
                return value;
            }
	},
    colorFormatter: function(value) {
        if (value == "") {
            return false;

   }else{
            return true;
   }
   
   } 
	
	};
