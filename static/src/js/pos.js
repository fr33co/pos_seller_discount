odoo.define('pos_seller.main', function (require) {
    "use strict";

    var base_widget = require('point_of_sale.BaseWidget');
    var chrome = require('point_of_sale.chrome');
    var pos_model = require('point_of_sale.models');
    var gui = require('point_of_sale.gui');
    var utils = require('web.utils');
    var core = require('web.core');
    var formats = require('web.formats');
    var screens = require('point_of_sale.screens');
    var _t = core._t;
    var round_di = utils.round_decimals;
    var Model = require('web.DataModel');
    var SuperOrder = pos_model.Order;
    var SuperOrderline = pos_model.Orderline.prototype;

    pos_model.load_models({
      model:  'res.users',
      fields: ['id', 'name', 'ean13', 'active', 'emp_int', 'pos_config'],
      domain: null,
      loaded: function(self, users){
        self.users = users;
      },
  	});

    pos_model.load_models({
  		model:  'product.product',
  		fields: ['display_name', 'list_price','price','pos_categ_id', 'taxes_id', 'barcode', 'default_code',
  				'to_weight', 'uom_id', 'description_sale', 'description',
  				'product_tmpl_id'],
  		order:  ['sequence','name'],
  		domain: [['sale_ok','=',true],['available_in_pos','=',true]],
  		context: function(self){ return {pricelist: self.pricelist.id, display_default_code: false };},
  		loaded: function(self, products){
  			self.all_products = products;
        self.all_products_ids = [];
  			products.forEach(function(product){
  				self.all_products_ids.push(product.id);
  			});
  			self.db.add_products(products);
  		}
  	});

    chrome.UsernameWidget.include({
      renderElement: function(){
        this._super();

        var self = this;

        var selectedOrder = self.pos.get('selectedOrder');
        var type_product = self.pos.config.type_product;
        var discount = 0;

        if(selectedOrder){
          if(selectedOrder.selected_orderline){
            for(var user in self.pos.users){
              if(self.pos.users[user].id == self.pos.get_cashier().id){
                if(self.pos.users[user].emp_int == false && self.pos.users[user].pos_config){
                  self.pos.all_products.forEach(function(product){
                    if($.inArray(product.pos_categ_id[0], type_product) >= 0){
                      if(selectedOrder.selected_orderline.product['id'] == product.id){
                        discount = parseFloat(self.pos.config.discount_pc);
                        selectedOrder.selected_orderline.set_seller(self.pos.users[user].id);
                        selectedOrder.selected_orderline.set_seller_name(self.pos.users[user].name);
                        selectedOrder.selected_orderline.set_discount(discount)
                      }
                    } else {
                      discount = 0;
                      selectedOrder.selected_orderline.set_seller(self.pos.users[user].id);
                      selectedOrder.selected_orderline.set_seller_name(self.pos.users[user].name);
                      selectedOrder.selected_orderline.set_discount(discount);
                    }
                  });
                } else {
                  discount = 0;
                  selectedOrder.selected_orderline.set_seller(self.pos.users[user].id);
                  selectedOrder.selected_orderline.set_seller_name(self.pos.users[user].name);
                  selectedOrder.selected_orderline.set_discount(discount);
                }
              }
            }
          }
        }
      },
    });

    // ORDERLINE
    pos_model.Orderline = pos_model.Orderline.extend({

      initialize: function(attr, options){
        var self = this;

        // SELLER
        var get_seller_id = options.pos.user.id;
        var get_seller_name = $('.pos-branding').find('.username').text().trim();
        var type_product = options.pos.config.type_product;
        var get_discount = 0;

        for(var user in options.pos.users){
          if(options.pos.users[user].id == options.pos.get_cashier().id){
            get_seller_id = options.pos.users[user].id;
            get_seller_name = options.pos.users[user].name;
            if(options.pos.users[user].emp_int == false && options.pos.users[user].pos_config){
              options.pos.all_products.forEach(function(product){
                if($.inArray(product.pos_categ_id[0], type_product) >= 0){
                  if(options.product.id == product.id){
                    get_discount = parseFloat(options.pos.config.discount_pc);
                    self.set_discount(get_discount);
                  } else {
                    self.set_discount(get_discount);
                  }
                }
              });
            }
          }
        }

        this.set({
          // SELLER
          seller_id: get_seller_id,
          seller_name: get_seller_name,
          discount: get_discount,
        });

        SuperOrderline.initialize.call(this, attr, options);
      },

      set_seller: function(seller_id) {
        this.set('seller_id', seller_id);
      },

      set_seller_name: function(seller_name) {
        this.set('seller_name', seller_name);
      },

      get_seller_id: function() {
        return this.get('seller_id');
      },

      get_seller_name: function() {
        return this.get('seller_name');
      },

      set_discount: function(discount) {
        this.set('discount', discount);
      },

      get_discount: function() {
        return this.get('discount');
      },

      export_as_JSON: function() {
        var self = this;
        var lines = SuperOrderline.export_as_JSON.call(this);
        var new_val = {
          seller_id: self.get_seller_id(),
          discount: self.get_discount()
        }
        $.extend(lines, new_val);
        return lines;
      },

    });

});
