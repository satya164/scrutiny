/* eslint-env mocha */

"use strict";

var Scrutiny = require("../src/scrutiny.js"),
    assert = require("assert");

describe("core", function() {
    it("should not register invalid function", function() {
        var scrutiny = new Scrutiny();

        assert.throws(function() {
            scrutiny.register("invalid", null);
        });
    });

    it("should not mix checks of different instances", function() {
        var instance1 = new Scrutiny(),
            instance2 = new Scrutiny();

        instance1.register("type1", function() {});

        instance2.register("type2", function() {});

        assert(instance1.checks.type1 && !instance1.checks.type2);
        assert(instance2.checks.type2 && !instance2.checks.type1);
    });

    it("should register and validate", function() {
        var scrutiny = new Scrutiny();

        scrutiny.register("veggie", function(value) {
            var veggies = [ "potato", "tomato" ];

            if (veggies.indexOf(value) === -1) {
                throw new Error("ERR_INVALID_VEGGIE");
            }
        });

        scrutiny.register("fruit", function(value) {
            var fruits = [ "apple", "orange", "banana", "tomato" ];

            if (fruits.indexOf(value) === -1) {
                throw new Error("ERR_INVALID_FRUIT");
            }
        });

        return scrutiny.validate("water", scrutiny.checks.veggie).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_VEGGIE");
        }).then(function() {
            return scrutiny.validate("tomato", scrutiny.checks.veggie);
        }).then(function() {
            return scrutiny.validate("sugar", scrutiny.checks.fruit);
        }).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_FRUIT");
        }).then(function() {
            return scrutiny.validate("apple", scrutiny.checks.fruit);
        }).then(function() {
            return scrutiny.validate("apple", scrutiny.checks.fruit, scrutiny.checks.veggie);
        }).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_VEGGIE");
        }).then(function() {
            return scrutiny.validate("potato", scrutiny.checks.fruit, scrutiny.checks.veggie);
        }).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_FRUIT");
        }).then(function() {
            return scrutiny.validate("fish", scrutiny.checks.fruit, scrutiny.checks.veggie);
        }).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_FRUIT");
        }).then(function() {
            return scrutiny.validate("tomato", scrutiny.checks.fruit, scrutiny.checks.veggie);
        }).then(function(value) {
            assert.equal(value, "tomato");
        });
    });

    it("should pass async validation", function() {
        var scrutiny = new Scrutiny(),
            thing = "thing";

        return scrutiny.validate(thing, function() {
            return new Promise(function(resolve) {
                setTimeout(function() {
                    resolve(thing);
                }, 5);
            });
        }).then(function(value) {
            assert.equal(value, thing);
        });
    });

    it("should fail async validation", function() {
        var scrutiny = new Scrutiny();

        return scrutiny.validate("shoot", function() {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    reject(new Error("ERR_ITS_WRONG"));
                }, 5);
            });
        }).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_ITS_WRONG");
        });
    });
});

describe("string", function() {
    it("should pass string validatation", function() {
        var scrutiny = new Scrutiny(),
            string = "john snow";

        return scrutiny.validate(string, scrutiny.checks.string).then(function(value) {
            assert.equal(value, string);
        });
    });

    it("should fail string validatation", function() {
        var scrutiny = new Scrutiny();

        return scrutiny.validate(null, scrutiny.checks.string).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_STRING");
        });
    });
});

describe("boolean", function() {
    it("should pass boolean validatation", function() {
        var scrutiny = new Scrutiny(),
            bool = false;

        return scrutiny.validate(bool, scrutiny.checks.bool).then(function(value) {
            assert.equal(value, bool);
        });
    });

    it("should fail boolean validatation", function() {
        var scrutiny = new Scrutiny();

        return scrutiny.validate(0, scrutiny.checks.bool).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_BOOL");
        });
    });
});

describe("number", function() {
    it("should pass number validatation", function() {
        var scrutiny = new Scrutiny(),
            num = 108;

        return scrutiny.validate(num, scrutiny.checks.number).then(function(value) {
            assert.equal(value, num);
        });
    });

    it("should fail number validatation", function() {
        var scrutiny = new Scrutiny();

        return scrutiny.validate(NaN, scrutiny.checks.number).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_NUMBER");
        }).then(function() {
            return scrutiny.validate("5", scrutiny.checks.number);
        }).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_NUMBER");
        });
    });
});

describe("function", function() {
    it("should pass function validatation", function() {
        var scrutiny = new Scrutiny(),
            func = function() {};

        return scrutiny.validate(func, scrutiny.checks.func).then(function(value) {
            assert.equal(value, func);
        });
    });

    it("should fail function validatation", function() {
        var scrutiny = new Scrutiny();

        return scrutiny.validate(null, scrutiny.checks.func).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_FUNC");
        });
    });
});

describe("array", function() {
    it("should pass array validatation", function() {
        var scrutiny = new Scrutiny(),
            arr = [ "a", "b", "c" ];

        return scrutiny.validate(arr, scrutiny.checks.array).then(function(value) {
            assert.equal(value, arr);
        });
    });

    it("should fail array validatation", function() {
        var scrutiny = new Scrutiny();

        return scrutiny.validate({ 0: "a", 1: "b", length: 2 }, scrutiny.checks.array).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_ARRAY");
        });
    });
});

describe("object", function() {
    it("should pass object validatation", function() {
        var scrutiny = new Scrutiny(),
            obj = { color: "pink" };

        return scrutiny.validate(obj, scrutiny.checks.object).then(function(value) {
            assert.equal(value, obj);
        });
    });

    it("should fail object validatation", function() {
        var scrutiny = new Scrutiny();

        return scrutiny.validate(543, scrutiny.checks.object).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_OBJECT");
        }).then(function() {
            return scrutiny.validate(null, scrutiny.checks.object);
        }).then(function() {
            assert(false);
        }, function(e) {
            assert.equal(e.message, "ERR_INVALID_OBJECT");
        });
    });
});
