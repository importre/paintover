angular.module('paintover', ['ngRoute'])
	.config(function($routeProvider, $locationProvider) {
		$routeProvider.
      when('/', {
      	redirectTo : '/vocareg'
      }).
      when('/vocareg', {
			  templateUrl: chrome.extension.getURL('template/vocaReg.html'),
			  controller: 'vocaRegCtrl'
			});

		// $locationProvider.html5Mode(true);
	})
	.constant('DEFAULT_COMPLETE_VALUE', 5)
	.factory("vocaSvc",['$rootScope',function($rootScope) {
		function _addVoca (voca,func) {
			if(voca){
				chrome.storage.sync.set(voca, function () {
					$rootScope.$apply(function() {
						if(func) func.apply(null,[]);
					});
				});
			}
		}

		function _removeVoca (key,func) {
			chrome.storage.sync.remove(key,function(){
				$rootScope.$apply(function() {
					if(func) func.apply({},[]);
				})
			});
		}

		function _getVocaList (func) {
			chrome.storage.sync.get(function(item){
				$rootScope.$apply(function() {
					if(func) func.apply({},[item]);
				})
			});
		}

		return {
			addVoca : _addVoca,
			removeVoca : _removeVoca,
			getVocaList : _getVocaList
		}
	}])
	.controller('mainCtrl',function($scope) {
		return {

		}
	})
	.controller('vocaRegCtrl',function($scope, vocaSvc, DEFAULT_COMPLETE_VALUE) {
		$scope.voca = {
			text: ""
		};

		$scope.loadVocaList = function() {
			vocaSvc.getVocaList(function(items) {
					$scope.vocaListReged = items;
					$scope.vocalListLength = Object.keys(items).length;
			});
		};

		$scope.addVoca = function(voca) {
			var vocaToSave = {};
			
			vocaToSave[voca.text] = {
				'text' : voca.text,
				'complete' : DEFAULT_COMPLETE_VALUE
			};
			console.log(vocaToSave);
			vocaSvc.addVoca(vocaToSave, function() {
				$scope.loadVocaList();
			});

			$scope.voca.text = "";
		};

		$scope.removeVoca = function(key) {
			vocaSvc.removeVoca(key,function() {
				$scope.loadVocaList();
			});
		};

		$scope.loadVocaList();
	});