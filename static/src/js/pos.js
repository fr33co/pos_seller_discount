openerp.pos_seller = function (instance) {
    var _t = instance.web._t;
    var QWeb = instance.web.qweb;
    var module   = instance.point_of_sale;
    var _super_orderline = module.Orderline.prototype;
    var _super_Order = module.Order.prototype;
    var SuperPosModel = module.PosModel.prototype;

    // POS MODEL
    module.PosModel = module.PosModel.extend({
  		initialize: function(session, attributes) {
  			var rr = SuperPosModel.initialize.call(this, session, attributes);
  			var self = this;
  			self.models.push(
        {
          model:  'res.users',
          fields: ['id', 'name', 'ean13', 'active', 'emp_int', 'pos_config'],
          domain: null,
          loaded: function(self, users){ self.users = users; },
        },
  			{
  				model:  'product.product',
  				fields: ['display_name', 'list_price', 'price', 'pos_categ_id', 'taxes_id', 'barcode', 'default_code',
  						'to_weight', 'uom_id', 'description_sale', 'description', 'product_tmpl_id'],
  				order:  ['sequence', 'name'],
  				domain: [['sale_ok', '=', true],['available_in_pos', '=', true]],
  				context: function(self){ return {pricelist: self.pricelist.id, display_default_code: false};},
  				loaded: function(self, products){
  					self.all_products = products;
            self.all_products_ids = [];
  					products.forEach(function(product)
  					{
  						self.all_products_ids.push(product.id);
  					});
  					self.db.add_products(products);
  				}
  			});
  		}
  	});

    // SELECT SELLER POPUP
    module.SellerPopupWidget = module.PopUpWidget.extend({
      template: 'SellerPopupWidget',

      init: function(parent, options) {
    		this._super(parent,options);
    	},

      set_sellers: function(){
    		var self = this;

    		var seller_list = [];
        var new_li = [];

    		var loaded_users = this.pos.fetch('res.users', ['id', 'name', 'pos_config'], [['active', '=','true']])
    			.then(function(seller){
    				for(var i = 0, len = seller.length; i < len; i++){
    					seller_list.push(seller[i]);
    				}
    				if(seller_list.length > 0){
    					for(var i = 0, len = seller_list.length; i < len; i++){
                if(seller_list[i].pos_config){
                  if(self.pos.user.id == seller_list[i].id){
  					 		  	new_li += '<li class="Seller selectedSeller" style="background-color:rgb(145, 218, 144);" id="li-element" value="'+seller_list[i].id+'">' +  seller_list[i].name + '</li>\n';
  								} else {
  									new_li += '<li class="Seller" id="li-element" value="'+seller_list[i].id+'">' +  seller_list[i].name + '</li>\n';
  								}
                }
    					}
    					if (new_li) {
    					 	self.$('#sellers').html(new_li);
    					}
    				}
    			});
    	},

      show: function(){
        var self = this;

        self.set_sellers();

        $("#sellers").on('click', '.Seller', function (event) {
  				$('.Seller').removeClass("selectedSeller");
  				$('.Seller').css("background-color","rgb(231, 238, 236)");
  				$(this).css("background-color","rgb(145, 218, 144)");
  				$(this).addClass( "selectedSeller" )
  			});

        this.$('.button.seller.cancel').off('click').click(function(){
          self.hide();
        });

        this.$('.button.seller.ok').click(function(){
          $('.username').html($('.selectedSeller').text());

          var selectedOrder = self.pos.get('selectedOrder');
          var selected_line = selectedOrder.getSelectedLine();
          if(selected_line){
            selected_line.change_seller();
          }

          self.hide();
        });

        this._super();
      },

      hide: function(){
    		self.visible = false;
    		this._super();
    	},

    });

    // POSWIDGET
    module.PosWidget = module.PosWidget.extend({
      build_widgets: function(){
        this._super();

        this.seller_popup = new module.SellerPopupWidget(this,{});
        this.seller_popup.appendTo(this.$el);
        this.screen_selector.popup_set['seller_confirm'] = this.seller_popup;
        this.seller_popup.hide();

      },
  	});

    // USERNAME WIDGET
    module.UsernameWidget = module.UsernameWidget.extend({

      refresh: function(){
        this._super();
        var self = this;

        $('.username').click(function() {
          self.pos.pos_widget.screen_selector.show_popup('seller_confirm');
        })
      },

    });

    // ORDER
    module.Order = module.Order.extend({

        addProduct: function (product, options) {
            options = options || {};
            var attr = JSON.parse(JSON.stringify(product));
            attr.pos = this.pos;
            attr.order = this;
            var line = new module.Orderline({}, {
                pos: this.pos,
                order: this,
                product: product
            });

            var self = this;
            var found = false;

            if (options.quantity !== undefined) {
                line.set_quantity(options.quantity);
            }
            if (options.price !== undefined) {
                line.set_unit_price(options.price);
            }
            if (options.discount !== undefined) {
                line.set_discount(options.discount);
            }

            var orderlines = [];
            if (self.get('orderLines').models !== undefined) {
                orderlines = self.get('orderLines').models;
            }
            for (var i = 0; i < orderlines.length; i++) {
                var _line = orderlines[i];
                if (_line && _line.can_be_merged_with(line) &&
                    options.merge !== false) {
                    _line.merge(line);
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.get('orderLines').add(line);
            }
            this.selectLine(this.getLastOrderline());

            // Set discount by seller
            var seller_name = $('.pos-branding').find('.username').text().trim();
            var type_product = self.pos.config.type_product;

            for(var user in self.pos.users){
              if(self.pos.users[user].name == seller_name){
                if(self.pos.users[user].emp_int == false && self.pos.users[user].pos_config){
                  if($.inArray(product.pos_categ_id[0], type_product) >= 0){
                    if(line.product['id'] == product.id){
                      discount = parseFloat(self.pos.config.discount_pc);
                      line.set_discount(discount);
                    }
                  } else {
                    line.set_discount(parseFloat(0));
                  }
                }
              }
            }
            // --- //
        },

    });

    // ORDERLINE
    module.Orderline = module.Orderline.extend({

      initialize: function(attr, options){

        // SELLER
        get_seller_id = options.pos.user.id;
        var seller_name = $('.pos-branding').find('.username').text().trim();
        get_discount = 0;

        this.set({
          // SELLER
          seller_id: get_seller_id,
          seller_name: $('.pos-branding').find('.username').text(),
          discount: get_discount,
        });

        _super_orderline.initialize.call(this, attr, options);
      },

      change_seller: function(){
    		var self = this;
    		var seller_name = $('.pos-branding').find('.username').text();

        // Discount
        var order = self.pos.get_order();
        var line = order.selected_orderline;

        var discount = 0;
        var type_product = self.pos.config.type_product;

        for(var user in self.pos.users){
          if(self.pos.users[user].name == seller_name){
            var user_id = self.pos.users[user].id;
            var user_name = self.pos.users[user].name;

            self.set_seller(user_id);
            self.set_seller_name(user_name);

            for(var user in self.pos.users){
              if(self.pos.users[user].name == seller_name){
                // Validacion de usuario
                if(self.pos.users[user].emp_int == false && self.pos.users[user].pos_config){
                  // Validacion de producto
                  self.pos.all_products.forEach(function(product){
                    if($.inArray(product.pos_categ_id[0], type_product) >= 0){
                      if(line.product['id'] == product.id){
                        discount = parseFloat(self.pos.config.discount_pc);
                        self.set_discount(discount);
                      }
                    } else {
                      self.set_discount(discount);
                    }
            			});
                } else {
                  self.set_discount(discount);
                }
              }
            }
          }
        }
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
        var lines = _super_orderline.export_as_JSON.call(this);
        new_val = {
          seller_id: this.get_seller_id(),
          discount: this.get_discount()
        }
        $.extend(lines, new_val);
        return lines;
      },

    });

}
