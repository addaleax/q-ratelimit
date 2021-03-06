'use strict';

var Q = require('q');

function ratelimit(rateInMs) {
	rateInMs = parseInt(rateInMs);
	if (rateInMs != rateInMs) // NaN check
		throw new TypeError('ratelimit needs a single numerical argument');
	
	if (rateInMs < 0)
		rateInMs = 0;
	
	var throttle = function() {
		var deferred = Q.defer();
		throttle.queue.push(deferred);
		
		return throttle.check().then(function() {
			return deferred.promise;
		});
	};
	
	throttle.currentlyActiveCheck = null;
	throttle.lastExecutionTime = 0;
	throttle.queue = [];
	
	throttle.resolveUniform = function(fnName, v) {
		throttle.queue.forEach(function(deferred) {
			return deferred[fnName](v);
		});
		
		throttle.queue = [];
	};
	
	throttle.resolveAll = function(v) {
		return throttle.resolveUniform('resolve', v);
	};
	
	throttle.rejectAll = function(v) {
		return throttle.resolveUniform('reject', v);
	};
	
	throttle.check = function() {
		if (throttle.currentlyActiveCheck || throttle.queue.length == 0)
			return throttle.currentlyActiveCheck;
		
		var waitingTime = rateInMs - (Date.now() - throttle.lastExecutionTime);
		return throttle.currentlyActiveCheck =
			(waitingTime > 0 ? Q.delay(waitingTime) : Q()).then(function()
		{
			var now = Date.now();
			if (now - throttle.lastExecutionTime >= rateInMs) {
				throttle.lastExecutionTime = now;
				throttle.queue.shift().resolve();
			}
			
			throttle.currentlyActiveCheck = null;
			throttle.check();
		});
	};
	
	return throttle;
}

module.exports = ratelimit;
