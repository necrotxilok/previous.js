
(function() {
"use strict";

String.prototype._trim = String.prototype.trim; 
String.prototype.trim = function(char) {
	if (!char) {
		return this._trim();
	}
	let str = this;
	let start = 0;
	let end = str.length;
	for (let i = 0; i < str.length; i++) {
		let cur = str[i];
		if (cur != char) { 
			break;
		}
		start = i + 1;
	}
	for (let i = str.length - 1; i >= 0; i--) {
		let cur = str[i];
		if (cur != char) { 
			break;
		}
		end = i;
	}
	str = str.substr(start, end - start);
	return str;
}

Array.prototype.unique = function() {
	return this.filter(function(value, index, self) { 
	    return self.indexOf(value) === index;
	});	
}

Date.prototype.getFullDateString = function() {
	var date = "";
	var year = "" + this.getFullYear();
	var month = "" + (this.getMonth() + 1);
	var day = "" + this.getDate();
	var hour = "" + this.getHours();
	var minute = "" + this.getMinutes();
	var second = "" + this.getSeconds();
	date += year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
	date += " ";
	date += hour.padStart(2, '0') + ':' + minute.padStart(2, '0') + ':' + second.padStart(2, '0');
	return date;
}

})();
