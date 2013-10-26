angular.module('paintover', ['ngRoute', 'colorpicker.module'])
	.config(function($routeProvider, $locationProvider) {
		$routeProvider.
      when('/', {
      	redirectTo : '/vocareg'
      }).
      when('/vocareg', {
			  templateUrl: chrome.extension.getURL('template/vocaReg.html'),
			  controller: 'vocaRegCtrl'
			}).
      when('/etcreg', {
			  templateUrl: chrome.extension.getURL('template/etcReg.html'),
			  controller: 'etcRegCtrl'
			});
	})
	.constant('DEFAULT_COMPLETE_VALUE', 5)
	.factory("vocaSvc",['$rootScope','$q',function($rootScope,$q) {
		function _addVoca (voca) {
			if(!voca){
				return;
			}
			var defer = $q.defer();

				chrome.storage.sync.set(voca, function () {
					$rootScope.$apply(function() {
						defer.resolve();
					});
				});

			return defer.promise;
		}

		function _removeVoca (key,func) {
			chrome.storage.sync.remove(key,function(){
				$rootScope.$apply(function() {
					if(func) func.apply({},[]);
				})
			});
		}

		function _getVocaList () {
			var defer = $q.defer();

			chrome.storage.sync.get(function(item){
				$rootScope.$apply(function() {
					defer.resolve(item);
				})
			});

			return defer.promise;
		}

		return {
			addVoca : _addVoca,
			removeVoca : _removeVoca,
			getVocaList : _getVocaList
		}
	}])
	.controller('mainCtrl',function($scope, $location) {
		console.log($location.$$path);
		$scope.isActive = function(path) {
			return {
				active : ($location.$$path == path)
			}
		};
	})
	.controller('vocaRegCtrl',function($scope, vocaSvc, DEFAULT_COMPLETE_VALUE) {
		$scope.voca = {
			text: ""
		};

		$scope.loadVocaList = function() {
			vocaSvc.getVocaList()
				.then(function(items) {
					$scope.vocaListReged = items;
					$scope.vocalListLength = Object.keys(items).length;
			});
		};

		$scope.addVoca = function(voca) {
			if(voca.text === ""){
				return;
			}
			var vocaToSave = {};

			vocaToSave[voca.text] = {
				'text' : voca.text,
				'complete' : DEFAULT_COMPLETE_VALUE
			};
			vocaSvc.addVoca(vocaToSave)
				.then(function() {
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
	})
    .controller('etcRegCtrl', function ($scope) {
        var sliderOpts = {
            min: 5,
            max: 10,
            orientation: "horizontal",
            tooltip: "show",
            handle: "round",
            selection: "before"
        }

        var slider = $(".compleMaxSlider").slider(sliderOpts);
        slider.on('slide', $scope.setSlider);

        chrome.storage.sync.get("$$option", function (obj) {
            $scope.$apply(function () {
                // default color
                $scope.options = {
                    maxComplete: 5,
                    bgColor: "#ffff00"
                };

                if (obj.$$option) {
                    var bgColor = obj.$$option["bgColor"];
                    if (bgColor) {
                        $scope.options["bgColor"] = bgColor;
                    }

                    var maxComplete = obj.$$option["maxComplete"];
                    if (maxComplete) {
                        $scope.options["maxComplete"] = maxComplete;
                        slider.slider('setValue', maxComplete);
                    }
                }
            });
        });

        $scope.setOptions = function () {
            chrome.storage.sync.set({"$$option": $scope.options}, function () {
            });
        };

        $scope.setSlider = function(event) {
            $scope.options["maxComplete"] = event.value;
            $scope.setOptions();
        }
    });