var app = angular.module("myApp", ["ngRoute"]);

const HOST = "http://localhost:8000/";

app.config(['$compileProvider', '$httpProvider', function($compileProvider, $httpProvider) {
    $compileProvider.debugInfoEnabled(false);
    $compileProvider.commentDirectivesEnabled(false);
    $compileProvider.cssClassDirectivesEnabled(false);
    $httpProvider.interceptors.push('httpRequestInterceptor');
}]);

app.factory('httpRequestInterceptor', function() {
    return {
        request: function(config) {

            config.headers['Authorization'] = 'Basic ' + localStorage.getItem('token');
            config.headers['Accept'] = 'application/json;odata=verbose';

            return config;
        }
    };
});

app.config(["$routeProvider", function($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "content/dashboard.html",
            controller: "dashboardController"
        })
        .when("/pending", {
            templateUrl: "content/ordertable.html",
            controller: "pendingController"
        })
        .when("/canceled", {
            templateUrl: "content/ordertable.html",
            controller: "canceledController"
        })
        .when("/shipped", {
            templateUrl: "content/ordertable.html",
            controller: "shippedController"
        })
        .when("/delivered", {
            templateUrl: "content/ordertable.html",
            controller: "deliveredController"
        }).when("/allorders", {
            templateUrl: "content/ordertable.html",
            controller: "allOrdersController"
        })
        .when("/products", {
            templateUrl: "content/allproducts.html",
            controller: "productsController"
        })
        .when("/newitem", {
            templateUrl: "content/newitem.html",
            controller: "newItemController"
        })
        .when("/promo", {
            templateUrl: "content/promo.html",
            controller: "promoController"
        })
        .when("/vouchers", {
            templateUrl: "content/vouchers.html",
            controller: "vouchersController"
        }).when("/banners", {
            templateUrl: "content/banners.html",
            controller: "bannerController"
        })
        .when("/login", {
            templateUrl: "content/login.html",
            controller: "loginController",
            anon: true
        })
        .when("/invoice/:idparam", {
            templateUrl: "content/invoice.html",
            controller: "invoiceController"
        }).when("/password", {
            templateUrl: "content/password.html",
            controller: "passwordController"
        }).when("/logout", {
            templateUrl: "content/logout.html",
            controller: "logoutController"
        })
        .otherwise({
            templateUrl: "content/404.html"
        });
}]);

app.run(['$rootScope', '$location', 'Auth', function($rootScope, $location, Auth) {

    $rootScope.$on('$routeChangeStart', function(event, path) {

        $rootScope.nextUrl = path.originalPath;

        if ($rootScope.nextUrl == '/') {
            $rootScope.nextUrl = '/dashboard'
        }
        if (!path.anon) {
            if (!Auth.isLoggedIn()) {
                event.preventDefault();
                $location.path('/login');
            }
        }

    });
}]);

app.factory('Auth', function() {
    var user;

    return {
        setUser: function(aUser) {
            user = aUser;
        },
        isLoggedIn: function() {
            return (user) ? user : false;
        }
    }
})

app.directive('autoFocus', function($timeout) {
    return {
        restrict: 'AC',
        link: function(_scope, _element) {
            $timeout(function(){
                _element[0].focus();
            }, 0);
        }
    };
});

app.controller('loginController', function($rootScope, $http, $scope, Auth, $location) {


        $scope.login = function() {

            credentials = {
                username: $scope.username,
                password: $scope.password
            }
            $http.post(HOST + "api/login", credentials).then((response) => {
                localStorage.setItem('token', response.data.token);
                Auth.setUser({
                    token: response.data.token
                });

                if ($rootScope.nextUrl == '/login') {
                    $rootScope.nextUrl = '/';
                }

                $location.path($rootScope.nextUrl);
            }).catch((err)=>{
                console.log(err);
                alert("Wrong Credientials")
            });

        };

        var checkLogin = function() {

            mtoken = localStorage.getItem('token');
            $http.post(HOST + "api/verify", {
                'token': mtoken
            }).then((response) => {
                Auth.setUser({
                    token: mtoken
                });
                

                if ($rootScope.nextUrl == '/login') {
                    $rootScope.nextUrl = '/';
                }

                $location.path($rootScope.nextUrl);
    
            }, (error) => {
            })
        };
        
        checkLogin();
})

app.controller('dashboardController', function($rootScope, $scope, $http) {
    $rootScope.nextUrl = "/dashboard";
    $http.get(HOST + 'api/dashboard').then(function(response) {
        $scope.data = response.data;
    });
})

app.controller('pendingController', function($scope, $http, $location, $window, sharedMethods, Auth) {

    $scope.status = "Pending";

    $scope.pending = false;
    $scope.delivered = true;
    $scope.shipped = true;
    $scope.cancel = true;

    $scope.delivered = function(id) {
        sharedMethods.delivered(id);
    }
    $scope.shipped = function(id) {
        sharedMethods.shipped(id);
    }
    $scope.cancel = function(id) {
        sharedMethods.cancel(id);
    }

    $http.get(HOST + "api/orders/pending")
        .then(function(response) {
            $scope.orders = response.data;
        });
});

app.controller('deliveredController', function($scope, $http, $location, sharedMethods) {
    $scope.status = "Delivered";

    $scope.pending = true;
    $scope.delivered = false;
    $scope.shipped = false;
    $scope.cancel = false;

    $scope.pending = function(id) {
        sharedMethods.pending(id);
    }

    $scope.showInvoice = function(id) {
        $location.path("invoice/" + id);
    }

    $http.get(HOST + "api/orders/delivered")
        .then(function(response) {
            $scope.orders = response.data;
        });
});

app.controller('canceledController', function($scope, $http, sharedMethods) {
    $scope.status = "Canceled";

    $scope.pending = true;
    $scope.delivered = true;
    $scope.shipped = true;
    $scope.cancel = false;

    $scope.delivered = function(id) {
        sharedMethods.delivered(id);
    }
    $scope.shipped = function(id) {
        sharedMethods.shipped(id);
    }
    $scope.pending = function(id) {
        sharedMethods.pending(id);
    }

    $http.get(HOST + "api/orders/canceled")
        .then(function(response) {
            $scope.orders = response.data;
        });
});

app.controller('shippedController', function($scope, $http, sharedMethods) {
    $scope.status = "Shipped";

    $scope.pending = true;
    $scope.delivered = true;
    $scope.shipped = false;
    $scope.cancel = true;

    $scope.delivered = function(id) {
        sharedMethods.delivered(id);
    }
    $scope.cancel = function(id) {
        sharedMethods.cancel(id);
    }
    $scope.pending = function(id) {
        sharedMethods.pending(id);
    }

    $http.get(HOST + "api/orders/shipped")
        .then(function(response) {
            $scope.orders = response.data;
        });
});

app.controller('allOrdersController', function($scope, $http) {
    $scope.status = "All";
    $http.get(HOST + "api/orders/all")
        .then(function(response) {
            $scope.orders = response.data;
        });
});

app.controller('productsController', function($scope, $http) {
    $http.get(HOST + "api/products/all")
        .then(function(response) {
            $scope.products = response.data;
        });
});

app.controller('newItemController', function($scope, $http, $route) {

    $http.get(HOST + "api/products/new").then(function(response) {
        $scope.categories = response.data.category;
        $scope.id = response.data.id;
    });

    $scope.submit = function() {
        vegbool = $scope.veg === 'veg' ? 0 : 1;
        home_delbool = $scope.home_del ? 0 : 1;
        pickupbool = $scope.pickup ? 0 : 1;
        $http.post(HOST + 'api/products/create', {
            title: $scope.title,
            desc: $scope.desc,
            uri: $scope.uri,
            veg: vegbool,
            category: $scope.category,
            location: $scope.location,
            contact: $scope.contact,
            price: $scope.price,
            currency: $scope.currency,
            home_del: home_delbool,
            pickup: pickupbool
        }).then(function(response) {
            $route.reload();
        });
    }
});

app.controller('promoController', function($scope, $http, $route) {

    $http.get(HOST + "api/promo/all").then(function(response) {
        $scope.promos = response.data;
    });

    $scope.activate = function(id) {
        $http.get(HOST + "api/promo/activate/" + id).then(function(response) {

            $route.reload();
        });
    }

    $scope.deactivate = function(id) {
        $http.get(HOST + "api/promo/deactivate/" + id).then(function(response) {
            $route.reload();
        });
    }

    $scope.submit = function() {

        $http.post(HOST + 'api/promo/create/', {
            code: $scope.code,
            value: $scope.value,
            type: $scope.type
        }).then(function(response) {
            $route.reload();
        });
    }

});

app.controller('vouchersController', function($scope, $http, $route) {

    $http.get(HOST + "api/voucher/all").then(function(response) {
        $scope.vouchers = response.data;
    });

    $scope.activate = function(id) {
        $http.get(HOST + "api/voucher/activate/" + id).then(function(response) {
            $route.reload();
        });
    }

    $scope.deactivate = function(id) {
        $http.get(HOST + "api/voucher/deactivate/" + id).then(function(response) {
            $route.reload();
        });
    }

    $scope.submit = function() {

        $http.post(HOST + 'api/voucher/create', {
            total: $scope.total,
            value: $scope.value
        }).then(function(response) {
            alert(response.data);
            $route.reload();
        });
    }


});

app.controller('bannerController', function($scope, $http, $route) {

    $http.get(HOST + "api/banner/all").then(function(response) {
        $scope.banners = response.data;
    });

    $scope.activate = function(id) {
        $http.get(HOST + "api/banner/activate/" + id).then(function(response) {
            $route.reload();
        });
    }

    $scope.deactivate = function(id) {
        $http.get(HOST + "api/banner/deactivate/" + id).then(function(response) {
            $route.reload();
        });
    }

    $scope.submit = function() {

        $http.post(HOST + 'api/banner/create/', {
            title: $scope.title,
            imgurl: $scope.imgurl,
            desurl: $scope.desurl
        }).then(function(response) {
            $route.reload();
        });
    }
});

app.controller('invoiceController', function($scope, $http, $routeParams) {

    id = $routeParams.idparam;
    $http.get(HOST + "api/invoice/" + id)
        .then(function(response) {
            $scope.item = response.data;
        });
});

app.controller('logoutController', function($scope, $location, Auth) {

    $scope.logout = ()=>{
        localStorage.removeItem('token');
        Auth.setUser();
        $location.path('/login');
    }
});

app.controller('passwordController', function($scope, $http) {

    $scope.oldpassword = "";
    $scope.newpassword = "";
    $scope.confirmpassword = "";

    $scope.change = function() {

        if ($scope.newpassword !== $scope.confirmpassword) {
            alert("Password does not match");
            return;
        }
        if ($scope.newpassword === $scope.oldpassword) {
            alert("Old and new Password are same");
            return;
        }
        $http.post(HOST + 'api/changepassword', {
            oldpassword: $scope.oldpassword,
            newpassword: $scope.newpassword
        }).then(function(response) {
            alert(response.data);
        });
    }
});

app.factory('sharedMethods', function($http, $route) {

    return {
        delivered: function(id) {
            $http.get(HOST + "api/orders/delivered/" + id).then(function(response) {
                $route.reload();
            });
        },
        cancel: function(id) {
            $http.get(HOST + "api/orders/cancel/" + id).then(function(response) {
                $route.reload();
            });
        },
        pending: function(id) {
            $http.get(HOST + "api/orders/pending/" + id).then(function(response) {
                $route.reload();
            });
        },
        shipped: function(id) {
            $http.get(HOST + "api/orders/shipped/" + id).then(function(response) {
                $route.reload();
            });
        }
    }
});