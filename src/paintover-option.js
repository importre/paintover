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
	.factory("vocaSvc",['$rootScope',function($rootScope) {
		function _addVoca (voca,func) {
			chrome.storage.sync.set(voca, function (item) {
				$rootScope.$apply(function() {
					func.apply(null,[item]);
				});
			});
		}

		function _removeVoca (voca) {
			
		}

		function _getVocaList (func) {
			chrome.storage.sync.get(function(item){
				$rootScope.$apply(function() {
					func.apply({},[item]);
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
	.controller('vocaRegCtrl',function($scope, vocaSvc) {
		$scope.voca = {
			text: ""
		};

		$scope.loadVocaList = function() {
			vocaSvc.getVocaList(function(items) {
					$scope.vocaListReged = items;
			});
		};

		$scope.addVoca = function(voca) {
			var vocaToSave = {};
			
			vocaToSave[voca.text] = voca.text;
			
			vocaSvc.addVoca(vocaToSave, function(a) {
				$scope.loadVocaList();
			});

			$scope.voca.text = "";
		};

		$scope.loadVocaList();
	});